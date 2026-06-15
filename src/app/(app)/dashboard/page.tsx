import type { Metadata } from "next";
import { getSheets } from "@/lib/data/sheets";
import { CreateSheetForm } from "@/components/dashboard/CreateSheetForm";
import { SheetCard } from "@/components/dashboard/SheetCard";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Minhas listas — PlataformaListas",
};

export default async function DashboardPage() {
  const sheets = await getSheets();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Minhas listas</h1>
        <p className="mt-1 text-ink-soft">Crie e organize suas listas de exercícios e provas.</p>
      </div>

      <Card className="p-5">
        <CreateSheetForm />
      </Card>

      {sheets.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">Nenhuma lista ainda</p>
          <p className="mt-1 text-sm text-ink-soft">Crie sua primeira lista acima para começar.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sheets.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} />
          ))}
        </div>
      )}
    </div>
  );
}
