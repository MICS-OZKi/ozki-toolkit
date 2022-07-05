export{}
let enc = new TextEncoder();
let s = "P-1BF08962SE3742350MKRYCVQ"
let bytes = Array.from(enc.encode(s));
console.log(bytes);
