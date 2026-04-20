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
from .views import offer_list
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
    path('', include(router.urls)),
]
