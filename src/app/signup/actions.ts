"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { koAuthError } from "@/lib/auth-errors";

export type SignUpState = { error?: string; ok?: string };

export async function signUp(
  _prev: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = String(formData.get("email") ?? "").trim();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  /* ── 보내기 전에 여기서 한 번 거른다 ── */
  if (!email || !nickname || !password) {
    return { error: "빈 칸이 있습니다." };
  }
  if (nickname.length < 2 || nickname.length > 20) {
    return { error: "닉네임은 2자에서 20자 사이로 적어 주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상으로 해 주세요." };
  }
  if (password !== password2) {
    return { error: "비밀번호 확인이 위와 다릅니다." };
  }
  if (region.length > 40) {
    return { error: "동네 이름이 너무 깁니다." };
  }

  const supabase = await createClient();

  // 닉네임이 이미 있는지 미리 본다.
  // (뒤늦게 데이터베이스가 막아 주기는 하지만, 그 전에 곱게 알려 주는 편이 낫다)
  const { data: taken } = await supabase
    .from("goguma_profiles")
    .select("id")
    .eq("nickname", nickname)
    .maybeSingle();

  if (taken) {
    return { error: "이미 쓰고 있는 닉네임입니다. 다른 이름으로 해 주세요." };
  }

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // 여기 담은 값이 auth.users.raw_user_meta_data 로 들어가고,
      // 데이터베이스 트리거가 그걸 읽어 goguma_profiles 한 줄을 만든다.
      data: { nickname, region },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: koAuthError(error.message) };
  }

  // 이메일 확인이 켜져 있으면 session 이 비어서 온다 — 메일함으로 안내한다.
  if (!data.session) {
    return {
      ok: `${email} 으로 확인 편지를 보냈습니다. 메일함의 링크를 눌러 주세요.`,
    };
  }

  // 확인이 꺼져 있으면 곧바로 로그인된 상태로 들어간다.
  revalidatePath("/", "layout");
  redirect("/");
}
