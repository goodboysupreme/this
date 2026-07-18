import type { Metadata } from "next";
import { getOffers } from "@/lib/api";
import { OfferExplorer } from "@/components/offers/OfferExplorer";

export const metadata: Metadata = { title: "PS-2" };

export default async function PS2Page() {
  const offers = await getOffers({ type: "ps2", limit: 1000 });
  return (
    <OfferExplorer
      type="ps2"
      title="PS-2 Stations"
      description="Final Practice School stations: stipends, roles and cutoff history, the data behind PPO season."
      offers={offers}
    />
  );
}
