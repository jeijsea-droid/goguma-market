-- 고구마마켓 2단계: 거래 글
-- 이 파일은 이미 수퍼베이스에 적용되어 있다 (migration: goguma_items). 기록용으로 남긴다.
--
-- seller_id 가 auth.users 가 아니라 goguma_profiles 를 가리키는 까닭은,
-- PostgREST 가 글과 파는 사람의 닉네임을 한 번에 묶어 내주게 하기 위해서다.
-- (goguma_profiles.id 는 auth.users.id 와 같은 값이라 auth.uid() 로 그대로 견줄 수 있다)

create table if not exists public.goguma_items (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references public.goguma_profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 60),
  body        text not null default '' check (char_length(body) <= 2000),
  price       bigint not null check (price >= 0 and price < 1000000000000),
  category    text not null check (category in (
                '디지털기기','생활가전','가구·인테리어','생활용품','의류','뷰티·미용',
                '도서·티켓','취미·게임','스포츠·레저','유아동','반려동물','식품','기타')),
  region      text not null default '' check (char_length(region) <= 40),
  status      text not null default 'selling' check (status in ('selling','reserved','sold')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.goguma_items is '고구마마켓 거래 글. price 0 은 나눔.';

create index if not exists goguma_items_created_idx  on public.goguma_items (created_at desc);
create index if not exists goguma_items_seller_idx   on public.goguma_items (seller_id);
create index if not exists goguma_items_category_idx on public.goguma_items (category);

alter table public.goguma_items enable row level security;

-- 장터는 손님도 둘러볼 수 있다.
drop policy if exists "goguma_items_select_all" on public.goguma_items;
create policy "goguma_items_select_all"
  on public.goguma_items for select
  to anon, authenticated
  using (true);

-- 내놓기·고치기·거두기는 제 글만.
drop policy if exists "goguma_items_insert_own" on public.goguma_items;
create policy "goguma_items_insert_own"
  on public.goguma_items for insert
  to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "goguma_items_update_own" on public.goguma_items;
create policy "goguma_items_update_own"
  on public.goguma_items for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "goguma_items_delete_own" on public.goguma_items;
create policy "goguma_items_delete_own"
  on public.goguma_items for delete
  to authenticated
  using (auth.uid() = seller_id);

-- updated_at 자동 갱신 (1단계에서 만든 함수를 그대로 쓴다)
drop trigger if exists goguma_items_touch on public.goguma_items;
create trigger goguma_items_touch
  before update on public.goguma_items
  for each row execute function public.goguma_touch_updated_at();
