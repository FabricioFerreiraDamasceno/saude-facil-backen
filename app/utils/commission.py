def get_commission_rate(item_type: str) -> float:
    if item_type == "EXAM":
        return 0.40
    if item_type == "PRODUCT":
        return 0.08
    return 0.10