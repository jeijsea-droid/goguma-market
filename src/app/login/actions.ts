"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { koAuthError, safePath } from "@/lib/auth-errors";

export type AuthState = { error?: string; ok?: string };

/**
 * 서버 액션. 브라우저가 아니라 서버에서 로그인하므로
 * 토큰이 자바스크립트가 닿는 곳에 남지 않고 httpOnly 쿠키로만 오간다.
 */
export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safePath(formData.get("next"));

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 적어 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: koAuthError(error.message) };
  }

  // 위쪽 길잡이가 들고 있던 "손님" 상태를 걷어 낸다.
  revalidatePath("/", "layout");
  redirect(next);
}
