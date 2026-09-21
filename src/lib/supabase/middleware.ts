import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { CookieToSet } from "./cookies";
import { missingEnvMessage, readSupabaseEnv } from "./env";

/** 로그인해야 들어갈 수 있는 길. 앞으로 /chat 이 늘어나면 여기에 적는다. */
const PROTECTED = ["/mypage", "/items/new"];

/** 가운데에 글 번호가 끼는 길은 모양으로 가린다 — /items/<id>/edit */
const PROTECTED_SHAPES = [/^\/items\/[^/]+\/edit\/?$/];

/** 로그인한 사람이 다시 올 까닭이 없는 길. */
const GUEST_ONLY = ["/login", "/signup"];

/**
 * 요청이 올 때마다 로그인 토큰을 새로 고치고, 갱신된 쿠키를 응답에 실어 보낸다.
 * 이걸 빼먹으면 한 시간쯤 뒤에 저절로 로그아웃된 것처럼 보인다.
 */
export async function updateSession(request: NextRequest) {
  // 미들웨어는 모든 길목을 지나므로, 여기서 터지면 사이트 전체가 까닭 모를 500 이 된다.
  // 설정이 비었을 때만은 던지지 말고, 무엇을 어디에 넣어야 하는지 적어 내준다.
  const env = readSupabaseEnv();
  if (!env) {
    return new NextResponse(missingEnvMessage(), {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.url,
    env.key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()는 수퍼베이스 서버에 되물어 확인한다. 쿠키만 믿는 getSession()보다 안전하다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const needsLogin =
    PROTECTED.some((p) => path === p || path.startsWith(p + "/")) ||
    PROTECTED_SHAPES.some((re) => re.test(path));

  if (!user && needsLogin) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.search = "";
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }

  if (user && GUEST_ONLY.includes(path)) {
    const to = request.nextUrl.clone();
    to.pathname = "/";
    to.search = "";
    return NextResponse.redirect(to);
  }

  return response;
}
