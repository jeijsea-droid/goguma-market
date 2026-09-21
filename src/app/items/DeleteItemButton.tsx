"use client";

import { deleteItem } from "./actions";

/**
 * 거두기. 되돌릴 수 없으므로 한 번 되묻는다.
 * 되묻기만 하려고 클라이언트 컴포넌트로 따로 뺀 것이다 — 나머지는 다 서버에서 그린다.
 */
export default function DeleteItemButton({ id }: { id: string }) {
  return (
    <form
      action={deleteItem}
      onSubmit={(e) => {
        if (!window.confirm("이 글을 거두시겠습니까? 되돌릴 수 없습니다.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="danger-btn" type="submit">
        거두기
      </button>
    </form>
  );
}
