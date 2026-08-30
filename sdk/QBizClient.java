package com.qbiz.sdk;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * QBiz Dynamic QRIS Gateway SDK for Java & Spring Boot.
 * Built using modern java.net.http.HttpClient with zero third-party dependencies.
 */
public class QBizClient {
    private final String apiKey;
    private final String baseUrl;
    private final HttpClient httpClient;

    public QBizClient(String apiKey) {
        this(apiKey, "http://localhost:8000");
    }

    public QBizClient(String apiKey, String baseUrl) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalArgumentException("API Key is required");
        }
        this.apiKey = apiKey.trim();
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Create a new dynamic QRIS invoice with raw JSON payload.
     */
    public String createInvoice(String jsonPayload) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(this.baseUrl + "/api/v1/invoices"))
                .header("Authorization", "Bearer " + this.apiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = this.httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    /**
     * Query real-time payment settlement status of an invoice.
     */
    public String getInvoiceStatus(String invoiceId) throws IOException, InterruptedException {
        if (invoiceId == null || invoiceId.trim().isEmpty()) {
            throw new IllegalArgumentException("invoiceId is required");
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(this.baseUrl + "/api/v1/invoices/" + invoiceId + "/status"))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        HttpResponse<String> response = this.httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    /**
     * Verify incoming HMAC SHA-256 webhook signature with anti-replay timestamp verification.
     */
    public static boolean verifyWebhookSignature(byte[] rawBody, String signature, String secretKey, long timestamp, long toleranceSeconds) {
        if (rawBody == null || signature == null || secretKey == null) {
            return false;
        }

        // Anti-replay timestamp check
        if (timestamp > 0) {
            long now = Instant.now().getEpochSecond();
            if (Math.abs(now - timestamp) > toleranceSeconds) {
                return false;
            }
        }

        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKeySpec);
            byte[] hmacBytes = sha256Hmac.doFinal(rawBody);

            StringBuilder sb = new StringBuilder();
            for (byte b : hmacBytes) {
                sb.append(String.format("%02x", b));
            }
            return signature.equalsIgnoreCase(sb.toString());
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return false;
        }
    }
}
