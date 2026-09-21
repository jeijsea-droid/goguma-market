/** 가게 표시 — 비스듬히 누운 고구마 한 알에 싹이 하나. */
export default function GogumaMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <g transform="rotate(25 15 19)">
        <ellipse cx="15" cy="19" rx="6.6" ry="9.6" fill="var(--goguma)" />
        <ellipse cx="12.7" cy="15.6" rx="2.1" ry="3.9" fill="#FFFBF2" opacity=".2" />
        <circle cx="17.2" cy="15.4" r=".62" fill="#2A1B12" opacity=".26" />
        <circle cx="15.4" cy="21.4" r=".55" fill="#2A1B12" opacity=".22" />
        <circle cx="17.8" cy="19.8" r=".48" fill="#2A1B12" opacity=".2" />
      </g>
      <path
        d="M19.1 10.6C20 8 21.4 6 23.3 4.9"
        fill="none"
        stroke="var(--hill-near)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M23.4 4.7c2.1-.7 3.9.2 4.4 2.2-2.1.9-3.9.3-4.4-2.2z" fill="var(--plus)" />
      <path d="M23.2 4.8c-.5-2.1.6-3.9 2.6-4.5.5 2.1-.4 3.9-2.6 4.5z" fill="var(--hill-near)" />
    </svg>
  );
}
