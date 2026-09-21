import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import ItemForm from "../../ItemForm";
import { updateItem } from "../../actions";

export const metadata: Metadata = { title: "글 고치기" };

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/items/${id}/edit`);

  const { data: item } = await supabase
    .from("goguma_items")
    .select("id,seller_id,title,body,price,category,region")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();

  // 남의 글은 RLS 가 고치지 못하게 막지만, 애초에 펴 보이지도 않는 편이 낫다.
  if (item.seller_id !== user.id) {
    return (
      <div className="wrap narrow">
        <TopBar />
        <Masthead title="고칠 수 없습니다" tagline="내가 올린 글만 고칠 수 있어요" stamp="남의 글" />
        <section className="panel">
          <div className="panel-body">
            <p className="lede">이 글은 다른 이웃이 올린 것입니다.</p>
            <Link className="ghost-btn" href={`/items/${id}`}>
              글 보러 가기
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="wrap narrow">
      <TopBar />

      <Masthead title="글 고치기" tagline="적어 둔 것을 다시 매만집니다" stamp="고치기" />

      <section className="panel">
        <div className="panel-head">
          <h2>무엇을 고칠까요</h2>
        </div>
        <div className="panel-body">
          <ItemForm
            action={updateItem}
            itemId={item.id}
            initial={{
              title: item.title,
              body: item.body,
              price: item.price,
              category: item.category,
              region: item.region,
            }}
            submitLabel="고친 대로 올리기"
            pendingLabel="고치는 중…"
          />
        </div>
      </section>

      <p className="foot">
        <Link href={`/items/${item.id}`}>← 글로 돌아가기</Link>
      </p>
    </div>
  );
}
