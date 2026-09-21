import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789"; // sem caracteres ambíguos

/** Token aleatório e imprevisível, usado nos URL secretos. */
export function randomToken(length = 22): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
