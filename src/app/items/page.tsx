import type { Metadata } from "next";
import Link from "next/link";
import GogumaMark from "@/components/GogumaMark";
import Masthead from "@/components/Masthead";
import TopBar from "@/components/TopBar";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORIES,
  STATUS_LABEL,
  STATUS_ORDER,
  categorySlug,
  formatPrice,
  isCategory,
  sanitizeQuery,
  timeAgo,
  type Status,
} from "@/lib/items";
import { photoUrl } from "@/lib/photos";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "장터" };

type Row = {
  id: string;
  title: string;
  price: number;
  category: string;
  region: string;
  status: Status;
  photos: string[] | null;
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
    .select(
      "id,title,price,category,region,status,photos,created_at,seller:goguma_profiles(nickname)"
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (cat) query = query.eq("category", cat);
  if (q) query = query.ilike("title", `%${q}%`);

  /*
    상태별 개수는 장터 **전체**를 센다 — 고른 분류나 검색어에 상관없이,
    또 화면에 펴 놓은 예순 개에도 상관없이 표 전체가 대상이다.

    head: true 는 "줄 내용은 필요 없고 개수만 달라"는 뜻이다.
    글 내용을 실어 오지 않으므로 세 번을 물어도 가볍다.
  */
  const [{ data, error }, ...counts] = await Promise.all([
    query,
    ...STATUS_ORDER.map((s) =>
      supabase
        .from("goguma_items")
        .select("id", { count: "exact", head: true })
        .eq("status", s)
    ),
  ]);

  const items = (data ?? []) as unknown as Row[];
  const tally = STATUS_ORDER.map((s, i) => ({
    status: s,
    count: counts[i].count ?? 0,
  }));

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
          <div className="tally">
            {tally.map(({ status, count }) => (
              <div key={status} className={`t-${status}`}>
                <b>{count}</b>
                <span>{STATUS_LABEL[status]}</span>
              </div>
            ))}
          </div>

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
            {/* '전체'는 어느 분류도 아니므로 data-cat 을 달지 않는다 — 가게 색을 그대로 쓴다. */}
            <Link
              className={cat === null ? "chip-on" : undefined}
              href={href(null, q)}
            >
              전체
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                data-cat={categorySlug(c)}
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
          {items.map((it) => {
            // 맨 앞 한 장이 대표 사진. 없으면 고구마 표시로 자리를 채워, 카드 높이가 들쭉날쭉하지 않게 한다.
            const cover = it.photos?.[0];
            return (
              <li key={it.id}>
                {/* data-cat 이 이 카드가 쓸 색을 정한다. 실제 색은 globals.css 에 있다. */}
                <Link
                  className="item-card"
                  data-cat={categorySlug(it.category)}
                  href={`/items/${it.id}`}
                >
                  <div className={cover ? "item-shot" : "item-shot bare"}>
                    {cover ? (
                      <img src={photoUrl(cover)} alt="" loading="lazy" />
                    ) : (
                      <GogumaMark />
                    )}
                    {it.photos && it.photos.length > 1 ? (
                      <span className="shot-more">{it.photos.length}장</span>
                    ) : null}
                  </div>

                  <div className="item-text">
                    <div className="item-top">
                      <h3>{it.title}</h3>
                      {it.status === "selling" ? null : (
                        <span className={`badge ${it.status}`}>{STATUS_LABEL[it.status]}</span>
                      )}
                    </div>
                    <p className="price">{formatPrice(it.price)}</p>
                    <p className="meta">
                      <span className="cat-pill">{it.category}</span>
                      {it.region ? <span>{it.region}</span> : null}
                      <span>{it.seller?.nickname ?? "탈퇴한 이웃"}</span>
                      <span>{timeAgo(it.created_at)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="foot">{SITE_NAME} · 최근 것부터 예순 개까지 보입니다</p>
    </div>
  );
}
