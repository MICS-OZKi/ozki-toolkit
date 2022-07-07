class ZkUtils {
  buffer2bits = (buff: any) => {
    const res = [];
    for (let i = 0; i < buff.length; i++) {
      for (let j = 0; j < 8; j++) {
        if ((buff[i] >> j) & 1) {
          res.push(1n);
        } else {
          res.push(0n);
        }
      }
    }
    return res;
  };

  stringToBytes = (s: string): number[] => {
    const MAX_STRING_LENGTH = 48;
    const enc = new TextEncoder();

    if (s.length > MAX_STRING_LENGTH)
      throw new Error("Exceeding max string length");

    s = s.padEnd(MAX_STRING_LENGTH, " ");
    return Array.from(enc.encode(s));
  };

  numberToBytes = (i: number, b: number): number[] => {
    let a: number[] = [];
    for (var j = 0; j < b; j++) {
      let q = Math.floor(i / 256);
      var r = i - q * 256;
      a.push(r);
      i = q;
    }
    return a;
  };

  bytesToNumber = (a: number[], b: number): number => {
    let x = 1;
    let s = 0;
    for (var j = 0; j < b; j++) {
      s += a[j] * x;
      x = x * 256;
    }
    return s;
  };

  normalizeAuthInputForHash = (domain: string, ts: number): number[] => {
    // s is a fixed array of 20 numbers
    // a is a number
    // the serialized data is s appended with a, resulting in array of 21 numbers
    let data = this.stringToBytes(domain);

    let bytes = this.numberToBytes(ts, 4);
    for (var i = 0; i < 4; i++) {
      data.push(bytes[i]);
    }

    return data;
  };

  normalizeInputForHash = (s: string, age: number, ts: number): number[] => {
    // s is a fixed array of 20 numbers
    // a is a number
    // the serialized data is s appended with a, resulting in array of 21 numbers
    let data = this.stringToBytes(s);

    let bytes = this.numberToBytes(age, 4);
    for (var i = 0; i < 4; i++) {
      data.push(bytes[i]);
    }

    bytes = this.numberToBytes(ts, 4);
    for (var i = 0; i < 4; i++) {
      data.push(bytes[i]);
    }

    return data;
  };

  print = (a: any) => {
    console.log(a);
  };
}

export default ZkUtils;
