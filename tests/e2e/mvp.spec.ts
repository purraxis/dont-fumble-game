import { expect, type Page, test } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow).toBe(false);
}

test("happy path: landing to result on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /will they pass the vibe check/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: /start a challenge/i }).click();
  await expect(page).toHaveURL(/\/create/);
  await expect(page.getByPlaceholder(/bae, babe, boss/i)).toBeVisible();
  await page.evaluate(() => sessionStorage.setItem("df_sender", "Bae"));
  await page.goto("/packs");

  await expect(page).toHaveURL(/\/packs/);
  await page.getByRole("button", { name: /worm test/i }).click();
  await page.getByRole("button", { name: /create challenge/i }).click();
  await expect(page).toHaveURL(/\/share\/[A-Z0-9]+/);
  await expect(page.getByText(/send it\. see if they survive/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: /preview as partner/i }).click();
  await expect(page.getByText(/would you still love me if i was a worm/i)).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.keys(localStorage).some((key) => key.startsWith("df_play_session_")),
      ),
    )
    .toBe(true);

  await page
    .getByPlaceholder(/survival response/i)
    .fill("Yes, I would build you a luxury terrarium.");
  await page.getByRole("button", { name: /submit answer/i }).click();
  await expect(page.getByText(/the terrarium upgrade plan/i)).toBeVisible();
  await page.getByRole("button", { name: /next/i }).click();

  await page
    .getByPlaceholder(/survival response/i)
    .fill("I would learn interpretive dance immediately.");
  await page.getByRole("button", { name: /submit answer/i }).click();
  await expect(page.getByText(/the terrarium upgrade plan/i)).toBeVisible();
  await page.getByRole("button", { name: /see result/i }).click();

  await expect(page).toHaveURL(/\/result\/[A-Z0-9]+/);
  await expect(page.getByText(/final verdict/i)).toBeVisible();
  await expect(page.getByText("84").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(page.getByText(/final verdict/i)).toBeVisible();
  await expect(page.getByText("84").first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("invalid challenge code shows a friendly error", async ({ page }) => {
  await page.goto("/play/invalid-code");

  await expect(page.getByRole("heading", { name: /challenge not found/i })).toBeVisible();
  await expect(page.getByText(/ask them to resend/i)).toBeVisible();
});

test("double-click create does not create duplicate challenges", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("df_sender", "Bae");
  });

  await page.goto("/packs");
  await page.getByRole("button", { name: /worm test/i }).click();
  await page.getByRole("button", { name: /create challenge/i }).dblclick();
  await expect(page).toHaveURL(/\/share\/[A-Za-z0-9]+/);

  const challengeCount = await page.evaluate(
    () =>
      (
        globalThis as typeof globalThis & {
          __DF_E2E_STATE__?: { challenges?: unknown[] };
        }
      ).__DF_E2E_STATE__?.challenges?.length ?? 0,
  );
  expect(challengeCount).toBe(1);
});

test("invalid result code shows a friendly error", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("df_play_session_INVALID-CODE", "dfps_1234567890abcdefghijklmn");
  });

  await page.goto("/result/invalid-code");

  await expect(page.getByRole("heading", { name: /result not ready/i })).toBeVisible();
  await expect(page.getByText(/same browser session/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("packs page handles empty data", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("df_sender", "Bae");
    sessionStorage.setItem("df_e2e_pack_mode", "empty");
  });

  await page.goto("/packs");

  await expect(page.getByText(/no traps loaded yet/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /create challenge/i })).toBeDisabled();
});

test("packs page handles Supabase errors", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("df_sender", "Bae");
    sessionStorage.setItem("df_e2e_pack_mode", "error");
  });

  await page.goto("/packs");

  await expect(page.getByText(/packs fumbled loading/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /create challenge/i })).toBeDisabled();
});
