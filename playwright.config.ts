import { defineConfig } from "playwright/test";
import path from "node:path";

const port = 48322;
export default defineConfig({
  testDir: "./test/browser",
  timeout: 120_000,
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? "/repl/tools/bin/chromium", args: ["--no-sandbox"] },
  },
  webServer: {
    command: `npm run dev -- -H 127.0.0.1 -p ${port}`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      WHITESPACE_DATA_MODE: "fixture",
      WHITESPACE_WINDOW_END: "",
      WHITESPACE_DATA_DIR: path.resolve(process.cwd(), "data"),
      ORIANE_API_KEY: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});