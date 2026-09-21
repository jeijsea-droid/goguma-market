import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL, formatPrice, timeAgo, type Status } from "@/lib/items";
import DeleteItemButton from "../DeleteItemButton";
import { setItemStatus } from "../actions";

const FIELDS =
  "id,seller_id,title,body,price,category,region,status,created_at,updated_at,seller:goguma_profiles(nickname)";

type Item = {
  id: string;
  seller_id: string;
  title: string;
  body: string;
  price: number;
  category: string;
  region: string;
  status: Status;
  created_at: string;
  updated_at: string;
  seller: { nickname: string } | null;
};

async function getItem(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("goguma_items").select(FIELDS).eq("id", id).maybeSingle();
  return data as unknown as Item | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  return { title: item ? item.title : "없는 글" };
}

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const item = await getItem(id);
  if (!item) notFound();

  const mine = user?.id === item.seller_id;
  const edited = item.updated_at !== item.created_at;

  return (
    <div className="wrap narrow">
      <TopBar />

      <Masthead
        title={item.title}
        tagline={`${item.category}${item.region ? " · " + item.region : ""}`}
        stamp={STATUS_LABEL[item.status]}
      />

      <section className="panel">
        <div className="panel-head">
          <h2>{formatPrice(item.price)}</h2>
          <span className="hint">
            {item.seller?.nickname ?? "탈퇴한 이웃"} · {timeAgo(item.created_at)}
            {edited ? " (고침)" : ""}
          </span>
        </div>

        <div className="panel-body">
          {item.body ? (
            <p className="item-body">{item.body}</p>
          ) : (
            <p className="empty">적어 둔 설명이 없습니다.</p>
          )}
        </div>
      </section>

      {mine ? (
        <section className="panel">
          <div className="panel-head">
            <h2>내가 올린 글</h2>
          </div>
          <div className="panel-body">
            <span className="lab">거래 상태</span>
            {/*
              상태마다 폼을 따로 둔다. 한 폼 안에 name/value 를 단 submit 버튼 여럿을
              두는 흔한 수법은 여기서 통하지 않는다 — 리액트의 서버 액션 폼은 FormData 에
              누른 버튼의 name/value 를 담아 주지 않아서, status 가 빈 채로 건너온다.
            */}
            <div className="cats" style={{ marginBottom: 16 }}>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <form key={s} action={setItemStatus}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="status" value={s} />
                  <button type="submit" aria-pressed={item.status === s}>
                    {STATUS_LABEL[s]}
                  </button>
                </form>
              ))}
            </div>

            <div className="row">
              <Link className="ghost-btn" href={`/items/${item.id}/edit`}>
                고치기
              </Link>
              <DeleteItemButton id={item.id} />
            </div>
          </div>
        </section>
      ) : null}

      <p className="foot">
        <Link href="/items">← 장터로 돌아가기</Link>
      </p>
    </div>
  );
}
