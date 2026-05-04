# ============================================================
# utils.py — Asian Basket
# Delivery fee calculation (server-side verification)
# Mirrors deliveryUtils.ts exactly to prevent tampering
# ============================================================

FREE_DELIVERY_THRESHOLD = 40.00    # €40+ = free (Dublin only)
BELOW_THRESHOLD_FEE     = 4.99     # Below €40 delivery charge
OUTSIDE_DUBLIN_FEE      = 6.99     # Outside Dublin flat charge
RICE_BAG_FEE            = 1.00     # Per 20kg rice bag
OVERWEIGHT_THRESHOLD    = 28       # kg
OVERWEIGHT_FEE          = 6.99


def count_20kg_rice_bags(items: list) -> int:
    """
    Count 20kg rice bags in the cart.
    Matches frontend: category contains 'rice' AND weight >= 20kg.
    """
    count = 0
    for item in items:
        category = item.get("category", "").lower()
        weight   = float(item.get("weight", 0))
        quantity = int(item.get("quantity", 1))
        if "rice" in category and weight >= 20:
            count += quantity
    return count


def calculate_total_weight(items: list) -> float:
    total = 0.0
    for item in items:
        weight   = float(item.get("weight", 0))
        quantity = int(item.get("quantity", 1))
        total   += weight * quantity
    return round(total, 3)


def calculate_delivery_fee(items: list, delivery_area: str, subtotal: float) -> dict:
    """
    Calculate delivery fee based on area selection and cart contents.

    Args:
        items:         list of cart items (each with name, price, quantity, weight, category)
        delivery_area: "dublin" or "outside_dublin"
        subtotal:      cart subtotal before delivery

    Returns:
        dict with fee breakdown and total
    """
    messages       = []
    outside_dublin = delivery_area == "outside_dublin"
    total_weight   = calculate_total_weight(items)
    rice_bag_count = count_20kg_rice_bags(items)

    base_fee          = 0.0
    outside_dublin_fee = 0.0
    rice_bag_fee      = 0.0
    overweight_fee    = 0.0

    # ── 1. Area-based base fee ────────────────────────────────────────────
    if outside_dublin:
        outside_dublin_fee = OUTSIDE_DUBLIN_FEE
        messages.append(f"€{OUTSIDE_DUBLIN_FEE:.2f} delivery charge (Outside Dublin)")
    else:
        if subtotal >= FREE_DELIVERY_THRESHOLD:
            base_fee = 0.0
            messages.append(f"Free delivery (Order ≥ €{FREE_DELIVERY_THRESHOLD:.2f})")
        else:
            base_fee = BELOW_THRESHOLD_FEE
            messages.append(f"€{BELOW_THRESHOLD_FEE:.2f} delivery (Order below €{FREE_DELIVERY_THRESHOLD:.2f})")

    # ── 2. 20kg rice bag surcharge ────────────────────────────────────────
    if rice_bag_count > 0:
        rice_bag_fee = rice_bag_count * RICE_BAG_FEE
        messages.append(
            f"€{rice_bag_fee:.2f} handling fee "
            f"({rice_bag_count} × 20kg rice bag{'s' if rice_bag_count > 1 else ''})"
        )

    # ── 3. Overweight surcharge ───────────────────────────────────────────
    if total_weight > OVERWEIGHT_THRESHOLD:
        overweight_fee = OVERWEIGHT_FEE
        messages.append(
            f"€{OVERWEIGHT_FEE:.2f} extra packaging "
            f"(Weight {total_weight:.2f}kg exceeds {OVERWEIGHT_THRESHOLD}kg)"
        )

    total = round(base_fee + outside_dublin_fee + rice_bag_fee + overweight_fee, 2)

    return {
        "base_fee":           base_fee,
        "rice_bag_fee":       rice_bag_fee,
        "outside_dublin_fee": outside_dublin_fee,
        "overweight_fee":     overweight_fee,
        "total":              total,
        "total_weight":       total_weight,
        "is_outside_dublin":  outside_dublin,
        "messages":           messages,
    }
