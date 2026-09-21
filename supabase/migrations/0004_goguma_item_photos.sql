-- 고구마마켓 3단계: 사진 붙이기
--
-- 사진은 표(테이블)가 아니라 "파일 보관함"에 둔다. 수퍼베이스에서는 이걸 스토리지라 부른다.
-- 표에는 사진 자체가 아니라 **보관함 안에서의 자리(경로)** 만 적어 둔다.
--
-- 왜 완성된 http 주소를 적지 않는가:
--   프로젝트 주소가 바뀌거나 보관함 이름을 갈면 적어 둔 주소가 전부 죽는다.
--   경로만 적어 두면 주소는 화면에서 그때그때 만들어 붙이면 된다 (src/lib/photos.ts).

/* ── 1. 보관함 열기 ──────────────────────── */

-- public = true : 주소만 알면 누구나 사진을 볼 수 있다.
--   장터 글은 손님도 둘러보게 해 두었으므로(0003의 select 정책) 사진도 같아야 한다.
--   "아무나 올릴 수 있다"는 뜻은 아니다 — 올리고 지우는 건 아래 정책이 따로 막는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'goguma-item-photos',
  'goguma-item-photos',
  true,
  5242880,                                  -- 한 장에 5MB 까지
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

/* ── 2. 보관함 자물쇠 ────────────────────── */
--
-- 파일 이름을 반드시 '<내 사용자 id>/...' 로 시작하게 해 두고,
-- 첫 칸이 제 id 인 파일만 올리고 지울 수 있게 한다.
-- 그래야 남의 사진을 덮어쓰거나 지우지 못한다.
-- storage.foldername(name) 은 경로를 '/' 로 잘라 배열로 준다. [1] 이 맨 앞 칸.

drop policy if exists "goguma_photos_read_all" on storage.objects;
create policy "goguma_photos_read_all"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'goguma-item-photos');

drop policy if exists "goguma_photos_insert_own" on storage.objects;
create policy "goguma_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'goguma-item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "goguma_photos_update_own" on storage.objects;
create policy "goguma_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'goguma-item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'goguma-item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "goguma_photos_delete_own" on storage.objects;
create policy "goguma_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'goguma-item-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

/* ── 3. 글에 사진 칸 더하기 ──────────────── */
--
-- text[] : 경로를 여러 개 담는 한 칸. 사진을 따로 표로 빼지 않은 까닭은
--   ① 사진은 늘 글과 함께 읽고 함께 지운다 (따로 찾을 일이 없다)
--   ② 늘어놓은 순서가 곧 의미다 — 맨 앞이 대표 사진. 배열은 순서를 그대로 지킨다.
-- 글이 지워지면 이 칸도 같이 사라진다. 다만 보관함의 파일은 따로 지워 주어야 한다.
alter table public.goguma_items
  add column if not exists photos text[] not null default '{}';

comment on column public.goguma_items.photos is
  '보관함(goguma-item-photos) 안에서의 경로들. 맨 앞이 대표 사진. 최대 5장.';

-- 다섯 장까지. 화면에서도 막지만, 화면을 건너뛰고 들어오는 길이 있으므로 여기도 막는다.
alter table public.goguma_items
  drop constraint if exists goguma_items_photos_len;
alter table public.goguma_items
  add constraint goguma_items_photos_len
  check (coalesce(array_length(photos, 1), 0) <= 5);
