# 고구마마켓

가까운 이웃과 주고받는 중고 장터. **Next.js(App Router) + Supabase**로 한 걸음씩 짓습니다.
색과 결은 [김부장의 가계부](../가계부)에서 그대로 가져왔습니다 — 같은 가을 산길, 같은 종이 결.

지금은 **1단계: 회원가입 · 로그인 · 로그아웃**까지 되어 있습니다.

## 띄우기

Node.js 24 LTS와 의존성은 이미 깔려 있습니다.

```bash
npm run dev
```

브라우저에서 <http://localhost:3000> 을 엽니다.
(터미널을 새로 열어야 `node` 명령이 잡힙니다 — 설치할 때 PATH가 바뀌었기 때문입니다.)

> `npm run dev`가 돌고 있는 채로 `npm run build`를 하면 안 됩니다. 둘이 `.next` 한 곳을
> 같이 쓰는 바람에 dev 서버가 빈 화면이 됩니다. 그리 되었으면 dev를 끄고 `.next`를 지운 뒤
> 다시 띄우면 됩니다.

## 수퍼베이스

가계부와 **같은 프로젝트**(`xqyuswukuekvvlaycpwf`)를 봅니다. 주소와 키는 `.env.local`에 있습니다.

이 프로젝트는 **이메일 확인이 꺼져 있습니다.** 그래서 가입하면 곧바로 로그인된 상태로
들어옵니다 — 공부하는 동안에는 이편이 편합니다.

나중에 켜고 싶으면 대시보드 → **Authentication** → **Sign In / Providers** → **Email** →
**Confirm email**. 켜도 동작은 합니다. 가입 뒤 "메일함을 확인해 주세요" 안내가 뜨고,
링크를 누르면 `/auth/confirm`이 받습니다. 다만 수퍼베이스 기본 메일은 **시간당 2통**으로
막혀 있으니 시험할 때 답답할 수 있습니다.

### 시험용 계정 하나가 남아 있습니다

1단계를 확인하느라 만든 계정입니다. 지우려면
대시보드 → **Authentication** → **Users** 에서 지우면 됩니다 (프로필 줄도 함께 지워집니다).

```
goguma-test@example.com / ********   (닉네임: 고구마시험)
```

## 어디에 무엇이 있나

| 자리 | 하는 일 |
| --- | --- |
| `src/app/page.tsx` | 첫 화면. 로그인 여부에 따라 다르게 보입니다 |
| `src/app/signup/` | 회원가입 — `actions.ts`(서버)와 `SignupForm.tsx`(입력칸) |
| `src/app/login/` | 로그인 — 같은 얼개 |
| `src/app/mypage/page.tsx` | 내 문패와 내가 내놓은 것들 |
| `src/app/items/page.tsx` | 장터. 분류 거르개와 제목 찾기 |
| `src/app/items/new/` | 물건 내놓기 |
| `src/app/items/[id]/page.tsx` | 글 하나. 주인에게만 고치기·거두기·상태 바꾸기가 보인다 |
| `src/app/items/[id]/edit/` | 글 고치기 |
| `src/app/items/actions.ts` | 올리기·고치기·거두기·상태 바꾸기 (서버 액션) |
| `src/app/items/ItemForm.tsx` | 내놓기와 고치기가 같이 쓰는 입력칸 |
| `src/lib/items.ts` | 분류·상태 목록, 값 표시, 얼마 전인지 |
| `src/app/auth/signout/route.ts` | 로그아웃. form 하나가 POST 합니다 |
| `src/app/auth/confirm/route.ts` | 가입 확인 편지의 링크가 돌아오는 자리 |
| `src/middleware.ts` | 요청마다 토큰을 새로 고치고, 막힌 길을 지킵니다 |
| `src/lib/supabase/` | 브라우저용 · 서버용 · 미들웨어용 손잡이 셋 |
| `src/app/globals.css` | 색 한 벌과 부품들. `:root`만 바꾸면 계절이 바뀝니다 |
| `supabase/migrations/` | 데이터베이스에 올린 것의 기록 (표의 생김새) |
| `supabase/seed/` | 장터를 눈으로 보려고 깔아 둔 샘플 물건 스무 가지 |

### 손잡이가 왜 셋인가

수퍼베이스 로그인 상태는 **쿠키**에 담겨 오갑니다. 쿠키를 읽고 쓰는 방법이
브라우저 · 서버 컴포넌트 · 미들웨어에서 각각 달라서, 자리마다 다른 손잡이를 씁니다.

- `client.ts` — `"use client"` 안에서
- `server.ts` — 서버 컴포넌트 · 서버 액션 · 라우트 핸들러에서 (요청마다 새로 만들 것)
- `middleware.ts` — 토큰 갱신. 이걸 빼면 한 시간쯤 뒤에 저절로 로그아웃된 것처럼 보입니다

## 데이터가 저장되는 곳

가계부와 **한 데이터베이스**를 쓰므로 이름이 겹치지 않게 `goguma_` 접두사를 둡니다.
가계부의 `public.entries`는 건드리지 않습니다.

`public.goguma_profiles`

| 열 | 뜻 |
| --- | --- |
| `id` | `auth.users.id`와 같은 uuid. 회원이 지워지면 함께 지워집니다 |
| `nickname` | 이웃에게 보이는 이름. 2~20자, 겹칠 수 없음 |
| `region` | 동네 |
| `avatar_url` | 사진 (아직 안 씀) |
| `created_at` / `updated_at` | 만든 때 / 고친 때 |

가입하면 `auth.users`에 줄이 하나 생기고, 트리거 `on_auth_user_created_goguma`가
곧바로 프로필 한 줄을 따라 만듭니다. 닉네임이 이미 있으면 뒤에 숫자를 붙여 비켜 가므로
가입 자체가 실패하지는 않습니다.

RLS는 이렇게 좁혀 두었습니다 — **읽기는 누구나**(거래 상대의 닉네임이 보여야 하므로),
**쓰기와 고치기는 제 것만**(`auth.uid() = id`).

`public.goguma_items`

| 열 | 뜻 |
| --- | --- |
| `id` | uuid |
| `seller_id` | 올린 사람. `goguma_profiles.id`를 가리킵니다 |
| `title` | 제목. 2~60자 |
| `body` | 설명. 2000자까지 |
| `price` | 값 (원, 정수). **0은 나눔** |
| `category` | 분류 열세 가지 중 하나 |
| `region` | 만나서 주고받을 동네 |
| `status` | `selling` / `reserved` / `sold` |
| `created_at` / `updated_at` | 올린 때 / 고친 때 |

`seller_id`가 `auth.users`가 아니라 `goguma_profiles`를 가리키는 까닭이 있습니다.
그래야 PostgREST가 글과 파는 사람의 닉네임을 **한 번에 묶어** 내줍니다
(`select("...,seller:goguma_profiles(nickname)")`). 두 테이블의 `id`는 같은 값이라
`auth.uid() = seller_id`로 견주는 데도 지장이 없습니다.

장터는 **손님도 둘러볼 수 있고**, 내놓기·고치기·거두기는 **제 글만** 됩니다.
확인해 두었습니다 — 로그인 없이 `goguma_items`에 글을 밀어 넣으면 `401`과 함께
`new row violates row-level security policy`로 막힙니다.

## 배포

가계부와는 **다른 주소**로 따로 올립니다. Vercel에 올릴 때 환경변수 두 개를 같이 넣어 주세요.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

두 값 모두 브라우저로 실려 나가는 **공개 값**입니다. 데이터를 지키는 것은 키가 아니라
위의 RLS 규칙입니다. `service_role` 키는 절대 이 프로젝트에 두지 마세요.

배포 주소가 정해지면 수퍼베이스 대시보드의
**Authentication → URL Configuration → Redirect URLs**에 그 주소를 더해야
가입 확인 링크가 제대로 돌아옵니다.

## 다음 단계

1. ~~회원가입 · 로그인 · 로그아웃~~
2. ~~거래 글 — 올리기 · 둘러보기 · 고치기 · 거두기 · 상태 바꾸기~~ ← 지금 여기
3. 사진 붙이기 — 수퍼베이스 스토리지에 올려 걸기
4. 찜하기
5. 말 걸기 — 판 사람과 주고받는 쪽지

### 2단계에서 걸렸던 것 하나

한 `<form>` 안에 `name="status"`를 단 submit 버튼을 여럿 두고 누른 것만 골라 받는,
흔히 쓰는 수법이 여기서는 통하지 않았습니다. **리액트의 서버 액션 폼은 FormData에
누른 버튼의 `name`/`value`를 담아 주지 않습니다.** 서버에서는 `status`가 빈 문자열로
건너와 아무 일도 일어나지 않았습니다. 상태마다 폼을 따로 두고 `<input type="hidden">`으로
값을 실어 보내는 것으로 고쳤습니다 — 자바스크립트 없이도 도는 건 덤입니다.
