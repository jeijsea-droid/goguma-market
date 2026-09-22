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

/**
 * 분류마다 붙이는 영문 이름표.
 *
 * 색을 입히려면 CSS 가 "이 카드는 어느 분류인가"를 알아야 하는데,
 * 한글이나 가운뎃점(·)을 CSS 선택자에 그대로 쓰면 다루기 번거롭다.
 * 그래서 화면에는 한글을 쓰되, 색을 고르는 열쇠로는 이 영문 이름표를 쓴다.
 * 실제 색은 globals.css 의 [data-cat="..."] 한 곳에 모여 있다.
 */
export const CATEGORY_SLUG: Record<Category, string> = {
  "디지털기기": "digital",
  "생활가전": "appliance",
  "가구·인테리어": "furniture",
  "생활용품": "household",
  "의류": "clothes",
  "뷰티·미용": "beauty",
  "도서·티켓": "book",
  "취미·게임": "hobby",
  "스포츠·레저": "sports",
  "유아동": "kids",
  "반려동물": "pet",
  "식품": "food",
  "기타": "etc",
};

/** 분류 이름으로 이름표를 찾는다. 모르는 값이면 '기타'의 것을 준다. */
export function categorySlug(name: string): string {
  return isCategory(name) ? CATEGORY_SLUG[name] : CATEGORY_SLUG["기타"];
}

/** 거래 상태. */
export const STATUS_LABEL = {
  selling: "판매중",
  reserved: "예약중",
  sold: "거래완료",
} as const;

export type Status = keyof typeof STATUS_LABEL;

/** 세어서 보여 줄 때의 차례. 팔고 있는 것이 먼저다. */
export const STATUS_ORDER = ["selling", "reserved", "sold"] as const;

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
