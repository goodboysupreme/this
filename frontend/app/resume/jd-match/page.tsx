import type { Metadata } from "next";
import { JDMatch } from "@/components/resume/jd-match";

export const metadata: Metadata = { title: "JD Match" };

export default function JDMatchPage() {
  return <JDMatch />;
}
