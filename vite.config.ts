// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // @lovable.dev/vite-tanstack-config already wires up Nitro internally (defaulting to the
  // cloudflare-module preset). Pass the preset override HERE, as a top-level option — do NOT
  // add a second `nitro()` plugin manually, that runs two conflicting Nitro instances and
  // corrupts the .output/public static asset output (this caused 404s on all built assets).
  nitro: {
    preset: "node-server",
  },
});
