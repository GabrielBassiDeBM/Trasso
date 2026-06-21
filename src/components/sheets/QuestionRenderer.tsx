import type { McqOption, MatchingItem } from "@/lib/types/question";
import type { PageSettings } from "@/lib/sheets/defaults";
import type { QuestionItem } from "@/components/sheets/QuestionList";
import { Latex } from "@/components/math/Latex";
import { cn } from "@/lib/utils/cn";

interface QuestionRendererProps {
  item: QuestionItem;
  index: number;
  numbering: PageSettings["numbering"];
  mcqStyle: PageSettings["mcqStyle"];
  pointsPerQuestion: PageSettings["pointsPerQuestion"];
  showAnswerLines: PageSettings["showAnswerLines"];
  showAnswers: boolean;
}

function formatPoints(points: number) {
  return points.toLocaleString("pt-BR", { minimumFractionDigits: points % 1 === 0 ? 0 : 1 });
}

export function QuestionRenderer({ item, index, numbering, mcqStyle, pointsPerQuestion, showAnswerLines, showAnswers }: QuestionRendererProps) {
  const { content, points } = item;
  const number = numbering === "numeric" ? `${index + 1}. ` : "";

  return (
    <div className="sheet-question font-print-serif mb-5 break-inside-avoid text-[11pt] leading-relaxed text-black">
      <p className="font-medium">
        {number}
        {content.type === "fill_blank" ? (
          <FillBlankStatement statement={content.statement} blanks={content.blanks} showAnswers={showAnswers} />
        ) : (
          <Latex text={content.statement} />
        )}
        {pointsPerQuestion && points != null && (
          <span className="ml-1 text-[10pt] text-black/60">(Valor: {formatPoints(points)})</span>
        )}
      </p>

      <div className="mt-2">
        {content.type === "open" && (
          <AnswerLines count={content.answerLines} hidden={!showAnswerLines} sample={showAnswers ? content.sampleAnswer : undefined} />
        )}
        {content.type === "essay" && <AnswerLines count={content.answerLines} />}
        {content.type === "multiple_choice" && <McqOptions options={content.options} mcqStyle={mcqStyle} showAnswers={showAnswers} />}
        {content.type === "true_false" && <TrueFalseAnswer answer={content.answer} showAnswers={showAnswers} />}
        {content.type === "matching" && (
          <MatchingColumns left={content.left} right={content.right} pairs={content.pairs} showAnswers={showAnswers} />
        )}
      </div>
    </div>
  );
}

function AnswerLines({ count, sample, hidden }: { count: number; sample?: string; hidden?: boolean }) {
  if (sample) {
    return (
      <p className="rounded-md border border-dashed border-brand/40 bg-brand-soft/40 px-3 py-2 text-[10pt] text-brand-dark">
        <span className="font-semibold">Resposta esperada: </span>
        <Latex text={sample} />
      </p>
    );
  }

  if (count <= 0) return null;

  return (
    <div className="space-y-4 pt-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("h-px", hidden ? "bg-transparent" : "bg-black/20")} />
      ))}
    </div>
  );
}

function McqOptions({ options, mcqStyle, showAnswers }: { options: McqOption[]; mcqStyle: PageSettings["mcqStyle"]; showAnswers: boolean }) {
  return (
    <div className="space-y-1.5 pl-1">
      {options.map((option) => {
        const isCorrect = showAnswers && option.is_correct;
        const marker = mcqStyle === "bubble" ? (isCorrect ? "●" : "○") : `${option.key.toUpperCase()})`;

        return (
          <p key={option.key} className={cn("flex gap-2", isCorrect && "font-semibold text-brand-dark")}>
            <span className="w-6 shrink-0">{marker}</span>
            <span>
              <Latex text={option.text} />
            </span>
          </p>
        );
      })}
    </div>
  );
}

function TrueFalseAnswer({ answer, showAnswers }: { answer: boolean; showAnswers: boolean }) {
  return (
    <div className="flex gap-8 pl-1">
      <span className={cn(showAnswers && answer && "font-semibold text-brand-dark")}>
        ( {showAnswers && answer ? "X" : " "} ) Verdadeiro
      </span>
      <span className={cn(showAnswers && !answer && "font-semibold text-brand-dark")}>
        ( {showAnswers && !answer ? "X" : " "} ) Falso
      </span>
    </div>
  );
}

function MatchingColumns({
  left,
  right,
  pairs,
  showAnswers,
}: {
  left: MatchingItem[];
  right: MatchingItem[];
  pairs: Record<string, string>;
  showAnswers: boolean;
}) {
  return (
    <div className="pl-1">
      <div className="grid grid-cols-2 gap-x-8 gap-y-1">
        <div className="space-y-1">
          {left.map((item) => (
            <p key={item.key}>
              {item.key}. <Latex text={item.text} />
            </p>
          ))}
        </div>
        <div className="space-y-1">
          {right.map((item) => (
            <p key={item.key}>
              {item.key.toUpperCase()}. <Latex text={item.text} />
            </p>
          ))}
        </div>
      </div>
      {showAnswers && (
        <p className="mt-2 text-[10pt] font-semibold text-brand-dark">
          Gabarito: {left.map((item) => `${item.key}-${(pairs[item.key] ?? "?").toUpperCase()}`).join(", ")}
        </p>
      )}
    </div>
  );
}

const BLANK_PATTERN = /(\{\{\s*[^{}]+?\s*\}\})/g;
const BLANK_KEY_PATTERN = /^\{\{\s*([^{}]+?)\s*\}\}$/;

function FillBlankStatement({ statement, blanks, showAnswers }: { statement: string; blanks: Record<string, string>; showAnswers: boolean }) {
  const parts = statement.split(BLANK_PATTERN);

  return (
    <span>
      {parts.map((part, index) => {
        const match = part.match(BLANK_KEY_PATTERN);
        if (!match) return <Latex key={index} text={part} />;

        const key = match[1];
        if (showAnswers) {
          return (
            <span key={index} className="font-semibold text-brand-dark underline">
              {blanks[key] || "?"}
            </span>
          );
        }

        return (
          <span key={index} className="inline-block min-w-16 border-b border-black align-bottom">
            &nbsp;
          </span>
        );
      })}
    </span>
  );
}
