import type { CoverBlock, CoverLayout, PageSettings } from "@/lib/sheets/defaults";
import type { QuestionItem } from "@/components/sheets/QuestionList";
import { Latex } from "@/components/math/Latex";
import { QuestionRenderer } from "./QuestionRenderer";
import { cn } from "@/lib/utils/cn";

interface SheetDocumentProps {
  title: string;
  pageSettings: PageSettings;
  coverLayout: CoverLayout;
  items: QuestionItem[];
  mode?: "preview" | "print";
  showAnswers?: boolean;
  className?: string;
}

export function SheetDocument({
  title,
  pageSettings,
  coverLayout,
  items,
  mode = "preview",
  showAnswers = false,
  className,
}: SheetDocumentProps) {
  const { margins, columns, numbering, mcqStyle } = pageSettings;
  const coverHeight = coverLayout.blocks.reduce((max, block) => Math.max(max, block.y + block.h), 0) + 6;

  return (
    <div
      className={cn("sheet-page bg-white text-ink", mode === "preview" && "shadow-lg shadow-ink/10", className)}
      style={{
        width: "210mm",
        minHeight: mode === "print" ? "297mm" : undefined,
        padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
      }}
    >
      <CoverSection blocks={coverLayout.blocks} title={title} height={coverHeight} margins={margins} />

      <div className={cn("mt-6", columns === 2 && "columns-2 gap-8")}>
        {items.map((item, index) => (
          <QuestionRenderer
            key={item.sheetQuestionId}
            item={item}
            index={index}
            numbering={numbering}
            mcqStyle={mcqStyle}
            showAnswers={showAnswers}
          />
        ))}
      </div>
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
  switch (block.type) {
    case "title":
      return (
        <div className="flex h-full flex-col justify-center">
          {block.props.text && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{block.props.text}</p>
          )}
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink">{title}</h1>
          {block.props.subtitle && <p className="mt-1 text-sm text-ink-soft">{block.props.subtitle}</p>}
        </div>
      );
    case "student_field":
      return (
        <div className="flex h-full items-end gap-2 pb-1">
          <span className="whitespace-nowrap text-sm text-ink-soft">{block.props.label}:</span>
          <span className="flex-1 border-b border-ink/40" />
        </div>
      );
    case "score_box":
      return (
        <div className="flex h-full items-center gap-2">
          <span className="whitespace-nowrap text-sm text-ink-soft">{block.props.label}:</span>
          <span className="h-6 flex-1 rounded-md border border-ink/30" />
        </div>
      );
    case "instructions":
      return (
        <div className="h-full rounded-md border border-ink/15 bg-canvas/60 p-3 text-xs leading-relaxed text-ink-soft">
          <Latex text={block.props.text ?? ""} />
        </div>
      );
    case "logo":
      if (block.props.url) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={block.props.url} alt="Logo" className="h-full w-full object-contain" />;
      }
      return (
        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-ink/30 text-xs text-ink-faint">
          Logo
        </div>
      );
  }
}
