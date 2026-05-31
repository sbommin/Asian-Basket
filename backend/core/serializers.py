from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from .models import Category
from .models import SubCategory
from .models import PromoCode
from .models import Product
from .models import Offer

class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Offer
        fields = ["id", "title", "description", "validity", "badge_type", "priority"]

# Signup
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['full_name', 'email', 'phone', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            password=validated_data['password']
        )
        user.phone = validated_data['phone']
        user.save()
        return user


# Login
# serializers.py - Replace LoginSerializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # ✅ Just validate - DON'T transform data
        user = authenticate(
            email=data['email'],
            password=data['password']
        )
        if not user:
            raise serializers.ValidationError("Invalid email or password")
        
        # ✅ RETURN ORIGINAL DATA (email/password) - View handles user
        return data  # ← CRITICAL: Don't transform!



# from rest_framework import serializers
# from .models import Category, SubCategory

# class SubCategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = SubCategory
#         fields = ["id", "name", "slug", "image"]

# class CategorySerializer(serializers.ModelSerializer):
#     subcategories = SubCategorySerializer(many=True, read_only=True)

#     class Meta:
#         model = Category
#         fields = ["id", "name", "slug", "icon", "subcategories"]


# from rest_framework import serializers
# from .models import Category, SubCategory, Product


# # ================================
# # SUB CATEGORY SERIALIZER
# # ================================
# class SubCategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = SubCategory
#         fields = [
#             "id",
#             "name",
#             "slug",
#             "is_active",
#         ]


# # ================================
# # CATEGORY SERIALIZER
# # ================================
# class CategorySerializer(serializers.ModelSerializer):
#     subcategories = SubCategorySerializer(many=True, read_only=True)

#     class Meta:
#         model = Category
#         fields = [
#             "id",
#             "name",
#             "slug",
#             "icon",
#             "is_active",
#             "subcategories",
#         ]


# from rest_framework import serializers
# from .models import Category, SubCategory

# # ============================
# # SUBCATEGORY SERIALIZER
# # ============================
# class SubCategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = SubCategory
#         fields = ["id", "name", "slug"]

# ============================
# CATEGORY SERIALIZER
# ============================

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ["id", "name", "slug"]


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "subcategories"]

    def get_subcategories(self, obj):
        subcats = obj.subcategories.filter(is_active=True)
        return SubCategorySerializer(subcats, many=True).data

# ================================
# PRODUCT SERIALIZER (IMPORTANT)
# ================================
# class ProductSerializer(serializers.ModelSerializer):
#     image = serializers.SerializerMethodField()  # ✅ REQUIRED
#     category = serializers.StringRelatedField()
#     subcategory = serializers.StringRelatedField()

#     class Meta:
#         model = Product
#         fields = [
#             "id",
#             "name",
#             "slug",
#             "image",
#             "mrp",
#             "price",
#             "category",
#             "subcategory",
#         ]

#     def get_image(self, obj):
#         request = self.context.get("request")
#         if obj.image and request:
#             return request.build_absolute_uri(obj.image.url)
#         return None



# from rest_framework import serializers
# from .models import Announcement

# class AnnouncementSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Announcement
#         fields = ["id", "description", "is_active"]


from rest_framework import serializers
from .models import Announcement

class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["id", "description", "created_at"]


from rest_framework import serializers
from .models import Banner

class BannerSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = [
            "id",
            "tag",
            "heading",
            "description",
            "image",
            "link",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

class ProductSerializer(serializers.ModelSerializer):
    image               = serializers.SerializerMethodField()
    final_stock_status  = serializers.ReadOnlyField()
    price_per_kg        = serializers.ReadOnlyField()        # ✅ NEW
    discount_percentage = serializers.ReadOnlyField()        # ✅ NEW

    category      = serializers.CharField(source="category.slug")
    category_name = serializers.CharField(source="category.name")

    # ✅ NEW — subcategory fields for frontend filtering
    subcategory      = serializers.CharField(source="subcategory.slug")
    subcategory_name = serializers.CharField(source="subcategory.name")
    variants            = ProductVariantSerializer(many=True, read_only=True)
    has_variants        = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",           # ✅ NEW
            "image",
            "mrp",
            "price",
            "price_per_kg",          # ✅ NEW — €x.xx/kg for frontend
            "discount_percentage",   # ✅ NEW — pre-computed % badge
            "stock_quantity",
            "in_stock",
            "final_stock_status",
            "weight",
            "category",
            "category_name",
            "subcategory",           # ✅ NEW
            "subcategory_name",      # ✅ NEW
            "priority",
            "is_trending",           # ✅ NEW — used by TrendingSection
            "variants",
            "has_variants",
        ]

    def get_image(self, obj):
        request = self.context.get("request")
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

from decimal import Decimal
from rest_framework import serializers
from .models import PromoCode


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = [
            "id",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "min_order_total",
            "max_discount_amount",
            "is_active",
            "valid_from",
            "valid_to",
            "usage_limit",
            "times_used",
        ]


class ApplyPromoCodeSerializer(serializers.Serializer):
    code = serializers.CharField()
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate(self, attrs):
        code = attrs["code"].strip().upper()
        cart_total = attrs["cart_total"]

        try:
            promo = PromoCode.objects.get(code__iexact=code)
        except PromoCode.DoesNotExist:
            raise serializers.ValidationError(
                {"code": "Invalid promo code."}
            )

        if not promo.can_be_used(cart_total):
            raise serializers.ValidationError(
                {"code": "Promo code cannot be applied to this order."}
            )

        discount_amount = promo.get_discount_amount(cart_total)

        attrs["promo"] = promo
        attrs["discount_amount"] = discount_amount

        return attrs

from django.db import transaction
from rest_framework import serializers
from .models import Address


# class AddressSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Address
#         fields = [
#             "id", "label", "full_name", "phone", "line1", "line2",
#             "city", "state", "zip_code", "country", "notes", "is_default",
#             "created_at", "updated_at",
#         ]
#         read_only_fields = ["id", "full_name", "created_at", "updated_at"]

#     # ✅ FIXED: Only validate on CREATE
#     def validate(self, attrs):
#         if self.instance is None:  # NEW address only
#             request = self.context.get("request")
#             if request and request.user:
#                 if Address.objects.filter(user=request.user).count() >= 3:
#                     raise serializers.ValidationError(
#                         "You can only save up to 3 addresses."
#                     )
#         return attrs


#     @transaction.atomic
#     def create(self, validated_data):
#         user = self.context["request"].user

#         existing = Address.objects.filter(user=user)
#         is_first = not existing.exists()

#         # If first address, force default
#         if is_first:
#             validated_data["is_default"] = True

#         addr = Address.objects.create(user=user, **validated_data)

#         # If created as default, unset others
#         if addr.is_default:
#             Address.objects.filter(user=user).exclude(pk=addr.pk).update(is_default=False)

#         return addr

#     @transaction.atomic
#     def update(self, instance, validated_data):
#         # Prevent leaving the user with no default if they unset the current default
#         if instance.is_default and validated_data.get("is_default") is False:
#             has_other = Address.objects.filter(user=instance.user, is_default=True).exclude(pk=instance.pk).exists()
#             if not has_other:
#                 raise serializers.ValidationError("At least one address must be default.")

#         for k, v in validated_data.items():
#             setattr(instance, k, v)
#         instance.save()

#         # If marked default, unset others
#         if instance.is_default:
#             Address.objects.filter(user=instance.user).exclude(pk=instance.pk).update(is_default=False)

#         return instance

class AddressSerializer(serializers.ModelSerializer):
    # ✅ Show CURRENT USER's data for display
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    
    class Meta:
        model = Address
        fields = [
            "id", "label", "full_name", "phone", "user_full_name", "user_phone",
            "line1", "line2", "city", "state", "zip_code", "country", 
            "notes", "is_default", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "user_full_name", "user_phone", "created_at", "updated_at"]

    def validate(self, attrs):
        if self.instance is None:  # NEW address only
            request = self.context.get("request")
            if request and request.user:
                if Address.objects.filter(user=request.user).count() >= 3:
                    raise serializers.ValidationError(
                        "You can only save up to 3 addresses."
                    )
        return attrs

    def to_representation(self, instance):
        # ✅ ALWAYS prioritize user data for display over stored address data
        data = super().to_representation(instance)
        data['full_name'] = instance.user.full_name or data.get('full_name', '')
        data['phone'] = instance.user.phone or data.get('phone', '')
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        
        # ✅ AUTO-POPULATE from user on create
        validated_data['full_name'] = user.full_name
        validated_data['phone'] = user.phone

        existing = Address.objects.filter(user=user)
        is_first = not existing.exists()

        if is_first:
            validated_data["is_default"] = True

        addr = Address.objects.create(user=user, **validated_data)

        if addr.is_default:
            Address.objects.filter(user=user).exclude(pk=addr.pk).update(is_default=False)

        return addr

    @transaction.atomic
    def update(self, instance, validated_data):
        if instance.is_default and validated_data.get("is_default") is False:
            has_other = Address.objects.filter(user=instance.user, is_default=True).exclude(pk=instance.pk).exists()
            if not has_other:
                raise serializers.ValidationError("At least one address must be default.")

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if instance.is_default:
            Address.objects.filter(user=instance.user).exclude(pk=instance.pk).update(is_default=False)

        return instance
      
# ============================================================
# ADD THESE TO YOUR EXISTING serializers.py (at the bottom)
# ============================================================

from rest_framework import serializers
from .models import AbandonedCart


class AbandonedCartItemSerializer(serializers.Serializer):
    """Validates each item in the cart items array."""
    id       = serializers.CharField()
    name     = serializers.CharField()
    price    = serializers.FloatField()
    quantity = serializers.IntegerField(min_value=1)
    image    = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)


class AbandonedCartSyncSerializer(serializers.Serializer):
    """
    Received from frontend on every cart change.
    Creates or updates the AbandonedCart record for this user.
    """
    items        = AbandonedCartItemSerializer(many=True)
    total_items  = serializers.IntegerField(min_value=0)
    total_amount = serializers.FloatField(min_value=0)


class AbandonedCartAdminSerializer(serializers.ModelSerializer):
    """Used by the admin list endpoint."""
    status_display   = serializers.CharField(source="get_status_display", read_only=True)
    is_stale         = serializers.BooleanField(read_only=True)
    idle_hours       = serializers.SerializerMethodField()

    class Meta:
        model  = AbandonedCart
        fields = [
            "id",
            "customer_name",
            "customer_email",
            "customer_phone",
            "items",
            "total_items",
            "total_amount",
            "status",
            "status_display",
            "is_stale",
            "idle_hours",
            "created_at",
            "updated_at",
            "converted_at",
        ]

    def get_idle_hours(self, obj):
        from django.utils import timezone
        delta = timezone.now() - obj.updated_at
        return round(delta.total_seconds() / 3600, 1)


# ============================================================
# ADD THESE TO THE BOTTOM OF core/serializers.py
# ============================================================

from rest_framework import serializers
from django.utils import timezone
from .models import UserCoupon


class UserCouponSerializer(serializers.ModelSerializer):
    code           = serializers.CharField(source="promo_code.code",           read_only=True)
    discount_value = serializers.DecimalField(source="promo_code.discount_value",
                                               max_digits=10, decimal_places=2, read_only=True)
    valid_to       = serializers.DateTimeField(source="promo_code.valid_to",    read_only=True)
    is_expired     = serializers.BooleanField(read_only=True)
    is_valid       = serializers.BooleanField(read_only=True)
    source_order_id = serializers.CharField(source="source_order.order_id",    read_only=True)

    # For admin view
    user_email     = serializers.EmailField(source="user.email",               read_only=True)
    user_name      = serializers.CharField(source="user.full_name",            read_only=True)

    class Meta:
        model  = UserCoupon
        fields = [
            "id",
            "code",
            "discount_amount",
            "discount_value",
            "is_used",
            "is_expired",
            "is_valid",
            "expires_at",
            "valid_to",
            "source_order_id",
            "created_at",
            # Admin fields
            "user_email",
            "user_name",
        ]
# ============================================================
# ADD TO core/serializers.py (at the bottom)
# ============================================================

from rest_framework import serializers
from .models import User, Order


class CustomerQuickSearchSerializer(serializers.ModelSerializer):
    """Lightweight serializer for search results list."""
    total_orders = serializers.IntegerField(read_only=True)
    total_spent  = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        read_only=True, allow_null=True
    )

    class Meta:
        model  = User
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "is_active",
            "created_at",
            "total_orders",
            "total_spent",
        ]


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Full customer profile for detail view."""
    total_orders = serializers.IntegerField(read_only=True)
    total_spent  = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        read_only=True, allow_null=True
    )

    class Meta:
        model  = User
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "is_active",
            "created_at",
            "total_orders",
            "total_spent",
        ]


class OrderSummarySerializer(serializers.ModelSerializer):
    """Order summary for customer detail view."""
    items_count = serializers.SerializerMethodField()
    items_preview = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = [
            "id",
            "order_id",
            "status",
            "payment_status",
            "total_amount",
            "subtotal",
            "discount",
            "delivery_fee",
            "name",
            "phone",
            "address",
            "city",
            "pincode",
            "items_count",
            "items_preview",
            "created_at",
        ]

    def get_items_count(self, obj):
        return obj.items.count()

    def get_items_preview(self, obj):
        return [
            {
                "name":     item.product_name,
                "quantity": item.quantity,
                "price":    str(item.price),
            }
            for item in obj.items.all()[:5]  # First 5 items
        ]
# ============================================================
# ADD TO BOTTOM OF core/serializers.py
# ============================================================

from rest_framework import serializers
from .models import Policy


class PolicySerializer(serializers.ModelSerializer):
    policy_type_display = serializers.CharField(
        source="get_policy_type_display", read_only=True
    )

    class Meta:
        model  = Policy
        fields = [
            "id",
            "policy_type",
            "policy_type_display",
            "title",
            "content",
            "last_updated",
        ]
        read_only_fields = ["id", "last_updated", "policy_type_display"]
# ============================================================
# ADD TO BOTTOM OF core/serializers.py
# ============================================================

from rest_framework import serializers
from .models import ProductVariant


class ProductVariantSerializer(serializers.ModelSerializer):
    final_stock_status = serializers.BooleanField(read_only=True)

    class Meta:
        model  = ProductVariant
        fields = [
            "id",
            "label",
            "weight_kg",
            "price",
            "mrp",
            "in_stock",
            "stock_quantity",
            "final_stock_status",
            "sort_order",
        ]


# ── Also update ProductSerializer to include variants ────────────────────────
# Find your existing ProductSerializer class and ADD these two fields:
#
#   variants = ProductVariantSerializer(many=True, read_only=True)
#   has_variants = serializers.SerializerMethodField()
#
# And add them to the fields list:
#   "variants",
#   "has_variants",
#
# And add this method:
#   def get_has_variants(self, obj):
#       return obj.variants.filter(is_active=True).exists()
#
# ── EXAMPLE of updated ProductSerializer ────────────────────────────────────
#
# class ProductSerializer(serializers.ModelSerializer):
#     image               = serializers.SerializerMethodField()
#     final_stock_status  = serializers.ReadOnlyField()
#     price_per_kg        = serializers.ReadOnlyField()
#     discount_percentage = serializers.ReadOnlyField()
#     category            = serializers.CharField(source="category.slug")
#     category_name       = serializers.CharField(source="category.name")
#     subcategory         = serializers.CharField(source="subcategory.slug")
#     subcategory_name    = serializers.CharField(source="subcategory.name")
#     variants            = ProductVariantSerializer(many=True, read_only=True)   # ✅ ADD
#     has_variants        = serializers.SerializerMethodField()                   # ✅ ADD
#
#     class Meta:
#         model = Product
#         fields = [
#             ...existing fields...
#             "variants",       # ✅ ADD
#             "has_variants",   # ✅ ADD
#         ]
#
#     def get_has_variants(self, obj):                                            # ✅ ADD
#         return obj.variants.filter(is_active=True).exists()
