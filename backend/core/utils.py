# utils.py

def is_outside_dublin(city: str) -> bool:
    if not city:
        return True
    return city.strip().lower() != "dublin"


def calculate_total_weight(items: list) -> float:
    total = 0.0
    for item in items:
        weight = float(item.get("weight", 0))
        quantity = int(item.get("quantity", 1))
        total += weight * quantity
    return total


def is_rice_or_atta_only_order(items: list) -> bool:
    if not items:
        return False
    return all(
        "rice" in item.get("category", "").lower() or
        "atta" in item.get("category", "").lower()
        for item in items
    )


def count_20kg_atta(items: list) -> int:
    atta_weight = 0.0
    for item in items:
        if "atta" in item.get("category", "").lower():
            atta_weight += float(item.get("weight", 0)) * int(item.get("quantity", 1))
    return int(atta_weight // 20)


def calculate_delivery_fee(items: list, city: str, subtotal: float) -> dict:
    messages = []

    outside_dublin = is_outside_dublin(city)
    total_weight = calculate_total_weight(items)
    rice_atta_only = is_rice_or_atta_only_order(items)
    atta_20kg_count = count_20kg_atta(items)

    base_fee = 0.0
    rice_atta_only_fee = 0.0
    heavy_atta_fee = 0.0
    outside_dublin_fee = 0.0
    overweight_fee = 0.0

    # 1. OUTSIDE DUBLIN
    if outside_dublin:
        outside_dublin_fee = 6.99
        messages.append("€6.99 delivery charge (Outside Dublin)")

    else:
        # 2. FREE DELIVERY
        if subtotal >= 39.99:
            base_fee = 0.0
            messages.append("Free delivery (Order ≥ €39.99)")
        else:
            base_fee = 5.99
            messages.append("€5.99 standard delivery")

        # 3. RICE & ATTA ONLY RULE
        if rice_atta_only:
            base_fee = 0.0
            rice_atta_only_fee = 3.0
            messages.append("€3 delivery (Rice/Atta only order)")

    # 4. ATTA HANDLING FEE
    if atta_20kg_count > 0:
        heavy_atta_fee = float(atta_20kg_count) * 1.0
        messages.append(f"€{heavy_atta_fee:.2f} handling fee (Atta ≥ 20kg)")

    # 5. OVERWEIGHT FEE (>28kg)
    if total_weight > 28:
        overweight_fee = 6.99
        messages.append(
            f"€6.99 extra packaging (Weight {total_weight:.2f}kg exceeds 28kg)"
        )

    total = round(
        base_fee + rice_atta_only_fee + heavy_atta_fee +
        outside_dublin_fee + overweight_fee,
        2
    )

    return {
        "base_fee": base_fee,
        "rice_atta_only_fee": rice_atta_only_fee,
        "heavy_atta_fee": heavy_atta_fee,
        "outside_dublin_fee": outside_dublin_fee,
        "overweight_fee": overweight_fee,
        "total": total,
        "total_weight": total_weight,
        "is_outside_dublin": outside_dublin,
        "messages": messages,
    }
