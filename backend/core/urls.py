# from django.urls import path, include
# from rest_framework_simplejwt.views import TokenRefreshView
# from core.views import create_revolut_payment, verify_revolut_payment

# from rest_framework.routers import DefaultRouter
# from .views import (
#     RegisterView,
#     LoginView,
#     CategoryListAPIView,
#     AnnouncementListAPIView,
#     ProductListView,
#     BannerListAPIView,
#     # ValidatePromoCodeView,
#     AddressViewSet,
#     update_profile,
#     trending_products,
#     trending_products_simple,
    
#     ApplyPromoCodeView
#     # create_revolut_payment,
#     # verify_revolut_payment,
#     # revolut_webhook,

    
    
# )
# # from .views import create_revolut_payment

# router = DefaultRouter()
# router.register(r"addresses", AddressViewSet, basename="addresses")

# urlpatterns = [
#     #  path("create-payment/", create_revolut_payment),
#     path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#     path('register/', RegisterView.as_view()),
#     path('login/', LoginView.as_view()),
#     path("categories/", CategoryListAPIView.as_view(), name="categories"),
#     path("announcement/", AnnouncementListAPIView.as_view(), name="announcement"),
#     path("products/", ProductListView.as_view(), name="product-list"),
#     path("banners/", BannerListAPIView.as_view(), name="banners"),
#     # path("promocode/",ValidatePromoCodeView.as_view(), name="PromoCode"),
#     path('profile/update/', update_profile, name='update_profile'),
#     path("trending-products/", trending_products),
#     path("trending-products-simple/", trending_products_simple),
#     path(
#     "trending-products-simple/",
#     trending_products_simple,
#     name="trending-products-simple",

# ),
# path("payment/create/", create_revolut_payment),
#     path("payment/verify/", verify_revolut_payment),
# path("apply-promocode/", ApplyPromoCodeView.as_view(), name="apply-promocode"),
# # path("create-payment/", create_revolut_payment),
# # path("verify-payment/", verify_revolut_payment),
# # path("revolut-webhook/", revolut_webhook),


#     path('', include(router.urls)),
# ]



from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    LoginView,
    CategoryListAPIView,
    AnnouncementListAPIView,
    ProductListView,
    BannerListAPIView,
    AddressViewSet,
    revolut_webhook,
    update_profile,
    trending_products,
    trending_products_simple,
    ApplyPromoCodeView,
    create_revolut_payment,
    verify_revolut_payment
)
from .views import offer_list, sync_abandoned_cart, convert_abandoned_cart, admin_abandoned_carts, admin_abandoned_cart_detail, sales_report
router = DefaultRouter()
router.register(r"addresses", AddressViewSet, basename="addresses")

urlpatterns = [
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path("categories/", CategoryListAPIView.as_view(), name="categories"),
    path("announcement/", AnnouncementListAPIView.as_view(), name="announcement"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path("banners/", BannerListAPIView.as_view(), name="banners"),
    path('profile/update/', update_profile, name='update_profile'),
    path("trending-products/", trending_products),
    path("trending-products-simple/", trending_products_simple, name="trending-products-simple"),
    path("payment/create/", create_revolut_payment, name="create-payment"),
    path("apply-promocode/", ApplyPromoCodeView.as_view(), name="apply-promocode"),
    path("payment/verify/", verify_revolut_payment),
    path("payment/webhook/revolut/", revolut_webhook, name="revolut-webhook"),
    path("offers/", offer_list, name="offer-list"),
    # Abandoned cart
    path("cart/sync/",                      sync_abandoned_cart,         name="cart-sync"),
    path("cart/convert/",                   convert_abandoned_cart,      name="cart-convert"),
    path("admin/abandoned-carts/",          admin_abandoned_carts,       name="admin-abandoned-carts"),
    path("admin/abandoned-carts/<int:pk>/", admin_abandoned_cart_detail, name="admin-abandoned-cart-detail"),
    # Sales reports
    path("admin/sales-report/",             sales_report,                name="sales-report"),
    path('', include(router.urls)),
]

# ============================================================
# ADD THESE LINES TO YOUR EXISTING core/urls.py
# ============================================================

# 1. Add these imports at the top of your urls.py:
from .views import (
    sync_abandoned_cart,
    convert_abandoned_cart,
    admin_abandoned_carts,
    admin_abandoned_cart_detail,
)

# 2. Add these paths to your urlpatterns list:
urlpatterns_to_add = [
    # Frontend calls these
    path("cart/sync/",    sync_abandoned_cart,    name="cart-sync"),
    path("cart/convert/", convert_abandoned_cart, name="cart-convert"),

    # Admin calls these
    path("admin/abandoned-carts/",         admin_abandoned_carts,        name="admin-abandoned-carts"),
    path("admin/abandoned-carts/<int:pk>/", admin_abandoned_cart_detail,  name="admin-abandoned-cart-detail"),
]

# ─── EXAMPLE of what your full urls.py should look like ─────────────────────
#
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from .views import (
#     RegisterView, LoginView, CategoryListAPIView, ...
#     sync_abandoned_cart, convert_abandoned_cart,
#     admin_abandoned_carts, admin_abandoned_cart_detail,
# )
#
# router = DefaultRouter()
# router.register(r'addresses', AddressViewSet, basename='address')
#
# urlpatterns = [
#     path('register/', RegisterView.as_view()),
#     path('login/', LoginView.as_view()),
#     ...existing paths...
#
#     # Abandoned Cart
#     path('cart/sync/',                     sync_abandoned_cart),
#     path('cart/convert/',                  convert_abandoned_cart),
#     path('admin/abandoned-carts/',         admin_abandoned_carts),
#     path('admin/abandoned-carts/<int:pk>/',admin_abandoned_cart_detail),
#
#     path('', include(router.urls)),
# ]
# ============================================================
# ADD THESE TO core/urls.py
# ============================================================

# 1. Add to imports:
# from .views import my_coupons, admin_user_coupons

# 2. Add to urlpatterns:
# path("coupons/my/",          my_coupons,          name="my-coupons"),
# path("admin/coupons/",       admin_user_coupons,  name="admin-coupons"),


# ── FULL urls.py additions for reference ─────────────────────────────────────
#
# urlpatterns = [
#     ...existing urls...
#
#     # Reward Coupons
#     path("coupons/my/",     my_coupons,         name="my-coupons"),
#     path("admin/coupons/",  admin_user_coupons, name="admin-coupons"),
# ]
# ============================================================
# ADD TO core/urls.py
# ============================================================

# 1. Add to imports:
# from .views import customer_quick_search, customer_detail

# 2. Add to urlpatterns:
# path("admin/customers/search/",       customer_quick_search, name="customer-search"),
# path("admin/customers/<int:user_id>/", customer_detail,       name="customer-detail"),
# ============================================================
# ADD TO core/urls.py
# ============================================================

# 1. Add to imports:
# from .views import get_policy, list_policies, update_policy

# 2. Add to urlpatterns:
# path("policies/",                  list_policies,  name="policy-list"),
# path("policies/<str:policy_type>/", get_policy,    name="policy-detail"),
# path("admin/policies/<str:policy_type>/update/", update_policy, name="policy-update"),

