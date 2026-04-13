create table if not exists organizations (
  id text primary key,
  name text not null,
  country_code char(2) not null default 'KR',
  timezone text not null default 'Asia/Seoul',
  currency_code char(3) not null default 'KRW',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists operator_users (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null check (role in ('admin', 'operations_manager', 'operations_operator', 'finance_admin', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (organization_id, email)
);

create table if not exists client_accounts (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  owner_user_id text not null references operator_users (id),
  legal_name text not null,
  business_registration_number text not null,
  contract_status text not null check (contract_status in ('draft', 'active', 'suspended', 'terminated')),
  billing_contact_name text not null,
  billing_contact_email text not null,
  invoicing_terms_days integer not null check (invoicing_terms_days >= 0),
  payment_method text not null check (payment_method in ('bank_transfer', 'card', 'cash')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (organization_id, business_registration_number)
);

create table if not exists sites (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  client_account_id text not null references client_accounts (id) on delete restrict,
  name text not null,
  address_line_1 text not null,
  manager_name text not null,
  manager_phone text not null,
  required_qualifications text[] not null default '{}',
  operating_calendar_code text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists orders (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  client_account_id text not null references client_accounts (id) on delete restrict,
  site_id text not null references sites (id) on delete restrict,
  role_code text not null,
  headcount_required integer not null check (headcount_required > 0),
  required_qualifications text[] not null default '{}',
  slots_filled integer not null default 0 check (slots_filled >= 0),
  start_date date not null,
  end_date date not null,
  shift_pattern text not null,
  bill_rate_krw integer not null check (bill_rate_krw > 0),
  overtime_rule_code text not null,
  status text not null check (status in ('draft', 'open', 'partially_filled', 'filled', 'closed', 'cancelled')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (end_date >= start_date),
  check (slots_filled <= headcount_required)
);

create table if not exists workers (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  legal_name text not null,
  phone_e164 text not null,
  residency_status text not null,
  skill_tags text[] not null default '{}',
  held_qualifications text[] not null default '{}',
  qualification_status text not null check (qualification_status in ('pending', 'qualified', 'restricted', 'inactive')),
  document_readiness text not null check (document_readiness in ('ready', 'missing', 'expired')),
  availability_status text not null check (availability_status in ('available', 'unavailable')),
  availability_detail text not null,
  payroll_reference text not null,
  active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists assignments (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  client_account_id text not null references client_accounts (id) on delete restrict,
  order_id text not null references orders (id) on delete restrict,
  worker_id text not null references workers (id) on delete restrict,
  site_id text not null references sites (id) on delete restrict,
  planned_start_date date not null,
  planned_end_date date not null,
  source_channel text not null,
  status text not null check (status in ('proposed', 'confirmed', 'active', 'completed', 'replaced', 'cancelled')),
  snapshot_version integer not null default 1 check (snapshot_version = 1),
  pay_rate_krw integer not null check (pay_rate_krw > 0),
  bill_rate_krw integer not null check (bill_rate_krw > 0),
  shift_pattern text not null,
  effective_date date not null,
  service_type text not null check (service_type in ('dispatch', 'subcontracting', 'outsourcing')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (planned_end_date >= planned_start_date)
);

create table if not exists attendance (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  assignment_id text not null references assignments (id) on delete restrict,
  work_date date not null,
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz not null,
  actual_start_at timestamptz,
  actual_end_at timestamptz,
  break_minutes integer not null default 0 check (break_minutes >= 0),
  overtime_minutes integer not null default 0 check (overtime_minutes >= 0),
  status text not null check (status in ('captured', 'submitted', 'approved', 'rejected', 'corrected')),
  source text not null check (source in ('operator_entry', 'site_lead_mobile', 'import')),
  exception_code text,
  approved_at timestamptz,
  approved_by_user_id text references operator_users (id),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (assignment_id, work_date)
);

create table if not exists document_files (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  storage_key text not null,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum_sha256 text not null,
  immutable_version integer not null check (immutable_version > 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (organization_id, checksum_sha256, immutable_version)
);

create table if not exists audit_events (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  module_name text not null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_user_id text not null references operator_users (id),
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists outbox_jobs (
  id text primary key,
  organization_id text not null references organizations (id) on delete cascade,
  topic text not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  dedupe_key text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 10 check (max_attempts > 0),
  last_error text,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (organization_id, dedupe_key)
);

create index if not exists idx_sites_client_account on sites (client_account_id);
create index if not exists idx_orders_site_status on orders (site_id, status);
create index if not exists idx_orders_status_slots on orders (status, slots_filled);
create index if not exists idx_assignments_order_status on assignments (order_id, status);
create index if not exists idx_assignments_worker on assignments (worker_id);
create index if not exists idx_workers_deployability on workers (qualification_status, document_readiness, availability_status);
create index if not exists idx_attendance_assignment_status on attendance (assignment_id, status);
create index if not exists idx_audit_events_entity on audit_events (entity_type, entity_id, occurred_at desc);
create index if not exists idx_outbox_jobs_topic_status on outbox_jobs (topic, status, scheduled_at);
