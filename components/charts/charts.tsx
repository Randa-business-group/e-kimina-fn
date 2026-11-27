"use client";

/**
 * Dependency-free SVG charts (msfts §5 — "dashboard charts").
 * Marks follow the dataviz spec: 2px lines, ≤24px columns with 4px rounded data-ends,
 * recessive grid, one y-axis, crosshair / per-mark tooltips, legend for ≥2 series and a
 * table view (the light-mode slot 3 is below 3:1 contrast, so the table is the relief).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type Series = { key: string; label: string; color: string };
export type Point = { x: string; values: Record<string, number> };

const H = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

export function compact(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(a >= 100_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}
export const rwf = (n: number) => `${Math.round(n).toLocaleString("en-US")} RWF`;
export const monthLabel = (m: string) => {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
};

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

function useWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { setRef: ref, w };
}

function Grid({ w, max, fmt }: { w: number; max: number; fmt: (n: number) => string }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const innerH = H - PAD.top - PAD.bottom;
  return (
    <g>
      {ticks.map((t) => {
        const y = PAD.top + innerH * (1 - t);
        return (
          <g key={t}>
            <line x1={PAD.left} x2={w - PAD.right} y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--chart-axis)">
              {fmt(max * t)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function XLabels({ data, xOf }: { data: Point[]; xOf: (i: number) => number }) {
  const step = data.length > 8 ? Math.ceil(data.length / 6) : 1;
  return (
    <g>
      {data.map((d, i) =>
        i % step === 0 || i === data.length - 1 ? (
          <text key={d.x} x={xOf(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--chart-axis)">
            {d.x}
          </text>
        ) : null,
      )}
    </g>
  );
}

function Tooltip({ x, title, rows, w }: { x: number; title: string; rows: { label: string; color: string; value: string; line?: boolean }[]; w: number }) {
  const left = Math.min(Math.max(x + 12, 0), w - 190);
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 min-w-42.5 rounded-md border border-border bg-bg px-3 py-2 text-xs shadow-md"
      style={{ left }}
    >
      <p className="mb-1 font-medium text-text">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-3 text-text-muted">
          <span className="flex items-center gap-1.5">
            {r.line ? (
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: r.color }} />
            ) : (
              <span className="inline-block size-2.5 rounded-sm" style={{ background: r.color }} />
            )}
            {r.label}
          </span>
          <span className="tabular-nums text-text">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function LineChart({ series, data, fmt = compact, tooltipFmt = rwf }: { series: Series[]; data: Point[]; fmt?: (n: number) => string; tooltipFmt?: (n: number) => string }) {
  const { setRef, w } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const max = useMemo(() => niceMax(Math.max(0, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)))), [data, series]);
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const xOf = (i: number) => PAD.left + (data.length <= 1 ? innerW / 2 : (innerW * i) / (data.length - 1));
  const yOf = (v: number) => PAD.top + innerH * (1 - v / max);
  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * innerW;
    setHover(Math.round(data.length <= 1 ? 0 : (px / innerW) * (data.length - 1)));
  };
  return (
    <div ref={setRef} className="relative w-full">
      <svg width="100%" height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={series.map((s) => s.label).join(", ")}>
        <Grid w={w} max={max} fmt={fmt} />
        {series.map((s) => (
          <polyline
            key={s.key}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={data.map((d, i) => `${xOf(i)},${yOf(d.values[s.key] ?? 0)}`).join(" ")}
          />
        ))}
        {hover != null && data[hover] ? (
          <g>
            <line x1={xOf(hover)} x2={xOf(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--chart-axis)" strokeWidth={1} strokeDasharray="3 3" />
            {series.map((s) => (
              <circle key={s.key} cx={xOf(hover)} cy={yOf(data[hover].values[s.key] ?? 0)} r={4} fill={s.color} stroke="var(--color-bg)" strokeWidth={2} />
            ))}
          </g>
        ) : null}
        <XLabels data={data} xOf={xOf} />
        <rect
          x={PAD.left}
          y={PAD.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hover != null && data[hover] ? (
        <Tooltip
          w={w}
          x={xOf(hover)}
          title={data[hover].x}
          rows={series.map((s) => ({ label: s.label, color: s.color, value: tooltipFmt(data[hover].values[s.key] ?? 0), line: true }))}
        />
      ) : null}
    </div>
  );
}

export function BarChart({ series, data, fmt = compact, tooltipFmt = rwf }: { series: Series; data: Point[]; fmt?: (n: number) => string; tooltipFmt?: (n: number) => string }) {
  const { setRef, w } = useWidth();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.values[series.key] ?? 0)));
  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const band = innerW / Math.max(1, data.length);
  const bw = Math.min(24, Math.max(4, band - 4));
  const xOf = (i: number) => PAD.left + band * i + band / 2;
  const base = PAD.top + innerH;
  return (
    <div ref={setRef} className="relative w-full">
      <svg width="100%" height={H} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={series.label}>
        <Grid w={w} max={max} fmt={fmt} />
        {data.map((d, i) => {
          const v = d.values[series.key] ?? 0;
          const h = (v / max) * innerH;
          const x = xOf(i) - bw / 2;
          const r = Math.min(4, h, bw / 2);
          const path =
            h <= 0
              ? ""
              : `M${x},${base} L${x},${base - h + r} Q${x},${base - h} ${x + r},${base - h} L${x + bw - r},${base - h} Q${x + bw},${base - h} ${x + bw},${base - h + r} L${x + bw},${base} Z`;
          return (
            <g key={d.x} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={xOf(i) - band / 2} y={PAD.top} width={band} height={innerH} fill="transparent" />
              {path ? <path d={path} fill={series.color} opacity={hover == null || hover === i ? 1 : 0.55} /> : null}
            </g>
          );
        })}
        <XLabels data={data} xOf={xOf} />
      </svg>
      {hover != null && data[hover] ? (
        <Tooltip
          w={w}
          x={xOf(hover)}
          title={data[hover].x}
          rows={[{ label: series.label, color: series.color, value: tooltipFmt(data[hover].values[series.key] ?? 0) }]}
        />
      ) : null}
    </div>
  );
}

/** Card with title, legend (≥2 series) and a chart / table toggle. */
export function ChartCard({
  title,
  description,
  series,
  data,
  children,
  tooltipFmt = rwf,
  className,
}: {
  title: string;
  description?: string;
  series: Series[];
  data: Point[];
  children: ReactNode;
  tooltipFmt?: (n: number) => string;
  className?: string;
}) {
  const [table, setTable] = useState(false);
  return (
    <section className={cn("rounded-(--radius) border border-border bg-bg p-4", className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          {description ? <p className="text-xs text-text-muted">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          className="rounded-md border border-border px-2 py-1 text-xs text-text-muted hover:text-text"
        >
          {table ? "Show chart" : "Show table"}
        </button>
      </div>
      {series.length >= 2 ? (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-text-muted">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      ) : null}
      {table ? (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-1 pr-3 font-medium">Period</th>
                {series.map((s) => (
                  <th key={s.key} className="py-1 pr-3 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.x} className="border-t border-border">
                  <td className="py-1 pr-3 text-text">{d.x}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1 pr-3 text-right tabular-nums text-text">
                      {tooltipFmt(d.values[s.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/** Hero number tile (no chart): label, value, optional note and status tone. */
export function StatTile({ label, value, note, tone }: { label: string; value: string; note?: string; tone?: "critical" | "warning" }) {
  return (
    <div className="rounded-(--radius) border border-border bg-bg p-4">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-text">{value}</p>
      {note ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
          {tone ? (
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: tone === "critical" ? "var(--status-critical)" : "var(--status-warning)" }}
              aria-hidden
            />
          ) : null}
          {note}
        </p>
      ) : null}
    </div>
  );
}
