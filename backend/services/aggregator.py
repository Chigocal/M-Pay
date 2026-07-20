import httpx
import logging
from typing import Dict, Any

try:
    from backend.app.config import settings
except ImportError:
    from app.config import settings

logger = logging.getLogger("aggregator_service")

# Default conversion rates for conversion (since the API has no rates endpoint)
# E.g. user gets 80% for MTN, 75% for Airtel, etc.
CONVERSION_RATES = {
    "MTN": 0.80,
    "AIRTEL": 0.75,
    "GLO": 0.70,
    "9MOBILE": 0.75
}


class AggregatorException(Exception):
    """
    Custom exception representing Airtime-to-Cash aggregator errors.
    """
    def __init__(self, code: int, message: str, details: Any = None):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(f"Aggregator Error [{code}]: {message}")


def get_conversion_rate(network: str) -> float:
    """
    Returns the conversion rate for a given mobile network from a local configuration dictionary.
    """
    network_upper = network.upper()
    return CONVERSION_RATES.get(network_upper, 0.70)


async def _send_request(method: str, path: str, payload: Dict[str, Any], require_auth: bool = True) -> Dict[str, Any]:
    """
    Internal helper to send asynchronous HTTP requests to the aggregator API using httpx.
    """
    base_url = settings.AGGREGATOR_BASE_URL.rstrip("/")
    url = f"{base_url}{path}"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    if require_auth:
        headers["Authorization"] = f"Bearer {settings.AGGREGATOR_API_KEY}"
        
    print(f"DEBUG REQUEST - Authorization: {headers.get('Authorization')}")
    print(f"DEBUG REQUEST - URL: {url} | Payload: {payload}")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method.upper() == "POST":
                response = await client.post(url, json=payload, headers=headers)
            else:
                response = await client.get(url, headers=headers)
                
            response.raise_for_status()
            
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP Error from aggregator: {e.response.status_code} - {e.response.text}")
        raise AggregatorException(
            code=3000,
            message=f"HTTP connection failed with status code {e.response.status_code}",
            details=e.response.text
        )
    except httpx.RequestError as e:
        logger.error(f"Network request error connecting to aggregator: {e}")
        raise AggregatorException(
            code=3000,
            message="Unable to establish network connection with aggregator service."
        )

    try:
        response_data = response.json()
    except ValueError:
        logger.error(f"Failed to parse JSON response: {response.text}")
        raise AggregatorException(
            code=3000,
            message="Aggregator returned invalid non-JSON format response."
        )

    # Check for custom business response codes in payload
    code = response_data.get("code")
    message = response_data.get("message", "No response message provided.")
    
    # Only 2000 is globally allowed. If code is anything else, raise AggregatorException
    if code is not None and code != 2000:
        logger.warning(f"Aggregator returned business logic failure: Code {code} - {message}")
        raise AggregatorException(code=code, message=message, details=response_data)
        
    return response_data


async def generate_otp(network: str, phone_number: str) -> Dict[str, Any]:
    """
    Generate an OTP verification request for the sender's phone number on a network.
    Endpoint: POST /api/v1/generate/otp (requires Bearer token headers in live environments)
    """
    payload = {
        "networkName": network.upper(),
        "sender": phone_number
    }
    return await _send_request("POST", "/api/v1/generate/otp", payload, require_auth=True)


async def verify_otp(network: str, phone_number: str, otp: str) -> Dict[str, Any]:
    """
    Verify the OTP code received via SMS on the sender's phone number.
    Endpoint: POST /api/v1/verify/otp (requires Bearer token headers in live environments)
    """
    payload = {
        "networkName": network.upper(),
        "sender": phone_number,
        "otp": otp
    }
    return await _send_request("POST", "/api/v1/verify/otp", payload, require_auth=True)


async def login_with_session_id(network: str, phone_number: str, session_id: str) -> Dict[str, Any]:
    """
    Login using a previously validated session ID.
    Endpoint: POST /api/v1/login/with/session/id (requires Bearer token authentication)
    """
    payload = {
        "networkName": network.upper(),
        "sender": phone_number,
        "sessionId": session_id
    }
    return await _send_request("POST", "/api/v1/login/with/session/id", payload, require_auth=True)


async def check_quota_availability(network: str, amount: int) -> bool:
    """
    Check if recipients are available to receive the conversion amount.
    Endpoint: POST /api/v1/check/quota/availability (requires Bearer token authentication)
    """
    payload = {
        "networkName": network.upper(),
        "amount": int(amount)
    }
    try:
        response = await _send_request("POST", "/api/v1/check/quota/availability", payload, require_auth=True)
        return response.get("code") == 2000
    except AggregatorException as e:
        if e.code == 5030 and "available" in e.message.lower():
            return True
        if e.code == 3000:
            return False
        raise


async def transfer_airtime(
    network: str,
    phone_number: str,
    amount: int,
    reference: str,
    pin: str,
    session_id: str
) -> Dict[str, Any]:
    """
    Performs the final airtime transfer and initiates the cash conversion.
    Endpoint: POST /api/v1/transfer/airtime (requires Bearer token authentication)
    """
    payload = {
        "networkName": network.upper(),
        "sender": phone_number,
        "amount": int(amount),
        "reference": reference,
        "pin": pin,
        "sessionId": session_id
    }
    return await _send_request("POST", "/api/v1/transfer/airtime", payload, require_auth=True)


# Alias for check_quota_availability
check_quota = check_quota_availability
