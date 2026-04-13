import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { staffingCoreTables, staffingDbManifest } from "../src/index.js";

const migrationSql = staffingDbManifest.migrationFiles
  .map((fileName) =>
    readFileSync(new URL(`../migrations/${fileName}`, import.meta.url), "utf8").toLowerCase()
  )
  .join("\n");

describe("initial staffing ops migration", () => {
  it("creates every core table needed for the first workflow slice", () => {
    for (const table of staffingCoreTables) {
      expect(migrationSql).toContain(`create table if not exists ${table}`);
    }
  });

  it("pins the two workflow-critical uniqueness contracts", () => {
    expect(migrationSql).toContain("unique (assignment_id, work_date)");
    expect(migrationSql).toContain("unique (organization_id, dedupe_key)");
    expect(migrationSql).toContain("unique (organization_id, batch_key)");
  });

  it("stores order fill state and worker deployability fields for the staffing thin slice", () => {
    expect(migrationSql).toContain("required_qualifications text[] not null default '{}'");
    expect(migrationSql).toContain(
      "slots_filled integer not null default 0 check (slots_filled >= 0)"
    );
    expect(migrationSql).toContain(
      "check (slots_filled <= headcount_required)"
    );
    expect(migrationSql).toContain("held_qualifications text[] not null default '{}'");
    expect(migrationSql).toContain(
      "document_readiness text not null check (document_readiness in ('ready', 'missing', 'expired'))"
    );
    expect(migrationSql).toContain(
      "availability_status text not null check (availability_status in ('available', 'unavailable'))"
    );
  });

  it("stores billing handoff batch payloads for spreadsheet-first finance exports", () => {
    expect(migrationSql).toContain("create table if not exists billing_handoff_batches");
    expect(migrationSql).toContain("source_assignment_snapshots jsonb not null default '[]'::jsonb");
    expect(migrationSql).toContain("artifact_payload jsonb not null default '{}'::jsonb");
    expect(migrationSql).toContain("export_format text not null check (export_format in ('csv'))");
  });
});
