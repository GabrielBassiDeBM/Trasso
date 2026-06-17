import { PAPER_SIZES, type CoverBlock, type CoverLayout, type PageSettings } from "@/lib/sheets/defaults";
import type { QuestionItem } from "@/components/sheets/QuestionList";
import type { GroupItem } from "./QuestionGroupEditor";
import { Latex } from "@/components/math/Latex";
import { QuestionRenderer } from "./QuestionRenderer";
import { cn } from "@/lib/utils/cn";

interface SheetDocumentProps {
  title: string;
  pageSettings: PageSettings;
  coverLayout: CoverLayout;
  items: QuestionItem[];
  groups?: GroupItem[];
  mode?: "preview" | "print";
  showAnswers?: boolean;
  className?: string;
}

type DocumentBlock =
  | { type: "item"; sortKey: number; item: QuestionItem }
  | { type: "group"; sortKey: number; group: GroupItem };

function buildDocumentBlocks(items: QuestionItem[], groups: GroupItem[]): DocumentBlock[] {
  const blocks: DocumentBlock[] = [
    ...items.map((item) => ({ type: "item" as const, sortKey: item.position ?? Infinity, item })),
    ...groups.map((group) => ({ type: "group" as const, sortKey: group.position ?? Infinity, group })),
  ];
  return blocks.sort((a, b) => a.sortKey - b.sortKey);
}

function withQuestionIndex(blocks: DocumentBlock[]): { block: DocumentBlock; index: number }[] {
  let index = 0;
  return blocks.map((block) => {
    if (block.type !== "item") return { block, index: -1 };
    const current = index;
    index += 1;
    return { block, index: current };
  });
}

export function SheetDocument({
  title,
  pageSettings,
  coverLayout,
  items,
  groups = [],
  mode = "preview",
  showAnswers = false,
  className,
}: SheetDocumentProps) {
  const { margins, columns, numbering, mcqStyle, pointsPerQuestion } = pageSettings;
  const coverHeight = coverLayout.blocks.reduce((max, block) => Math.max(max, block.y + block.h), 0) + 6;
  const paper = PAPER_SIZES[pageSettings.size] ?? PAPER_SIZES.A4;
  const blocks = withQuestionIndex(buildDocumentBlocks(items, groups));

  return (
    <div
      className={cn("sheet-page relative bg-white text-black", mode === "preview" && "shadow-lg shadow-ink/10", className)}
      style={{
        width: `${paper.widthMm}mm`,
        minHeight: mode === "print" ? `${paper.heightMm}mm` : undefined,
        padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
      }}
    >
      {mode === "print" && (
        <style>{`@page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }`}</style>
      )}

      {/* Watermark — print:fixed repeats it on every physical page when printed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden print:fixed"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/trasso-logo-watermark.svg"
          alt=""
          className="h-auto w-[110%]"
          style={{ opacity: 0.06, maxWidth: `${paper.widthMm * 1.1}mm` }}
        />
      </div>

      {/* Corner credit — print:fixed repeats it on every physical page when printed */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1.5 print:fixed"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/trasso-logo.svg" alt="" className="h-5 w-5" style={{ opacity: 0.55 }} />
        <span className="text-[9.5pt] leading-none" style={{ color: "#9ca3af" }}>
          trassolistas.vercel.app
        </span>
      </div>

      <div className="relative z-10">
        <CoverSection blocks={coverLayout.blocks} title={title} height={coverHeight} margins={margins} />

        <div className={cn("mt-6", columns === 2 && "columns-2 gap-8")}>
          {blocks.map(({ block, index }) => {
            if (block.type === "item") {
              return (
                <QuestionRenderer
                  key={block.item.sheetQuestionId}
                  item={block.item}
                  index={index}
                  numbering={numbering}
                  mcqStyle={mcqStyle}
                  pointsPerQuestion={pointsPerQuestion}
                  showAnswers={showAnswers}
                />
              );
            }

            return <PassageBlock key={block.group.id} group={block.group} />;
          })}
        </div>
      </div>
    </div>
  );
}

function PassageBlock({ group }: { group: GroupItem }) {
  if (!group.passage && !group.instructions) return null;

  return (
    <div className="mb-5 break-inside-avoid">
      {group.passage && (
        <div className="mb-3 rounded-md border border-black/15 bg-black/[0.02] p-3 text-[10.5pt] leading-relaxed text-black">
          <Latex text={group.passage} />
        </div>
      )}
      {group.instructions && (
        <p className="mb-3 text-[10.5pt] italic leading-relaxed text-black">
          <Latex text={group.instructions} />
        </p>
      )}
    </div>
  );
}

interface CoverSectionProps {
  blocks: CoverBlock[];
  title: string;
  height: number;
  margins: PageSettings["margins"];
}

function CoverSection({ blocks, title, height, margins }: CoverSectionProps) {
  return (
    <div
      className="relative"
      style={{
        height: `${height}mm`,
        margin: `-${margins.top}mm -${margins.right}mm 0 -${margins.left}mm`,
      }}
    >
      {blocks.map((block) => (
        <div
          key={block.id}
          className="absolute"
          style={{
            left: `${block.x}mm`,
            top: `${block.y}mm`,
            width: `${block.w}mm`,
            height: `${block.h}mm`,
          }}
        >
          <CoverBlockContent block={block} title={title} />
        </div>
      ))}
    </div>
  );
}

export function CoverBlockContent({ block, title }: { block: CoverBlock; title: string }) {
  const color = block.props.color || undefined;
  const fill = block.props.fill || undefined;
  switch (block.type) {
    case "title": {
      const kickerColor = block.props.kickerColor || undefined;
      const titleColor = block.props.titleColor || undefined;
      return (
        <div className="flex h-full flex-col justify-center">
          {block.props.text && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black" style={{ color: kickerColor }}>
              {block.props.text}
            </p>
          )}
          <h1 className="font-display text-2xl font-semibold leading-tight text-black" style={{ color: titleColor }}>
            {title}
          </h1>
          {block.props.subtitle && (
            <p className="mt-1 text-sm text-black" style={{ color: titleColor }}>
              {block.props.subtitle}
            </p>
          )}
        </div>
      );
    }
    case "student_field":
      return (
        <div className="flex h-full items-end gap-2 pb-1">
          <span className="whitespace-nowrap text-sm text-black" style={{ color }}>
            {block.props.label}:
          </span>
          <span className="flex-1 border-b border-black/40" style={{ borderColor: fill }} />
        </div>
      );
    case "score_box":
      return (
        <div className="flex h-full items-center gap-2">
          <span className="whitespace-nowrap text-sm text-black" style={{ color }}>
            {block.props.label}:
          </span>
          <span className="h-6 flex-1 rounded-md border border-black/30" style={{ borderColor: fill }} />
        </div>
      );
    case "instructions":
      return (
        <div
          className="h-full rounded-md border border-black/15 bg-canvas/60 p-3 text-xs leading-relaxed text-black"
          style={{ color, backgroundColor: fill }}
        >
          <Latex text={block.props.text ?? ""} />
        </div>
      );
    case "logo":
      if (block.props.url) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={block.props.url} alt="Logo" className="h-full w-full object-contain" />;
      }
      return (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-black/30 text-xs text-black/60">
          Logo
        </div>
      );
  }
}
