# 🎨 QBiz — Official Brand Kit & Design Guidelines

Official visual identity, color tokens, typography, and vector logo assets for **QBiz Dynamic QRIS Gateway**.

---

## 1. Logo Assets (`static/brand/`)

| Asset | File | Usage |
| :--- | :--- | :--- |
| **Primary App Mark** | [qbiz-mark.svg](static/brand/qbiz-mark.svg) | App icon, favicon, PWA tile, avatar |
| **Wordmark (Light UI)** | [qbiz-wordmark-light.svg](static/brand/qbiz-wordmark-light.svg) | Light backgrounds, documentation, invoices |
| **Wordmark (Dark UI)** | [qbiz-wordmark-dark.svg](static/brand/qbiz-wordmark-dark.svg) | Dark dashboards, developer portals, banners |
| **Monochrome Mark** | [qbiz-mono-black.svg](static/brand/qbiz-mono-black.svg) | Thermal receipts, B&W printouts, watermarks |
| **CSS Design Tokens** | [tokens.css](static/brand/tokens.css) | CSS custom properties for third-party embeds |

### Logo Usage Rules
- **Clear space:** Maintain at least `0.25x` of the icon width around all sides of the mark.
- **Minimum size:** `24×24 px` for the standalone mark; `140 px` width for the horizontal wordmark.
- **Do not:** Stretch, skew, rotate, add drop-shadows onto the SVG, or place the light wordmark on dark backgrounds.

---

## 2. Color Palette

| Token | Hex | Role |
| :--- | :--- | :--- |
| **QBiz Sky Primary** | `#0284C7` | Primary buttons, active navigation, brand mark |
| **QBiz Sky Glow** | `#0EA5E9` | Gradient highlight, hover focus rings |
| **Deep Slate Ink** | `#0F172A` | Primary headings & light-mode typography |
| **Dark Canvas** | `#09090B` | Dark-mode background surface |
| **Emerald Paid** | `#10B981` | `PAID` invoices, `ACTIVE` listeners, Low-Risk badge |
| **Amber Express** | `#F59E0B` | `NEEDS_OTP`, Express sync warning |
| **Crimson Alert** | `#EF4444` | `EXPIRED` / `DISCONNECTED` / High-Risk warning |

---

## 3. Typography

- **UI & Headings:** `Inter`, `system-ui`, `-apple-system`, `sans-serif` (weights `500`, `600`, `700`, `800`).
- **Identifiers, Amounts & API Keys:** `JetBrains Mono`, `ui-monospace`, `monospace` (`tabular-nums` for currency alignment).

---

## 4. Brand Voice

- **Tone:** Direct, technical-friendly, transparent, and security-conscious.
- **Naming:** Always write **QBiz** (capital `Q` and `B`, lowercase `iz`).
