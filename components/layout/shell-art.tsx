import Image from "next/image";
import { useId } from "react";
import { cn } from "@/utils/cn";

/* Decorative artwork for the signed-in shell (aria-hidden, no pointer events).
   Uses the same landscape and leaf images as the sign-in screens. */

const LANDSCAPE_SRC = "/images/login-landscape.webp";
const LEAVES_SRC = "/images/login-leaves.webp";

function useSvgId() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

/** Landscape with a soft wave on top, sitting above the user card at the foot of the sidebar. */
export function SidebarArt({ className }: { className?: string }) {
  const id = useSvgId();
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none relative h-28 w-full [@media(min-height:820px)]:h-40", className)}
    >
      <svg viewBox="0 0 264 160" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <defs>
          <clipPath id={`${id}-photo`} clipPathUnits="objectBoundingBox">
            <path d="M0 0.48 C0.23 0.33, 0.53 0.24, 1 0.21 V1 H0 Z" />
          </clipPath>
        </defs>
        <path d="M0 64 C 70 40, 150 22, 264 12 V160 H0 Z" fill="#f6d3b8" className="dark:opacity-25" />
      </svg>
      <div className="absolute inset-0" style={{ clipPath: `url(#${id}-photo)` }}>
        <Image
          src={LANDSCAPE_SRC}
          alt=""
          fill
          sizes="264px"
          className="object-cover object-[38%_55%] dark:brightness-75"
        />
      </div>
    </div>
  );
}

/** Leaf branch and fine lines at the top of the content area, peach waves in the bottom-right corner. */
export function ContentArt() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 380 110" fill="none" className="absolute left-[38%] top-0 hidden w-[380px] xl:block dark:opacity-30">
        <g stroke="#efd3bf" strokeWidth={1.1}>
          <path d="M0 0 C 80 40 200 60 380 30" />
          <path d="M20 0 C 100 46 220 70 380 44" />
          <path d="M40 0 C 120 52 240 80 380 58" />
        </g>
      </svg>
      <Image
        src={LEAVES_SRC}
        alt=""
        width={1292}
        height={797}
        sizes="240px"
        className="absolute left-[54%] top-[-52px] hidden h-auto w-[240px] -rotate-12 drop-shadow-[0_12px_14px_rgba(107,61,28,0.25)] xl:block"
      />
      <svg viewBox="0 0 520 150" preserveAspectRatio="none" className="absolute bottom-0 right-0 h-[120px] w-[min(520px,70%)] dark:opacity-10">
        <path d="M0 150 C 160 140, 330 90, 520 20 V150 Z" fill="#f8e0ce" />
        <path d="M180 150 C 300 140, 420 100, 520 64 V150 Z" fill="#f3cdb3" />
      </svg>
    </div>
  );
}
