/**
 * Rounds a number to a specified number of significant figures
 * @param n - The number to round
 * @param sig - The number of significant figures
 * @returns The rounded number
 */
export default function sigFigs(n: number, sig: number): number {
  if (n === 0) {
    return 0;
  }
  if (n < 0) {
    n = -n;
  }
  return parseFloat(n.toPrecision(sig));
}
