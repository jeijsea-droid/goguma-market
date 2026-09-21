import Link from "next/link";
import GogumaMark from "./GogumaMark";
import { createClient } from "@/lib/supabase/server";

/**
 * 위쪽 길잡이. 서버에서 그리므로 로그인 여부가 처음 그림부터 맞다.
 * 로그아웃은 자바스크립트 없이 form 하나로 /auth/signout 에 POST 한다.
 */
export default async function TopBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nickname: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("goguma_profiles")
      .select("nickname")
      .eq("id", user.id)
      .maybeSingle();
    nickname = data?.nickname ?? null;
  }

  return (
    <div className="topbar">
      <Link className="brand" href="/">
        <GogumaMark />
        고구마마켓
      </Link>

      <span className="spacer" />

      {user ? (
        <>
          <span className="who">
            <b>{nickname ?? user.email}</b> 님
          </span>
          <Link className="ghost-btn" href="/mypage">
            내 정보
          </Link>
          <form action="/auth/signout" method="post">
            <button className="ghost-btn" type="submit">
              로그아웃
            </button>
          </form>
        </>
      ) : (
        <>
          <Link className="ghost-btn" href="/login">
            로그인
          </Link>
          <Link className="ghost-btn" href="/signup">
            회원가입
          </Link>
        </>
      )}
    </div>
  );
}
