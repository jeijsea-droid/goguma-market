import type { CookieOptions } from "@supabase/ssr";

/**
 * setAll 이 받아 드는 쿠키 한 장의 모양.
 *
 * @supabase/ssr 의 cookies 옵션은 "옛 방식(get/set/remove)"과 "새 방식(getAll/setAll)"의
 * 합집합 타입이다. 합집합이라 타입스크립트가 어느 쪽인지 스스로 고르지 못하고,
 * strict 모드에서는 인자가 any 로 새어 버린다. 그래서 여기 한 번 적어 두고 같이 쓴다.
 */
export type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};
