/**
 * Truncates an Ethereum address for display
 * @param address The full address to truncate
 * @param startChars Number of characters to show at start (default 6)
 * @param endChars Number of characters to show at end (default 4)
 * @returns Truncated address string
 */
export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}
