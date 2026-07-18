import type { Metadata } from "next";
import { ExperiencesClient } from "@/components/experiences/experiences-client";

export const metadata: Metadata = {
  title: "Experience Bank",
  description:
    "A structured, searchable bank of BITS Pilani placement, PS-1, PS-2 and SI interview experiences — browse or contribute your own.",
};

export default function ExperiencesPage() {
  return <ExperiencesClient />;
}
