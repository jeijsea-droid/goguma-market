"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_PHOTOS,
  PHOTO_ACCEPT,
  PHOTO_BUCKET,
  newPhotoPath,
  photoRejectReason,
  photoUrl,
} from "@/lib/photos";

/**
 * 물건 사진 고르기.
 *
 * 사진은 **브라우저에서 곧장 보관함으로** 올린다. 서버 액션으로 파일을 실어 보내지
 * 않는 까닭은 두 가지다 — ① 몇 MB 짜리가 서버를 한 번 더 거치면 느리고,
 * ② 서버 액션에는 본문 크기 제한이 따로 있어 큰 사진에서 걸린다.
 *
 * 그래서 이 컴포넌트가 하는 일은: 파일을 보관함에 올리고, 돌아온 **경로만**
 * 숨은 칸(<input type="hidden" name="photos">)에 심어 두는 것이다.
 * 글을 저장할 때 서버는 경로 목록만 받는다.
 */
export default function PhotoPicker({
  userId,
  initial,
  onBusyChange,
}: {
  userId: string;
  /** 고치기 화면에서 이미 걸려 있던 사진들. 새 글이면 빈 배열. */
  initial: string[];
  /** 올리는 중에는 저장 버튼을 잠가야 해서, 바깥에 알려 준다. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const [paths, setPaths] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  /**
   * 이번에 새로 올린 사진들의 경로.
   * 이것만 "빼기"를 눌렀을 때 보관함에서도 곧바로 지운다.
   * 원래 걸려 있던 사진은 목록에서만 빼 두고, 실제로 지우는 건 저장할 때 서버가 한다 —
   * 여기서 지워 버리면 폼을 저장하지 않고 나가 버렸을 때 멀쩡한 사진이 사라진다.
   */
  const fresh = useRef<Set<string>>(new Set());

  function setBothBusy(v: boolean) {
    setBusy(v);
    onBusyChange?.(v);
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    // 같은 사진을 다시 고를 수 있게 입력칸을 비워 둔다 (안 비우면 onChange 가 안 뜬다).
    if (fileRef.current) fileRef.current.value = "";
    if (picked.length === 0) return;

    const room = MAX_PHOTOS - paths.length;
    if (room <= 0) {
      setNote(`사진은 ${MAX_PHOTOS}장까지입니다.`);
      return;
    }

    const taking = picked.slice(0, room);
    const skipped = picked.length - taking.length;

    setBothBusy(true);
    setNote(`사진 ${taking.length}장을 올리는 중…`);

    const supabase = createClient();
    const done: string[] = [];
    const failed: string[] = [];

    for (const file of taking) {
      const reason = photoRejectReason(file);
      if (reason) {
        failed.push(reason);
        continue;
      }

      const path = newPhotoPath(userId, file.type);
      if (!path) {
        failed.push(`${file.name} — 알 수 없는 사진 종류입니다.`);
        continue;
      }

      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { contentType: file.type });

      if (error) {
        failed.push(`${file.name} — ${error.message}`);
        continue;
      }

      fresh.current.add(path);
      done.push(path);
    }

    setPaths((prev) => [...prev, ...done]);
    setBothBusy(false);

    const lines: string[] = [];
    if (done.length) lines.push(`${done.length}장 올렸습니다.`);
    if (skipped > 0) lines.push(`${MAX_PHOTOS}장이 넘어 ${skipped}장은 건너뛰었습니다.`);
    lines.push(...failed);
    setNote(lines.join(" "));
  }

  async function remove(path: string) {
    setPaths((prev) => prev.filter((p) => p !== path));
    setNote("");

    if (fresh.current.has(path)) {
      fresh.current.delete(path);
      const supabase = createClient();
      await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    }
  }

  /** 맨 앞이 대표 사진이다. 목록과 미리보기에 이 한 장이 나간다. */
  function makeCover(path: string) {
    setPaths((prev) => [path, ...prev.filter((p) => p !== path)]);
    setNote("대표 사진을 바꾸었습니다.");
  }

  return (
    <div className="field">
      <span className="lab">사진</span>

      {/* 서버로 건너가는 건 이 숨은 칸들뿐이다. 늘어놓은 순서가 그대로 지켜진다. */}
      {paths.map((p) => (
        <input key={p} type="hidden" name="photos" value={p} />
      ))}

      {paths.length > 0 ? (
        <ul className="shots">
          {paths.map((p, i) => (
            <li key={p} className={i === 0 ? "shot cover" : "shot"}>
              {/* eslint-disable-next-line */}
              <img src={photoUrl(p)} alt={`올린 사진 ${i + 1}`} loading="lazy" />
              {i === 0 ? <span className="shot-tag">대표</span> : null}
              <div className="shot-acts">
                {i === 0 ? null : (
                  <button type="button" onClick={() => makeCover(p)}>
                    대표로
                  </button>
                )}
                <button type="button" className="clr" onClick={() => remove(p)}>
                  빼기
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="quick" style={{ marginTop: paths.length ? 10 : 0 }}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || paths.length >= MAX_PHOTOS}
        >
          {busy ? "올리는 중…" : paths.length ? "사진 더 고르기" : "사진 고르기"}
        </button>
        <span className="shot-count">
          {paths.length} / {MAX_PHOTOS}장
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={PHOTO_ACCEPT}
        multiple
        hidden
        onChange={onPick}
      />

      <p className="help" role="status" aria-live="polite">
        {note || `맨 앞의 한 장이 장터 목록에 나갑니다. 한 장에 5MB까지, ${MAX_PHOTOS}장까지.`}
      </p>
    </div>
  );
}
