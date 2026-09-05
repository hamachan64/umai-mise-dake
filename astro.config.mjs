// @ts-check
import { defineConfig } from "astro/config";

// GitHub Pages のプロジェクトサイトとして公開する設定。
// 独自ドメインに変える場合は site を変えて base を "/" にする。
export default defineConfig({
  site: "https://hamachan64.github.io",
  base: "/umai-mise-dake",
  trailingSlash: "ignore",
  build: { format: "directory" },
});
