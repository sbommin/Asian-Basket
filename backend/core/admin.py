from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category,Announcement
from .models import Address
from .models import Offer

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display  = ("title", "description", "badge_type", "priority", "is_active", "created_at")
    list_editable = ("is_active", "priority")
    list_filter   = ("is_active", "badge_type")
    search_fields = ("title", "description")
    ordering      = ("-priority", "-created_at")

# ---------------- USER ADMIN ----------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User

    list_display = ('id', 'email', 'full_name', 'phone', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    readonly_fields = ('last_login', 'created_at')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'created_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'phone', 'password1', 'password2'),
        }),
    )

    search_fields = ('email', 'full_name', 'phone')
    ordering = ('email',)



from django.contrib import admin
from .models import Category, SubCategory, Product


# ============================
# CATEGORY ADMIN
# ============================
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("name",)


# ============================
# SUB CATEGORY ADMIN
# ============================
@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "slug", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("name", "category__name")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("category", "name")



@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("description", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("description",)
    ordering = ("-created_at",)

    actions = ["make_active", "make_inactive"]

    def make_active(self, request, queryset):
        queryset.update(is_active=True)

    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)

    make_active.short_description = "Mark selected announcements as Active"
    make_inactive.short_description = "Mark selected announcements as Inactive"


from django.contrib import admin
from .models import Banner

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("heading", "tag", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("heading", "tag")



from django.contrib import admin
from .models import Product


from django.contrib import admin
from .models import PromoCode


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "discount_type",
        "discount_value",
        "is_active",
        "valid_from",
        "valid_to",
        "times_used",
    )
    list_filter = ("is_active", "discount_type")
    search_fields = ("code",)

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "city", "state", "zip_code", "is_default", "updated_at")
    list_filter = ("is_default", "country", "state")
    search_fields = ("user__email", "line1", "city", "zip_code")



from django.contrib import admin
from .models import Order, OrderItem


# 🔹 OrderItem Inline (shows products inside order page)
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_name", "quantity", "price")
    can_delete = False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        "order_id",
        "user",
        "revolut_order_id",
        "payment_status",
        "status",           # ← must be in list_display to use list_editable
        "total_amount",
        "created_at",
    )

    # ✅ Allows changing status directly from the order list page
    list_editable = (
        "status",
    )

    list_filter = (
        "payment_status",
        "status",
        "created_at",
    )

    search_fields = (
        "order_id",
        "revolut_order_id",
        "user__email",
        "name",
        "phone",
    )

    readonly_fields = (
        "order_id",
        "revolut_order_id",
        "payment_status",
        # ✅ "status" REMOVED from readonly — now editable in form view too
        "subtotal",
        "discount",
        "delivery_fee",
        "total_amount",
        "created_at",
    )

    inlines = [OrderItemInline]
    ordering = ("-created_at",)

    fieldsets = (
        ("Order Info", {
            "fields": (
                "order_id",
                "user",
                "revolut_order_id",
                "payment_status",
                "status",           # ← renders as dropdown in form view
            )
        }),
        ("Customer Info", {
            "fields": (
                "name",
                "phone",
                "address",
                "city",
                "state",
                "pincode",
            )
        }),
        ("Pricing", {
            "fields": (
                "subtotal",
                "discount",
                "delivery_fee",
                "total_amount",
            )
        }),
        ("Timestamps", {
            "fields": (
                "created_at",
            )
        }),
    )


# 🔹 Optional: Register OrderItem separately (optional)
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product_name", "quantity", "price")



from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "formatted_price",
        "formatted_mrp",
        "stock_quantity",
        "in_stock",
        "weight",
        "is_active",
    )

    list_filter = (
        "in_stock",
        "is_active",
        "is_trending",
        "category",
    )

    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("priority",)

    # 🔥 Change field labels in form
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields["price"].label = "Price (€ EUR)"
        form.base_fields["mrp"].label = "MRP (€ EUR)"
        form.base_fields["weight"].label = "Weight (KG)"
        form.base_fields["stock_quantity"].label = "Stock Quantity"
        return form

    # 💶 Format Price
    def formatted_price(self, obj):
        return f"€{obj.price}"
    formatted_price.short_description = "Price (€)"

    # 💶 Format MRP
    def formatted_mrp(self, obj):
        return f"€{obj.mrp}"
    formatted_mrp.short_description = "MRP (€)"
    
# ============================================================
# ADD THIS TO YOUR existing admin.py (or create core/admin.py)
# ============================================================

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import AbandonedCart


@admin.register(AbandonedCart)
class AbandonedCartAdmin(admin.ModelAdmin):

    list_display = [
        "customer_email",
        "customer_name",
        "customer_phone",
        "total_items",
        "total_amount_display",
        "status_badge",
        "idle_time",
        "updated_at",
    ]

    list_filter  = ["status", "created_at", "updated_at"]
    search_fields = ["customer_email", "customer_name", "customer_phone"]
    readonly_fields = [
        "customer_name", "customer_email", "customer_phone",
        "items_display", "total_items", "total_amount",
        "status", "created_at", "updated_at", "converted_at",
    ]

    ordering = ["-updated_at"]

    fieldsets = (
        ("Customer", {
            "fields": ("customer_name", "customer_email", "customer_phone", "user")
        }),
        ("Cart Contents", {
            "fields": ("items_display", "total_items", "total_amount")
        }),
        ("Status", {
            "fields": ("status", "created_at", "updated_at", "converted_at")
        }),
    )

    # ── Custom display columns ──────────────────────────────────────────────

    def total_amount_display(self, obj):
        return f"€{obj.total_amount:.2f}"
    total_amount_display.short_description = "Total"

    def status_badge(self, obj):
        colors = {
            "active":    "#f59e0b",   # amber
            "converted": "#10b981",   # green
            "expired":   "#6b7280",   # gray
        }
        color = colors.get(obj.status, "#6b7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            color,
            obj.get_status_display(),
        )
    status_badge.short_description = "Status"

    def idle_time(self, obj):
        delta = timezone.now() - obj.updated_at
        hours = delta.total_seconds() / 3600
        if hours < 1:
            return f"{int(delta.total_seconds() / 60)}m ago"
        if hours < 24:
            return f"{int(hours)}h ago"
        return f"{delta.days}d ago"
    idle_time.short_description = "Last Active"

    def items_display(self, obj):
        if not obj.items:
            return "—"
        rows = "".join(
            f"<tr>"
            f"<td style='padding:4px 12px'>{item.get('name','?')}</td>"
            f"<td style='padding:4px 12px;text-align:center'>{item.get('quantity','?')}</td>"
            f"<td style='padding:4px 12px;text-align:right'>€{float(item.get('price',0)):.2f}</td>"
            f"<td style='padding:4px 12px;text-align:right'>"
            f"€{float(item.get('price',0)) * int(item.get('quantity',1)):.2f}</td>"
            f"</tr>"
            for item in obj.items
        )
        return format_html(
            "<table style='border-collapse:collapse;width:100%;font-size:13px'>"
            "<thead><tr style='background:#f3f4f6'>"
            "<th style='padding:6px 12px;text-align:left'>Product</th>"
            "<th style='padding:6px 12px'>Qty</th>"
            "<th style='padding:6px 12px;text-align:right'>Price</th>"
            "<th style='padding:6px 12px;text-align:right'>Subtotal</th>"
            "</tr></thead>"
            "<tbody>{}</tbody>"
            "</table>",
            format_html(rows),
        )
    items_display.short_description = "Cart Items"

    # Disable add from admin (carts are only created via API)
    def has_add_permission(self, request):
        return False
# ============================================================
# ADD TO core/admin.py
# ============================================================

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import UserCoupon


@admin.register(UserCoupon)
class UserCouponAdmin(admin.ModelAdmin):

    list_display = [
        "coupon_code",
        "user_email",
        "discount_amount_display",
        "source_order_display",
        "status_badge",
        "expires_at",
        "created_at",
    ]

    list_filter  = ["is_used", "created_at", "expires_at"]
    search_fields = ["user__email", "user__full_name", "promo_code__code", "source_order__order_id"]
    readonly_fields = [
        "user", "promo_code", "source_order", "redeemed_on_order",
        "discount_amount", "is_used", "expires_at", "created_at",
    ]
    ordering = ["-created_at"]

    def coupon_code(self, obj):
        return obj.promo_code.code
    coupon_code.short_description = "Code"

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Customer"

    def discount_amount_display(self, obj):
        return f"€{obj.discount_amount:.2f}"
    discount_amount_display.short_description = "Value"

    def source_order_display(self, obj):
        if obj.source_order:
            return obj.source_order.order_id
        return "—"
    source_order_display.short_description = "Source Order"

    def status_badge(self, obj):
        if obj.is_used:
            color, label = "#6b7280", "Used"
        elif obj.is_expired:
            color, label = "#ef4444", "Expired"
        else:
            color, label = "#10b981", "Valid"

        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            color, label,
        )
    status_badge.short_description = "Status"

    def has_add_permission(self, request):
        return False  # Coupons are auto-generated only
# ============================================================
# ADD TO core/admin.py
# ============================================================

from django.contrib import admin
from django.utils.html import format_html
from .models import Policy


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display  = ["policy_type_display", "title", "last_updated_display", "updated_by"]
    readonly_fields = ["last_updated", "updated_by"]
    ordering      = ["policy_type"]

    fieldsets = (
        (None, {
            "fields": ("policy_type", "title"),
        }),
        ("Content", {
            "fields": ("content",),
            "description": "You can use HTML tags for formatting: "
                           "<b>&lt;h2&gt;</b>, <b>&lt;p&gt;</b>, <b>&lt;ul&gt;</b>, "
                           "<b>&lt;li&gt;</b>, <b>&lt;strong&gt;</b>, <b>&lt;br&gt;</b>",
        }),
        ("Metadata", {
            "fields": ("last_updated", "updated_by"),
            "classes": ("collapse",),
        }),
    )

    def policy_type_display(self, obj):
        colors = {"terms": "#3b82f6", "delivery": "#10b981"}
        color  = colors.get(obj.policy_type, "#6b7280")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            color,
            obj.get_policy_type_display(),
        )
    policy_type_display.short_description = "Type"

    def last_updated_display(self, obj):
        return obj.last_updated.strftime("%d %b %Y, %H:%M")
    last_updated_display.short_description = "Last Updated"

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    # Prevent adding more than 2 policies (one per type)
    def has_add_permission(self, request):
        return Policy.objects.count() < 2
