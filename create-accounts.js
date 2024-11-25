import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { AccountId, Binary } from "polkadot-api";

const pdpPriv = ed25519.utils.randomPrivateKey();
const pdpPubl = ed25519.getPublicKey(pdpPriv);

const userPiv = ed25519.utils.randomPrivateKey();
const userPubl = ed25519.getPublicKey(userPiv);

console.log("Private: ", bytesToHex(pdpPriv));
console.log("Public bytes: ", bytesToHex(pdpPubl));
console.log("Public Address: ", AccountId(42).dec(pdpPubl));

console.log("USER");
console.log("Private: ", bytesToHex(userPiv));
console.log("Public bytes: ", bytesToHex(userPubl));
console.log("Public Address: ", AccountId(42).dec(userPubl));

// PDP
// Private = [ 148, 102,  58,  21, 138, 101,  95,  31, 193,  26, 139, 171, 213, 237,  60,  17, 19,  56, 106, 104, 128, 114, 116, 216, 202, 245,  93,  39, 208,  37, 102,  97]
// Public = [ 59, 131,  61, 185, 199,  87,  51, 180, 0, 174, 206, 200,  27, 101,  95,  32, 215, 165,  67, 249,  27, 218, 174,   1, 254,  99, 218,  72, 250, 136, 232,  63]
// Public Address = 12M2p6Qg5F2Hras8GPdnXiZduBjZ1Ng9gibJ5SeDvNxyJsRF
// USER
// Private = [ 121,   4, 151, 112,  22,  81,  6, 232, 214, 126,   6, 193, 103,  98,  6, 102, 14, 238,  17, 161, 162,  92, 71,  83, 49, 195,  33, 239, 165, 193, 63, 245]
// Public = [ 99, 134, 233, 201,  48, 223, 109, 255, 105, 134,  87,  24, 225,  54,  14, 117, 10,  59,  13, 135,   1, 238, 228,  78, 97,  27,  39, 187,  45, 231, 111,  35]
// Public Address = 13FVpTNm3so7ZHE6932cBeDnSwBxFiR6EBouErULHRXNrM5D

// Private:  af28243196de5e3a2b4ecee0b6537ee1012d62cb2e8a0dc198320b454f6d46a2
// Public bytes:  6c0ba37e5dbd28d01dcfcfac0c78a77b23d27fdf68e8ddd9c16ad028ad6f1aaf
// Public Address:  5EWNV9XKKsLR3oCBixA5UdLxibvnh82uLGd6ouEiQLKoEnog
// USER
// Private:  894f074411d67d944cce1246b5ac8c01c85ed3ba2c6e238cf0d7378e11d2e76b
// Public bytes:  39aabb20aaa747435c1fde18bafa2dcef07f48c91cada2d1dcdd1a36aa584820
// Public Address:  5DNKJbrFw9TZQDsHWRkquEEFuhWTZ2fT3A3SEhLYkUTziPdb
