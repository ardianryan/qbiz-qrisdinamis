use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use hmac::{Hmac, Mac};
use sha2::Sha256;
use hex;

type HmacSha256 = Hmac<Sha256>;

/// QBiz API Client SDK for Rust.
/// Provides methods to interface with the QBiz QRIS Gateway Middleware.
#[derive(Debug, Clone)]
pub struct QBizClient {
    api_key: String,
    base_url: String,
    client: reqwest::Client,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InvoiceItem {
    pub name: String,
    pub price: i64,
    pub quantity: i32,
}

#[derive(Serialize, Debug, Clone)]
pub struct CreateInvoiceParams {
    pub order_id: String,
    pub amount: i64,
    pub callback_url: Option<String>,
    pub redirect_url: Option<String>,
    pub merchant_id: Option<String>,
    pub customer_name: Option<String>,
    pub customer_email: Option<String>,
    pub customer_phone: Option<String>,
    pub items: Option<Vec<InvoiceItem>>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct Invoice {
    pub id: String,
    pub order_id: String,
    pub amount: i64,
    pub total_amount: i64,
    pub status: String,
    pub qr_string: String,
    pub created_at: String,
    pub expired_at: String,
}

#[derive(Deserialize, Debug, Clone)]
struct CreateInvoiceResponse {
    pub success: bool,
    pub invoice: Option<Invoice>,
    pub error: Option<String>,
}

#[derive(Deserialize, Debug, Clone)]
pub struct InvoiceStatusResponse {
    pub success: bool,
    pub id: String,
    pub order_id: String,
    pub amount: i64,
    pub total_amount: i64,
    pub status: String,
    pub paid_at: Option<String>,
}

impl QBizClient {
    /// Initialize a new QBizClient.
    pub fn new(api_key: &str, base_url: Option<&str>) -> Result<Self, &'static str> {
        if api_key.is_empty() {
            return Err("API Key is required to initialize QBizClient");
        }
        let url = base_url.unwrap_or("http://localhost:8000").trim_end_matches('/').to_string();
        Ok(Self {
            api_key: api_key.to_string(),
            base_url: url,
            client: reqwest::Client::new(),
        })
    }

    /// Create a new dynamic QRIS invoice.
    pub async fn create_invoice(&self, params: CreateInvoiceParams) -> Result<Invoice, String> {
        let url = format!("{}/api/v1/invoices", self.base_url);
        
        let mut headers = HeaderMap::new();
        let auth_val = format!("Bearer {}", self.api_key);
        headers.insert(AUTHORIZATION, HeaderValue::from_str(&auth_val).unwrap());
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let response = self.client.post(&url)
            .headers(headers)
            .json(&params)
            .send()
            .await
            .map_err(|e| format!("Connection error: {}", e))?;

        let status = response.status();
        let body = response.json::<CreateInvoiceResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        if !status.is_success() || !body.success {
            return Err(body.error.unwrap_or_else(|| format!("HTTP Error {}", status)));
        }

        body.invoice.ok_or_else(|| "Invoice missing in response".to_string())
    }

    /// Fetch payment status of an invoice.
    pub async fn get_invoice_status(&self, invoice_id: &str) -> Result<InvoiceStatusResponse, String> {
        let url = format!("{}/api/v1/invoices/{}/status", self.base_url, urlencoding::encode(invoice_id));
        
        let response = self.client.get(&url)
            .header(CONTENT_TYPE, "application/json")
            .send()
            .await
            .map_err(|e| format!("Connection error: {}", e))?;

        let status = response.status();
        if !status.is_success() {
            return Err(format!("QBiz API Error: HTTP {}", status));
        }

        response.json::<InvoiceStatusResponse>()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))
    }

    /// Verify HMAC-SHA256 signature received in webhook headers.
    pub fn verify_webhook(&self, payload_raw_body: &str, signature_header: &str, webhook_secret: &str) -> bool {
        if signature_header.is_empty() || webhook_secret.is_empty() {
            return false;
        }

        let mut mac = match HmacSha256::new_from_slice(webhook_secret.as_bytes()) {
            Ok(m) => m,
            Err(_) => return false,
        };

        mac.update(payload_raw_body.as_bytes());
        let result = mac.finalize();
        let computed_hex = hex::encode(result.into_bytes());

        let sig_bytes = computed_hex.as_bytes();
        let header_bytes = signature_header.as_bytes();

        if sig_bytes.len() != header_bytes.len() {
            return false;
        }

        // Constant-time comparison to prevent timing attacks
        let mut equal = 0;
        for i in 0..sig_bytes.len() {
            equal |= sig_bytes[i] ^ header_bytes[i];
        }
        equal == 0
    }
}
