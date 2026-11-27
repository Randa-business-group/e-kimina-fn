import Image from "next/image";
import { useId } from "react";
import { cn } from "@/utils/cn";

/* Decorative artwork for the login screen: the landscape photo, the leaf sprig,
   and the curved swooshes / line waves around them. */

const LANDSCAPE_SRC = "/images/login-landscape.webp";
const LEAVES_SRC = "/images/login-leaves.webp";

function useSvgId() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

function Landscape({ sizes, position }: { sizes: string; position: string }) {
  return (
    <Image
      src={LANDSCAPE_SRC}
      alt=""
      fill
      sizes={sizes}
      fetchPriority="high"
      className="object-cover"
      style={{ objectPosition: position }}
    />
  );
}

/** Branch of leaves entering from the right edge. Flip it with `-scale-y-100` for a bottom corner. */
export function LeafSprig({ className }: { className?: string }) {
  return (
    <Image
      src={LEAVES_SRC}
      alt=""
      aria-hidden
      width={1292}
      height={797}
      sizes="(min-width: 1024px) 340px, 200px"
      className={cn("h-auto drop-shadow-[0_12px_14px_rgba(107,61,28,0.28)]", className)}
    />
  );
}

export function LineWaves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 170" fill="none" className={className} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M0,${168 - i * 3} C110,${172 - i * 9} 200,${96 - i * 7} 420,${70 - i * 8}`}
          stroke="#e3bd9f"
          strokeOpacity={0.75 - i * 0.05}
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}

/** Desktop hero: landscape clipped to a bulging curve, with a cream gap and an orange swoosh beside it. */
export function DesktopHero({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <div className={cn("relative self-stretch", className)} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`${id}-swoosh`} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#b8460c" />
            <stop offset="0.3" stopColor="#dd7431" />
            <stop offset="0.62" stopColor="#f1b48a" />
            <stop offset="1" stopColor="#f8e4d4" />
          </linearGradient>
          <clipPath id={`${id}-clip`} clipPathUnits="objectBoundingBox">
            <path d="M0,0 L0.32,0 C0.76,0.18 0.965,0.44 0.945,0.6 C0.925,0.77 0.72,0.91 0.46,1 L0,1Z" />
          </clipPath>
        </defs>
        <path d="M33,0 L74,0 C91,20 103,44 100,62 C97,80 84,93 62,100 L40,100Z" fill={`url(#${id}-swoosh)`} />
        <path d="M0,0 L35.5,0 C80,18 99,44 97.5,60.5 C95.5,78 75,92 49.5,100 L0,100Z" fill="var(--color-cream)" />
      </svg>
      <div className="absolute inset-0" style={{ clipPath: `url(#${id}-clip)` }}>
        <Landscape sizes="(min-width: 1024px) 520px, 1px" position="52% 50%" />
      </div>
    </div>
  );
}

/** Mobile hero: landscape with a sweeping lower edge and an orange band following it. */
export function MobileHero({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <div className={cn("relative w-full", className)} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={`${id}-band`} x1="1" y1="0" x2="0" y2="0.4">
            <stop offset="0" stopColor="#c2510f" />
            <stop offset="0.45" stopColor="#e9935a" />
            <stop offset="1" stopColor="#f6dcc8" />
          </linearGradient>
          <clipPath id={`${id}-clip`} clipPathUnits="objectBoundingBox">
            <path d="M0,0 L1,0 L1,0.56 C0.9,0.66 0.76,0.7 0.58,0.74 C0.38,0.79 0.16,0.86 0,0.94Z" />
          </clipPath>
        </defs>
        <path
          d="M0,98 C16,90 38,83 59,78 C76,74 91,70 100,60 L100,78 C89,85 73,87 55,90 C36,93 16,97 0,101Z"
          fill={`url(#${id}-band)`}
        />
      </svg>
      <div className="absolute inset-0" style={{ clipPath: `url(#${id}-clip)` }}>
        <Landscape sizes="(min-width: 1024px) 1px, 100vw" position="50% 45%" />
      </div>
    </div>
  );
}

/** Soft orange waves for the bottom-left corner on small screens. */
export function CornerWaves({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#d9682a" />
          <stop offset="1" stopColor="#f5c9a6" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d="M0,40 C50,60 90,100 200,120 L0,120Z" fill="#f4d5bd" opacity="0.7" />
      <path d="M0,70 C40,82 70,108 130,120 L0,120Z" fill={`url(#${id}-w)`} />
    </svg>
  );
}
