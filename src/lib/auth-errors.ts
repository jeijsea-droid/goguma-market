/** 수퍼베이스가 영어로 돌려주는 까닭을 사람 말로 옮긴다. */
export function koAuthError(message: string): string {
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "이메일이나 비밀번호가 맞지 않습니다.";
  }
  if (m.includes("email not confirmed")) {
    return "아직 이메일 확인이 끝나지 않았습니다. 메일함의 링크를 먼저 눌러 주세요.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  }
  if (m.includes("password should be at least")) {
    return "비밀번호가 너무 짧습니다.";
  }
  if (m.includes("invalid email") || m.includes("unable to validate email")) {
    return "이메일 주소를 다시 확인해 주세요.";
  }
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many")) {
    return "너무 잦은 요청입니다. 잠시 뒤에 다시 해 주세요.";
  }
  if (m.includes("signups not allowed")) {
    return "지금은 가입을 받지 않습니다.";
  }
  if (m.includes("database error")) {
    return "가입 중에 데이터베이스가 걸렸습니다. 닉네임을 바꿔 다시 해 보세요.";
  }

  return "잘 되지 않았습니다 — " + message;
}

/** 열린 리다이렉트를 막는다. 우리 사이트 안의 길만 통과. */
export function safePath(raw: unknown, fallback = "/"): string {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}
