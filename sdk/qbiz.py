import hmac
import hashlib
import json
import urllib.request
import urllib.parse
import urllib.error

class QBizClient:
    """
    QBiz API Client SDK for Python.
    Provides methods to interface with the QBiz QRIS Gateway Middleware.
    """
    def __init__(self, api_key: str, base_url: str = "http://localhost:8000"):
        if not api_key:
            raise ValueError("API Key is required to initialize QBizClient")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def create_invoice(self, params: dict) -> dict:
        """
        Create a new dynamic QRIS invoice.
        
        :param params: Dict containing:
            - orderId: Unique order identifier
            - amount: Nominal invoice billing amount
            - callbackUrl: (Optional) Callback webhook URL
            - redirectUrl: (Optional) Customer browser redirect URL
            - merchantId: (Optional) Target merchant ID
            - customerName: (Optional) Customer full name
            - customerEmail: (Optional) Customer email address
            - customerPhone: (Optional) Customer phone number
            - items: (Optional) List of items being purchased
        :return: Created invoice details dict
        """
        url = f"{self.base_url}/api/v1/invoices"
        body = {
            "order_id": params.get("orderId"),
            "amount": int(params.get("amount", 0)),
            "callback_url": params.get("callbackUrl"),
            "redirect_url": params.get("redirectUrl"),
            "merchant_id": params.get("merchantId"),
            "customer_name": params.get("customerName"),
            "customer_email": params.get("customerEmail"),
            "customer_phone": params.get("customerPhone"),
            "items": params.get("items")
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                if not res_data.get("success"):
                    raise Exception(res_data.get("error", "Failed to create invoice"))
                return res_data.get("invoice")
        except urllib.error.HTTPError as e:
            try:
                res_data = json.loads(e.read().decode("utf-8"))
                error_msg = res_data.get("error", e.reason)
            except Exception:
                error_msg = e.reason
            raise Exception(f"QBiz API Error: {error_msg}")
        except Exception as e:
            raise Exception(f"Connection error connecting to QBiz Gateway API: {str(e)}")

    def get_invoice_status(self, invoice_id: str) -> dict:
        """
        Fetch payment status details of an invoice.
        
        :param invoice_id: Invoice identifier (e.g. inv_...)
        :return: Dict containing invoice status
        """
        url = f"{self.base_url}/api/v1/invoices/{urllib.parse.quote(invoice_id)}/status"
        req = urllib.request.Request(
            url,
            headers={"Content-Type": "application/json"},
            method="GET"
        )
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raise Exception(f"QBiz API Error: HTTP {e.code}")
        except Exception as e:
            raise Exception(f"Connection error connecting to QBiz Gateway API: {str(e)}")

    def verify_webhook(self, payload_raw_body: str, signature_header: str, webhook_secret: str) -> bool:
        """
        Verify HMAC-SHA256 signature received in webhook headers.
        
        :param payload_raw_body: Raw request body string or bytes
        :param signature_header: Signature header string (X-QBiz-Signature)
        :param webhook_secret: Your webhook verification secret key
        :return: True if signature is valid, False otherwise
        """
        if not signature_header or not webhook_secret:
            return False
        
        if isinstance(payload_raw_body, str):
            payload_bytes = payload_raw_body.encode("utf-8")
        else:
            payload_bytes = payload_raw_body

        computed_hash = hmac.new(
            webhook_secret.encode("utf-8"),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_hash, signature_header)
