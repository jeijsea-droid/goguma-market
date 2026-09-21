"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCategory, isStatus, parsePrice } from "@/lib/items";

export type ItemFormState = { error?: string };

type Parsed =
  | { ok: true; values: { title: string; body: string; price: number; category: string; region: string } }
  | { ok: false; error: string };

/**
 * 보내기 전에 여기서 한 번 거른다.
 * 데이터베이스에도 똑같은 check 제약을 걸어 두었다 — 화면을 건너뛰고 들어오는 길이 있으므로,
 * 둘 중 하나만 두어서는 안 된다.
 */
function parseItemForm(formData: FormData): Parsed {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const price = parsePrice(String(formData.get("price") ?? ""));

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

  return { ok: true, values: { title, body, price, category, region } };
}

/* ── 내놓기 ─────────────────────────────── */

export async function createItem(
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const parsed = parseItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/items/new");

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

  const parsed = parseItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();

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

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

/* ── 거두기 ─────────────────────────────── */

export async function deleteItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("goguma_items").delete().eq("id", id);

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
