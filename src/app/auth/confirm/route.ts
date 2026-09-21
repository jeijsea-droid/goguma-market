import { type EmailOtpType } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safePath } from "@/lib/auth-errors";

/**
 * 가입 확인 편지의 링크가 돌아오는 자리.
 *
 * 수퍼베이스 설정에 따라 두 가지 모양으로 온다 —
 *   ?code=...                 (기본, PKCE)
 *   ?token_hash=...&type=...  (메일 템플릿을 {{ .TokenHash }} 로 바꾼 경우)
 * 둘 다 받아 준다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = safePath(searchParams.get("next"));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      revalidatePath("/", "layout");
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      revalidatePath("/", "layout");
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", request.url));
}
