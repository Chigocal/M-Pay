import asyncio
import httpx
import base64
from backend.app.config import settings

async def test_validate():
    # 1. Login to get access token
    url_login = f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v1/auth/login"
    credentials = f"{settings.MONNIFY_API_KEY}:{settings.MONNIFY_SECRET_KEY}"
    encoded_creds = base64.b64encode(credentials.encode("utf-8")).decode("utf-8")
    headers_login = {
        "Authorization": f"Basic {encoded_creds}",
        "Content-Type": "application/json"
    }
    
    print("Settings MONNIFY_BASE_URL:", settings.MONNIFY_BASE_URL)
    print("Settings API Key:", settings.MONNIFY_API_KEY)
    
    async with httpx.AsyncClient() as client:
        r_login = await client.post(url_login, headers=headers_login)
        print("Login response code:", r_login.status_code)
        login_data = r_login.json()
        token = login_data["responseBody"]["accessToken"]
        
        # 2. Call validate endpoint
        url_validate = f"{settings.MONNIFY_BASE_URL.rstrip('/')}/api/v1/merchant/bank/validate"
        headers_val = {
            "Authorization": f"Bearer {token}"
        }
        params_val = {
            "accountNumber": "0123456789",
            "bankCode": "058"
        }
        
        r_val = await client.get(url_validate, headers=headers_val, params=params_val)
        print("Validate response code:", r_val.status_code)
        print("Validate response body:", r_val.text)

if __name__ == "__main__":
    asyncio.run(test_validate())