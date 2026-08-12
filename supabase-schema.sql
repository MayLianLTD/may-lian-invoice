-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nickname text,
  email text,
  phone text,
  created_at timestamptz default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  number int not null,
  customer_id uuid references customers(id),
  description text,
  amount numeric not null,
  tax_mode text not null, -- 'before' or 'after'
  subtotal numeric not null,
  gst numeric not null,
  total numeric not null,
  paid boolean default false,
  invoice_date date not null default current_date,
  created_at timestamptz default now()
);

-- Allow the app's service role to do everything (default). No RLS needed
-- since we're using the service role key server-side only.
