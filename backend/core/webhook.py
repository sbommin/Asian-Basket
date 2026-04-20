import requests
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings

headers = {
    "Authorization": f"Bearer {settings.REVOLUT_SECRET_KEY}",
    "Content-Type": "application/json",
    "Revolut-Api-Version": "2023-09-01",
}

payload = {
    "url": f"{settings.BACKEND_PUBLIC_URL}/api/auth/payment/webhook/revolut/",
    "events": [
        "ORDER_COMPLETED",
        "ORDER_PAYMENT_FAILED",
        "ORDER_PAYMENT_DECLINED",
    ],
}

# ✅ Correct webhook endpoint for sandbox
resp = requests.post(
    "https://sandbox-merchant.revolut.com/api/1.0/webhooks",
    json=payload,
    headers=headers,
)
print(resp.status_code, resp.json())
