import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { CookieToSet } from "./cookies";
import { requireSupabaseEnv } from "./env";

/**
 * 서버(서버 컴포넌트 · 서버 액션 · 라우트 핸들러)에서 쓰는 수퍼베이스 손잡이.
 * 로그인 상태는 쿠키에 담겨 오가므로, 요청마다 새로 만들어 써야 한다.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabaseEnv();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 미들웨어가 대신 갱신해 주므로 그냥 넘어간다. */
          }
        },
      },
    }
  );
}
