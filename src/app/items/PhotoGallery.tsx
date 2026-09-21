"use client";

import { useState } from "react";
import { photoUrl } from "@/lib/photos";

/**
 * 글에 걸린 사진 보여 주기.
 *
 * 큰 사진 한 장을 두고, 아래 작은 사진을 누르면 그 자리에 갈아 끼운다.
 * 이것만을 위해 "use client" 를 붙였다 — 누르면 바뀌는 것은 브라우저에서만 할 수 있다.
 * 사진이 한 장뿐이면 고를 게 없으므로 작은 줄은 아예 그리지 않는다.
 */
export default function PhotoGallery({
  photos,
  title,
}: {
  photos: string[];
  /** 사진을 못 볼 때 대신 읽히는 말에 쓴다. */
  title: string;
}) {
  const [at, setAt] = useState(0);
  if (photos.length === 0) return null;

  // 사진이 지워져 숫자가 줄어든 경우를 대비해 범위를 붙든다.
  const i = Math.min(at, photos.length - 1);

  return (
    <div className="gallery">
      <div className="gallery-big">
        <img
          src={photoUrl(photos[i])}
          alt={`${title} 사진 ${i + 1}`}
          /* 첫 장은 화면에 바로 보이므로 미루지 않고 곧장 받는다. */
          loading={i === 0 ? "eager" : "lazy"}
        />
      </div>

      {photos.length > 1 ? (
        <div className="gallery-strip">
          {photos.map((p, n) => (
            <button
              key={p}
              type="button"
              aria-label={`${n + 1}번째 사진 보기`}
              aria-pressed={n === i}
              onClick={() => setAt(n)}
            >
              <img src={photoUrl(p)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
