function hexToDecimalBigInt(hexStr) {
  const bigInt = BigInt(`0x${hexStr}`);
  return bigInt.toString(10).padStart(10, "0");
}

module.exports = hexToDecimalBigInt;
