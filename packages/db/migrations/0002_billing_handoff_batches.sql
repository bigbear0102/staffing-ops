create table if not exists billing_handoff_batches (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  client_account_id text not null references client_accounts (id) on delete restrict,
  site_id text not null references sites (id) on delete restrict,
  batch_key text not null,
  billing_period_start date not null,
  billing_period_end date not null,
  export_format text not null check (export_format in ('csv')),
  generated_at timestamptz not null,
  generated_by_user_id text not null references operator_users (id),
  source_attendance_ids text[] not null default '{}',
  source_assignment_snapshots jsonb not null default '[]'::jsonb,
  artifact_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (billing_period_end >= billing_period_start),
  unique (organization_id, batch_key)
);

create index if not exists idx_billing_handoff_batches_period
  on billing_handoff_batches (client_account_id, site_id, billing_period_start, billing_period_end);
