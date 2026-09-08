import sanitizeHtml from "sanitize-html";

/**
 * Hosts an inline <img> may point at. Same-origin /uploads paths are always
 * allowed. When S3_PUBLIC_URL is set its host is allowed too.
 */
function allowedImageHosts(): string[] {
  const hosts: string[] = [];
  const s3 = process.env.S3_PUBLIC_URL;
  if (s3) {
    try {
      hosts.push(new URL(s3).host);
    } catch {
      // ignore malformed value; env validation reports it separately
    }
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) {
    try {
      hosts.push(new URL(site).host);
    } catch {
      // ignore
    }
  }
  return hosts;
}

export function isAllowedImageSrc(src: string | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/uploads/")) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return allowedImageHosts().includes(url.host);
  } catch {
    return false;
  }
}

const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "li",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
    "br",
    "hr",
    "figure",
    "figcaption",
    "img",
    "pre",
    "code",
    "sub",
    "sup",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "title"],
    img: ["src", "alt", "width", "height", "title"],
    "*": [],
  },
  allowedSchemes: ["https", "http", "mailto"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const isExternal = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : { rel: undefined as never }),
        },
      };
    },
    b: "strong",
    i: "em",
  },
  exclusiveFilter: (frame) => {
    if (frame.tag === "img") {
      return !isAllowedImageSrc(frame.attribs.src);
    }
    // Drop empty paragraphs that Tiptap emits for trailing newlines
    if (frame.tag === "p" && !frame.text.trim() && !/<(img|br)/.test(frame.tag)) {
      return frame.text.trim() === "" && !frame.mediaChildren?.length;
    }
    return false;
  },
};

/** Sanitise Tiptap output before it is stored. */
export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html ?? "", options).trim();
}

/** Strip every tag; used for excerpts and search text. */
export function htmlToText(html: string): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
