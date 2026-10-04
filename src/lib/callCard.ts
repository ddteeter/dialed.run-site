import type { CallCard } from "@/data/artifact/schema";

/**
 * "38°F · FEELS 33° · DAMP": the board's data strip. MONO.lg keeps its case
 * (uppercase is a transform only at MONO.xs and sm), so the caps are in
 * the text.
 */
export function conditionsLine({ conditions }: CallCard): string {
  return `${String(conditions.f)}°F · FEELS ${String(conditions.feelsF)}° · ${conditions.sky.toUpperCase()}`;
}

/** "7 of 9 dialed", set in MONO.sm, which renders it uppercase. */
export function dialedCount(item: CallCard["items"][number]): string {
  return `${String(item.dialed)} of ${String(item.of)} dialed`;
}
