import json
import pytest
from pytest_httpx import HTTPXMock
from backend.services.aggregator import (
    get_conversion_rate,
    check_quota_availability,
    transfer_airtime,
    AggregatorException,
)
from backend.app.config import settings

@pytest.mark.asyncio
async def test_get_conversion_rate():
    """
    Test helper method get_conversion_rate returns correct float values.
    """
    assert get_conversion_rate("MTN") == 0.80
    assert get_conversion_rate("AIRTEL") == 0.75
    assert get_conversion_rate("GLO") == 0.70
    assert get_conversion_rate("9MOBILE") == 0.75
    assert get_conversion_rate("UNKNOWN") == 0.70


@pytest.mark.asyncio
async def test_check_quota_success_2000(httpx_mock: HTTPXMock):
    """
    Test that code 2000 results in quota availability.
    """
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/check/quota/availability",
        json={"code": 2000, "message": "Recipient(s) Available"}
    )
    result = await check_quota_availability("MTN", 1000)
    assert result is True


@pytest.mark.asyncio
async def test_check_quota_success_5030(httpx_mock: HTTPXMock):
    """
    Test that code 5030 accompanied by "Available" message matches true.
    """
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/check/quota/availability",
        json={"code": 5030, "message": "Recipient(s) Available"}
    )
    result = await check_quota_availability("MTN", 1000)
    assert result is True


@pytest.mark.asyncio
async def test_check_quota_failure_3000(httpx_mock: HTTPXMock):
    """
    Test that error code 3000 indicates recipient quota is not available.
    """
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/check/quota/availability",
        json={"code": 3000, "message": "No recipient available"}
    )
    result = await check_quota_availability("MTN", 1000)
    assert result is False


@pytest.mark.asyncio
async def test_transfer_airtime_success(httpx_mock: HTTPXMock):
    """
    Test a successful transfer of airtime with correct payloads and headers.
    """
    expected_response = {
        "code": 2000,
        "message": "Yello! You have gifted...",
        "data": {
            "amountConverted": "₦1000",
            "recipient": "23481****89",
            "balanceBefore": "₦220751.8",
            "balanceAfter": "₦219751.8",
            "automationCharges": "₦2",
            "sessionId": "20230521232229|744673|18"
        }
    }
    
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/transfer/airtime",
        json=expected_response
    )
    
    result = await transfer_airtime(
        network="MTN",
        phone_number="08061234567",
        amount=1000,
        reference="TXN123456789",
        pin="1234",
        session_id="20230521232229|744673|18"
    )
    
    assert result["code"] == 2000
    assert result["data"]["amountConverted"] == "₦1000"

    # Verify request details sent to mock
    request = httpx_mock.get_request()
    assert request is not None
    assert request.headers["authorization"] == f"Bearer {settings.AGGREGATOR_API_KEY}"
    
    request_data = json.loads(request.read())
    assert request_data["networkName"] == "MTN"
    assert request_data["sender"] == "08061234567"
    assert request_data["amount"] == 1000
    assert request_data["reference"] == "TXN123456789"
    assert request_data["pin"] == "1234"
    assert request_data["sessionId"] == "20230521232229|744673|18"


@pytest.mark.asyncio
async def test_transfer_airtime_failure(httpx_mock: HTTPXMock):
    """
    Test correct mapping of error status code 3000 raising AggregatorException.
    """
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/transfer/airtime",
        json={"code": 3000, "message": "Invalid transfer PIN code"}
    )
    
    with pytest.raises(AggregatorException) as exc_info:
        await transfer_airtime(
            network="MTN",
            phone_number="08061234567",
            amount=1000,
            reference="TXN123456789",
            pin="1234",
            session_id="20230521232229|744673|18"
        )
        
    assert exc_info.value.code == 3000
    assert "Invalid transfer PIN" in exc_info.value.message
