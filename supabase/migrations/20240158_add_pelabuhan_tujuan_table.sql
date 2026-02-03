-- Create pelabuhan_tujuan table
create table public.pelabuhan_tujuan (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) not null unique,
  name varchar(255) not null,
  country_id uuid references countries(id),
  type varchar(20) default 'SEA',
  kantor_pabean_id uuid not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  source varchar(50) default 'seed_unlocode'
);

-- Add foreign key constraint to kantor_pabean
alter table pelabuhan_tujuan
  add constraint pelabuhan_tujuan_kantor_pabean_id_fkey
  foreign key (kantor_pabean_id)
  references kantor_pabean(id)
  on update cascade
  on delete restrict;

-- Create indexes
create index if not exists idx_pelabuhan_tujuan_code 
  on public.pelabuhan_tujuan using btree (code);

create index if not exists idx_pelabuhan_tujuan_type 
  on public.pelabuhan_tujuan using btree (type);

create index if not exists idx_pelabuhan_tujuan_active 
  on public.pelabuhan_tujuan using btree (is_active);

create index if not exists idx_pelabuhan_tujuan_kantor_pabean 
  on public.pelabuhan_tujuan using btree (kantor_pabean_id);

-- Enable RLS
alter table public.pelabuhan_tujuan enable row level security;

-- RLS Policies
create policy "Allow public read access to pelabuhan_tujuan"
  on public.pelabuhan_tujuan
  for select
  to anon, authenticated
  using (true);

create policy "Allow authenticated users to insert pelabuhan_tujuan"
  on public.pelabuhan_tujuan
  for insert
  to authenticated
  with check (true);

create policy "Allow authenticated users to update pelabuhan_tujuan"
  on public.pelabuhan_tujuan
  for update
  to authenticated
  using (true)
  with check (true);
