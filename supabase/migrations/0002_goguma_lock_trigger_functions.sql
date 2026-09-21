-- 트리거로만 쓰는 함수다. REST 의 /rpc 로 부를 수 있을 까닭이 없으니 문을 닫는다.
-- (수퍼베이스 security advisor 가 짚어 준 것)

revoke execute on function public.goguma_handle_new_user() from public, anon, authenticated;
revoke execute on function public.goguma_touch_updated_at() from public, anon, authenticated;
