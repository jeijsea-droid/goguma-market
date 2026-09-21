/**
 * 물건 사진에서 같이 쓰는 값과 잔손질들.
 *
 * 사진 파일은 데이터베이스가 아니라 수퍼베이스의 **파일 보관함(스토리지)** 에 쌓인다.
 * 표에는 파일 자체가 아니라 보관함 안에서의 자리(경로)만 적어 둔다.
 * 자세한 까닭은 supabase/migrations/0004_goguma_item_photos.sql 참고.
 */

import { requireSupabaseEnv } from "./supabase/env";

/** 보관함 이름. 0004 migration 에서 연 것과 같아야 한다. */
export const PHOTO_BUCKET = "goguma-item-photos";

/** 한 글에 붙일 수 있는 장 수. 데이터베이스의 check 제약과 같은 수여야 한다. */
export const MAX_PHOTOS = 5;

/** 한 장의 크기. 보관함에도 같은 값을 걸어 두었다. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** 받아 주는 사진 종류. <input accept> 와 보관함 설정에 함께 쓴다. */
export const PHOTO_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const PHOTO_ACCEPT = Object.keys(PHOTO_MIME).join(",");

/**
 * 보관함 경로를 브라우저가 읽을 수 있는 주소로.
 *
 * 보관함을 public 으로 열어 두었기 때문에 이 주소는 서명이나 토큰 없이 그냥 열린다.
 * 주소를 표에 적어 두지 않고 여기서 매번 만드는 까닭은, 프로젝트 주소가 바뀌어도
 * 적어 둔 글들이 멀쩡하도록 하기 위해서다.
 */
export function photoUrl(path: string): string {
  const { url } = requireSupabaseEnv();
  return `${url}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

/**
 * 올릴 파일에 붙일 새 경로. 반드시 '<내 사용자 id>/' 로 시작해야 한다 —
 * 보관함 자물쇠(RLS)가 첫 칸이 제 id 가 아니면 받아 주지 않는다.
 *
 * 파일 이름은 원래 이름을 쓰지 않고 새로 지어 준다. 한글·공백·같은 이름끼리
 * 부딪히는 일을 한 번에 없애기 위해서다.
 */
export function newPhotoPath(userId: string, mime: string): string | null {
  const ext = PHOTO_MIME[mime];
  if (!ext) return null;
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}

/**
 * 폼으로 건너온 경로가 진짜 "내가 올린 사진의 자리" 모양인지 본다.
 *
 * 화면에서 고른 것만 건너오는 게 보통이지만, 폼은 누구든 흉내 내어 보낼 수 있다.
 * 남의 id 로 시작하는 경로를 적어 넣어 남의 사진을 제 글에 걸어 두는 일을 막는다.
 */
const PATH_SHAPE =
  /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i;

export function isOwnPhotoPath(path: string, userId: string): boolean {
  return PATH_SHAPE.test(path) && path.startsWith(userId + "/");
}

/** 크기가 넘치는지. 넘치면 사람 말로 된 까닭을 돌려준다. */
export function photoRejectReason(file: File): string | null {
  if (!PHOTO_MIME[file.type]) {
    return `${file.name} — jpg·png·webp·gif 만 올릴 수 있습니다.`;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `${file.name} — 한 장에 5MB 까지입니다 (이 사진은 ${mb}MB).`;
  }
  return null;
}
