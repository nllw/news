import { describe, expect, it } from "vitest";
import { htmlToText, sanitizeArticleHtml } from "@/lib/sanitize";
import { deriveText, plainTextToHtml } from "@/lib/derive-text";

describe("sanitizeArticleHtml", () => {
  it("removes script tags and event handlers", () => {
    const out = sanitizeArticleHtml('<p onclick="x()">Hi<script>alert(1)</script></p>');
    expect(out).toBe("<p>Hi</p>");
  });

  it("drops javascript: links", () => {
    const out = sanitizeArticleHtml('<p><a href="javascript:alert(1)">x</a></p>');
    expect(out).not.toContain("javascript:");
  });

  it("adds rel and target to external links", () => {
    const out = sanitizeArticleHtml('<p><a href="https://example.com">x</a></p>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it("keeps allowed structure", () => {
    const html =
      "<h2>Title</h2><p>Body <em>em</em> <strong>strong</strong></p><blockquote><p>q</p></blockquote><ul><li>a</li></ul>";
    expect(sanitizeArticleHtml(html)).toBe(html);
  });

  it("drops images from foreign hosts but keeps local uploads", () => {
    const out = sanitizeArticleHtml(
      '<p><img src="https://evil.example/x.png" alt="a" /><img src="/uploads/images/1.webp" alt="b" /></p>'
    );
    expect(out).not.toContain("evil.example");
    expect(out).toContain("/uploads/images/1.webp");
  });

  it("removes iframes and style tags", () => {
    const out = sanitizeArticleHtml('<p>a</p><iframe src="https://x"></iframe><style>p{}</style>');
    expect(out).toBe("<p>a</p>");
  });
});

describe("htmlToText and deriveText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToText("<p>Hello   <b>there</b></p>\n<p>friend</p>")).toBe("Hello there friend");
  });

  it("computes word count, reading time, and excerpt", () => {
    const words = Array.from({ length: 450 }, (_, i) => `w${i}`).join(" ");
    const d = deriveText(`<p>${words}</p>`);
    expect(d.wordCount).toBe(450);
    expect(d.readingTime).toBe(3);
    expect(d.excerpt.length).toBeLessThanOrEqual(201);
    expect(d.excerpt.endsWith("…")).toBe(true);
  });

  it("uses the dek when the body is empty", () => {
    expect(deriveText("", "Fallback dek").excerpt).toBe("Fallback dek");
    expect(deriveText("", "x").readingTime).toBe(1);
  });
});

describe("plainTextToHtml", () => {
  it("wraps paragraphs and escapes html", () => {
    expect(plainTextToHtml("One <b>two</b>\n\nThree")).toBe(
      "<p>One &lt;b&gt;two&lt;/b&gt;</p>\n<p>Three</p>"
    );
  });
});
