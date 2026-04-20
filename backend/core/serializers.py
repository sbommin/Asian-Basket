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
