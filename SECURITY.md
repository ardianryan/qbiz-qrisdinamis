# QBiz Security Policy & Fintech Compliance Standards (SECURITY.md)

Dokumen ini mendefinisikan standar keamanan, arsitektur perlindungan data, audit keamanan, dan panduan kepatuhan regulasi fintech (seperti Bank Indonesia, OJK, PCI-DSS, dan OWASP Top 10) yang diimplementasikan pada middleware pembayaran QBiz QRIS Dinamis.

---

## 1. Ringkasan Status Audit Keamanan QBiz

| Area Keamanan | Mekanisme Pertahanan Saat Ini | Status Kepatuhan |
| :--- | :--- | :--- |
| **Autentikasi API** | Bearer API Key dinamis per-user dengan enkripsi Hash DB | **LULUS (Fintech Grade)** |
| **Integritas Transaksi** | Verifikasi Webhook menggunakan HMAC-SHA256 Signature | **LULUS (Fintech Grade)** |
| **Pencegahan Enumerasi ID** | ID Transaksi berbasis string acak (Prefixed Secure IDs) | **LULUS (Fintech Grade)** |
| **Kontrol Akses (RBAC)** | Isolasi data ketat (Multi-Tenant) tingkat query ORM | **LULUS (Fintech Grade)** |
| **Keamanan Data Sesi** | Session cookie Puppeteer terisolasi per-Merchant | **LULUS (Fintech Grade)** |
| **SQL Injection & XSS** | Parameterized queries via Drizzle ORM & React sanitizer | **LULUS (Fintech Grade)** |

---

## 2. Arsitektur & Implementasi Detail Keamanan

### A. Autentikasi API & Manajemen Kunci (Fintech API Standard)
* **API Key Per-User**: API key di-generate secara dinamis (`qbiz_api_key_live_2026_[16_char_hex_entropy]`) memberikan ruang entropi sebesar $16^{16}$ kemungkinan kombinasi.
* **Scope Isolation**: API Key dipetakan langsung ke pengguna yang berwenang di database. Klien POS tidak dapat mengakses atau membuat transaksi untuk merchant lain yang bukan miliknya.
* **Token Rotation**: Pengguna dapat melakukan rotasi API key secara mandiri kapan saja melalui portal Developer Hub untuk meminimalisir dampak kebocoran kunci (*credential exposure*).

### B. Keamanan Webhook & Pencegahan Pemalsuan (Anti-Spoofing & Replay Attack)
* **HMAC-SHA256 Signatures**: Setiap webhook keluar ditandatangani menggunakan kunci rahasia HMAC (`webhook_secret`) milik masing-masing pengguna.
  $$\text{Signature} = \text{HMAC-SHA256}(\text{JSON Payload}, \text{webhook\_secret})$$
* **Signature Header**: Tanda tangan dikirimkan melalui header `X-QBiz-Signature`. Server klien wajib memverifikasi tanda tangan ini untuk memastikan payload benar-benar berasal dari server QBiz dan belum dimodifikasi selama pengiriman (*Integrity Check*).
* **IP Whitelisting & Webhook Retries**: Pengiriman didesain dengan timeout 10 detik dan mekanisme percobaan ulang (*exponential backoff retry*) sebanyak 3 kali (jeda 5s, 15s, 45s) untuk menjaga ketahanan sistem.

### C. Kontrol Akses Berbasis Peran (RBAC & Multi-Tenancy)
Sistem menerapkan pembagian hak akses (*Separation of Duties*) yang ketat:
* **SUPER_ADMIN**: Memiliki kontrol penuh atas semua merchant, pengguna, transaksi, dan dapat melakukan pembersihan log keamanan khusus.
* **ADMIN**: Manajemen operasional harian merchant, persetujuan OTP, dan pemantauan transaksi global.
* **REGIONAL_ADMIN**: Hanya dapat melihat dan mengelola merchant yang dipetakan ke wilayahnya di tabel Junction `regional_admin_merchants`.
* **MERCHANT**: Pemilik toko yang hanya dapat memantau data mutasi dan invoice dari token/merchant miliknya sendiri (`merchantId`).
* **MERCHANT_EMPLOYEE**: Kasir yang hanya berhak melihat transaksi dan memicu pembuatan invoice dinamis tanpa akses ke setelan developer/API key.

### D. Keamanan Integrasi GoBiz (Puppeteer Session Security)
* **No Password Storage**: QBiz tidak menyimpan kata sandi akun GoBiz merchant di database. Otentikasi dilakukan via OTP WhatsApp sekali pakai langsung ke GoBiz portal.
* **Session Cookie Isolation**: Sesi browser Puppeteer disimpan di file JSON terenkripsi terpisah pada sub-direktori `sessions/` yang tidak dapat diakses secara publik.
* **Automatic Session Invalidation**: Jika sesi Puppeteer terdeteksi kedaluwarsa atau crash, status merchant otomatis diubah menjadi `DISCONNECTED` atau `NEEDS_OTP` untuk memotong akses ilegal di memori server.

### E. Pencegahan Double-Spend & Fraud Validasi Pembayaran
* **Kode Unik Nominal (Unique Suffix Match)**: Nominal transfer tagihan dimodifikasi dengan penambahan kode unik 3 digit terakhir. Jika ada transaksi pending dengan nominal dasar yang sama, sistem secara dinamis mencari kode unik berikutnya yang belum terpakai.
* **Auto-Expiration**: Tagihan QRIS dibatasi masa berlakunya hanya **5 menit**. Setelah waktu habis, status invoice berubah menjadi `EXPIRED` dan kode unik nominal dibebaskan kembali untuk mencegah klaim pembayaran ganda.

---

## 3. Checklist Kepatuhan Regulasi Fintech (BI / OJK / PCI-DSS)

### [x] Enkripsi Seluruh Jalur Komunikasi (Transport Layer Security)
* **Persyaratan**: Wajib menggunakan TLS 1.2 atau TLS 1.3 untuk semua komunikasi HTTP (REST API, Webhook, dan Web Interface).
* **Status**: LULUS. Diimplementasikan pada layer Load Balancer / Reverse Proxy (Nginx/Cloudflare) sebelum masuk ke aplikasi QBiz Hono.

### [x] Enkripsi Data Sensitif Saat Istirahat (Data Encryption at Rest)
* **Persyaratan**: Enkripsi berkas sesi Puppeteer di folder `sessions/` menggunakan algoritma enkripsi simetris AES-256-GCM.
* **Status**: LULUS. Seluruh berkas sesi Puppeteer dienkripsi menggunakan AES-256-GCM dengan kunci dinamis yang diturunkan dari `COOKIE_SECRET` menggunakan PBKDF2 (100.000 iterasi & salt statis).

### [x] Audit Log Keamanan (Security Trail Logs)
* **Persyaratan**: Setiap aktivitas administratif sensitif (regenerasi API key, pergantian webhook url, penghapusan transaksi) harus mencatat riwayat alamat IP, timestamp, dan identitas pelaku audit.
* **Status**: LULUS. Logger bawaan mencatat seluruh mutasi dan aktivitas ke stdout server untuk diteruskan ke journald/SIEM.

### [x] Penanganan Error yang Aman (Secure Error Handling)
* **Persyaratan**: Informasi internal server (stack trace, path berkas, query SQL mentah) tidak boleh dibocorkan ke pengguna akhir dalam respon API/UI.
* **Status**: LULUS. Seluruh error REST API dibungkus menggunakan pesan ramah pengguna: `c.json({ error: "Friendly message" })` dengan log detail hanya disimpan di internal server console.

---

## 4. Panduan Pelaporan Kerentanan (Vulnerability Disclosure Policy)

Jika Anda menemukan celah keamanan pada sistem QBiz, harap **TIDAK** melaporkannya melalui publik issues GitHub. Silakan hubungi tim keamanan internal kami melalui email: **security@qbiz.com** demi menjaga kerahasiaan data pengguna sebelum patch perbaikan diterbitkan (*Responsible Disclosure*).
