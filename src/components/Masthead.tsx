/** 머리말. 가계부의 산길 머리말과 같은 얼개 — 하늘빛 판 위에 제목, 아래에 능선. */
export default function Masthead({
  title,
  tagline,
  stamp,
}: {
  title: string;
  tagline: string;
  stamp?: string;
}) {
  return (
    <header className="masthead">
      <div className="masthead-in">
        <div>
          <h1>{title}</h1>
          <p>{tagline}</p>
        </div>
        {stamp ? <span className="stamp">{stamp}</span> : null}
      </div>

      <div className="scene" aria-hidden="true">
        <svg viewBox="0 0 800 108" preserveAspectRatio="none">
          <path
            d="M0 72C90 50 150 82 240 68s150 26 230 14 150 8 230-4c50-7 80-2 100-6v36H0z"
            fill="var(--hill-far)"
            opacity=".5"
          />
          <path
            d="M0 85C80 69 160 95 250 83s170 24 270 12 190 19 280 5v23H0z"
            fill="var(--hill-mid)"
            opacity=".55"
          />
          <path
            d="M0 97C120 87 220 103 340 95s200 15 320 7c60-4 100 1 140-2v11H0z"
            fill="var(--hill-near)"
            opacity=".7"
          />
        </svg>
      </div>
    </header>
  );
}
