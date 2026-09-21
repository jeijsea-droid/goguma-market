/**
 * 수퍼베이스 주소와 공개 키를 읽어 오는 곳.
 *
 * 로컬에서는 `.env.local`, 배포(Vercel)에서는 프로젝트 설정의 환경변수에서 옵니다.
 * 둘 중 하나라도 비면 수퍼베이스 손잡이를 만들 수 없어 사이트 전체가 멈추므로,
 * "무엇이 없어서 멈췄는지"를 여기 한 곳에 적어 두고 다 같이 씁니다.
 *
 * NEXT_PUBLIC_ 으로 시작하는 값은 **빌드할 때 코드에 박힙니다.** 그래서 Vercel 에
 * 값을 넣기만 하고 다시 배포하지 않으면 여전히 빈 채로 돕니다.
 */

export type SupabaseEnv = { url: string; key: string };

export const ENV_NAMES = {
  url: "NEXT_PUBLIC_SUPABASE_URL",
  key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
} as const;

/** 없으면 null. 미들웨어는 이걸 보고 까닭을 적은 화면을 내준다. */
export function readSupabaseEnv(): SupabaseEnv | null {
  // 아래 두 줄은 반드시 process.env.NEXT_PUBLIC_... 모양 그대로여야 한다.
  // 변수에 담아 돌려 쓰면 빌드할 때 값이 박히지 않는다.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return url && key ? { url, key } : null;
}

/** 무엇이 없는지 사람 말로. */
export function missingEnvMessage(): string {
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && ENV_NAMES.url,
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && ENV_NAMES.key,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `수퍼베이스 설정이 없습니다 — ${missing}`,
    "",
    "· 내 컴퓨터에서 띄우는 중이라면: 프로젝트 맨 위의 .env.local 에 두 줄을 넣고 개발 서버를 다시 띄우세요.",
    "· Vercel 에 올린 것이라면: Settings → Environment Variables 에 두 값을 넣은 뒤,",
    "  Deployments 에서 맨 위 배포의 ⋯ → Redeploy 를 눌러 다시 배포해야 합니다.",
    "",
    "NEXT_PUBLIC_ 으로 시작하는 값은 빌드할 때 코드에 박히므로, 넣기만 하고 재배포하지 않으면 반영되지 않습니다.",
  ].join("\n");
}

/** 없으면 던진다. 서버·브라우저 손잡이는 이쪽을 쓴다. */
export function requireSupabaseEnv(): SupabaseEnv {
  const env = readSupabaseEnv();
  if (!env) throw new Error(missingEnvMessage());
  return env;
}
