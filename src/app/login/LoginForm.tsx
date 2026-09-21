"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signIn, type AuthState } from "./actions";
import { SITE_NAME } from "@/lib/site";

const EMPTY: AuthState = {};

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, EMPTY);

  // 리액트 19는 서버 액션이 끝나면 폼을 비운다.
  // 값이 날아가면 곤란한 칸(이메일)만 useState 로 들고 있는다 —
  // 이렇게 붙들어 둔 칸은 비워지지 않는다. 비밀번호는 오히려 비워지는 편이 낫다.
  const [email, setEmail] = useState("");

  return (
    <form action={action}>
      <input type="hidden" name="next" value={next} />

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
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <button className="submit" type="submit" disabled={pending}>
        {pending ? "들어가는 중…" : "로그인"}
      </button>

      <p className="note" role="status" aria-live="polite">
        {state.error ?? ""}
      </p>

      <p className="swap">
        {SITE_NAME}이 처음이신가요? <Link href="/signup">회원가입</Link>
      </p>
    </form>
  );
}
