import slugifyLib from "slugify";
import { customAlphabet } from "nanoid";

const shortId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

/**
 * Turn free text into a URL slug. Non-Latin text (Japanese, Cyrillic, Arabic)
 * produces almost nothing after transliteration, so fall back to a random id
 * prefixed with a stable word.
 */
export function makeSlug(text: string, fallbackPrefix = "story"): string {
  const base = slugifyLib(text ?? "", { lower: true, strict: true, trim: true }).slice(0, 96);
  if (base.replace(/-/g, "").length < 3) {
    return `${fallbackPrefix}-${shortId()}`;
  }
  return base.replace(/^-+|-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && slug.length <= 120;
}

/**
 * Given a base slug and a predicate reporting whether a slug is taken, return
 * the first free candidate: base, base-2, base-3, ...
 */
export async function ensureUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await isTaken(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 500) {
      candidate = `${base}-${shortId()}`;
      break;
    }
  }
  return candidate;
}
