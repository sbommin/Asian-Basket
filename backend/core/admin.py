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
