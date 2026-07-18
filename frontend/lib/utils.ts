import type { Offer, OfferType } from "./types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const TYPE_LABELS: Record<OfferType, string> = {
  placement: "Placement",
  ps1: "PS-1",
  ps2: "PS-2",
  si: "Summer Internship",
};

/** stipend_ctc is monthly stipend (k INR) for ps1/ps2/si, CTC (LPA) for placement. */
export function formatCompensation(type: OfferType, value: number | null): string {
  if (value === null || value === undefined) return "—";
  return type === "placement" ? `₹${value} LPA` : `₹${value}k/mo`;
}

export function compensationLabel(type: OfferType): string {
  return type === "placement" ? "CTC" : "Stipend";
}

export function formatCutoff(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(2);
}

export function sortOffersByYearDesc<T extends Offer>(offers: T[]): T[] {
  return [...offers].sort((a, b) => b.year - a.year || a.role.localeCompare(b.role));
}
