import { expect, test } from "@playwright/test";

test("loads the reef simulator and runs a happy path", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Coral Reef Ecology Simulator" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /star repo/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/coral-reef-ecology-simulator",
  );
  await expect(page.getByRole("link", { name: /paypal/i })).toHaveAttribute(
    "href",
    "https://www.paypal.com/paypalme/florinbadita",
  );
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText(/v0\.1\.0/)).toBeVisible();

  await page.getByRole("button", { name: "Marine heatwave" }).click();
  await expect(page.getByText(/Scenario applied/)).toBeVisible();
  await page.getByRole("button", { name: "Add Stoplight parrotfish" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Run" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
