export default function sigFigs (n, sig) {
  if (n === 0) {
    return 0
  }
  if (n < 0) {
    n = -n
  }
  return parseFloat(n.toPrecision(sig))
}
