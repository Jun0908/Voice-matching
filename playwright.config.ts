import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium-mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 }, launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] } } }],
  webServer: { command: "npm run start", url: "http://127.0.0.1:3000", reuseExistingServer: true, timeout: 120000 },
});
