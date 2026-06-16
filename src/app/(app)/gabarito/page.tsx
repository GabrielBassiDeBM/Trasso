import type { Metadata } from "next";
import { getSheets, getExamResults } from "@/lib/data/sheets";
import { GradingDashboard } from "@/components/grading/GradingDashboard";

export const metadata: Metadata = { title: "Grading — trasso" };

export default async function GabaritoPage() {
  const sheets = await getSheets();

  return <GradingDashboard sheets={sheets} />;
}
