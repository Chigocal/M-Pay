import base64
import logging
import httpx
from backend.app.config import settings

logger = logging.getLogger(__name__)

class MonnifyException(Exception):
    """
    Custom exception raised for Monnify API errors.
    """
    def __init__(self, code: str = None, message: str = None, details: dict = None):
        self.code = code
        self.message = message or "Monnify API error occurred."
        self.details = details
        super().__init__(self.message)


async def get_access_token() -> str:
    """
    Generate a JWT access token valid for subsequent requests.
    Endpoint: POST {settings.MONNIFY_BASE_URL}/api/v1/auth/login
    Headers: "Authorization": "Basic " + base64_encoded(apiKey:secretKey)
    """
    url = f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v1/auth/login"
    
    # Base64 encode the API key and secret key
    credentials = f"{settings.MONNIFY_API_KEY}:{settings.MONNIFY_SECRET_KEY}"
    encoded_creds = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    
    headers = {
        "Authorization": f"Basic {encoded_creds}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            logger.info("Requesting Monnify access token...")
            response = await client.post(url, headers=headers, timeout=15.0)
            
            # Handle 401 token failures gracefully
            if response.status_code == 401:
                logger.error("Monnify authentication failed (401 Unauthorized).")
                raise MonnifyException(
                    code="401",
                    message="Unauthorized: Invalid Monnify API Key or Secret Key.",
                    details=response.json() if response.headers.get("content-type") == "application/json" else {}
                )
                
            response.raise_for_status()
            response_data = response.json()
            
            if not response_data.get("requestSuccessful") or response_data.get("responseCode") != "0":
                code = response_data.get("responseCode")
                message = response_data.get("responseMessage", "Failed to retrieve access token.")
                logger.error(f"Monnify login response error: {code} - {message}")
                raise MonnifyException(code=code, message=message, details=response_data)
                
            access_token = response_data.get("responseBody", {}).get("accessToken")
            if not access_token:
                logger.error("Monnify login response body missing accessToken.")
                raise MonnifyException(message="Access token not found in responseBody.", details=response_data)
                
            return access_token
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Monnify login request failed with status: {e}")
            raise MonnifyException(message=f"HTTP Status Error: {e}", details={"status_code": e.response.status_code})
        except httpx.RequestError as e:
            logger.error(f"Monnify login network/request failed: {e}")
            raise MonnifyException(message=f"Network Request Error: {e}")


async def initiate_single_transfer(
    amount: float,
    reference: str,
    bank_code: str,
    account_number: str,
    account_name: str,
    narration: str
) -> dict:
    """
    Instantly disburse cash from the platform merchant wallet to the user's personal bank account.
    Endpoint: POST {settings.MONNIFY_BASE_URL}/api/v2/disbursements/single
    Headers: "Authorization": "Bearer {access_token}", "Content-Type": "application/json"
    """
    access_token = await get_access_token()
    url = f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v2/disbursements/single"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "amount": amount,
        "reference": reference,
        "narration": narration,
        "destinationBankCode": bank_code,
        "destinationAccountNumber": account_number,
        "destinationAccountName": account_name,
        "currency": "NGN",
        "sourceAccountNumber": settings.MONNIFY_WALLET_ACCOUNT_NUMBER,
        "async": False
    }
    
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Initiating disbursement of {amount} NGN to {account_number}...")
            response = await client.post(url, headers=headers, json=payload, timeout=20.0)
            response.raise_for_status()
            response_data = response.json()
            
            # Behavior: If requestSuccessful is true and responseCode is "0", return the responseBody.
            # If requestSuccessful is false, raise MonnifyException with the API's error message.
            if not response_data.get("requestSuccessful") or response_data.get("responseCode") != "0":
                code = response_data.get("responseCode")
                message = response_data.get("responseMessage", "Single transfer request failed.")
                logger.error(f"Monnify transfer initiation failure: {code} - {message}")
                raise MonnifyException(code=code, message=message, details=response_data)
                
            return response_data.get("responseBody")
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Monnify transfer initiation status error: {e}")
            raise MonnifyException(message=f"HTTP Status Error: {e}", details={"status_code": e.response.status_code})
        except httpx.RequestError as e:
            logger.error(f"Monnify transfer initiation connection error: {e}")
            raise MonnifyException(message=f"Network Request Error: {e}")
