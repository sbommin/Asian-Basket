from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils.text import slugify
from django.utils import timezone

class Offer(models.Model):
    BADGE_CHOICES = [
        ("percent",  "Percent Off"),
        ("bogo",     "Buy 1 Get 1"),
        ("delivery", "Free Delivery"),
        ("flat",     "Flat Off"),
        ("custom",   "Custom"),
    ]

    title       = models.CharField(max_length=100)              # e.g. "50% OFF"
    description = models.CharField(max_length=255)              # e.g. "On all fresh vegetables"
    validity    = models.CharField(max_length=100, blank=True)  # e.g. "Valid until end of month"
    badge_type  = models.CharField(max_length=20, choices=BADGE_CHOICES, default="custom")
    is_active   = models.BooleanField(default=True)
    priority    = models.PositiveIntegerField(default=0)        # higher = shown first
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-priority", "-created_at"]

    def __str__(self):
        return self.title

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None):
        if not email:
            raise ValueError("Email is required")

        user = self.model(
            email=self.normalize_email(email),
            full_name=full_name
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password):
        user = self.create_user(email, full_name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email

from django.conf import settings
from django.db import models, transaction
from django.db.models import Q


class Address(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )

    label = models.CharField(max_length=30, blank=True)  # Home/Work/etc
    full_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)

    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100) # ISO-2

    notes = models.CharField(max_length=255, blank=True)
    is_default = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_default", "-updated_at"]
        indexes = [
            models.Index(fields=["user", "is_default"]),
            models.Index(fields=["user", "updated_at"]),
        ]
        constraints = [
            # Ensures at most one default address per user
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(is_default=True),
                name="uniq_default_address_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} - {self.line1}, {self.city}"

    @transaction.atomic
    def make_default(self):
        Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        Address.objects.filter(pk=self.pk).update(is_default=True)



# class Category(models.Model):
#     name = models.CharField(max_length=100, unique=True)
#     slug = models.SlugField(unique=True)
#     icon = models.CharField(max_length=50, blank=True)
#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name


# class SubCategory(models.Model):
#     category = models.ForeignKey(
#         Category,
#         related_name="subcategories",
#         on_delete=models.CASCADE
#     )
#     name = models.CharField(max_length=100)
#     slug = models.SlugField()
#     image = models.ImageField(upload_to="subcategories/", blank=True, null=True)
#     is_active = models.BooleanField(default=True)  # ✅ ADD THIS

#     def __str__(self):
#         return f"{self.category.name} → {self.name}"



# ============================
# CATEGORY
# ============================
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ============================
# SUB CATEGORY (NO IMAGE ✅)
# ============================
class SubCategory(models.Model):
    category = models.ForeignKey(
        Category,
        related_name="subcategories",
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.category.name} → {self.name}"


# ============================
# PRODUCT (IMAGE + PRICE HERE ✅)
# ============================
# class Product(models.Model):
#     category = models.ForeignKey(
#         Category,
#         related_name="products",
#         on_delete=models.CASCADE
#     )
#     subcategory = models.ForeignKey(
#         SubCategory,
#         related_name="products",
#         on_delete=models.CASCADE
#     )

#     name = models.CharField(max_length=150)
#     slug = models.SlugField(unique=True)

#     image = models.ImageField(upload_to="products/")
#     mrp = models.DecimalField(max_digits=10, decimal_places=2)
#     price = models.DecimalField(max_digits=10, decimal_places=2)

#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name
    

# class Announcement(models.Model):
#     description = models.CharField(max_length=255)
#     is_active = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.description

class Announcement(models.Model):
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.description[:50]



class Banner(models.Model):
    tag = models.CharField(max_length=50)  # eg: "Fresh Arrival"
    heading = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(upload_to="banners/")
    link = models.CharField(max_length=200) 
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.heading


# class Product(models.Model):
#     category = models.ForeignKey(
#         Category,
#         related_name="products",
#         on_delete=models.CASCADE
#     )
#     subcategory = models.ForeignKey(
#         SubCategory,
#         related_name="products",
#         on_delete=models.CASCADE
#     )

#     name = models.CharField(max_length=150)
#     slug = models.SlugField(unique=True)

#     image = models.ImageField(upload_to="products/")
#     mrp = models.DecimalField(max_digits=10, decimal_places=2)
#     price = models.DecimalField(max_digits=10, decimal_places=2)

#     # ✅ STOCK MANAGEMENT
#     in_stock = models.BooleanField(default=True)
#     stock_quantity = models.PositiveIntegerField(default=0)

#     # ✅ PRODUCT PRIORITY (HIGHER = SHOWN FIRST)
#     priority = models.PositiveIntegerField(default=0)

#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

#working

# class Product(models.Model):
#     category = models.ForeignKey(
#         Category,
#         related_name="products",
#         on_delete=models.CASCADE
#     )
#     subcategory = models.ForeignKey(
#         SubCategory,
#         related_name="products",
#         on_delete=models.CASCADE
#     )

#     name = models.CharField(max_length=150)
#     slug = models.SlugField(unique=True)

#     image = models.ImageField(upload_to="products/")
#     mrp = models.DecimalField(max_digits=10, decimal_places=2)
#     price = models.DecimalField(max_digits=10, decimal_places=2)

#     # STOCK
#     in_stock = models.BooleanField(default=True)
#     stock_quantity = models.PositiveIntegerField(default=0)

#     # PRIORITY
#     priority = models.PositiveIntegerField(default=0)

#     # 🔥 TRENDING FLAG
#     is_trending = models.BooleanField(default=False)

#     is_active = models.BooleanField(default=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

# class Product(models.Model):
#     name = models.CharField(max_length=200)
#     slug = models.SlugField(unique=True)

#     category = models.ForeignKey("Category", on_delete=models.CASCADE)
#     subcategory = models.ForeignKey("SubCategory", on_delete=models.CASCADE)

#     image = models.ImageField(upload_to="products/")
#     mrp = models.DecimalField(max_digits=10, decimal_places=2)
#     price = models.DecimalField(max_digits=10, decimal_places=2)

#     in_stock = models.BooleanField(default=True)
#     stock_quantity = models.PositiveIntegerField(default=0)

#     weight = models.FloatField(default=0.5)
#     priority = models.IntegerField(default=0)

#     is_trending = models.BooleanField(default=False)
#     is_active = models.BooleanField(default=True)

#     created_at = models.DateTimeField(auto_now_add=True)  # 🔥 ADD THIS

#     def save(self, *args, **kwargs):
#         self.in_stock = self.stock_quantity > 0
#         super().save(*args, **kwargs)


class Product(models.Model):
    name     = models.CharField(max_length=200)
    slug     = models.SlugField(unique=True)
    description = models.TextField(blank=True,null=True, default="")  # ✅ NEW — for quick view modal

    category = models.ForeignKey(
        "Category",
        on_delete=models.CASCADE,
        related_name="products",
        db_index=True,       # ✅ faster category page queries
    )
    subcategory = models.ForeignKey(
        "SubCategory",
        on_delete=models.CASCADE,
        related_name="products",
        db_index=True,       # ✅ faster subcategory filter queries
    )

    image = models.ImageField(upload_to="products/")

    mrp   = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    stock_quantity = models.PositiveIntegerField(default=0)
    in_stock       = models.BooleanField(default=True, db_index=True)  # ✅ indexed

    weight   = models.FloatField(default=0.5)        # ✅ fixed — own line
    priority = models.IntegerField(default=0)

    is_trending = models.BooleanField(default=False)
    is_active   = models.BooleanField(default=True, db_index=True)   # ✅ indexed

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-priority", "-in_stock", "-created_at"]  # ✅ default ordering
        indexes = [
            models.Index(fields=["is_active", "category"]),        # ✅ category page
            models.Index(fields=["is_active", "subcategory"]),     # ✅ subcategory filter
            models.Index(fields=["is_active", "is_trending"]),     # ✅ trending section
            models.Index(fields=["-priority", "-in_stock"]),       # ✅ sort order
        ]

    # ✅ Both conditions must be true
    @property
    def final_stock_status(self):
        return self.in_stock and self.stock_quantity > 0

    # ✅ NEW — used by frontend for "€x.xx/kg" display
    @property
    def price_per_kg(self):
        if self.weight and self.weight > 0:
            return round(float(self.price) / float(self.weight), 2)
        return None

    # ✅ NEW — discount percentage for badge
    @property
    def discount_percentage(self):
        if self.mrp and self.mrp > self.price:
            return round(((self.mrp - self.price) / self.mrp) * 100)
        return None

    def __str__(self):
        return self.name

from decimal import Decimal
from django.db import models
from django.utils import timezone


class PromoCode(models.Model):
    DISCOUNT_TYPE_PERCENTAGE = "percentage"
    DISCOUNT_TYPE_FIXED = "fixed"

    DISCOUNT_TYPE_CHOICES = [
        (DISCOUNT_TYPE_PERCENTAGE, "Percentage"),
        (DISCOUNT_TYPE_FIXED, "Fixed Amount"),
    ]

    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=255, blank=True)

    discount_type = models.CharField(
        max_length=20,
        choices=DISCOUNT_TYPE_CHOICES,
        default=DISCOUNT_TYPE_PERCENTAGE,
    )

    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Percentage (10 = 10%) OR fixed amount"
    )

    min_order_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Minimum cart total required"
    )

    max_discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional cap on discount amount"
    )

    is_active = models.BooleanField(default=True)

    valid_from = models.DateTimeField(default=timezone.now)
    valid_to = models.DateTimeField(null=True, blank=True)

    usage_limit = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Leave blank for unlimited"
    )

    times_used = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    # ✅ Check if usable
    def can_be_used(self, cart_total: Decimal) -> bool:
        if not self.is_active:
            return False

        now = timezone.now()

        if self.valid_from and now < self.valid_from:
            return False

        if self.valid_to and now > self.valid_to:
            return False

        if cart_total < self.min_order_total:
            return False

        if self.usage_limit is not None and self.times_used >= self.usage_limit:
            return False

        return True

    # ✅ Calculate discount
    def get_discount_amount(self, cart_total: Decimal) -> Decimal:
        if not self.can_be_used(cart_total):
            return Decimal("0.00")

        if self.discount_type == self.DISCOUNT_TYPE_PERCENTAGE:
            discount = (cart_total * self.discount_value) / Decimal("100")
        else:
            discount = self.discount_value

        if self.max_discount_amount:
            discount = min(discount, self.max_discount_amount)

        return max(Decimal("0.00"), min(discount, cart_total))
    




# import uuid
# from django.db import models
# from django.conf import settings


# class Order(models.Model):

#     PAYMENT_STATUS_CHOICES = (
#         ("CREATED", "Created"),
#         ("PAID", "Paid"),
#         ("FAILED", "Failed"),
#     )

#     ORDER_STATUS_CHOICES = (
#         ("PENDING", "Pending"),
#         ("PROCESSED", "Processed"),
#         ("SHIPPED", "Shipped"),
#         ("DELIVERED", "Delivered"),
#         ("CANCELLED", "Cancelled"),
#     )

#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name="orders"
#     )

#     order_id = models.CharField(max_length=100, unique=True, editable=False)
#     revolut_order_id = models.CharField(max_length=100, blank=True, null=True)

#     payment_status = models.CharField(
#         max_length=10,
#         choices=PAYMENT_STATUS_CHOICES,
#         default="CREATED"
#     )

#     status = models.CharField(
#         max_length=15,
#         choices=ORDER_STATUS_CHOICES,
#         default="PENDING"
#     )

#     name = models.CharField(max_length=100)
#     phone = models.CharField(max_length=15)
#     address = models.TextField()
#     city = models.CharField(max_length=50)
#     state = models.CharField(max_length=50)
#     pincode = models.CharField(max_length=10)

#     subtotal = models.DecimalField(max_digits=10, decimal_places=2)
#     discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
#     total_amount = models.DecimalField(max_digits=10, decimal_places=2)

#     created_at = models.DateTimeField(auto_now_add=True)

#     def save(self, *args, **kwargs):
#         if not self.order_id:
#             self.order_id = str(uuid.uuid4()).replace("-", "")[:12].upper()
#         super().save(*args, **kwargs)


# class OrderItem(models.Model):

#     order = models.ForeignKey(
#         Order,
#         related_name="items",
#         on_delete=models.CASCADE
#     )

#     product_name = models.CharField(max_length=200)
#     quantity = models.IntegerField()
#     price = models.DecimalField(max_digits=10, decimal_places=2)





import uuid
from django.db import models
from django.conf import settings


class Order(models.Model):

    PAYMENT_STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("PAID", "Paid"),
        ("FAILED", "Failed"),
    )

    ORDER_STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("PROCESSED", "Processed"),
        ("SHIPPED", "Shipped"),
        ("DELIVERED", "Delivered"),
        ("CANCELLED", "Cancelled"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    order_id = models.CharField(max_length=100, unique=True, editable=False)

    revolut_order_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    payment_status = models.CharField(
        max_length=10,
        choices=PAYMENT_STATUS_CHOICES,
        default="PENDING"
    )

    status = models.CharField(
        max_length=15,
        choices=ORDER_STATUS_CHOICES,
        default="PENDING"
    )

    name = models.CharField(max_length=100)

    phone = models.CharField(max_length=15)

    address = models.TextField()

    city = models.CharField(max_length=50)

    state = models.CharField(max_length=50)

    pincode = models.CharField(max_length=10)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):

        if not self.order_id:

            self.order_id = str(uuid.uuid4()) \
                .replace("-", "")[:12].upper()

        super().save(*args, **kwargs)


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        related_name="items",
        on_delete=models.CASCADE
    )

    product_name = models.CharField(max_length=200)

    quantity = models.IntegerField()

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
