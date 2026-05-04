# ============================================================
# CREATE NEW FILE: core/coupon_service.py
# ============================================================
"""
Auto Coupon Generation Service — Asian Basket

Rules:
- Every €50 spent on a SINGLE order → €5 coupon
- Scales linearly: €100 order = €10 coupon, €150 = €15, etc.
- Minimum qualifying order: €50
- Coupon valid for 30 days
- Single use per coupon
- One coupon generated per qualifying paid order
- Coupon is user-specific (cannot be shared)
"""

import random
import string
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta


# ── Constants ─────────────────────────────────────────────────────────────────
SPEND_THRESHOLD   = Decimal("50.00")   # Every €50 earns...
COUPON_VALUE      = Decimal("5.00")    # ...a €5 coupon
EXPIRY_DAYS       = 30                 # Valid for 30 days
CODE_PREFIX       = "REWARD"
CODE_LENGTH       = 6                  # Random suffix length


def _generate_unique_code() -> str:
    """Generate a unique promo code like REWARD-X7K2P9"""
    from .models import PromoCode
    for _ in range(10):  # retry up to 10 times
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=CODE_LENGTH))
        code = f"{CODE_PREFIX}-{suffix}"
        if not PromoCode.objects.filter(code=code).exists():
            return code
    raise ValueError("Could not generate a unique coupon code after 10 attempts")


def calculate_coupon_value(order_total: Decimal) -> Decimal:
    """
    Calculate coupon value based on order total.

    Examples:
        €49.99  → €0    (below threshold)
        €50.00  → €5
        €99.99  → €5
        €100.00 → €10
        €150.00 → €15
    """
    if order_total < SPEND_THRESHOLD:
        return Decimal("0.00")

    multiplier = int(order_total / SPEND_THRESHOLD)  # floor division
    return COUPON_VALUE * multiplier


def generate_coupon_for_order(order) -> "UserCoupon | None":
    """
    Main entry point. Call this after an order is marked as PAID.

    Returns the created UserCoupon or None if order doesn't qualify.

    Usage:
        from .coupon_service import generate_coupon_for_order
        coupon = generate_coupon_for_order(order)
    """
    from .models import PromoCode, UserCoupon

    # Already generated a coupon for this order?
    if UserCoupon.objects.filter(source_order=order).exists():
        return None

    order_total   = Decimal(str(order.total_amount))
    coupon_value  = calculate_coupon_value(order_total)

    # Order doesn't qualify
    if coupon_value <= 0:
        return None

    # Create the PromoCode record
    code       = _generate_unique_code()
    expires_at = timezone.now() + timedelta(days=EXPIRY_DAYS)

    promo = PromoCode.objects.create(
        code             = code,
        description      = (
            f"Reward coupon for order {order.order_id}. "
            f"Earned by spending €{order_total:.2f}."
        ),
        discount_type    = PromoCode.DISCOUNT_TYPE_FIXED,
        discount_value   = coupon_value,
        min_order_total  = Decimal("0.00"),
        max_discount_amount = coupon_value,   # Cap = coupon value
        is_active        = True,
        valid_from       = timezone.now(),
        valid_to         = expires_at,
        usage_limit      = 1,                 # Single use only
        times_used       = 0,
    )

    # Create the UserCoupon record linking user → promo → order
    user_coupon = UserCoupon.objects.create(
        user            = order.user,
        promo_code      = promo,
        source_order    = order,
        discount_amount = coupon_value,
        expires_at      = expires_at,
    )

    return user_coupon
