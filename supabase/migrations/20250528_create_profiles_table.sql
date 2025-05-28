create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text,
  address text,
  tax_id text,
  email text,
  phone text,
  bank_name text,
  bank_account text,
  bank_iban text,
  bank_bic text,
  logo_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create or replace function public.delete_user_account()
returns void as $$
begin
  delete from public.profiles where user_id = auth.uid();
  delete from public.invoices where user_id = auth.uid();
  delete from public.customers where user_id = auth.uid();
  
  return;
end;
$$ language plpgsql security definer;

comment on function public.delete_user_account is 'Allows users to delete their account data';
