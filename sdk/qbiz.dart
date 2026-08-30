import 'dart:convert';
import 'dart:io';

/// QBiz Dynamic QRIS Gateway SDK for Dart & Flutter Mobile POS
class QBizClient {
  final String apiKey;
  final String baseUrl;
  final HttpClient _httpClient;

  QBizClient({
    required this.apiKey,
    String? baseUrl,
    HttpClient? httpClient,
  })  : baseUrl = (baseUrl ?? 'http://localhost:8000').replaceAll(RegExp(r'/+$'), ''),
        _httpClient = httpClient ?? HttpClient();

  /// Create a new dynamic QRIS invoice
  Future<Map<String, dynamic>> createInvoice({
    required String orderId,
    required int amount,
    String? callbackUrl,
    String? redirectUrl,
    String? merchantId,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
    List<Map<String, dynamic>>? items,
  }) async {
    final uri = Uri.parse('$baseUrl/api/v1/invoices');
    final request = await _httpClient.postUrl(uri);

    request.headers.set('Authorization', 'Bearer $apiKey');
    request.headers.set('Content-Type', 'application/json');
    request.headers.set('Accept', 'application/json');

    final payload = {
      'order_id': orderId,
      'amount': amount,
      if (callbackUrl != null) 'callback_url': callbackUrl,
      if (redirectUrl != null) 'redirect_url': redirectUrl,
      if (merchantId != null) 'merchant_id': merchantId,
      if (customerName != null) 'customer_name': customerName,
      if (customerEmail != null) 'customer_email': customerEmail,
      if (customerPhone != null) 'customer_phone': customerPhone,
      if (items != null) 'items': items,
    };

    request.add(utf8.encode(jsonEncode(payload)));
    final response = await request.close();
    final responseBody = await response.transform(utf8.decoder).join();

    final Map<String, dynamic> data = jsonDecode(responseBody);
    if (response.statusCode < 200 || response.statusCode >= 300 || data['success'] != true) {
      throw Exception(data['error'] ?? 'HTTP ${response.statusCode}: Failed to create invoice');
    }

    return data['invoice'] as Map<String, dynamic>;
  }

  /// Get status of an invoice
  Future<Map<String, dynamic>> getInvoiceStatus(String invoiceId) async {
    final uri = Uri.parse('$baseUrl/api/v1/invoices/$invoiceId/status');
    final request = await _httpClient.getUrl(uri);
    request.headers.set('Accept', 'application/json');

    final response = await request.close();
    final responseBody = await response.transform(utf8.decoder).join();

    if (response.statusCode != 200) {
      throw Exception('HTTP ${response.statusCode}: $responseBody');
    }

    return jsonDecode(responseBody) as Map<String, dynamic>;
  }
}
