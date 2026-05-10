import { createHmac } from "crypto";

const ORDER_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";
const ORDER_CODE_BASE = BigInt(ORDER_CODE_ALPHABET.length);
const ORDER_CODE_MAX_LENGTH = 22;
const ORDER_CODE_BYTES = 15;
const ORDER_CODE_BITS = BigInt(120);
const ORDER_CODE_HALF_BITS = BigInt(60);
const ORDER_CODE_HALF_MASK = (BigInt(1) << ORDER_CODE_HALF_BITS) - BigInt(1);
const ORDER_CODE_ROUNDS = 12;

function getOrderCodeSecret() {
  const secret = process.env.ORDER_CODE_SECRET?.trim();

  if (!secret) {
    throw new Error("ORDER_CODE_SECRET is not configured.");
  }

  return secret;
}

export function normalizeOrderId(orderId: string) {
  const normalizedOrderId = orderId.trim().toUpperCase();

  if (!normalizedOrderId) {
    throw new Error("Order ID is required.");
  }

  if (!/^[A-Z0-9-]+$/.test(normalizedOrderId)) {
    throw new Error("Order ID may only contain uppercase letters, digits, and hyphen.");
  }

  if (normalizedOrderId.length > ORDER_CODE_MAX_LENGTH) {
    throw new Error(`Order ID must be ${ORDER_CODE_MAX_LENGTH} characters or fewer.`);
  }

  return normalizedOrderId;
}

function bigintToFixedBytes(value: bigint, byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  let remainingValue = value;

  for (let index = byteLength - 1; index >= 0; index -= 1) {
    bytes[index] = Number(remainingValue & BigInt(0xff));
    remainingValue >>= BigInt(8);
  }

  return Buffer.from(bytes);
}

function fixedBytesToBigint(bytes: Uint8Array) {
  return bytes.reduce((value, byte) => (value << BigInt(8)) | BigInt(byte), BigInt(0));
}

function orderIdToInteger(orderId: string) {
  const normalizedOrderId = normalizeOrderId(orderId);
  let value = BigInt(normalizedOrderId.length);

  for (const character of normalizedOrderId) {
    const characterIndex = ORDER_CODE_ALPHABET.indexOf(character);
    value = value * ORDER_CODE_BASE + BigInt(characterIndex);
  }

  if (value >= BigInt(1) << ORDER_CODE_BITS) {
    throw new Error("Order ID is too large to encode.");
  }

  return value;
}

function integerToOrderId(value: bigint) {
  for (let length = 1; length <= ORDER_CODE_MAX_LENGTH; length += 1) {
    const rangeSize = ORDER_CODE_BASE ** BigInt(length);
    const rangeStart = BigInt(length) * rangeSize;
    const rangeEnd = BigInt(length + 1) * rangeSize;

    if (value < rangeStart || value >= rangeEnd) {
      continue;
    }

    let remainingValue = value - rangeStart;
    const characters = Array<string>(length);

    for (let index = length - 1; index >= 0; index -= 1) {
      characters[index] = ORDER_CODE_ALPHABET[Number(remainingValue % ORDER_CODE_BASE)];
      remainingValue /= ORDER_CODE_BASE;
    }

    return characters.join("");
  }

  throw new Error("Token does not decode to a valid order ID.");
}

function roundFunction(secret: string, round: number, halfBlock: bigint) {
  const digest = createHmac("sha256", secret)
    .update("flow-ops-order-code-v1")
    .update(Buffer.from([round]))
    .update(bigintToFixedBytes(halfBlock, 8))
    .digest();

  return fixedBytesToBigint(digest.subarray(0, 8)) & ORDER_CODE_HALF_MASK;
}

function encryptBlock(value: bigint, secret: string) {
  let left = value >> ORDER_CODE_HALF_BITS;
  let right = value & ORDER_CODE_HALF_MASK;

  for (let round = 0; round < ORDER_CODE_ROUNDS; round += 1) {
    const nextLeft = right;
    const nextRight = left ^ roundFunction(secret, round, right);

    left = nextLeft;
    right = nextRight;
  }

  return (left << ORDER_CODE_HALF_BITS) | right;
}

function decryptBlock(value: bigint, secret: string) {
  let left = value >> ORDER_CODE_HALF_BITS;
  let right = value & ORDER_CODE_HALF_MASK;

  for (let round = ORDER_CODE_ROUNDS - 1; round >= 0; round -= 1) {
    const previousRight = left;
    const previousLeft = right ^ roundFunction(secret, round, left);

    left = previousLeft;
    right = previousRight;
  }

  return (left << ORDER_CODE_HALF_BITS) | right;
}

export function encodeOrderId(orderId: string) {
  const encryptedValue = encryptBlock(orderIdToInteger(orderId), getOrderCodeSecret());

  return bigintToFixedBytes(encryptedValue, ORDER_CODE_BYTES).toString("base64url");
}

export function decodeOrderToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20}$/.test(token)) {
    throw new Error("Order token must be exactly 20 Base64url characters.");
  }

  const tokenBytes = Buffer.from(token, "base64url");

  if (tokenBytes.length !== ORDER_CODE_BYTES) {
    throw new Error("Order token must decode to 15 bytes.");
  }

  return integerToOrderId(decryptBlock(fixedBytesToBigint(tokenBytes), getOrderCodeSecret()));
}
