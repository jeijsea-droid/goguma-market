import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 로그아웃. 위쪽 길잡이의 form 이 여기로 POST 한다.
 * 라우트 핸들러 안에서는 쿠키를 지울 수 있으므로, signOut() 한 번이면 끝난다.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  // 브라우저가 들고 있던 옛 화면(로그인한 모습)을 버리게 한다.
  revalidatePath("/", "layout");

  // 303 이라야 브라우저가 POST 를 GET 으로 바꿔 따라간다.
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
