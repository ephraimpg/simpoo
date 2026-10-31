import type { GalleryCategory } from "@/lib/content-schema";

/**
 * Illustrated, clearly non-photographic artwork used wherever real, approved
 * school photographs are not yet available. These are NOT presented as photos
 * of the school — every tile carries a "photo to be added" label.
 */

type Motif = "classroom" | "science" | "sports" | "creativity" | "events" | "campus" | "hero";

function Motif({ motif }: { motif: Motif }) {
  switch (motif) {
    case "classroom":
      return (
        <g>
          <rect x="88" y="150" width="184" height="112" rx="10" fill="#5a1521" />
          <rect x="102" y="164" width="156" height="84" rx="6" fill="#751a29" />
          <path d="M118 190h60M118 206h92M118 222h74" stroke="#e0a5ae" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
          <rect x="52" y="286" width="256" height="14" rx="7" fill="#e0a5ae" opacity="0.85" />
          <rect x="70" y="300" width="12" height="46" rx="5" fill="#751a29" />
          <rect x="278" y="300" width="12" height="46" rx="5" fill="#751a29" />
        </g>
      );
    case "science":
      return (
        <g>
          <path d="M168 130v52l-58 108a24 24 0 0 0 21 36h98a24 24 0 0 0 21-36l-58-108v-52" fill="none" stroke="#e0a5ae" strokeWidth="8" strokeLinejoin="round" />
          <path d="M146 130h68" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
          <path d="M126 262h108" stroke="#5a1521" strokeWidth="6" opacity="0.5" />
          <circle cx="160" cy="292" r="10" fill="#ffffff" opacity="0.9" />
          <circle cx="200" cy="316" r="7" fill="#ffffff" opacity="0.7" />
          <circle cx="216" cy="282" r="5" fill="#ffffff" opacity="0.6" />
        </g>
      );
    case "sports":
      return (
        <g>
          <circle cx="200" cy="230" r="74" fill="none" stroke="#ffffff" strokeWidth="7" opacity="0.9" />
          <path d="M200 156v148M126 230h148" stroke="#e0a5ae" strokeWidth="6" opacity="0.9" />
          <circle cx="200" cy="230" r="14" fill="#e0a5ae" />
          <path d="M96 340c40-24 168-24 208 0" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.55" fill="none" />
        </g>
      );
    case "creativity":
      return (
        <g>
          <path d="M200 128c52 0 92 36 92 82 0 30-22 44-44 44h-18c-16 0-26 12-22 26 4 14-4 24-8 28-8-34-64-64-64-118 0-38 30-62 64-62z" fill="#ffffff" opacity="0.92" />
          <circle cx="168" cy="196" r="12" fill="#e0a5ae" />
          <circle cx="212" cy="176" r="12" fill="#751a29" />
          <circle cx="240" cy="212" r="12" fill="#e0a5ae" opacity="0.65" />
          <rect x="238" y="286" width="76" height="12" rx="6" transform="rotate(-38 238 286)" fill="#e0a5ae" />
        </g>
      );
    case "events":
      return (
        <g>
          <path d="M104 150l30 130M296 150l-30 130" stroke="#ffffff" strokeWidth="5" opacity="0.6" />
          {Array.from({ length: 7 }).map((_, i) => (
            <path
              key={i}
              d={`M${112 + i * 30} 150 q15 34 0 62 q-15-28 0-62z`}
              fill={i % 2 === 0 ? "#e0a5ae" : "#ffffff"}
              opacity={i % 2 === 0 ? 0.95 : 0.75}
            />
          ))}
          <rect x="96" y="140" width="208" height="8" rx="4" fill="#ffffff" opacity="0.8" />
          <rect x="128" y="290" width="144" height="52" rx="10" fill="#ffffff" opacity="0.9" />
          <path d="M152 316h96" stroke="#751a29" strokeWidth="7" strokeLinecap="round" />
        </g>
      );
    case "campus":
      return (
        <g>
          <rect x="112" y="204" width="176" height="118" rx="8" fill="#ffffff" opacity="0.92" />
          <path d="M96 208l104-72 104 72z" fill="#e0a5ae" />
          <rect x="182" y="252" width="36" height="70" rx="4" fill="#751a29" />
          <rect x="130" y="232" width="34" height="34" rx="4" fill="#f7e6e9" />
          <rect x="236" y="232" width="34" height="34" rx="4" fill="#f7e6e9" />
          <path d="M60 336h280" stroke="#e0a5ae" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
        </g>
      );
    case "hero":
    default:
      return (
        <g>
          {/* Ngong-hills inspired layers */}
          <path d="M0 470 Q 240 330 480 430 T 960 400 T 1440 440 T 1920 400 V 900 H 0 Z" fill="#5a1521" />
          <path d="M0 560 Q 320 430 640 520 T 1280 500 T 1920 540 V 900 H 0 Z" fill="#751a29" />
          <path d="M0 660 Q 380 560 760 630 T 1920 640 V 900 H 0 Z" fill="#8e2031" opacity="0.85" />
          {/* Sun */}
          <circle cx="1560" cy="220" r="86" fill="#e0a5ae" opacity="0.9" />
          <circle cx="1560" cy="220" r="120" fill="#e0a5ae" opacity="0.18" />
          {/* Floating book + shapes */}
          <g opacity="0.9">
            <path d="M240 250c44-22 88-22 132 0 44-22 88-22 132 0v120c-44-22-88-22-132 0-44-22-88-22-132 0z" fill="#ffffff" opacity="0.9" />
            <path d="M372 250v120" stroke="#751a29" strokeWidth="6" />
            <path d="M272 300h64M272 328h48M416 300h64M416 328h48" stroke="#8e2031" strokeWidth="8" strokeLinecap="round" opacity="0.55" />
          </g>
          <circle cx="640" cy="180" r="12" fill="#e0a5ae" />
          <circle cx="720" cy="300" r="7" fill="#ffffff" opacity="0.7" />
          <circle cx="120" cy="420" r="9" fill="#ffffff" opacity="0.5" />
          <rect x="1180" y="330" width="56" height="56" rx="14" fill="#ffffff" opacity="0.16" transform="rotate(18 1180 330)" />
        </g>
      );
  }
}

export function PhotoArt({
  motif,
  className = "",
  label,
}: {
  motif: Motif;
  className?: string;
  /** Small overlay label; pass null for purely decorative hero art. */
  label?: string | null;
}) {
  return (
    <div className={`relative overflow-hidden bg-maroon-900 ${className}`}>
      <svg
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`art-bg-${motif}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#751a29" />
            <stop offset="55%" stopColor="#5a1521" />
            <stop offset="100%" stopColor="#330b12" />
          </linearGradient>
          <pattern id={`art-dots-${motif}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="#ffffff" opacity="0.08" />
          </pattern>
        </defs>
        <rect width="800" height="500" fill={`url(#art-bg-${motif})`} />
        <rect width="800" height="500" fill={`url(#art-dots-${motif})`} />
        <g transform={motif === "hero" ? "scale(0.42) translate(-40 -60)" : "translate(200 60) scale(2)"}>
          <Motif motif={motif} />
        </g>
        {motif !== "hero" && (
          <path d="M0 470h800" stroke="#e0a5ae" strokeWidth="3" opacity="0.35" />
        )}
      </svg>
      {label ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-maroon-950/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-maroon-100 backdrop-blur">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function categoryMotif(category: GalleryCategory): Motif {
  return category;
}
