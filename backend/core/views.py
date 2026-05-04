from rest_framework.views import APIView
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status, generics, viewsets
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import PromoCode
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import generics

from django.db.models import Q

from .models import Category, Announcement, Product
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    CategorySerializer,
    AnnouncementSerializer,
    ProductSerializer
)

from .models import Offer
from .serializers import OfferSerializer

@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def offer_list(request):
    offers = Offer.objects.filter(is_active=True)
    serializer = OfferSerializer(offers, many=True)
    return Response(serializer.data)

# ===================== AUTH =====================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=201)
        return Response(serializer.errors, status=400)


# class LoginView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         serializer = LoginSerializer(data=request.data)
#         if serializer.is_valid():
#             return Response(serializer.validated_data, status=200)
#         return Response(serializer.errors, status=400)

# views.py - Replace your LoginView with this EXACT code:
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .serializers import LoginSerializer

# views.py - Replace LoginView
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            # ✅ Extract from validated_data (has email/password)
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # ✅ Authenticate separately
            user = authenticate(email=email, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'full_name': user.full_name,
                        'phone': user.phone or '',
                    }
                }, status=200)
        
        return Response(serializer.errors, status=400)


from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Category

class CategoryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.filter(
            is_active=True,
            subcategories__is_active=True
        ).distinct()

        serializer = CategorySerializer(
            categories,
            many=True,
            context={"request": request}
        )
        return Response(serializer.data)



from rest_framework.generics import ListAPIView
from .models import Announcement
from .serializers import AnnouncementSerializer
from .pagination import AnnouncementPagination

class AnnouncementListAPIView(ListAPIView):
    serializer_class = AnnouncementSerializer
    queryset = Announcement.objects.filter(is_active=True)
    permission_classes = [AllowAny] 
    def get_queryset(self):
        qs = super().get_queryset()
        print("ANNOUNCEMENTS COUNT:", qs.count())
        return qs
    
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Banner
from .serializers import BannerSerializer

class BannerListAPIView(APIView):
    permission_classes = [AllowAny] 
    def get(self, request):
        banners = Banner.objects.filter(is_active=True).order_by("-created_at")
        serializer = BannerSerializer(banners, many=True, context={"request": request})
        return Response(serializer.data)




# from rest_framework import generics
# from .models import Product
# from .serializers import ProductSerializer

# class ProductListView(generics.ListAPIView):
#     serializer_class = ProductSerializer
#     permission_classes = [AllowAny] 
#     def get_queryset(self):
#         queryset = Product.objects.filter(is_active=True)

#         category = self.request.query_params.get("category")
#         subcategory = self.request.query_params.get("subcategory")
#         search = self.request.query_params.get("search")

#         if category:
#             queryset = queryset.filter(category__slug=category)

#         if subcategory:
#             queryset = queryset.filter(subcategory__slug=subcategory)

#         if search:
#             queryset = queryset.filter(name__icontains=search)

#         # ✅ PRIORITY FIRST, THEN STOCK, THEN NEW
#         return queryset.order_by(
#             "-priority",
#             "-in_stock",
#             "-created_at"
#         )
    



from rest_framework import generics
from rest_framework.permissions import AllowAny   # 🔥 REQUIRED
from .models import Product
from .serializers import ProductSerializer

class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # 🔥 PUBLIC API

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)

        category = self.request.query_params.get("category")
        subcategory = self.request.query_params.get("subcategory")
        search = self.request.query_params.get("search")

        if category:
            queryset = queryset.filter(category__slug=category)

        if subcategory:
            queryset = queryset.filter(subcategory__slug=subcategory)

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by(
            "-priority",
            "-in_stock",
            "-created_at"
        )



from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Address
from .serializers import AddressSerializer


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by("-is_default", "-updated_at")

    @transaction.atomic
    def perform_destroy(self, instance):
        user = instance.user
        was_default = instance.is_default
        instance.delete()

        if was_default:
            next_addr = Address.objects.filter(user=user).order_by("-updated_at").first()
            if next_addr:
                Address.objects.filter(user=user).update(is_default=False)
                Address.objects.filter(pk=next_addr.pk).update(is_default=True)

    @action(detail=True, methods=["post"])
    def set_default(self, request, pk=None):
        addr = self.get_object()
        Address.objects.filter(user=request.user).update(is_default=False)
        Address.objects.filter(pk=addr.pk).update(is_default=True)
        return Response({"detail": "Default address updated."}, status=status.HTTP_200_OK)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data

    user.full_name = data.get('name', user.full_name) # Frontend sends 'name'
    user.phone = data.get('phone', user.phone)
    user.save()

    return Response({
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone
    })

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer

from .serializers import ProductSerializer

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer

@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def trending_products(request):
    products = Product.objects.filter(
        is_trending=True,
        is_active=True
    )

    serializer = ProductSerializer(
        products,
        many=True,
        context={"request": request}
    )
    return Response(serializer.data)

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Product

@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def trending_products_simple(request):
    products = Product.objects.filter(
        is_trending=True,
        is_active=True
    ).select_related("category", "subcategory")

    data = [
        {
            "id": p.id,
            "name": p.name,
            "category_slug": p.category.slug,
            "subcategory_slug": p.subcategory.slug,
        }
        for p in products
    ]

    return Response(data)

#this section i will be changed 
@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def trending_products_simple(request):
    products = Product.objects.filter(
        is_trending=True,
        is_active=True
    ).select_related("category", "subcategory")

    data = [
        {
            "id": p.id,
            "name": p.name,
            "category_slug": p.category.slug,
            "subcategory_slug": p.subcategory.slug,
        }
        for p in products
    ]

    return Response(data)

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction

from .models import PromoCode
from .serializers import PromoCodeSerializer, ApplyPromoCodeSerializer


# CRUD ViewSet (optional)
class PromoCodeViewSet(viewsets.ModelViewSet):
    queryset = PromoCode.objects.all()
    serializer_class = PromoCodeSerializer
    filterset_fields = ["code", "discount_type", "is_active"]
    search_fields = ["code", "description"]


# Apply Promo Code API
class ApplyPromoCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ApplyPromoCodeSerializer(data=request.data)

        if serializer.is_valid():
            promo = serializer.validated_data["promo"]
            discount_amount = serializer.validated_data["discount_amount"]
            cart_total = serializer.validated_data["cart_total"]

            new_total = cart_total - discount_amount

            return Response({
                "code": promo.code,
                "discount_type": promo.discount_type,
                "discount_value": promo.discount_value,
                "discount_amount": discount_amount,
                "new_total": new_total
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
import requests
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order
import requests
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order, OrderItem

import requests
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Order, OrderItem

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import requests
from django.conf import settings
from .models import Order, OrderItem


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def create_revolut_payment(request):

#     data = request.data

#     print("CHECKOUT REQUEST DATA:", data)

#     required_fields = [
#         "name",
#         "phone",
#         "address",
#         "city",
#         "state",
#         "pincode",
#         "subtotal",
#         "delivery_fee",
#         "total_amount",
#         "items"
#     ]

#     # ✅ Validate fields
#     for field in required_fields:
#         if field not in data or data[field] is None:
#             return Response(
#                 {"error": f"{field} is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#     try:

#         # ✅ STEP 1: Create local order
#         order = Order.objects.create(
#             user=request.user,
#             name=data["name"],
#             phone=data["phone"],
#             address=data["address"],
#             city=data["city"],
#             state=data["state"],
#             pincode=data["pincode"],
#             subtotal=data["subtotal"],
#             discount=data.get("discount", 0),
#             delivery_fee=data["delivery_fee"],
#             total_amount=data["total_amount"],
#             status="PENDING",
#             payment_status="PENDING"
#         )

#         print("LOCAL ORDER CREATED:", order.order_id)

#         # ✅ STEP 2: Save order items
#         for item in data["items"]:
#             OrderItem.objects.create(
#                 order=order,
#                 product_name=item["name"],
#                 quantity=item["quantity"],
#                 price=item["price"],
#             )

#         # ✅ STEP 3: Revolut headers
#         headers = {
#             "Authorization": f"Bearer {settings.REVOLUT_SECRET_KEY}",
#             "Content-Type": "application/json",
#             "Accept": "application/json",
#             "Revolut-Api-Version": "2023-09-01",
#         }

#         # ✅ STEP 4: CORRECT hosted checkout payload
#         payload = {
#             "amount": int(float(order.total_amount) * 100),  # cents
#             "currency": "EUR",
#             "capture_mode": "automatic",

#             # important reference
#             "merchant_order_ext_ref": str(order.order_id),

#             # ✅ THIS IS THE FIX
#             "redirect_url": f"{settings.FRONTEND_URL}/payment-success?order_id={order.order_id}"
#         }

#         print("REVOLUT PAYLOAD:", payload)

#         # ✅ STEP 5: Create Revolut order
#         response = requests.post(
#             "https://sandbox-merchant.revolut.com/api/orders",
#             json=payload,
#             headers=headers
#         )

#         revolut_data = response.json()

#         print("REVOLUT STATUS:", response.status_code)
#         print("REVOLUT DATA:", revolut_data)

#         if response.status_code != 201:

#             order.payment_status = "FAILED"
#             order.status = "CANCELLED"
#             order.save()

#             return Response(
#                 {"error": revolut_data},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ STEP 6: Save revolut order id
#         order.revolut_order_id = revolut_data.get("id")
#         order.save()

#         print("REVOLUT ORDER CREATED:", order.revolut_order_id)

#         # ✅ STEP 7: Return checkout url
#         return Response({
#             "checkout_url": revolut_data.get("checkout_url"),
#             "order_id": str(order.order_id)
#         })

#     except Exception as e:

#         print("REVOLUT ERROR:", str(e))

#         order.payment_status = "FAILED"
#         order.status = "CANCELLED"
#         order.save()

#         return Response(
#             {"error": str(e)},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )
# views.py

from .utils import calculate_delivery_fee  # ✅ Import from utils.py

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_revolut_payment(request):

    data = request.data
    print("CHECKOUT REQUEST DATA:", data)

    required_fields = [
        "name",
        "phone",
        "address",
        "city",
        "state",
        "pincode",
        "subtotal",
        "delivery_fee",
        "total_amount",
        "items"
    ]

    # ✅ Validate required fields
    for field in required_fields:
        if field not in data or data[field] is None:
            return Response(
                {"error": f"{field} is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

    try:
        subtotal = float(data["subtotal"])
        discount = float(data.get("discount", 0))
        frontend_delivery_fee = round(float(data["delivery_fee"]), 2)

        # ✅ STEP 1: Recalculate delivery fee on backend
        
      delivery_area = data.get("delivery_area", "dublin") # "dublin" or "outside_dublin"
      
      delivery_result = calculate_delivery_fee(
            items=data["items"],
            delivery_area=delivery_area,
            subtotal=subtotal
        )
        expected_delivery_fee = delivery_result["total"]

        print("EXPECTED DELIVERY FEE:", expected_delivery_fee)
        print("FRONTEND DELIVERY FEE:", frontend_delivery_fee)
        print("DELIVERY BREAKDOWN:", delivery_result)

        # ✅ STEP 2: Reject if frontend tampered with delivery fee
        if frontend_delivery_fee != expected_delivery_fee:
            return Response(
                {
                    "error": f"Invalid delivery fee. "
                             f"Expected €{expected_delivery_fee}, "
                             f"got €{frontend_delivery_fee}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ STEP 3: Always use backend-calculated total
        calculated_total = round(subtotal - discount + expected_delivery_fee, 2)

        # ✅ STEP 4: Create local order with backend-verified values
        order = Order.objects.create(
            user=request.user,
            name=data["name"],
            phone=data["phone"],
            address=data["address"],
            city=data["city"],
            state=data["state"],
            pincode=data["pincode"],
            subtotal=subtotal,
            discount=discount,
            delivery_fee=expected_delivery_fee,  # ✅ backend value
            total_amount=calculated_total,        # ✅ backend value
            status="PENDING",
            payment_status="PENDING"
        )

        print("LOCAL ORDER CREATED:", order.order_id)

        # ✅ STEP 5: Save order items
        for item in data["items"]:
            OrderItem.objects.create(
                order=order,
                product_name=item["name"],
                quantity=item["quantity"],
                price=item["price"],
            )

        # ✅ STEP 6: Revolut headers
        headers = {
            "Authorization": f"Bearer {settings.REVOLUT_SECRET_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Revolut-Api-Version": "2024-09-01",
        }

        # ✅ STEP 7: Revolut payload with backend-calculated total
        payload = {
            "amount": int(calculated_total * 100),  # cents
            "currency": "EUR",
            "capture_mode": "automatic",
            "merchant_order_ext_ref": str(order.order_id),
            "redirect_url": f"{settings.FRONTEND_URL}/payment-success?order_id={order.order_id}"
        }

        print("REVOLUT PAYLOAD:", payload)

        # ✅ STEP 8: Create Revolut order
        response = requests.post(
            settings.REVOLUT_BASE_URL,  # ✅ Use settings, not hardcoded URL
            json=payload,
            headers=headers
        )

        revolut_data = response.json()

        print("REVOLUT STATUS:", response.status_code)
        print("REVOLUT DATA:", revolut_data)

        if response.status_code != 201:
            order.payment_status = "FAILED"
            order.status = "CANCELLED"
            order.save()
            return Response(
                {"error": revolut_data},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ STEP 9: Save revolut order id
        order.revolut_order_id = revolut_data.get("id")
        order.save()

        print("REVOLUT ORDER CREATED:", order.revolut_order_id)

        # ✅ STEP 10: Return checkout url
        return Response({
            "checkout_url": revolut_data.get("checkout_url"),
            "order_id": str(order.order_id)
        })

    except Exception as e:
        print("REVOLUT ERROR:", str(e))

        # ✅ Only update order if it was created before the exception
        try:
            order.payment_status = "FAILED"
            order.status = "CANCELLED"
            order.save()
        except UnboundLocalError:
            pass  # Order was never created, nothing to update

        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_revolut_payment(request):

    order_id = request.data.get("order_id")

    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

    headers = {
        "Authorization": f"Bearer {settings.REVOLUT_SECRET_KEY}",
        "Revolut-Api-Version": "2024-09-01",
    }

    response = requests.get(
        f"https://merchant.revolut.com/api/orders/{order.revolut_order_id}",
        headers=headers
    )

    data = response.json()

    state = data.get("state")

    print("REVOLUT STATE:", state)

    if state == "COMPLETED":

        order.payment_status = "PAID"
        order.status = "PROCESSED"

    elif state == "FAILED":

        order.payment_status = "FAILED"
        order.status = "CANCELLED"

    else:

        order.payment_status = "PENDING"
        order.status = "PENDING"

    order.save()

    return Response({
        "payment_status": order.payment_status,
        "order_status": order.status
    })

# Add this to views.py (exact copy-paste)
import logging
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Order

logger = logging.getLogger(__name__)

@csrf_exempt
#@method_decorator(csrf_exempt, name='dispatch')
@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@transaction.atomic
def revolut_webhook(request):
    """
    Revolut webhook endpoint - updates Order.payment_status automatically
    """
    payload = request.data
    logger.info(f"REVOLUT WEBHOOK RECEIVED: {payload}")
    revolut_signature = request.headers.get("Revolut-Signature")
    if not revolut_signature:
        return Response({"detail": "Missing signature"}, status=400)

    expected = hmac.new(
        settings.REVOLUT_WEBHOOK_SECRET.encode(),
        request.body,
        hashlib.sha256
    ).hexdigest()

    # Revolut sends "v1=<hash>"
    received = revolut_signature.replace("v1=", "")
    if not hmac.compare_digest(expected, received):
        logger.warning("Invalid Revolut webhook signature")
        return Response({"detail": "Invalid signature"}, status=403)
    event_type = payload.get("event")
    order_data = payload.get("data", {}).get("order", {})

    # Use merchant_order_ext_ref (what you set during order creation)
    ext_ref = order_data.get("merchant_order_ext_ref")
    
    if not ext_ref:
        logger.warning("Webhook missing merchant_order_ext_ref")
        return Response({"detail": "Missing order reference"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(order_id=ext_ref)
    except Order.DoesNotExist:
        logger.warning(f"Webhook order not found: {ext_ref}")
        return Response({"detail": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    # Map Revolut events/states to your Order model
    if event_type == "ORDER_COMPLETED":
        order.payment_status = "PAID"
        order.status = "PROCESSED"
    elif event_type in ["ORDER_PAYMENT_FAILED", "ORDER_PAYMENT_DECLINED"]:
        order.payment_status = "FAILED"
        order.status = "CANCELLED"
    elif order_data.get("state") == "completed":
        order.payment_status = "PAID"
        order.status = "PROCESSED"
    elif order_data.get("state") in ["failed", "declined", "cancelled"]:
        order.payment_status = "FAILED"
        order.status = "CANCELLED"
    else:
        logger.info(f"Webhook ignored for state: {order_data.get('state')}")
        return Response({"detail": "Ignored event"}, status=status.HTTP_200_OK)

    order.save()
    logger.info(f"Order {order.order_id} updated to {order.payment_status}")

    return Response({"detail": "ok"}, status=status.HTTP_200_OK)
  
# ============================================================
# ADD THESE TO YOUR EXISTING views.py (at the bottom)
# ============================================================

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from .models import AbandonedCart
from .serializers import AbandonedCartSyncSerializer, AbandonedCartAdminSerializer


# ─── 1. SYNC CART (called from frontend on every cart change) ────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def sync_abandoned_cart(request):
    """
    Frontend calls this endpoint every time the cart changes.
    Creates or updates the AbandonedCart record for the logged-in user.
    If cart is empty, deletes the record (no longer abandoned).
    """
    serializer = AbandonedCartSyncSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    # If cart is empty, remove the abandoned cart record
    if data["total_items"] == 0:
        AbandonedCart.objects.filter(
            user=request.user,
            status="active"
        ).delete()
        return Response({"detail": "Cart cleared."})

    user = request.user

    # Create or update
    cart, _ = AbandonedCart.objects.update_or_create(
        user=user,
        status="active",
        defaults={
            "customer_name":  user.full_name or "",
            "customer_email": user.email or "",
            "customer_phone": user.phone or "",
            "items":          data["items"],
            "total_items":    data["total_items"],
            "total_amount":   data["total_amount"],
        },
    )

    return Response({"detail": "Cart synced.", "cart_id": cart.id})


# ─── 2. MARK CART AS CONVERTED (called when order is placed) ─────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def convert_abandoned_cart(request):
    """
    Called after a successful order placement to mark the cart as converted.
    This stops it from showing as abandoned in the admin.
    """
    try:
        cart = AbandonedCart.objects.get(user=request.user, status="active")
        cart.status       = "converted"
        cart.converted_at = timezone.now()
        cart.save()
    except AbandonedCart.DoesNotExist:
        pass  # Cart already cleared or never existed — that's fine

    return Response({"detail": "Cart marked as converted."})


# ─── 3. ADMIN LIST (admin only) ──────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_abandoned_carts(request):
    """
    Returns all abandoned (active) carts for the admin dashboard.
    Supports filtering by status and search by email.
    Also auto-marks stale carts (7+ days idle) as expired.
    """
    # Auto-expire stale carts
    stale_cutoff = timezone.now() - timezone.timedelta(days=7)
    AbandonedCart.objects.filter(
        status="active",
        updated_at__lt=stale_cutoff
    ).update(status="expired")

    # Filtering
    cart_status = request.query_params.get("status", "active")
    search      = request.query_params.get("search", "").strip()

    carts = AbandonedCart.objects.all()

    if cart_status in ("active", "converted", "expired"):
        carts = carts.filter(status=cart_status)

    if search:
        carts = carts.filter(customer_email__icontains=search) | \
                carts.filter(customer_name__icontains=search)

    serializer = AbandonedCartAdminSerializer(carts, many=True)
    return Response(serializer.data)


# ─── 4. ADMIN DETAIL (admin only) ────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_abandoned_cart_detail(request, pk):
    """Returns full details of a single abandoned cart."""
    try:
        cart = AbandonedCart.objects.get(pk=pk)
    except AbandonedCart.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = AbandonedCartAdminSerializer(cart)
    return Response(serializer.data)
# ============================================================
# CHANGES TO core/views.py
# ============================================================

# ── CHANGE 1: Update revolut_webhook to trigger coupon generation ────────────
#
# Find this block in your revolut_webhook view:
#
#   if event_type == "ORDER_COMPLETED":
#       order.payment_status = "PAID"
#       order.status = "PROCESSED"
#   elif order_data.get("state") == "completed":
#       order.payment_status = "PAID"
#       order.status = "PROCESSED"
#
# REPLACE both "PAID" blocks with this:
#
#   if event_type == "ORDER_COMPLETED":
#       order.payment_status = "PAID"
#       order.status = "PROCESSED"
#       order.save()
#       # ✅ Auto-generate reward coupon
#       from .coupon_service import generate_coupon_for_order
#       generate_coupon_for_order(order)
#       return Response({"detail": "ok"}, status=status.HTTP_200_OK)
#
#   elif order_data.get("state") == "completed":
#       order.payment_status = "PAID"
#       order.status = "PROCESSED"
#       order.save()
#       # ✅ Auto-generate reward coupon
#       from .coupon_service import generate_coupon_for_order
#       generate_coupon_for_order(order)
#       return Response({"detail": "ok"}, status=status.HTTP_200_OK)
#
# ── CHANGE 2: Update verify_revolut_payment to trigger coupon generation ─────
#
# Find this block in verify_revolut_payment:
#
#   if state == "COMPLETED":
#       order.payment_status = "PAID"
#       order.status = "PROCESSED"
#
# REPLACE with:
#
#   if state == "COMPLETED":
#       order.payment_status = "PAID"
#       order.status = "PROCESSED"
#       order.save()
#       # ✅ Auto-generate reward coupon
#       from .coupon_service import generate_coupon_for_order
#       generate_coupon_for_order(order)


# ── NEW ENDPOINTS TO ADD AT THE BOTTOM OF views.py ───────────────────────────

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import UserCoupon
from .serializers import UserCouponSerializer


# ── 1. List user's own coupons (for profile / order confirmation page) ────────

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_coupons(request):
    """
    Returns all coupons for the logged-in user.
    Frontend uses this to show available reward coupons.
    """
    # Auto-expire stale coupons
    now = timezone.now()
    UserCoupon.objects.filter(
        user=request.user,
        is_used=False,
        expires_at__lt=now
    ).update(is_used=False)  # They'll show as expired via is_expired property

    coupons = UserCoupon.objects.filter(
        user=request.user
    ).select_related("promo_code").order_by("-created_at")

    serializer = UserCouponSerializer(coupons, many=True)
    return Response(serializer.data)


# ── 2. Admin: list all user coupons ──────────────────────────────────────────

@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_user_coupons(request):
    """Admin view of all generated reward coupons."""
    coupons = UserCoupon.objects.select_related(
        "user", "promo_code", "source_order"
    ).order_by("-created_at")

    # Optional filter by user email
    email = request.query_params.get("email", "").strip()
    if email:
        coupons = coupons.filter(user__email__icontains=email)

    serializer = UserCouponSerializer(coupons, many=True)
    return Response(serializer.data)

# ============================================================
# ADD TO core/views.py (at the bottom)
# ============================================================

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Sum
from .models import User, Order, Address
from .serializers import CustomerQuickSearchSerializer


@api_view(["GET"])
@permission_classes([IsAdminUser])
def customer_quick_search(request):
    """
    Admin quick search for customers.
    Query param: ?q=<search term>
    Searches by name, email, or phone.
    Returns customer info + order summary.
    """
    query = request.query_params.get("q", "").strip()

    if not query or len(query) < 2:
        return Response(
            {"error": "Please enter at least 2 characters to search."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Search across name, email, phone
    users = User.objects.filter(
        Q(full_name__icontains=query) |
        Q(email__icontains=query) |
        Q(phone__icontains=query)
    ).annotate(
        total_orders=Count("orders"),
        total_spent=Sum(
            "orders__total_amount",
            filter=Q(orders__payment_status="PAID")
        ),
    ).order_by("-created_at")[:20]  # Limit to 20 results

    serializer = CustomerQuickSearchSerializer(users, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def customer_detail(request, user_id):
    """
    Returns full customer profile + all orders + saved addresses.
    """
    try:
        user = User.objects.annotate(
            total_orders=Count("orders"),
            total_spent=Sum(
                "orders__total_amount",
                filter=Q(orders__payment_status="PAID")
            ),
        ).get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "Customer not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    orders = Order.objects.filter(user=user).order_by("-created_at")
    addresses = Address.objects.filter(user=user)

    from .serializers import CustomerDetailSerializer, OrderSummarySerializer, AddressSerializer
    return Response({
        "customer":  CustomerDetailSerializer(user).data,
        "orders":    OrderSummarySerializer(orders, many=True).data,
        "addresses": AddressSerializer(addresses, many=True).data,
    })
# ============================================================
# ADD TO BOTTOM OF core/views.py
# ============================================================

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from .models import Policy
from .serializers import PolicySerializer


# ── 1. PUBLIC: Get a single policy by type ───────────────────────────────────

@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def get_policy(request, policy_type):
    """
    Public endpoint — returns the current policy content.
    policy_type: 'terms' or 'delivery'
    """
    if policy_type not in ("terms", "delivery"):
        return Response(
            {"error": "Invalid policy type. Use 'terms' or 'delivery'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        policy = Policy.objects.get(policy_type=policy_type)
    except Policy.DoesNotExist:
        return Response(
            {"error": f"No {policy_type} policy found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = PolicySerializer(policy)
    return Response(serializer.data)


# ── 2. PUBLIC: List all policies ─────────────────────────────────────────────

@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def list_policies(request):
    """Returns all available policies (terms + delivery)."""
    policies   = Policy.objects.all()
    serializer = PolicySerializer(policies, many=True)
    return Response(serializer.data)


# ── 3. ADMIN: Create or update a policy ──────────────────────────────────────

@api_view(["PUT"])
@permission_classes([IsAdminUser])
def update_policy(request, policy_type):
    """
    Admin endpoint — create or update a policy.
    policy_type: 'terms' or 'delivery'
    Body: { title, content }
    """
    if policy_type not in ("terms", "delivery"):
        return Response(
            {"error": "Invalid policy type. Use 'terms' or 'delivery'."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    policy, created = Policy.objects.get_or_create(
        policy_type=policy_type,
        defaults={"title": "", "content": ""},
    )

    serializer = PolicySerializer(policy, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(updated_by=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
