import type { Metadata } from "next";
import { getBankQuestions, getPersonalQuestions, getSubjects, getTopics, getSheets } from "@/lib/data/sheets";
import { BankBrowser } from "@/components/banco/BankBrowser";

export const metadata: Metadata = {
  title: "Question Bank — trasso",
};

export default async function BancoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    subjects?: string;
    subject?: string;
    topics?: string;
    topic?: string;
    types?: string;
    difficulties?: string;
    adapted?: string;
    tab?: string;
  }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab === "personal" ? "personal" : "public";

  const types = sp.types ? sp.types.split(",").filter(Boolean) : [];
  const difficulties = sp.difficulties ? sp.difficulties.split(",").filter(Boolean) : [];

  // Multi-value params with backward-compat for single-value legacy links
  const subjectIds = sp.subjects
    ? sp.subjects.split(",").filter(Boolean)
    : sp.subject
      ? [sp.subject]
      : [];
  const topicIds = sp.topics
    ? sp.topics.split(",").filter(Boolean)
    : sp.topic
      ? [sp.topic]
      : [];

  const filters = {
    search: sp.q,
    subjectIds: subjectIds.length > 0 ? subjectIds : undefined,
    topicIds: topicIds.length > 0 ? topicIds : undefined,
    types: types.length > 0 ? types : undefined,
    difficulties: difficulties.length > 0 ? difficulties : undefined,
    isAdapted: sp.adapted === "1" ? true : undefined,
  };

  const [questions, subjects, allTopics, sheets] = await Promise.all([
    tab === "personal" ? getPersonalQuestions(filters) : getBankQuestions(filters, "public"),
    getSubjects(),
    getTopics(),
    getSheets(),
  ]);

  return (
    <BankBrowser
      questions={questions}
      subjects={subjects}
      allTopics={allTopics}
      sheets={sheets.map((s) => ({ id: s.id, title: s.title }))}
      activeTab={tab}
      filters={{
        q: sp.q ?? "",
        subjects: subjectIds,
        topics: topicIds,
        types,
        difficulties,
        adapted: sp.adapted ?? "",
      }}
    />
  );
}
