/** 거래 글에서 같이 쓰는 목록과 잔손질들. 서버와 브라우저 양쪽에서 부른다. */

/** 분류. 데이터베이스의 check 제약과 같은 줄이어야 한다 (migrations/0003 참고). */
export const CATEGORIES = [
  "디지털기기",
  "생활가전",
  "가구·인테리어",
  "생활용품",
  "의류",
  "뷰티·미용",
  "도서·티켓",
  "취미·게임",
  "스포츠·레저",
  "유아동",
  "반려동물",
  "식품",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}

/** 거래 상태. */
export const STATUS_LABEL = {
  selling: "판매중",
  reserved: "예약중",
  sold: "거래완료",
} as const;

export type Status = keyof typeof STATUS_LABEL;

export function isStatus(v: string): v is Status {
  return v === "selling" || v === "reserved" || v === "sold";
}

export const MAX_PRICE = 1_000_000_000_000;

/** 값을 사람이 읽는 모양으로. 0원은 나눔. */
export function formatPrice(price: number): string {
  return price === 0 ? "나눔" : price.toLocaleString("ko-KR") + "원";
}

/** 천 단위 콤마. 입력칸에서 타이핑할 때마다 쓴다. */
export function withCommas(digits: string): string {
  const only = digits.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
  return only === "" ? "" : Number(only).toLocaleString("ko-KR");
}

/** 적어 넣은 값을 정수로. 못 읽으면 null. */
export function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits === "") return null;
  const n = Number(digits);
  if (!Number.isSafeInteger(n) || n < 0 || n >= MAX_PRICE) return null;
  return n;
}

/** 얼마 전인지. 이레가 넘으면 그냥 날짜로 적는다. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const sec = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (sec < 60) return "방금 전";
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  if (sec < 86400 * 7) return `${Math.floor(sec / 86400)}일 전`;

  return `${then.getFullYear()}. ${then.getMonth() + 1}. ${then.getDate()}.`;
}

/**
 * 검색어에서 ilike 의 와일드카드를 걷어 낸다.
 * 이걸 그대로 흘려보내면 '%' 하나로 글 전부가 걸려 나온다.
 */
export function sanitizeQuery(raw: string): string {
  return raw.replace(/[%_*]/g, "").trim().slice(0, 40);
}
