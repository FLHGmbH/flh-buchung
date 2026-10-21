const PETROL = "#006478";

type Rgb = [number, number, number];

export function brandHex(raw: string) {
  const v = raw.trim().toLowerCase();
  if (!v) return "";
  return /^#[0-9a-f]{6}$/.test(v) ? v : null;
}

function parse(hex: string): Rgb {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function luma(c: Rgb) {
  const f = (n: number) => {
    const s = n / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t),
  ];
}

function hex(c: Rgb) {
  return `#${c.map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

export function brandOf(raw?: string | null) {
  const picked = brandHex(raw ?? "") || PETROL;
  let rgb = parse(picked);
  // ponytail: light picks are darkened until white type clears about 4.5:1 (luma <= 0.18). A light ground with dark type would need a second palette.
  for (let i = 0; i < 12 && luma(rgb) > 0.18; i++) rgb = mix(rgb, [0, 0, 0], 0.18);
  const white: Rgb = [255, 255, 255];
  return {
    base: hex(rgb),
    mix75: hex(mix(rgb, white, 0.25)),
    mix50: hex(mix(rgb, white, 0.5)),
    mix25: hex(mix(rgb, white, 0.75)),
    ink: hex(mix(rgb, [0, 0, 0], 0.22)),
    wash: hex(mix(rgb, white, 0.92)),
  };
}

export function guestVars(raw?: string | null) {
  if (!brandHex(raw ?? "")) return undefined;
  const b = brandOf(raw);
  return {
    "--petrol": b.base,
    "--petrol-75": b.mix75,
    "--petrol-50": b.mix50,
    "--petrol-25": b.mix25,
    "--btn": b.base,
    "--brand-ink": b.ink,
    "--brand-wash": b.wash,
  };
}
