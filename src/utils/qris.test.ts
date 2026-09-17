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

Deno.test("generateDynamicQRIS - should inject transaction amount and dynamic indicator while preserving tags", () => {
  const staticPayload = "00020101021151260016ID.CO.QRIS.WWW020412345802ID6304ABCD";
  const dynamic = generateDynamicQRIS(staticPayload, 25000, "inv_test_999");
  
  const tags = parseEMVCo(dynamic);
  assertEquals(tags.get("01"), "12"); // Initiation Method should be 12 (Dynamic)
  assertEquals(tags.get("54"), "25000"); // Amount tag 54 should be set
  assertEquals(tags.get("58"), "ID"); // Tag 58 should be preserved
});

Deno.test("generateDynamicQRIS - should correctly convert real GoPay/GoFood QRIS to dynamic", () => {
  const realGoPayStatic = "00020101021126610014COM.GO-JEK.WWW01189360091435575271210210G5575271210303UMI51440014ID.CO.QRIS.WWW0215ID10253801132960303UMI5204504553033605802ID5920Mango Teknusa, MGRSR6009MOJOKERTO61056131762070703A0163044ACC";
  const dynamic = generateDynamicQRIS(realGoPayStatic, 5001);
  
  const tags = parseEMVCo(dynamic);
  assertEquals(tags.get("01"), "12");
  assertEquals(tags.get("54"), "5001");
  assertEquals(tags.get("58"), "ID");
  assertEquals(tags.get("62"), "0703A01"); // Tag 62 terminal label must be preserved untouched!
  assertEquals(tags.get("59"), "Mango Teknusa, MGRSR");
});

