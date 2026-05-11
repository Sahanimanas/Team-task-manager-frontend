import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function hashColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const hue = 200 + (Math.abs(h) % 50);
  const sat = 55 + (Math.abs(h >> 3) % 25);
  const light = 42 + (Math.abs(h >> 5) % 12);
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function Avatar({
  name,
  email,
  size = 32,
  className,
}: {
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}) {
  const seed = (email || name || "?").toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight text-white ring-1 ring-black/5",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${hashColor(seed)} 0%, ${hashColor(seed + "x")} 100%)`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
