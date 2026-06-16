import type { Metadata } from "next";
import { getBankQuestions, getPersonalQuestions, getSubjects, getTopics } from "@/lib/data/sheets";
import { BankBrowser } from "@/components/banco/BankBrowser";

export const metadata: Metadata = {
  title: "Question Bank — trasso",
};

export default async function BancoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subject?: string;
    topic?: string;
    type?: string;
    difficulty?: string;
    adapted?: string;
    tab?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "personal" ? "personal" : "public";

  const filters = {
    search: sp.q,
    subjectId: sp.subject,
    topicId: sp.topic,
    type: sp.type,
    difficulty: sp.difficulty,
    isAdapted: sp.adapted === "1" ? true : undefined,
  };

  const [questions, subjects, topics] = await Promise.all([
    tab === "personal" ? getPersonalQuestions(filters) : getBankQuestions(filters, "public"),
    getSubjects(),
    getTopics(sp.subject),
  ]);

  return (
    <BankBrowser
      questions={questions}
      subjects={subjects}
      topics={topics}
      activeTab={tab}
      filters={{
        q: sp.q ?? "",
        subject: sp.subject ?? "",
        topic: sp.topic ?? "",
        type: sp.type ?? "",
        difficulty: sp.difficulty ?? "",
        adapted: sp.adapted ?? "",
      }}
    />
  );
}
