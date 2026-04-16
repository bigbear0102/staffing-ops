create table if not exists billing_handoff_requests (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  client_account_id text not null references client_accounts (id) on delete restrict,
  site_id text not null references sites (id) on delete restrict,
  worker_id text not null references workers (id) on delete restrict,
  source_assignment_id text not null references assignments (id) on delete restrict,
  source_attendance_id text not null references attendance (id) on delete restrict,
  billing_period_start date not null,
  billing_period_end date not null,
  bill_rate_krw integer not null check (bill_rate_krw > 0),
  status text not null check (status in ('pending_export', 'exported', 'cancelled')),
  export_batch_id text references billing_handoff_batches (id) on delete set null,
  requested_at timestamptz not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (billing_period_end >= billing_period_start),
  unique (organization_id, source_attendance_id)
);

create index if not exists idx_billing_handoff_requests_status_period
  on billing_handoff_requests (organization_id, status, billing_period_start, billing_period_end);
