import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "회원가입 · 고구마마켓" };

export default function SignupPage() {
  return (
    <div className="wrap narrow">
      <TopBar />

      <Masthead
        title="고구마마켓에 들어오기"
        tagline="쓰던 물건에 다음 주인을 찾아 주는 곳"
        stamp="회원가입"
      />

      <section className="panel">
        <div className="panel-head">
          <h2>이메일로 가입</h2>
          <span className="hint">한 사람에 하나</span>
        </div>
        <div className="panel-body">
          <SignupForm />
        </div>
      </section>

      <p className="foot">고구마마켓 · 개발 공부용으로 한 걸음씩</p>
    </div>
  );
}
