import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저에서 쓰는 수퍼베이스 손잡이.
 * "use client" 붙은 컴포넌트 안에서만 부른다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
