import Image from "next/image";
import { useId } from "react";
import { cn } from "@/utils/cn";

/* Decorative artwork shared by every auth screen (all aria-hidden, no pointer events).
   Desktop (lg+): the landscape inside a large oval on the left, a cream ring, and an orange
   crescent that fades to peach; a leaf branch top-right and fine line waves bottom-right.
   Mobile (< lg): the landscape as a header with an S-curved lower edge and an orange swoosh,
   leaf branches top-right and bottom-right, and layered orange waves bottom-left. */

const LANDSCAPE_SRC = "/images/login-landscape.webp";
const LEAVES_SRC = "/images/login-leaves.webp";

function useSvgId() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Branch of leaves entering from the right edge. Flip it with `-scale-y-100` for a bottom corner. */
export function LeafSprig({ className, sizes }: { className?: string; sizes: string }) {
  return (
    <Image
      src={LEAVES_SRC}
      alt=""
      aria-hidden
      width={1292}
      height={797}
      sizes={sizes}
      className={cn("h-auto drop-shadow-[0_12px_14px_rgba(107,61,28,0.28)]", className)}
    />
  );
}

function LineWaves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 484 182" fill="none" className={className} aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d={`M${i * 28} 182 C ${140 + i * 20} ${182 - i * 2}, ${210 + i * 20} ${60 + i * 12}, 484 ${i * 16}`}
          stroke="#ebcdb5"
          strokeWidth={1.3}
        />
      ))}
    </svg>
  );
}

export function DesktopArt() {
  const id = useSvgId();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {/* Fixed-ratio panel so the oval keeps its shape at any screen height. */}
      <div className="absolute inset-y-0 left-0 aspect-[600/990] max-w-[48%]">
        <svg viewBox="0 0 600 990" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <defs>
            <linearGradient id={`${id}-band`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="990">
              <stop offset="0" stopColor="#c25811" />
              <stop offset="0.16" stopColor="#d66e29" />
              <stop offset="0.3" stopColor="#e68f52" />
              <stop offset="0.42" stopColor="#f0b88e" />
              <stop offset="0.52" stopColor="#f6dcc6" />
              <stop offset="1" stopColor="#f5d9c2" />
            </linearGradient>
          </defs>
          <ellipse cx="-391" cy="452" rx="948" ry="826" fill={`url(#${id}-band)`} />
          <ellipse cx="-391" cy="481" rx="937" ry="610" fill="#fcf6f1" />
        </svg>
        <div className="absolute inset-0" style={{ clipPath: "ellipse(154% 60.3% at -65.2% 48.6%)" }}>
          <div className="absolute inset-y-0 left-0 w-[90%]">
            <Image
              src={LANDSCAPE_SRC}
              alt=""
              fill
              sizes="(min-width: 1024px) 45vw, 1px"
              fetchPriority="high"
              className="object-cover object-[55%_50%]"
            />
          </div>
        </div>
      </div>
      <LeafSprig sizes="(min-width: 1024px) 340px, 1px" className="absolute -right-4 top-0 w-[300px]" />
      <LineWaves className="absolute bottom-0 right-0 w-[395px]" />
    </div>
  );
}

export function MobileArt() {
  const id = useSvgId();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
      <svg width="0" height="0" className="absolute">
        <defs>
          {/* S-curve for the photo, in 0–1 units so it stretches with the screen width. */}
          <clipPath id={`${id}-photo`} clipPathUnits="objectBoundingBox">
            <path d="M0 0 H1 V0.3933 C0.9231 0.5833, 0.7692 0.64, 0.6154 0.6733 C0.4103 0.7667, 0.1795 0.9, 0 0.9733 Z" />
          </clipPath>
        </defs>
      </svg>

      <svg viewBox="0 0 390 360" preserveAspectRatio="none" className="absolute left-0 top-0 h-[360px] w-full">
        <defs>
          <linearGradient id={`${id}-band`} x1="1" y1="0" x2="0" y2="0.6">
            <stop offset="0" stopColor="#b9480a" />
            <stop offset="0.3" stopColor="#d9702c" />
            <stop offset="0.55" stopColor="#ee9e64" />
            <stop offset="0.8" stopColor="#f3c096" />
            <stop offset="1" stopColor="#f7d9bf" />
          </linearGradient>
        </defs>
        <path d="M0 0 H390 V186 C 350 200, 290 208, 230 213 C 150 222, 60 290, 0 350 Z" fill={`url(#${id}-band)`} />
        <path
          d="M390 118 C 360 175, 300 192, 240 202 C 160 230, 70 270, 0 292"
          fill="none"
          stroke="var(--color-cream)"
          strokeWidth={12}
        />
      </svg>

      <div className="absolute left-0 top-0 h-[300px] w-full" style={{ clipPath: `url(#${id}-photo)` }}>
        <Image
          src={LANDSCAPE_SRC}
          alt=""
          fill
          sizes="(max-width: 1023px) 100vw, 1px"
          fetchPriority="high"
          className="object-cover object-[52%_45%]"
        />
      </div>

      <LeafSprig sizes="(max-width: 1023px) 170px, 1px" className="absolute -right-3 top-0 w-[150px]" />

      <svg viewBox="0 0 200 120" className="absolute bottom-0 left-0 w-[200px]">
        <defs>
          <linearGradient id={`${id}-wave`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#c95e1a" />
            <stop offset="1" stopColor="#eba36b" />
          </linearGradient>
        </defs>
        <path d="M0 10 C 60 34, 125 70, 180 120 H0 Z" fill="#f7dcc5" />
        <path d="M0 42 C 50 58, 100 86, 140 120 H0 Z" fill="#f2c49b" />
        <path d="M0 76 C 36 86, 70 102, 92 120 H0 Z" fill={`url(#${id}-wave)`} />
      </svg>

      <LeafSprig
        sizes="(max-width: 1023px) 170px, 1px"
        className="absolute -right-3 bottom-0 w-[150px] -scale-y-100"
      />
    </div>
  );
}
