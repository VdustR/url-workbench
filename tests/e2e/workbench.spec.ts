import { expect, test } from "@playwright/test";

test("edits URL anatomy and search rows", async ({ page }) => {
  await page.goto("/");

  const totalUrl = page.getByLabel("Total URL");
  await expect(totalUrl).toBeVisible();
  await expect(totalUrl).toHaveValue(/docs\.example\.com/);

  await page.getByLabel("domain / hostname").fill("api.example.test");
  await expect(totalUrl).toHaveValue(/api\.example\.test/);

  await page.getByLabel("port").fill("9443");
  await expect(totalUrl).toHaveValue(/:9443/);

  await page.getByRole("button", { name: "Add parameter" }).click();
  await page.getByLabel("parameter key").last().fill("feature");
  await page.getByLabel("parameter value").last().fill("url-workbench");
  await expect(totalUrl).toHaveValue(/feature=url-workbench/);

  await page.getByRole("button", { name: "query-string" }).click();
  await expect(page.getByText("query-string").first()).toBeVisible();
});
