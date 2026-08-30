// Package qbiz provides an idiomatic Golang client for the QBiz Dynamic QRIS Gateway Hub.
// Zero external dependencies (uses standard library net/http and crypto/hmac).
package qbiz

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client represents a configured QBiz API client instance.
type Client struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

// PurchaseItem defines purchase item parameters for an invoice.
type PurchaseItem struct {
	Name     string `json:"name"`
	Quantity int    `json:"quantity"`
	Price    int    `json:"price"`
}

// CreateInvoiceParams specifies payload options for creating a dynamic QRIS invoice.
type CreateInvoiceParams struct {
	OrderID       string         `json:"order_id"`
	Amount        int            `json:"amount"`
	CallbackURL   string         `json:"callback_url,omitempty"`
	RedirectURL   string         `json:"redirect_url,omitempty"`
	MerchantID    string         `json:"merchant_id,omitempty"`
	CustomerName  string         `json:"customer_name,omitempty"`
	CustomerEmail string         `json:"customer_email,omitempty"`
	CustomerPhone string         `json:"customer_phone,omitempty"`
	Items         []PurchaseItem `json:"items,omitempty"`
}

// Invoice represents a generated dynamic QRIS invoice details.
type Invoice struct {
	ID            string         `json:"id"`
	MerchantID    string         `json:"merchant_id"`
	OrderID       string         `json:"order_id"`
	BaseAmount    int            `json:"base_amount"`
	UniqueCode    int            `json:"unique_code"`
	TotalAmount   int            `json:"total_amount"`
	Status        string         `json:"status"`
	QRISPayload   string         `json:"qris_payload"`
	CheckoutURL   string         `json:"checkout_url"`
	RedirectURL   string         `json:"redirect_url"`
	CustomerName  string         `json:"customer_name"`
	CustomerEmail string         `json:"customer_email"`
	CustomerPhone string         `json:"customer_phone"`
	Items         []PurchaseItem `json:"items"`
	ExpiredAt     string         `json:"expired_at"`
	CreatedAt     string         `json:"created_at"`
}

// InvoiceResponse wraps standard invoice creation API responses.
type InvoiceResponse struct {
	Success bool     `json:"success"`
	Invoice *Invoice `json:"invoice,omitempty"`
	Error   string   `json:"error,omitempty"`
}

// InvoiceStatusResponse represents polling query status output.
type InvoiceStatusResponse struct {
	Status      string  `json:"status"`
	TotalAmount int     `json:"total_amount"`
	PaidAt      *string `json:"paid_at,omitempty"`
}

// WebhookPayload represents the standard payment.success webhook event data.
type WebhookPayload struct {
	Event       string `json:"event"`
	InvoiceID   string `json:"invoice_id"`
	OrderID     string `json:"order_id"`
	AmountPaid  int    `json:"amount_paid"`
	PaidAt      string `json:"paid_at"`
}

// NewClient initializes a new QBizClient instance.
func NewClient(apiKey string, baseURL ...string) *Client {
	url := "http://localhost:8000"
	if len(baseURL) > 0 && baseURL[0] != "" {
		url = strings.TrimRight(baseURL[0], "/")
	}

	return &Client{
		APIKey:  apiKey,
		BaseURL: url,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// CreateInvoice generates a new dynamic QRIS invoice.
func (c *Client) CreateInvoice(ctx context.Context, params CreateInvoiceParams) (*Invoice, error) {
	if params.OrderID == "" {
		return nil, errors.New("order_id is required")
	}
	if params.Amount <= 0 {
		return nil, errors.New("amount must be greater than 0")
	}

	bodyJSON, err := json.Marshal(params)
	if err != nil {
		return nil, fmt.Errorf("failed marshaling request: %w", err)
	}

	endpoint := fmt.Sprintf("%s/api/v1/invoices", c.BaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBuffer(bodyJSON))
	if err != nil {
		return nil, fmt.Errorf("failed creating request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed reading response: %w", err)
	}

	var apiResp InvoiceResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("invalid json response (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 || !apiResp.Success {
		if apiResp.Error != "" {
			return nil, errors.New(apiResp.Error)
		}
		return nil, fmt.Errorf("HTTP error %d: %s", resp.StatusCode, string(respBody))
	}

	return apiResp.Invoice, nil
}

// GetInvoiceStatus queries the payment settlement state of a given invoice ID.
func (c *Client) GetInvoiceStatus(ctx context.Context, invoiceID string) (*InvoiceStatusResponse, error) {
	if invoiceID == "" {
		return nil, errors.New("invoice_id is required")
	}

	endpoint := fmt.Sprintf("%s/api/v1/invoices/%s/status", c.BaseURL, invoiceID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed creating request: %w", err)
	}

	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed reading response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error %d fetching status: %s", resp.StatusCode, string(respBody))
	}

	var statusResp InvoiceStatusResponse
	if err := json.Unmarshal(respBody, &statusResp); err != nil {
		return nil, fmt.Errorf("failed decoding status response: %w", err)
	}

	return &statusResp, nil
}

// VerifyWebhookSignature validates the authenticity of an incoming HMAC SHA-256 webhook signature.
func VerifyWebhookSignature(rawBody []byte, signature, secretKey string, timestamp int64, maxToleranceSeconds ...int64) bool {
	if len(rawBody) == 0 || signature == "" || secretKey == "" {
		return false
	}

	// 1. Anti-replay timestamp tolerance check (default 5 minutes / 300s)
	if timestamp > 0 {
		tolerance := int64(300)
		if len(maxToleranceSeconds) > 0 && maxToleranceSeconds[0] > 0 {
			tolerance = maxToleranceSeconds[0]
		}
		currentTime := time.Now().Unix()
		diff := currentTime - timestamp
		if diff < 0 {
			diff = -diff
		}
		if diff > tolerance {
			return false // Expired or future timestamp (potential replay attack)
		}
	}

	// 2. Compute HMAC SHA-256
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write(rawBody)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(strings.ToLower(signature)), []byte(strings.ToLower(expectedSignature)))
}
