import { describe, expect, it } from "vitest";

import { adminShellManifest } from "../../apps/admin/src/index.js";
import { apiServiceManifest } from "../../apps/api/src/index.js";
import { systemProfile } from "../../packages/domain/src/index.js";

describe("workspace baseline", () => {
  it("keeps admin, API, and domain profiles aligned to the initial Korea-only operating model", () => {
    expect(adminShellManifest.defaultTimezone).toBe(systemProfile.timezone);
    expect(apiServiceManifest.currency).toBe(systemProfile.currency);
    expect(adminShellManifest.targetPersona).toBe(systemProfile.primaryPersona);
  });
});
