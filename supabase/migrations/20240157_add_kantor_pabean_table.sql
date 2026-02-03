-- Create kantor_pabean table
create table public.kantor_pabean (
  id uuid not null default gen_random_uuid(),
  code character varying(20) not null,
  name character varying(255) not null,
  type character varying(20) not null,
  address text null,
  city character varying(100) null,
  province character varying(100) null,
  is_active boolean null default true,
  source character varying(50) null default 'seed_djbc'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint kantor_pabean_pkey primary key (id),
  constraint kantor_pabean_code_key unique (code),
  constraint kantor_pabean_type_check check (
    (type)::text = any (
      (
        array[
          'AIR'::character varying,
          'SEA'::character varying,
          'LAND'::character varying,
          'MIXED'::character varying
        ]
      )::text[]
    )
  )
) tablespace pg_default;

-- Create indexes
create index if not exists idx_kantor_pabean_code 
  on public.kantor_pabean using btree (code) tablespace pg_default;

create index if not exists idx_kantor_pabean_type 
  on public.kantor_pabean using btree (type) tablespace pg_default;

create index if not exists idx_kantor_pabean_active 
  on public.kantor_pabean using btree (is_active) tablespace pg_default;

-- Enable RLS
alter table public.kantor_pabean enable row level security;

-- RLS Policies
create policy "Allow public read access to kantor_pabean"
  on public.kantor_pabean
  for select
  to anon, authenticated
  using (true);

create policy "Allow authenticated users to insert kantor_pabean"
  on public.kantor_pabean
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update kantor_pabean"
  on public.kantor_pabean
  for update
  to authenticated
  using (true)
  with check (true);
