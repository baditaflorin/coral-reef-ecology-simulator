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
  await expect
    .poll(async () =>
      page.locator("canvas").evaluate((canvas) => {
        const target = canvas as HTMLCanvasElement;
        const gl =
          target.getContext("webgl2", { preserveDrawingBuffer: true }) ??
          target.getContext("webgl", { preserveDrawingBuffer: true });
        if (!gl) {
          return 0;
        }

        const samples = [
          [0.5, 0.5],
          [0.35, 0.45],
          [0.65, 0.55],
          [0.5, 0.72],
        ];
        let colorVariance = 0;
        const first = new Uint8Array(4);
        gl.readPixels(
          Math.floor(target.width * samples[0][0]),
          Math.floor(target.height * samples[0][1]),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          first,
        );

        for (const [x, y] of samples.slice(1)) {
          const pixel = new Uint8Array(4);
          gl.readPixels(
            Math.floor(target.width * x),
            Math.floor(target.height * y),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixel,
          );
          colorVariance +=
            Math.abs(pixel[0] - first[0]) +
            Math.abs(pixel[1] - first[1]) +
            Math.abs(pixel[2] - first[2]);
        }

        return colorVariance;
      }),
    )
    .toBeGreaterThan(24);
  await expect(page.getByText(/v0\.1\.0/)).toBeVisible();

  await page.getByRole("button", { name: "Marine heatwave" }).click();
  await expect(page.getByText(/Scenario applied/)).toBeVisible();
  await page.getByRole("button", { name: "Add Stoplight parrotfish" }).click();
  await expect(page.getByText(/local samples captured/)).toBeVisible();
  await page.getByRole("button", { name: "Analyze log" }).click();
  await expect(page.getByText("Avg health")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Run" })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
