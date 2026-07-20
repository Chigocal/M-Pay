import asyncio
import logging
from typing import Any, Optional

import httpx

from backend.app.config import settings

try:
    from backend.services.monnify import MonnifyException, get_access_token
except ImportError:  # pragma: no cover
    from services.monnify import MonnifyException, get_access_token

logger = logging.getLogger(__name__)


class MonnifyClient:
    """Small wrapper around Monnify's auth and disbursement endpoints."""

    def __init__(self) -> None:
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[float] = None
        self._banks_cache: Optional[list[dict[str, Any]]] = None
        self._banks_cache_expires_at: Optional[float] = None

    async def _authenticate(self) -> str:
        now = asyncio.get_running_loop().time()
        if self._access_token and self._token_expires_at and now < self._token_expires_at:
            return self._access_token

        logger.info("Authenticating with Monnify")
        token = await get_access_token()
        self._access_token = token
        self._token_expires_at = now + 3300
        return token

    async def get_supported_banks(self) -> list[dict[str, Any]]:
        now = asyncio.get_running_loop().time()
        if self._banks_cache and self._banks_cache_expires_at and now < self._banks_cache_expires_at:
            return self._banks_cache

        access_token = await self._authenticate()
        url = f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v1/banks"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers, timeout=20.0)
                response_data = response.json() if response.content else {}
                logger.info("Monnify supported banks response: %s", response_data)

                if response.status_code >= 400:
                    raise MonnifyException(
                        code=str(response.status_code),
                        message=response_data.get("responseMessage") or "Failed to fetch supported banks from Monnify.",
                        details=response_data,
                    )

                if not response_data.get("requestSuccessful") or response_data.get("responseCode") != "0":
                    raise MonnifyException(
                        code=str(response_data.get("responseCode") or "UNKNOWN"),
                        message=response_data.get("responseMessage") or "Failed to fetch supported banks from Monnify.",
                        details=response_data,
                    )

                banks = response_data.get("responseBody") or []
                self._banks_cache = banks
                self._banks_cache_expires_at = now + 600
                return banks
            except httpx.HTTPStatusError as exc:
                logger.exception("Monnify supported banks failed with HTTP error")
                raise MonnifyException(
                    code=str(exc.response.status_code),
                    message="Failed to fetch supported banks from Monnify.",
                    details={"status_code": exc.response.status_code},
                ) from exc
            except httpx.RequestError as exc:
                logger.exception("Monnify supported banks request failed")
                raise MonnifyException(
                    message=f"Network request error: {exc}",
                    details={"error": str(exc)},
                ) from exc

    async def initiate_single_transfer(
        self,
        amount: float,
        bank_code: str,
        account_number: str,
        reference: str,
        narration: str,
        account_name: Optional[str] = None,
    ) -> dict[str, Any]:
        access_token = await self._authenticate()
        url = f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v2/disbursements/single"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        payload: dict[str, Any] = {
            "amount": amount,
            "reference": reference,
            "narration": narration,
            "destinationBankCode": bank_code,
            "destinationAccountNumber": account_number,
            "currency": "NGN",
            "sourceAccountNumber": settings.MONNIFY_WALLET_ACCOUNT_NUMBER,
            "async": False,
        }
        if account_name:
            payload["destinationAccountName"] = account_name

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=25.0)
                response_data = response.json() if response.content else {}
                logger.info("Monnify initiate transfer response: %s", response_data)

                if response.status_code >= 400:
                    raise MonnifyException(
                        code=str(response.status_code),
                        message=response_data.get("responseMessage") or "Monnify transfer initiation failed.",
                        details=response_data,
                    )

                if not response_data.get("requestSuccessful") or response_data.get("responseCode") != "0":
                    raise MonnifyException(
                        code=str(response_data.get("responseCode") or "UNKNOWN"),
                        message=response_data.get("responseMessage") or "Monnify transfer initiation failed.",
                        details=response_data,
                    )

                return response_data.get("responseBody") or response_data
            except httpx.HTTPStatusError as exc:
                logger.exception("Monnify transfer initiation failed with HTTP error")
                raise MonnifyException(
                    code=str(exc.response.status_code),
                    message="Monnify transfer initiation failed.",
                    details={"status_code": exc.response.status_code},
                ) from exc
            except httpx.RequestError as exc:
                logger.exception("Monnify transfer initiation failed due to request error")
                raise MonnifyException(
                    message=f"Network request error: {exc}",
                    details={"error": str(exc)},
                ) from exc

    async def authorize_transfer(self, reference: str, otp: str) -> dict[str, Any]:
        access_token = await self._authenticate()
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {"reference": reference, "otp": otp}
        endpoints = [
            f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v2/disbursements/single/authorize",
            f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v2/disbursements/single/validate-otp",
            f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v2/disbursements/authorize",
        ]

        last_error: Optional[Exception] = None
        async with httpx.AsyncClient() as client:
            for endpoint in endpoints:
                try:
                    response = await client.post(endpoint, headers=headers, json=payload, timeout=25.0)
                    response_data = response.json() if response.content else {}
                    logger.info("Monnify authorize transfer response: %s", response_data)

                    if response.status_code in {404, 405}:
                        continue

                    if response.status_code >= 400:
                        raise MonnifyException(
                            code=str(response.status_code),
                            message=response_data.get("responseMessage") or "Monnify OTP authorization failed.",
                            details=response_data,
                        )

                    if not response_data.get("requestSuccessful") or response_data.get("responseCode") != "0":
                        raise MonnifyException(
                            code=str(response_data.get("responseCode") or "UNKNOWN"),
                            message=response_data.get("responseMessage") or "Monnify OTP authorization failed.",
                            details=response_data,
                        )

                    return response_data.get("responseBody") or response_data
                except httpx.HTTPStatusError as exc:
                    last_error = exc
                    logger.warning("Monnify authorize transfer endpoint %s returned HTTP error %s", endpoint, exc)
                except httpx.RequestError as exc:
                    last_error = exc
                    logger.warning("Monnify authorize transfer endpoint %s failed: %s", endpoint, exc)

        if last_error is not None:
            raise MonnifyException(message=f"Monnify OTP authorization failed: {last_error}")

        raise MonnifyException(message="Monnify OTP authorization endpoint not available.")
