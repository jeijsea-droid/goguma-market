"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCategory, isStatus, parsePrice } from "@/lib/items";
import { MAX_PHOTOS, PHOTO_BUCKET, isOwnPhotoPath } from "@/lib/photos";

export type ItemFormState = { error?: string };

type Values = {
  title: string;
  body: string;
  price: number;
  category: string;
  region: string;
  photos: string[];
};

type Parsed = { ok: true; values: Values } | { ok: false; error: string };

/**
 * 보내기 전에 여기서 한 번 거른다.
 * 데이터베이스에도 똑같은 check 제약을 걸어 두었다 — 화면을 건너뛰고 들어오는 길이 있으므로,
 * 둘 중 하나만 두어서는 안 된다.
 */
function parseItemForm(formData: FormData, userId: string): Parsed {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const price = parsePrice(String(formData.get("price") ?? ""));

  // 사진은 숨은 칸 여러 개로 건너온다. getAll 은 적어 넣은 순서 그대로 준다 — 맨 앞이 대표.
  const photos = formData.getAll("photos").map((v) => String(v));

  if (title.length < 2 || title.length > 60) {
    return { ok: false, error: "제목은 2자에서 60자 사이로 적어 주세요." };
  }
  if (!isCategory(category)) {
    return { ok: false, error: "분류를 하나 골라 주세요." };
  }
  if (price === null) {
    return { ok: false, error: "값을 숫자로 적어 주세요. 거저 주실 거면 0." };
  }
  if (body.length > 2000) {
    return { ok: false, error: "설명이 너무 깁니다. 2000자까지." };
  }
  if (region.length > 40) {
    return { ok: false, error: "동네 이름이 너무 깁니다." };
  }
  if (photos.length > MAX_PHOTOS) {
    return { ok: false, error: `사진은 ${MAX_PHOTOS}장까지입니다.` };
  }
  // 내 보관함 칸에 있는 사진만 걸 수 있다. 폼은 누구든 흉내 내어 보낼 수 있으므로 여기서 본다.
  if (photos.some((p) => !isOwnPhotoPath(p, userId))) {
    return { ok: false, error: "내가 올린 사진만 걸 수 있습니다." };
  }

  return { ok: true, values: { title, body, price, category, region, photos } };
}

/**
 * 글에서 빠진 사진을 보관함에서도 치운다.
 *
 * 표에서 경로만 지우면 파일은 보관함에 그대로 남아 자리를 차지한다.
 * 실패해도 글 저장까지 되돌리지는 않는다 — 사진 한 장 남는 것보다 글이 안 고쳐지는 게 더 나쁘다.
 */
async function sweepPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[]
) {
  if (paths.length === 0) return;
  await supabase.storage.from(PHOTO_BUCKET).remove(paths);
}

/* ── 내놓기 ─────────────────────────────── */

export async function createItem(
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/items/new");

  const parsed = parseItemForm(formData, user.id);
  if (!parsed.ok) return { error: parsed.error };

  const { data, error } = await supabase
    .from("goguma_items")
    .insert({ ...parsed.values, seller_id: user.id })
    .select("id")
    .single();

  if (error) return { error: "올리지 못했습니다 — " + error.message };

  revalidatePath("/items");
  redirect(`/items/${data.id}`);
}

/* ── 고치기 ─────────────────────────────── */

export async function updateItem(
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "어느 글인지 알 수 없습니다." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/items/${id}/edit`);

  const parsed = parseItemForm(formData, user.id);
  if (!parsed.ok) return { error: parsed.error };

  // 고치기 전에 걸려 있던 사진을 적어 둔다. 고친 뒤에 빠진 것을 가려내려면 필요하다.
  const { data: before } = await supabase
    .from("goguma_items")
    .select("photos")
    .eq("id", id)
    .maybeSingle();

  // 남의 글은 RLS 가 막아 준다. 막히면 error 가 아니라 "고친 줄 0개"로 돌아오므로 그걸로 가린다.
  const { data, error } = await supabase
    .from("goguma_items")
    .update(parsed.values)
    .eq("id", id)
    .select("id");

  if (error) return { error: "고치지 못했습니다 — " + error.message };
  if (!data || data.length === 0) {
    return { error: "고칠 수 없는 글입니다. 내가 올린 글이 맞는지 확인해 주세요." };
  }

  const dropped = ((before?.photos as string[] | null) ?? []).filter(
    (p) => !parsed.values.photos.includes(p)
  );
  await sweepPhotos(supabase, dropped);

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

/* ── 거두기 ─────────────────────────────── */

export async function deleteItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();

  // 글을 지우면 사진 경로도 같이 사라지므로, 지우기 전에 먼저 적어 둔다.
  const { data: before } = await supabase
    .from("goguma_items")
    .select("photos")
    .eq("id", id)
    .maybeSingle();

  const { data: gone } = await supabase
    .from("goguma_items")
    .delete()
    .eq("id", id)
    .select("id");

  // 정말로 지워졌을 때만 사진을 치운다 (RLS 에 막혀 한 줄도 안 지워졌을 수 있다).
  if (gone && gone.length > 0) {
    await sweepPhotos(supabase, (before?.photos as string[] | null) ?? []);
  }

  revalidatePath("/items");
  redirect("/items");
}

/* ── 팔림·예약 표시 ─────────────────────── */

export async function setItemStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isStatus(status)) return;

  const supabase = await createClient();
  await supabase.from("goguma_items").update({ status }).eq("id", id);

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
}
