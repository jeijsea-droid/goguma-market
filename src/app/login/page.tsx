import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { safePath } from "@/lib/auth-errors";
import LoginForm from "./LoginForm";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "로그인" };

const NOTICES: Record<string, string> = {
  confirm: "확인 링크가 만료되었거나 이미 쓰인 링크입니다. 다시 가입하거나 로그인해 주세요.",
  session: "로그인이 풀렸습니다. 다시 들어와 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; ok?: string }>;
}) {
  const sp = await searchParams;
  const next = safePath(sp.next);
  const notice = sp.error ? NOTICES[sp.error] : undefined;

  return (
    <div className="wrap narrow">
      <TopBar />

      <Masthead
        title="다시 오셨군요"
        tagline="한 번 들어오면 이 기기는 기억해 둡니다"
        stamp="로그인"
      />

      <section className="panel">
        <div className="panel-head">
          <h2>이메일로 로그인</h2>
        </div>
        <div className="panel-body">
          {sp.ok === "confirmed" ? (
            <p className="note ok">이메일 확인이 끝났습니다. 이제 로그인하실 수 있습니다.</p>
          ) : null}
          {notice ? <p className="note">{notice}</p> : null}

          <LoginForm next={next} />
        </div>
      </section>

      <p className="foot">{SITE_NAME} · 개발 공부용으로 한 걸음씩</p>
    </div>
  );
}
