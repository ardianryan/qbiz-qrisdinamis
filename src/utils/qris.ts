import jsQR from "npm:jsqr";
import { Jimp } from "npm:jimp";


export function parseEMVCo(qrString: string): Map<string, string> {
  const tags = new Map<string, string>();
  let index = 0;
  while (index < qrString.length) {
    if (index + 4 > qrString.length) break;
    const tag = qrString.slice(index, index + 2);
    const length = parseInt(qrString.slice(index + 2, index + 4), 10);
    index += 4;
    if (isNaN(length) || length < 0) break;
    if (index + length > qrString.length) break;
    const value = qrString.slice(index, index + length);
    tags.set(tag, value);
    index += length;
  }
  return tags;
}

export function serializeEMVCo(tags: Map<string, string>): string {
  let result = "";
  const sortedKeys = Array.from(tags.keys()).sort();
  for (const key of sortedKeys) {
    if (key === '63') continue; // CRC tag is calculated separately
    const val = tags.get(key) || "";
    const lenStr = val.length.toString().padStart(2, '0');
    result += `${key}${lenStr}${val}`;
  }
  return result;
}

export function computeCRC16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    crc ^= (charCode << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Convert a Static QRIS payload string to a Dynamic QRIS payload string
 * by changing tag 01 to '12' (Dynamic) and inserting Tag 54 (Transaction Amount).
 * Preserves the exact tag order of the static template and avoids mutating Tag 62,
 * ensuring 100% compatibility with GoPay, BCA, Livin Mandiri, and other QRIS scanners.
 * 
 * @param staticPayload The raw static QRIS string (e.g. 000201010211...)
 * @param amount The payment amount (e.g. 50023)
 * @param _invoiceId Optional invoice ID (preserved for backwards-compatibility)
 */
export function generateDynamicQRIS(staticPayload: string, amount: number, _invoiceId?: string): string {
  if (!staticPayload) return "";
  let payload = staticPayload.trim();

  // Strip trailing Tag 63 (CRC) if present
  const idx63 = payload.indexOf('6304');
  if (idx63 !== -1) {
    payload = payload.substring(0, idx63);
  }

  // Parse EMVCo TLV preserving original tag sequence
  const tags: Array<{ tag: string; val: string }> = [];
  let i = 0;
  while (i < payload.length) {
    if (i + 4 > payload.length) break;
    const tag = payload.substring(i, i + 2);
    const length = parseInt(payload.substring(i + 2, i + 4), 10);
    if (isNaN(length) || length < 0) break;
    if (i + 4 + length > payload.length) break;
    const val = payload.substring(i + 4, i + 4 + length);
    tags.push({ tag, val });
    i += 4 + length;
  }

  const amountStr = Math.round(amount).toString();
  const newTags: Array<{ tag: string; val: string }> = [];
  let hasTag54 = false;

  for (const item of tags) {
    if (item.tag === '01') {
      // Change Static (11) to Dynamic (12)
      newTags.push({ tag: '01', val: '12' });
    } else if (item.tag === '54') {
      newTags.push({ tag: '54', val: amountStr });
      hasTag54 = true;
    } else if (item.tag === '58' && !hasTag54) {
      // Insert Tag 54 right before Tag 58 (Country Code) per EMVCo standard
      newTags.push({ tag: '54', val: amountStr });
      hasTag54 = true;
      newTags.push(item);
    } else {
      newTags.push(item);
    }
  }

  if (!hasTag54) {
    newTags.push({ tag: '54', val: amountStr });
  }

  let result = '';
  for (const item of newTags) {
    const lenStr = item.val.length.toString().padStart(2, '0');
    result += `${item.tag}${lenStr}${item.val}`;
  }

  result += '6304';
  const checksum = computeCRC16(result);
  return result + checksum;
}

export async function decodeQRISFromImage(filePath: string): Promise<string | null> {
  try {
    const image = await Jimp.read(filePath);
    const imageData = new Uint8ClampedArray(image.bitmap.data.buffer);
    const code = (jsQR as any)(imageData, image.bitmap.width, image.bitmap.height);
    return code ? code.data : null;
  } catch (err) {
    console.error("[QRIS Decoder] Error decoding QR code:", err);
    return null;
  }
}
