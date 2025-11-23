export const title = "2048 Mini App";
export const description = "Play the classic 2048 game in a mini app.";
export const url = process.env.NEXT_PUBLIC_URL;

export function generateAttributionSuffix(
  codes: string[],
  registryAddress?: string,
  registryChainId?: number
): string {
  // ERC-8021 suffix: 16 bytes of "8021" repeated
  const ercSuffix = "80218021802180218021802180218021";
  const schemaId = "00"; // schemaId 0 for canonical registry
  const codesStr = codes.join(",");
  const codesLength = codesStr.length.toString(16).padStart(2, "0");
  // Build suffix: codesLength + codes + schemaId + ercSuffix
  const suffix = `${codesLength}${codesStr}${schemaId}${ercSuffix}`;
  return `0x${suffix}`;
}
