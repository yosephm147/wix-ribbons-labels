// @ts-check
import { defineConfig, envField } from "astro/config";
import wix from "@wix/astro";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const pkg = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./package.json", import.meta.url)),
    "utf8"
  )
);

export default defineConfig({
  output: "server",
  adapter: cloudflare(),
  integrations: [wix(), react()],
  image: { domains: ["static.wixstatic.com"] },
  security: { checkOrigin: false },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tsconfigPaths()],
    define: {
      __RIBBONS_RELEASE_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },
  env: {
    schema: {
      LABELS_DEV_API_BASE: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      PUBLIC_TIDIO_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      PUBLIC_IS_DEV: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },
});
