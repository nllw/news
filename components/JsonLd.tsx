import { headers } from "next/headers";

/** Emits a JSON-LD script tag with the request's CSP nonce. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const nonce = headers().get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON.stringify output with < escaped so it cannot close the script tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
