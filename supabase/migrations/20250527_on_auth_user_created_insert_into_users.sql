create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (uuid, email, first_name, last_name)
  values (new.id, new.email, 
          coalesce((new.raw_user_meta_data->>'name')::text, '')::text, 
          '')
  on conflict (uuid) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_insert_into_users on auth.users;
create trigger on_auth_user_created_insert_into_users
after insert on auth.users
for each row execute procedure public.handle_new_user();

comment on trigger on_auth_user_created_insert_into_users on auth.users is 
  'Automatically creates a public.users record when a new auth.users record is created';
