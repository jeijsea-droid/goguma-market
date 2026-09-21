"use client";

import { useActionState, useState } from "react";
import { CATEGORIES, withCommas } from "@/lib/items";
import type { ItemFormState } from "./actions";

const EMPTY: ItemFormState = {};

export type ItemDraft = {
  title: string;
  body: string;
  /** 새 글이면 null — 값 칸을 0 이 아니라 빈 칸으로 펴 두어야 한다 (0 은 "나눔"이라는 뜻이므로). */
  price: number | null;
  category: string;
  region: string;
};

export default function ItemForm({
  action,
  itemId,
  initial,
  submitLabel,
  pendingLabel,
}: {
  /** 서버 액션. 내놓기면 createItem, 고치기면 updateItem 이 건너온다. */
  action: (prev: ItemFormState, formData: FormData) => Promise<ItemFormState>;
  itemId?: string;
  initial?: ItemDraft;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  // 리액트 19는 액션이 끝나면 폼을 비운다. 붙들어 두지 않으면 실패할 때마다 처음부터 다시 적어야 한다.
  const [title, setTitle] = useState(initial?.title ?? "");
  const [price, setPrice] = useState(
    initial?.price == null ? "" : initial.price === 0 ? "0" : withCommas(String(initial.price))
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [body, setBody] = useState(initial?.body ?? "");

  /** 값 위에 얼마를 더 쌓는다. 가계부의 +1천 / +1만 버튼과 같은 손놀림. */
  function bump(amount: number) {
    const now = Number(price.replace(/[^0-9]/g, "") || "0");
    setPrice(withCommas(String(now + amount)));
  }

  return (
    <form action={formAction}>
      {itemId ? <input type="hidden" name="id" value={itemId} /> : null}

      <div className="field">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          name="title"
          type="text"
          minLength={2}
          maxLength={60}
          placeholder="거의 새 것인 전기밥솥"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <span className="lab">분류</span>
        <input type="hidden" name="category" value={category} />
        <div className="cats">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <p className="help">하나만 고르면 됩니다.</p>
      </div>

      <div className="field">
        <label htmlFor="price">값</label>
        <div className="amount-wrap">
          <input
            id="price"
            name="price"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(withCommas(e.target.value))}
            required
          />
          <span className="won">원</span>
        </div>
        <div className="quick">
          <button type="button" onClick={() => bump(1000)}>+1천</button>
          <button type="button" onClick={() => bump(10000)}>+1만</button>
          <button type="button" onClick={() => bump(50000)}>+5만</button>
          <button type="button" onClick={() => setPrice("0")}>나눔</button>
          <button type="button" className="clr" onClick={() => setPrice("")}>지우기</button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="region">동네</label>
        <input
          id="region"
          name="region"
          type="text"
          maxLength={40}
          placeholder="서울 관악구 신림동"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />
        <p className="help">만나서 주고받을 곳. 비워 두어도 됩니다.</p>
      </div>

      <div className="field">
        <label htmlFor="body">설명</label>
        <textarea
          id="body"
          name="body"
          rows={7}
          maxLength={2000}
          placeholder="산 때, 쓴 정도, 흠집이 있다면 어디에 있는지 적어 주세요."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <p className="help">{body.length} / 2000자</p>
      </div>

      <button className="submit" type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>

      <p className="note" role="status" aria-live="polite">
        {state.error ?? ""}
      </p>
    </form>
  );
}
