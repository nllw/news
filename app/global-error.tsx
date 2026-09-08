"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{ fontFamily: "Georgia, serif", background: "#FAFAF7", color: "#1A1A18", margin: 0 }}
      >
        <main
          style={{ maxWidth: 560, margin: "15vh auto", padding: "0 1rem", textAlign: "center" }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Something went wrong.</h1>
          <p style={{ color: "#595959" }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "#1A1A18",
              color: "#FAFAF7",
              border: 0,
              borderRadius: 999,
              padding: "0.6rem 1.4rem",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ fontSize: 11, color: "#595959", marginTop: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
