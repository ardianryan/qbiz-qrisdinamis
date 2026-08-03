<?php

class QBizClient {
    private $apiKey;
    private $baseUrl;

    /**
     * QBizClient constructor.
     * @param string $apiKey Secret API Bearer Key
     * @param string $baseUrl Base URL (default is http://localhost:8000)
     */
    public function __construct($apiKey, $baseUrl = 'http://localhost:8000') {
        if (empty($apiKey)) {
            throw new Exception("API Key is required to initialize QBizClient");
        }
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    /**
     * Create a new dynamic QRIS invoice
     * @param array $params
     * @return array The created invoice details
     */
    public function createInvoice($params) {
        $url = $this->baseUrl . '/api/v1/invoices';
        
        $body = [
            'order_id' => $params['orderId'],
            'amount' => (int)$params['amount'],
            'callback_url' => isset($params['callbackUrl']) ? $params['callbackUrl'] : null,
            'merchant_id' => isset($params['merchantId']) ? $params['merchantId'] : null
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response) {
            throw new Exception("Connection error connecting to QBiz Gateway API.");
        }

        $data = json_decode($response, true);
        if ($httpCode !== 200 || !isset($data['success']) || !$data['success']) {
            $errorMsg = isset($data['error']) ? $data['error'] : "HTTP Error $httpCode";
            throw new Exception("QBiz API Error: " . $errorMsg);
        }

        return $data['invoice'];
    }

    /**
     * Fetch payment status of an invoice
     * @param string $invoiceId QBiz invoice ID (e.g. inv_...)
     * @return array Payment status details
     */
    public function getInvoiceStatus($invoiceId) {
        $url = $this->baseUrl . '/api/v1/invoices/' . urlencode($invoiceId) . '/status';

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if (!$response) {
            throw new Exception("Connection error connecting to QBiz Gateway API.");
        }

        $data = json_decode($response, true);
        if ($httpCode !== 200) {
            throw new Exception("QBiz API Error: HTTP $httpCode");
        }

        return $data;
    }

    /**
     * Verify HMAC signature received in webhook headers
     * @param string $payloadRawBody Raw JSON request body string received from QBiz webhook POST
     * @param string $signatureHeader Signature string received in X-QBiz-Signature header
     * @param string $webhookSecret Your webhook verification secret key
     * @return bool True if valid, false otherwise
     */
    public function verifyWebhook($payloadRawBody, $signatureHeader, $webhookSecret) {
        if (empty($signatureHeader) || empty($webhookSecret)) {
            return false;
        }
        $computedHash = hash_hmac('sha256', $payloadRawBody, $webhookSecret);
        return hash_equals($computedHash, $signatureHeader); // Secure comparison against timing attacks
    }
}
