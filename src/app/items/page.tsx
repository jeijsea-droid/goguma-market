import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORIES,
  STATUS_LABEL,
  formatPrice,
  isCategory,
  sanitizeQuery,
  timeAgo,
  type Status,
} from "@/lib/items";

export const metadata: Metadata = { title: "장터 · 고구마마켓" };

type Row = {
  id: string;
  title: string;
  price: number;
  category: string;
  region: string;
  status: Status;
  created_at: string;
  seller: { nickname: string } | null;
};

/** 고른 분류·검색어를 지우지 않고 주소만 갈아 끼운다. */
function href(cat: string | null, q: string) {
  const sp = new URLSearchParams();
  if (cat) sp.set("cat", cat);
  if (q) sp.set("q", q);
  const s = sp.toString();
  return s ? `/items?${s}` : "/items";
}

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat && isCategory(sp.cat) ? sp.cat : null;
  const q = sanitizeQuery(sp.q ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("goguma_items")
    .select("id,title,price,category,region,status,created_at,seller:goguma_profiles(nickname)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (cat) query = query.eq("category", cat);
  if (q) query = query.ilike("title", `%${q}%`);

  const { data, error } = await query;
  const items = (data ?? []) as unknown as Row[];

  return (
    <div className="wrap">
      <TopBar />

      <Masthead
        title="장터"
        tagline="이웃이 내놓은 것들"
        stamp={`${items.length}가지`}
      />

      <section className="panel">
        <div className="panel-head">
          <h2>둘러보기</h2>
          <span className="hint">
            {user ? (
              <Link className="ghost-btn" href="/items/new">
                물건 내놓기
              </Link>
            ) : (
              <Link className="ghost-btn" href="/login?next=/items/new">
                로그인하고 내놓기
              </Link>
            )}
          </span>
        </div>

        <div className="panel-body">
          <form className="filters" action="/items" method="get">
            {cat ? <input type="hidden" name="cat" value={cat} /> : null}
            <div className="search">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="제목으로 찾기"
                aria-label="제목으로 찾기"
                maxLength={40}
              />
            </div>
            <button className="ghost-btn" type="submit">찾기</button>
            {q ? (
              <Link className="ghost-btn" href={href(cat, "")}>
                검색 지우기
              </Link>
            ) : null}
          </form>

          <div className="cats" style={{ marginTop: 12 }}>
            <Link
              className={cat === null ? "chip-on" : undefined}
              href={href(null, q)}
            >
              전체
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                className={cat === c ? "chip-on" : undefined}
                href={href(c, q)}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <section className="panel">
          <div className="panel-body">
            <p className="note">장터를 펴지 못했습니다 — {error.message}</p>
          </div>
        </section>
      ) : items.length === 0 ? (
        <section className="panel">
          <div className="panel-body">
            <p className="empty">
              {q || cat ? "여기 걸리는 물건이 아직 없습니다." : "아직 아무도 내놓지 않았습니다."}
            </p>
          </div>
        </section>
      ) : (
        <ul className="items">
          {items.map((it) => (
            <li key={it.id}>
              <Link className="item-card" href={`/items/${it.id}`}>
                <div className="item-top">
                  <h3>{it.title}</h3>
                  {it.status === "selling" ? null : (
                    <span className={`badge ${it.status}`}>{STATUS_LABEL[it.status]}</span>
                  )}
                </div>
                <p className="price">{formatPrice(it.price)}</p>
                <p className="meta">
                  <span>{it.category}</span>
                  {it.region ? <span>{it.region}</span> : null}
                  <span>{it.seller?.nickname ?? "탈퇴한 이웃"}</span>
                  <span>{timeAgo(it.created_at)}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="foot">고구마마켓 · 최근 것부터 예순 개까지 보입니다</p>
    </div>
  );
}
