import { expect, test } from "playwright/test";

test("real-response search → map → detail → reload → guided presentation", async ({ page }) => {
  const seen: string[] = [];
  page.on("response", response => {
    if (new URL(response.url()).pathname.startsWith("/api/")) seen.push(new URL(response.url()).pathname);
  });
  // The panel is outside this regression check; never run an AI call during the presentation check.
  await page.route("**/api/audience**", route => route.abort());
  await page.goto("/");
  await page.getByRole("textbox", { name: "Market, brand or audience" }).fill("Running shoes UAE");
  await page.getByRole("button", { name: /Find the Delta/ }).click();
  await expect(page).toHaveURL(/\/discover\?q=Running/);
  await expect(page.getByRole("heading", { name: "Running shoes UAE" })).toBeVisible();
  await expect(page.getByText("Cached result", { exact: false }).first()).toBeVisible();
  await expect(page.locator("#map g[role=button]").first()).toBeVisible();
  await page.locator('#map g[role=button][aria-label^="Desert heat:"]').click();
  await expect(page).toHaveURL(/\/opportunity\?q=Running.*&id=/);
  await expect(page.locator("#overview h1")).toBeVisible();
  await expect(page.locator("#evidence")).toBeVisible();
  await expect(page.locator('#evidence + div a[href^="https://"]').first()).toBeVisible();
  const title = await page.locator("#overview h1").textContent();
  await page.reload();
  await expect(page.locator("#overview h1")).toHaveText(title!);
  await expect(page.locator("#evidence")).toBeVisible();

  await page.getByRole("button", { name: "Present" }).click();
  await expect(page.getByText("1/13")).toBeVisible();
  const steps = ["Delta Map", "Open the delta", "Desert heat", "Real evidence", "Crowd Gap",
    "Hidden conversation", "Creative DNA", "Test with Audience", "One improvement",
    "Creators who can make it", "Build the campaign", "TikTok · Reels · Shorts"];
  for (const [index, title] of steps.entries()) {
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText(`${index + 2}/13`)).toBeVisible();
    await expect(page.getByText(title, { exact: true }).last()).toBeVisible();
    if (index >= 2) await expect(page).toHaveURL(/\/opportunity\?q=Running.*&id=visual-outdoor-sun/);
    if (index === 3) {
      await page.reload();
      await expect(page.getByText("5/13")).toBeVisible();
      await expect(page.locator("#overview h1")).toBeVisible();
    }
  }
  await page.getByRole("button", { name: "Exit presentation" }).last().click();
  await expect(page.getByText("13/13")).toHaveCount(0);
  expect(seen).toContain("/api/analyze");
  expect(seen).toContain("/api/opportunity");
});