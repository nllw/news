import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run e2e:server`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT: String(PORT),
      DATABASE_URL: "file:../tests/tmp/e2e.db",
      AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-1234567",
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      SEED_ADMIN_EMAIL: "e2e@example.com",
      SEED_ADMIN_PASSWORD: "e2e-password-1234",
      STORAGE_DRIVER: "local",
      UPLOADS_DIR: "tests/tmp/e2e-uploads",
    },
  },
});
