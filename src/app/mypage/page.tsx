import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, formatPrice, timeAgo, type Status } from "@/lib/items";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "내 정보" };

function ymd(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어가 이미 막아 주지만, 문은 두 번 잠가 둔다.
  if (!user) {
    redirect("/login?next=/mypage");
  }

  const { data: profile } = await supabase
    .from("goguma_profiles")
    .select("nickname, region, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: mineRaw } = await supabase
    .from("goguma_items")
    .select("id,title,price,status,created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const mine = (mineRaw ?? []) as {
    id: string;
    title: string;
    price: number;
    status: Status;
    created_at: string;
  }[];

  return (
    <div className="wrap narrow">
      <TopBar />

      <Masthead
        title="내 정보"
        tagline="문패에 적힌 것들"
        stamp={profile?.nickname ?? "손님"}
      />

      <section className="panel">
        <div className="panel-head">
          <h2>문패</h2>
          <span className="hint">고치기는 다음 단계에</span>
        </div>
        <div className="panel-body">
          <dl className="dl">
            <dt>닉네임</dt>
            <dd>{profile?.nickname ?? "아직 없음"}</dd>

            <dt>이메일</dt>
            <dd>{user.email}</dd>

            <dt>동네</dt>
            <dd>{profile?.region ? profile.region : <span className="muted">아직 적지 않음</span>}</dd>

            <dt>가입한 날</dt>
            <dd>{ymd(profile?.created_at ?? user.created_at)}</dd>

            <dt>회원 번호</dt>
            <dd className="mono">{user.id}</dd>
          </dl>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>내가 내놓은 것</h2>
          <span className="hint">
            <Link className="ghost-btn" href="/items/new">
              물건 내놓기
            </Link>
          </span>
        </div>
        <div className="panel-body">
          {mine.length === 0 ? (
            <p className="empty">아직 내놓은 물건이 없습니다.</p>
          ) : (
            <ul className="mine">
              {mine.map((it) => (
                <li key={it.id}>
                  <Link href={`/items/${it.id}`}>
                    <span className="t">{it.title}</span>
                    <span className="p">{formatPrice(it.price)}</span>
                    <span className={`badge ${it.status}`}>{STATUS_LABEL[it.status]}</span>
                    <span className="w">{timeAgo(it.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>나가기</h2>
        </div>
        <div className="panel-body">
          <p className="lede">
            로그아웃하면 이 기기의 쿠키가 지워집니다. 다른 기기의 로그인은 그대로입니다.
          </p>
          <form action="/auth/signout" method="post">
            <button className="submit" type="submit">
              로그아웃
            </button>
          </form>
        </div>
      </section>

      <p className="foot">{SITE_NAME} · 개발 공부용으로 한 걸음씩</p>
    </div>
  );
}
