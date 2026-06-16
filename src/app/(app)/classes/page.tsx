import type { Metadata } from "next";
import { getClassRosters } from "@/lib/actions/classes";
import { ClassesManager } from "@/components/classes/ClassesManager";

export const metadata: Metadata = { title: "Classes — trasso" };

export default async function ClassesPage() {
  const rosters = await getClassRosters();
  return <ClassesManager initialRosters={rosters} />;
}
