"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signUp, type SignUpState } from "./actions";

const EMPTY: SignUpState = {};

export default function SignupForm() {
  const [state, action, pending] = useActionState(signUp, EMPTY);

  // 리액트 19는 서버 액션이 끝나면 폼을 비운다.
  // 다시 적기 번거로운 칸은 useState 로 붙들어 둔다 (붙들린 칸은 비워지지 않는다).
  // 비밀번호는 그대로 두어 실패할 때마다 새로 치게 한다.
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState("");

  // 편지를 보낸 뒤에는 입력칸 대신 안내만 남긴다.
  if (state.ok) {
    return (
      <div className="slip">
        <h3>메일함을 확인해 주세요</h3>
        <p>{state.ok}</p>
        <p className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>
          링크를 누르면 확인이 끝나고 로그인 화면으로 돌아옵니다.
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="nickname">닉네임</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          minLength={2}
          maxLength={20}
          autoComplete="nickname"
          placeholder="감자밭농부"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />
        <p className="help">거래할 때 이웃에게 보이는 이름입니다. 2~20자.</p>
      </div>

      <div className="field">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="goguma@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="region">동네 (나중에 바꿀 수 있어요)</label>
        <input
          id="region"
          name="region"
          type="text"
          maxLength={40}
          placeholder="서울 강남구 역삼동"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
        <p className="help">8자 이상.</p>
      </div>

      <div className="field">
        <label htmlFor="password2">비밀번호 확인</label>
        <input
          id="password2"
          name="password2"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </div>

      <button className="submit" type="submit" disabled={pending}>
        {pending ? "밭을 고르는 중…" : "고구마마켓 시작하기"}
      </button>

      <p className="note" role="status" aria-live="polite">
        {state.error ?? ""}
      </p>

      <p className="swap">
        이미 회원이신가요? <Link href="/login">로그인</Link>
      </p>
    </form>
  );
}
