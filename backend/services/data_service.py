from typing import Dict

# Static rate table for data bundle conversions to cash payout
DATA_BUNDLE_RATES: Dict[str, Dict[str, float]] = {
    "MTN": {
        "100": 90.0,
        "200": 175.0,
        "500": 430.0,
        "1000": 860.0,
        "2000": 1650.0,
        "500MB": 90.0,
        "1GB": 175.0,
        "2GB": 340.0,
        "5GB": 820.0,
    },
    "AIRTEL": {
        "100": 85.0,
        "200": 165.0,
        "500": 410.0,
        "1000": 820.0,
        "2000": 1575.0,
        "500MB": 85.0,
        "1GB": 165.0,
        "2GB": 320.0,
        "5GB": 780.0,
    },
    "GLO": {
        "100": 80.0,
        "200": 150.0,
        "500": 380.0,
        "1000": 760.0,
        "2000": 1450.0,
        "500MB": 80.0,
        "1GB": 150.0,
        "2GB": 295.0,
        "5GB": 720.0,
    },
    "9MOBILE": {
        "100": 82.0,
        "200": 155.0,
        "500": 395.0,
        "1000": 790.0,
        "2000": 1500.0,
        "500MB": 82.0,
        "1GB": 155.0,
        "2GB": 305.0,
        "5GB": 740.0,
    },
}


def calculate_data_payout(network: str, bundle_size: str) -> float:
    """
    Calculate the cash payout for a given network and data bundle size.
    """
    normalized_network = network.strip().upper()
    normalized_bundle = bundle_size.strip().upper()

    if normalized_network not in DATA_BUNDLE_RATES:
        raise ValueError(f"Unsupported network '{network}'. Supported networks are: {', '.join(DATA_BUNDLE_RATES.keys())}.")

    rate_table = DATA_BUNDLE_RATES[normalized_network]
    if normalized_bundle not in rate_table:
        raise ValueError(
            f"Unsupported bundle '{bundle_size}' for {normalized_network}. "
            f"Available bundles: {', '.join(sorted(rate_table.keys()))}."
        )

    return float(rate_table[normalized_bundle])


def generate_data_ussd(
    network: str,
    phone_number: str,
    amount_or_bundle: str,
    validity: int = 30,
    pin: str = "0000"
) -> str:
    """
    Build a network-specific USSD string for data bundle conversion.
    """
    normalized_network = network.strip().upper()
    phone = phone_number.strip()
    amount = amount_or_bundle.strip()

    if normalized_network == "MTN":
        return f"*312*{phone}*{amount}#"
    if normalized_network == "AIRTEL":
        return f"*141*{validity}*{amount}*{phone}#"
    if normalized_network == "GLO":
        return f"*127*01*{phone}#"
    if normalized_network == "9MOBILE":
        return f"*229*{pin}*{amount}*{phone}#"

    raise ValueError(f"Unsupported network '{network}' for USSD generation.")
