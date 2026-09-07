import { expect, test } from "@playwright/test";

const ADMIN = { email: "e2e@example.com", password: "e2e-password-1234" };

test.describe("public site", () => {
  test("front page renders the masthead and nav", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Sections", exact: true })).toBeVisible();
    await expect(page.locator("footer")).not.toContainText("Editor");
  });

  test("feeds, sitemap, and robots respond", async ({ request }) => {
    for (const path of ["/feed.xml", "/sitemap.xml", "/news-sitemap.xml", "/robots.txt"]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });

  test("security headers are present", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["content-security-policy"]).toContain("default-src 'self'");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["x-powered-by"]).toBeUndefined();
  });
});

test.describe("admin", () => {
  test("bare /admin redirects to login when signed out", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("upload endpoint requires auth", async ({ request }) => {
    const res = await request.post("/api/admin/upload", { multipart: { alt: "x" } });
    expect([401, 403]).toContain(res.status());
  });

  test("login, create, publish, and view an article", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto("/admin/articles/new");
    const headline = `Playwright story ${Date.now()}`;
    await page.getByLabel("Headline").fill(headline);
    await page.getByLabel("Dek").fill("A story created by the end-to-end test.");
    await page.getByRole("textbox", { name: "Article body" }).click();
    await page.keyboard.type("This body was typed by Playwright. It has enough words to count.");

    await page.getByRole("button", { name: "Publish" }).first().click();
    await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/articles\/[^/]+\/edit/);

    const slug = await page.locator("#slug").inputValue();
    await page.goto(`/article/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: headline })).toBeVisible();
    await expect(page.locator('script[type="application/ld+json"]').first()).toHaveCount(1);
  });
});
