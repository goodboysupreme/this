import type { Metadata } from "next";
import { ResumeScreener } from "@/components/resume/resume-screener";

export const metadata: Metadata = { title: "Resume Screener" };

export default function ResumePage() {
  return <ResumeScreener />;
}
