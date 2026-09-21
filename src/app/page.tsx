import Link from "next/link";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";

export default async function HomePage() {
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
    <div className="wrap">
      <TopBar />

      <Masthead
        title={SITE_NAME}
        tagline="가까운 이웃과 주고받는 중고 장터"
        stamp="캐 가세요"
      />

      <section className="panel">
        <div className="panel-head">
          <h2>{user ? "어서 오세요" : "아직 손님이십니다"}</h2>
          <span className="hint">2단계 · 거래 글까지 됩니다</span>
        </div>

        <div className="panel-body">
          {user ? (
            <>
              <p className="lede">
                <b>{nickname ?? user.email}</b> 님으로 들어와 계십니다. 이 상태는 쿠키에
                담겨 있어, 창을 닫았다 열어도 그대로입니다.
              </p>
              <p style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: 0 }}>
                <Link className="ghost-btn" href="/items">
                  장터 둘러보기
                </Link>
                <Link className="ghost-btn" href="/items/new">
                  물건 내놓기
                </Link>
                <Link className="ghost-btn" href="/mypage">
                  내 정보
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="lede">
                물건을 내놓거나 말을 걸려면 먼저 문패를 달아야 합니다. 이메일 하나면
                됩니다.
              </p>
              <p style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: 0 }}>
                <Link className="ghost-btn" href="/items">
                  장터 둘러보기
                </Link>
                <Link className="ghost-btn" href="/signup">
                  회원가입
                </Link>
                <Link className="ghost-btn" href="/login">
                  로그인
                </Link>
              </p>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>앞으로 낼 자리</h2>
          <span className="hint">한 걸음씩</span>
        </div>
        <div className="panel-body">
          <ul className="soon">
            <li className="done">
              <b>물건 내놓기</b> — 올리고, 고치고, 거두기
              <span className="tag">2단계 · 됨</span>
            </li>
            <li>
              <b>사진 붙이기</b> — 수퍼베이스 스토리지에 올려 걸기
              <span className="tag">3단계</span>
            </li>
            <li>
              <b>찜하기</b> — 마음에 둔 물건 모아 보기
              <span className="tag">4단계</span>
            </li>
            <li>
              <b>말 걸기</b> — 판 사람과 주고받는 쪽지
              <span className="tag">5단계</span>
            </li>
          </ul>
        </div>
      </section>

      <p className="foot">{SITE_NAME} · 가계부와 같은 밭에서 자랍니다</p>
    </div>
  );
}
