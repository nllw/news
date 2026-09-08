// Runs once when the Next.js server boots. Importing lib/env validates the
// environment and throws in production if anything required is missing.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env");
  }
}
