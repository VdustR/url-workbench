import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/url-workbench/" : "/",
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [react()],
  test: {
    exclude: ["tests/e2e/**"],
    include: ["src/**/*.test.{ts,tsx}", "tests/domain/**/*.test.{ts,tsx}"],
  },
});
