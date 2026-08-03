/**
 * Utility for parsing and manipulating EMVCo QRIS payloads
 * to convert Static QRIS to Dynamic QRIS.
 */

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
 * by injecting the transaction amount and invoice reference.
 * 
 * @param staticPayload The raw static QRIS string (e.g. 000201010211...)
 * @param amount The payment amount (e.g. 50023)
 * @param invoiceId The invoice reference ID to inject into tag 62 subtag 01
 */
export function generateDynamicQRIS(staticPayload: string, amount: number, invoiceId: string): string {
  const tags = parseEMVCo(staticPayload);

  // 1. Set Initiation Method to 12 (Dynamic QR) instead of 11 (Static QR)
  tags.set('01', '12');

  // 2. Set Transaction Amount (Tag 54)
  tags.set('54', amount.toString());

  // 3. Inject Invoice ID into Tag 62 (Additional Data) under subtag 01 (Bill Number)
  const tag62Val = tags.get('62');
  const subTags = tag62Val ? parseEMVCo(tag62Val) : new Map<string, string>();
  subTags.set('01', invoiceId);
  tags.set('62', serializeEMVCo(subTags));

  // 4. Serialize all tags
  const partialSerialized = serializeEMVCo(tags);

  // 5. Append tag 6304 (CRC-16 tag indicator)
  const finalPreCrc = partialSerialized + "6304";

  // 6. Calculate CRC-16-CCITT and append it
  const crc = computeCRC16(finalPreCrc);
  return finalPreCrc + crc;
}
