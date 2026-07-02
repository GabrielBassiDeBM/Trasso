import { memo } from "react";
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
  const { margins, columns, numbering, mcqStyle, pointsPerQuestion, showAnswerLines } = pageSettings;
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
        // `@page` keeps margin at 0 (see below) so Chrome never reserves space for its own
        // print header/footer (date, URL, title) — we draw the margin ourselves via padding.
        // `clone` re-applies that padding on every page fragment instead of only the first/last.
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
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
                  showAnswerLines={showAnswerLines}
                  showAnswers={showAnswers}
                />
              );
            }

            if (block.group.block_type === "section_header") {
              return <SectionHeaderBlock key={block.group.id} group={block.group} />;
            }

            return <PassageBlock key={block.group.id} group={block.group} />;
          })}
        </div>
      </div>
    </div>
  );
}

function SectionHeaderBlock({ group }: { group: GroupItem }) {
  if (!group.title) return null;

  if (group.level === 2) {
    return (
      <div className="mb-3 break-inside-avoid border-b border-black/30 pb-1">
        <h3 className="text-[11pt] font-semibold text-black">{group.title}</h3>
      </div>
    );
  }

  return (
    <div className="mb-5 break-inside-avoid border-b-2 border-black/70 pb-1.5">
      <h2 className="text-[13pt] font-semibold uppercase tracking-wide text-black">{group.title}</h2>
    </div>
  );
}

/** Memoized: reference passages can be huge KaTeX documents; only re-render when the group itself changes. */
const PassageBlock = memo(function PassageBlock({ group }: { group: GroupItem }) {
  if (!group.passage && !group.instructions) return null;

  // A near-page-tall passage with `break-inside: avoid` gets pushed whole to the
  // next page, leaving the previous page blank — so only short passages are kept
  // unsplittable; long ones flow across pages with the border cloned per fragment.
  const keepTogether = (group.passage?.length ?? 0) <= 600;

  return (
    <div className={cn("mb-5", keepTogether && "break-inside-avoid")}>
      {group.title && (
        <p className="font-print-serif mb-1.5 text-[10.5pt] font-semibold uppercase tracking-wide text-black">
          {group.title}
        </p>
      )}
      {group.passage && (
        <div
          className="font-print-serif mb-3 rounded-md border border-black/15 bg-black/[0.02] p-3 text-[10.5pt] leading-relaxed text-black"
          style={{ boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
        >
          <Latex text={group.passage} />
        </div>
      )}
      {group.instructions && (
        <p className="font-print-serif mb-3 text-[10.5pt] italic leading-relaxed text-black">
          <Latex text={group.instructions} />
        </p>
      )}
    </div>
  );
});

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
    case "image":
      if (block.props.url) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={block.props.url} alt="" className="h-full w-full rounded-sm object-contain" />;
      }
      return (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-black/30 text-xs text-black/60">
          Photo / image
        </div>
      );
  }
}
