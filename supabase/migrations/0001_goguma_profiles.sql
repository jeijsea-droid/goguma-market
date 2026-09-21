-- 고구마마켓 1단계: 회원 프로필
-- 가계부(public.entries)와 같은 데이터베이스를 쓰므로, 이름이 겹치지 않도록 goguma_ 접두사를 둔다.
-- 이 파일은 이미 수퍼베이스에 적용되어 있다 (migration: goguma_profiles). 기록용으로 남긴다.

create table if not exists public.goguma_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null unique check (char_length(nickname) between 2 and 20),
  region      text not null default '' check (char_length(region) <= 40),
  avatar_url  text check (avatar_url is null or char_length(avatar_url) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.goguma_profiles is '고구마마켓 회원 프로필. auth.users 한 줄에 프로필 한 줄이 따라붙는다.';

alter table public.goguma_profiles enable row level security;

-- 닉네임은 거래 상대에게 보여야 하므로 누구나 읽을 수 있다.
drop policy if exists "goguma_profiles_select_all" on public.goguma_profiles;
create policy "goguma_profiles_select_all"
  on public.goguma_profiles for select
  to anon, authenticated
  using (true);

-- 고치는 것은 제 것만.
drop policy if exists "goguma_profiles_insert_own" on public.goguma_profiles;
create policy "goguma_profiles_insert_own"
  on public.goguma_profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "goguma_profiles_update_own" on public.goguma_profiles;
create policy "goguma_profiles_update_own"
  on public.goguma_profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- updated_at 자동 갱신
create or replace function public.goguma_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists goguma_profiles_touch on public.goguma_profiles;
create trigger goguma_profiles_touch
  before update on public.goguma_profiles
  for each row execute function public.goguma_touch_updated_at();

-- 가입하면 프로필 한 줄이 저절로 생긴다.
-- 닉네임이 이미 있으면 뒤에 숫자를 붙여 비켜 간다 (가입 자체가 실패하지 않도록).
create or replace function public.goguma_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  base      text;
  candidate text;
  n         int := 0;
begin
  base := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''), split_part(new.email, '@', 1));
  base := left(base, 20);
  if char_length(base) < 2 then
    base := base || '이웃';
  end if;

  candidate := base;
  while exists (select 1 from public.goguma_profiles p where p.nickname = candidate) loop
    n := n + 1;
    candidate := left(base, 17) || n::text;
  end loop;

  insert into public.goguma_profiles (id, nickname, region)
  values (new.id, candidate, coalesce(btrim(new.raw_user_meta_data ->> 'region'), ''))
  on conflict (id) do nothing;

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created_goguma on auth.users;
create trigger on_auth_user_created_goguma
  after insert on auth.users
  for each row execute function public.goguma_handle_new_user();
