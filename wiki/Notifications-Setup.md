# Multi-Channel Notifications Setup 🔔

QBiz Gateway Hub dispatches instant confirmation alerts whenever a QRIS payment is verified. You can configure channels per store under **Merchants** (`/merchants`) > **Notification Settings**.

---

## ✈️ 1. Telegram Bot Integration

1. Create a Telegram bot by messaging [@BotFather](https://t.me/botfather) and copy your **Bot Token** (e.g. `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
2. Add the bot to your private chat or cashier Telegram group.
3. Obtain your Chat ID (using [@userinfobot](https://t.me/userinfobot) or `https://api.telegram.org/bot<TOKEN>/getUpdates`).
4. Paste the Bot Token and Chat ID into the store's Telegram settings in QBiz.
5. Click **Send Test Alert** to verify connectivity.

---

## 💬 2. Discord Webhook Integration

1. Open your Discord server > **Channel Settings** > **Integrations** > **Webhooks**.
2. Click **New Webhook**, name it (e.g., `QBiz Cashier`), and copy the **Webhook URL**.
3. Paste the URL into the Discord Webhook field in QBiz.
4. Alerts are delivered as rich embedded cards with transaction breakdown and payment status badges.

---

## 📱 3. WhatsApp Multi-Device (GOWA API)

QBiz integrates natively with [GOWA (Go WhatsApp Web Multi-Device API)](https://github.com/aldinokemal/go-whatsapp-web-multidevice):
1. Deploy GOWA and pair your WhatsApp device via QR code.
2. In QBiz Notification Settings, configure:
   - **GOWA Endpoint**: `http://YOUR_GOWA_HOST:3000/send/message`
   - **Auth Method**: No Auth / Bearer Token / Basic Auth
   - **Target Recipient Phone**: (e.g. `6281234567890`)
3. Test delivery using the in-app simulator.

---

## 🎨 Customizing Message Templates

Templates support dynamic variable placeholders:
* `{merchant_name}`: Store name
* `{order_id}`: POS invoice order number
* `{amount_formatted}`: Formatted Rupiah amount (e.g. `Rp 50.123`)
* `{customer_name}`: Customer name
* `{paid_at}`: Timestamp of transaction settlement
