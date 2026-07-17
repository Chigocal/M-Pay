import asyncio
from backend.services.aggregator import get_conversion_rate, check_quota

async def run_verification():
    print("--- Verifying aggregator.py ---")
    
    # 1. Test Rate Helper
    mtn_rate = get_conversion_rate("MTN")
    print(f"MTN Rate retrieved: {mtn_rate}")

    # 2. Test Quota Check (API connection)
    try:
        print("Checking quota for MTN (N1000)...")
        quota_status = await check_quota("MTN", 1000)
        print(f"Quota API Response: {quota_status}")
    except Exception as e:
        print(f"Quota API Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_verification())