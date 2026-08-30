# Multi-Language Client SDK Guide 📦

QBiz Gateway Hub includes official, zero-dependency client libraries located in the `sdk/` directory and attached as release assets in every GitHub Release.

---

## 🦫 1. Go (Golang) — `sdk/qbiz.go`

```go
package main

import (
	"context"
	"fmt"
	"log"
	"qbiz"
)

func main() {
	client := qbiz.NewClient("qbiz_api_key_live_...", "https://qris.yourdomain.com")

	invoice, err := client.CreateInvoice(context.Background(), qbiz.CreateInvoiceParams{
		OrderID:     "ORDER-100239",
		Amount:      50000,
		MerchantID:  "mrc_toko_cabang_1",
		CallbackURL: "https://yourpos.com/webhooks/qris",
	})
	if err != nil {
		log.Fatalf("Failed to create invoice: %v", err)
	}

	fmt.Printf("Invoice ID: %s, Total: Rp %d, Checkout: %s\n", 
		invoice.ID, invoice.TotalAmount, invoice.CheckoutURL)
}
```

---

## 🔷 2. TypeScript / Deno / Node ESM — `sdk/qbiz.ts`

```typescript
import { QBizClient } from './sdk/qbiz.ts';

const client = new QBizClient({
  apiKey: 'qbiz_api_key_live_...',
  baseUrl: 'https://qris.yourdomain.com'
});

const invoice = await client.createInvoice({
  orderId: 'ORDER-100239',
  amount: 50000,
  merchantId: 'mrc_toko_cabang_1',
  callbackUrl: 'https://yourpos.com/webhooks/qris'
});

console.log(`Scan QR here: ${invoice.checkout_url}`);
```

---

## 🟡 3. Node.js (CommonJS) — `sdk/qbiz-node.js`

```javascript
const { QBizClient } = require('./sdk/qbiz-node.js');

const client = new QBizClient({
  apiKey: 'qbiz_api_key_live_...',
  baseUrl: 'https://qris.yourdomain.com'
});

client.createInvoice({
  orderId: 'ORDER-100239',
  amount: 50000,
  merchantId: 'mrc_toko_cabang_1'
}).then(invoice => {
  console.log('Invoice generated:', invoice.checkout_url);
});
```

---

## 🎯 4. Dart / Flutter — `sdk/qbiz.dart`

```dart
import 'package:qbiz/qbiz.dart';

final client = QBizClient(
  apiKey: 'qbiz_api_key_live_...',
  baseUrl: 'https://qris.yourdomain.com',
);

final invoice = await client.createInvoice(
  orderId: 'ORDER-100239',
  amount: 50000,
  merchantId: 'mrc_toko_cabang_1',
);

print('Payment QR: ${invoice.qrisPayload}');
```

---

## ☕ 5. Java / Android — `sdk/QBizClient.java`

```java
QBizClient client = new QBizClient("qbiz_api_key_live_...", "https://qris.yourdomain.com");

InvoiceResponse invoice = client.createInvoice(new CreateInvoiceRequest(
    "ORDER-100239",
    50000,
    "mrc_toko_cabang_1",
    "https://yourpos.com/webhooks/qris"
));

System.out.println("Checkout URL: " + invoice.getCheckoutUrl());
```

---

## 🐘 6. PHP (Laravel / WordPress) — `sdk/qbiz.php`

```php
require_once __DIR__ . '/sdk/qbiz.php';

$client = new QBizClient(
    apiKey: 'qbiz_api_key_live_...',
    baseUrl: 'https://qris.yourdomain.com'
);

$invoice = $client->createInvoice([
    'order_id' => 'ORDER-100239',
    'amount' => 50000,
    'merchant_id' => 'mrc_toko_cabang_1',
    'callback_url' => 'https://yourpos.com/webhooks/qris'
]);

echo "QRIS Checkout: " . $invoice['checkout_url'];
```

---

## 🐍 7. Python (Django / FastAPI) — `sdk/qbiz.py`

```python
from qbiz import QBizClient

client = QBizClient(
    api_key="qbiz_api_key_live_...",
    base_url="https://qris.yourdomain.com"
)

invoice = client.create_invoice(
    order_id="ORDER-100239",
    amount=50000,
    merchant_id="mrc_toko_cabang_1"
)

print(f"Dynamic QR payload: {invoice['qris_payload']}")
```

---

## 🦀 8. Rust — `sdk/qbiz.rs`

```rust
use qbiz_client::QBizClient;

#[tokio::main]
async func main() -> Result<(), Box<dyn std::error::Error>> {
    let client = QBizClient::new("qbiz_api_key_live_...", "https://qris.yourdomain.com");
    let invoice = client.create_invoice("ORDER-100239", 50000, "mrc_toko_cabang_1").await?;
    println!("Checkout: {}", invoice.checkout_url);
    Ok(())
}
```
