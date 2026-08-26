import { assertEquals } from "@std/assert";
import { parseEMVCo, serializeEMVCo, computeCRC16, generateDynamicQRIS } from "./qris.ts";

Deno.test("parseEMVCo - should parse raw tags correctly", () => {
  const payload = "0002010102116304ABCD";
  const tags = parseEMVCo(payload);
  assertEquals(tags.get("00"), "01");
  assertEquals(tags.get("01"), "11");
  assertEquals(tags.get("63"), "ABCD");
});

Deno.test("serializeEMVCo - should serialize tags while skipping CRC tag 63", () => {
  const tags = new Map<string, string>([
    ["00", "01"],
    ["01", "11"],
    ["63", "ABCD"]
  ]);
  const serialized = serializeEMVCo(tags);
  assertEquals(serialized, "000201010211");
});

Deno.test("computeCRC16 - should calculate correct CRC-16-CCITT checksum", () => {
  const data = "123456789";
  const crc = computeCRC16(data);
  assertEquals(crc, "29B1");
});

Deno.test("generateDynamicQRIS - should inject transaction amount and dynamic indicator", () => {
  const staticPayload = "00020101021151240016ID.CO.QRIS.WWW020412346304ABCD";
  const dynamic = generateDynamicQRIS(staticPayload, 25000, "inv_test_999");
  
  const tags = parseEMVCo(dynamic);
  assertEquals(tags.get("01"), "12"); // Initiation Method should be 12 (Dynamic)
  assertEquals(tags.get("54"), "25000"); // Amount tag 54 should be set
  
  // Tag 62 subtag 01 should contain the invoice ID
  const tag62Val = tags.get("62");
  const subTags = parseEMVCo(tag62Val!);
  assertEquals(subTags.get("01"), "inv_test_999");
});
