export default function sigFigs(n, sig) {
    let neg = false;
    if (n == 0) {
        return 0;
    }
    if (n < 0) {
        neg = true;
        n = -n;
    }
    // let mult = Math.pow(10, sig - Math.floor(Math.log(n) / Math.LN10) - 1);
    // return neg ? -Math.round(n * mult) / mult : Math.round(n * mult) / mult
    return parseFloat(n.toPrecision(sig));
}