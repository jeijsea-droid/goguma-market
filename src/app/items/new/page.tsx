import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import ItemForm from "../ItemForm";
import { createItem } from "../actions";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "물건 내놓기" };

export default async function NewItemPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어가 이미 막아 주지만, 문은 두 번 잠가 둔다.
  if (!user) redirect("/login?next=/items/new");

  // 가입할 때 적어 둔 동네를 미리 채워 준다.
  const { data: profile } = await supabase
    .from("goguma_profiles")
    .select("region")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="wrap narrow">
      <TopBar />

      <Masthead
        title="물건 내놓기"
        tagline="다음 주인을 기다리는 것 하나"
        stamp="새 글"
      />

      <section className="panel">
        <div className="panel-head">
          <h2>무엇을 내놓으시나요</h2>
        </div>
        <div className="panel-body">
          <ItemForm
            action={createItem}
            initial={{
              title: "",
              body: "",
              price: null,
              category: "",
              region: profile?.region ?? "",
            }}
            submitLabel="장터에 올리기"
            pendingLabel="올리는 중…"
          />
        </div>
      </section>

      <p className="foot">{SITE_NAME} · 사진은 다음 단계에 붙습니다</p>
    </div>
  );
}
