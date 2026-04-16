import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const workspaceSourceAliases = {
  "@staffing-ops/domain": fileURLToPath(new URL("./packages/domain/src/index.ts", import.meta.url)),
  "@staffing-ops/db": fileURLToPath(new URL("./packages/db/src/index.ts", import.meta.url)),
  "@staffing-ops/jobs": fileURLToPath(new URL("./packages/jobs/src/index.ts", import.meta.url))
};

export default defineConfig({
  resolve: {
    alias: workspaceSourceAliases
  },
  test: {
    environment: "node",
    passWithNoTests: false
  }
});
