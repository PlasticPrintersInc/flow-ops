const QUICKSTART_PIN_TOKEN_PREFIX = "q1_";
const QUICKSTART_PIN_KEY_PREFIX = "flow.quickstart";

function bytesToBase64Url(bytes: Uint8Array) {
  let binaryValue = "";

  bytes.forEach((byte) => {
    binaryValue += String.fromCharCode(byte);
  });

  return btoa(binaryValue).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string) {
  if (!/^[A-Za-z0-9_-]*$/u.test(value)) {
    throw new Error("Invalid quickstart token.");
  }

  const paddedValue = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binaryValue = atob(paddedValue.replace(/-/g, "+").replace(/_/g, "/"));

  return Uint8Array.from(binaryValue, (character) => character.charCodeAt(0));
}

function transformPinBytes(userId: string, bytes: Uint8Array) {
  const keyBytes = new TextEncoder().encode(`${QUICKSTART_PIN_KEY_PREFIX}:${userId}`);

  return bytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
}

export function encodeQuickstartPin(userId: string, pin: string) {
  const trimmedPin = pin.trim();
  const encodedBytes = transformPinBytes(userId, new TextEncoder().encode(trimmedPin));

  return `${QUICKSTART_PIN_TOKEN_PREFIX}${bytesToBase64Url(encodedBytes)}`;
}

export function decodeQuickstartPin(userId: string, token: string) {
  if (!token.startsWith(QUICKSTART_PIN_TOKEN_PREFIX)) {
    throw new Error("Invalid quickstart token.");
  }

  const encodedValue = token.slice(QUICKSTART_PIN_TOKEN_PREFIX.length);
  const decodedBytes = transformPinBytes(userId, base64UrlToBytes(encodedValue));
  const pin = new TextDecoder().decode(decodedBytes).trim();

  if (!pin) {
    throw new Error("Invalid quickstart token.");
  }

  return pin;
}
