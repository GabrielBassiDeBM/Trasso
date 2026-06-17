"use client";

import { useRef, useState, useTransition } from "react";
import { Rnd } from "react-rnd";
import type { CoverBlock, CoverBlockType, CoverLayout } from "@/lib/sheets/defaults";
import { computeSnap, GRID_SIZE_MM, type SnapRect } from "@/lib/sheets/snapping";
import { uploadLogoAction } from "@/lib/actions/sheets";
import { CoverBlockContent } from "./SheetDocument";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Latex } from "@/components/math/Latex";
import { cn } from "@/lib/utils/cn";

const PAGE_WIDTH_MM = 210;
const CANVAS_WIDTH_PX = 700;
const PX_PER_MM = CANVAS_WIDTH_PX / PAGE_WIDTH_MM;
const MIN_CANVAS_HEIGHT_MM = 110;
const GUIDE_COLOR = "#ff3b6e";

interface BlockPreset {
  type: CoverBlockType;
  label: string;
  w: number;
  h: number;
  props: Record<string, string>;
}

const BLOCK_LIBRARY: BlockPreset[] = [
  { type: "title", label: "Title", w: 174, h: 20, props: { text: "Assessment", subtitle: "" } },
  { type: "student_field", label: "Student field", w: 80, h: 10, props: { label: "Field" } },
  { type: "score_box", label: "Score box", w: 50, h: 10, props: { label: "Score" } },
  { type: "instructions", label: "Instructions", w: 174, h: 24, props: { text: "" } },
  { type: "logo", label: "Logo", w: 30, h: 30, props: {} },
];

const HANDLE_STYLE: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 9999,
  background: "var(--color-brand)",
  border: "2px solid var(--color-surface)",
};

const RESIZE_HANDLE_STYLES = {
  topLeft: { ...HANDLE_STYLE, left: -5, top: -5 },
  topRight: { ...HANDLE_STYLE, right: -5, top: -5 },
  bottomLeft: { ...HANDLE_STYLE, left: -5, bottom: -5 },
  bottomRight: { ...HANDLE_STYLE, right: -5, bottom: -5 },
};

function mmToPx(mm: number) {
  return mm * PX_PER_MM;
}

function pxToMm(px: number) {
  return Math.max(0, Math.round(px / PX_PER_MM));
}

interface CoverDesignerProps {
  title: string;
  layout: CoverLayout;
  onChange: (layout: CoverLayout) => void;
}

export function CoverDesigner({ title, layout, onChange }: CoverDesignerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const selected = layout.blocks.find((block) => block.id === selectedId) ?? null;

  const canvasHeightMm = Math.max(
    MIN_CANVAS_HEIGHT_MM,
    layout.blocks.reduce((max, block) => Math.max(max, block.y + block.h), 0) + 12,
  );

  function setBlocks(blocks: CoverBlock[]) {
    onChange({ blocks });
  }

  function patchBlock(id: string, patch: Partial<CoverBlock>) {
    setBlocks(layout.blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }

  function patchProps(id: string, props: Record<string, string>) {
    setBlocks(
      layout.blocks.map((block) => (block.id === id ? { ...block, props: { ...block.props, ...props } } : block)),
    );
  }

  function removeBlock(id: string) {
    setBlocks(layout.blocks.filter((block) => block.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  function addBlock(preset: BlockPreset) {
    const id = `${preset.type}-${crypto.randomUUID()}`;
    const block: CoverBlock = {
      id,
      type: preset.type,
      x: 18,
      y: 14,
      w: preset.w,
      h: preset.h,
      props: { ...preset.props },
    };
    setBlocks([...layout.blocks, block]);
    setSelectedId(id);
  }

  function blockToRect(id: string, x: number, y: number, w: number, h: number): SnapRect {
    return { id, x: pxToMm(x), y: pxToMm(y), w: pxToMm(w), h: pxToMm(h) };
  }

  function previewGuides(rect: SnapRect) {
    const { guidesX, guidesY } = computeSnap(rect, layout.blocks, PAGE_WIDTH_MM);
    setGuides({ x: guidesX, y: guidesY });
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Add block to cover</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {BLOCK_LIBRARY.map((preset) => (
            <Button key={preset.type} type="button" variant="outline" size="sm" onClick={() => addBlock(preset)}>
              + {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <div
        className="relative mx-auto overflow-hidden rounded-md border border-ink/15 bg-white shadow-sm"
        style={{
          width: CANVAS_WIDTH_PX,
          height: mmToPx(canvasHeightMm),
          backgroundImage:
            "linear-gradient(to right, rgba(27,20,48,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(27,20,48,0.06) 1px, transparent 1px)",
          backgroundSize: `${mmToPx(GRID_SIZE_MM)}px ${mmToPx(GRID_SIZE_MM)}px`,
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedId(null);
        }}
      >
        {guides.x.map((x) => (
          <div
            key={`gx-${x}`}
            className="pointer-events-none absolute top-0 bottom-0 z-20"
            style={{ left: mmToPx(x), width: 1, background: GUIDE_COLOR }}
          />
        ))}
        {guides.y.map((y) => (
          <div
            key={`gy-${y}`}
            className="pointer-events-none absolute left-0 right-0 z-20"
            style={{ top: mmToPx(y), height: 1, background: GUIDE_COLOR }}
          />
        ))}

        {layout.blocks.map((block) => {
          const isSelected = block.id === selectedId;
          return (
            <Rnd
              key={block.id}
              bounds="parent"
              size={{ width: mmToPx(block.w), height: mmToPx(block.h) }}
              position={{ x: mmToPx(block.x), y: mmToPx(block.y) }}
              onMouseDown={() => setSelectedId(block.id)}
              onDrag={(_event, data) => previewGuides(blockToRect(block.id, data.x, data.y, mmToPx(block.w), mmToPx(block.h)))}
              onDragStop={(_event, data) => {
                const rect = blockToRect(block.id, data.x, data.y, mmToPx(block.w), mmToPx(block.h));
                const snapped = computeSnap(rect, layout.blocks, PAGE_WIDTH_MM);
                patchBlock(block.id, { x: snapped.x, y: snapped.y });
                setGuides({ x: [], y: [] });
              }}
              onResize={(_event, _direction, ref, _delta, position) =>
                previewGuides(blockToRect(block.id, position.x, position.y, ref.offsetWidth, ref.offsetHeight))
              }
              onResizeStop={(_event, _direction, ref, _delta, position) => {
                const rect = blockToRect(block.id, position.x, position.y, ref.offsetWidth, ref.offsetHeight);
                const snapped = computeSnap(rect, layout.blocks, PAGE_WIDTH_MM);
                patchBlock(block.id, { x: snapped.x, y: snapped.y, w: rect.w, h: rect.h });
                setGuides({ x: [], y: [] });
              }}
              enableResizing={isSelected}
              resizeHandleStyles={RESIZE_HANDLE_STYLES}
              className={isSelected ? "z-10" : "z-0"}
            >
              <div
                className={cn(
                  "h-full w-full cursor-move overflow-hidden rounded-sm ring-1 ring-inset transition-colors",
                  isSelected ? "ring-2 ring-brand" : "ring-transparent hover:ring-ink/15",
                )}
              >
                <div className="pointer-events-none h-full w-full">
                  <CoverBlockContent block={block} title={title} />
                </div>
              </div>
            </Rnd>
          );
        })}
      </div>

      {selected ? (
        <BlockInspector
          key={selected.id}
          block={selected}
          onChangeProps={(props) => patchProps(selected.id, props)}
          onChangeGeometry={(patch) => patchBlock(selected.id, patch)}
          onRemove={() => removeBlock(selected.id)}
        />
      ) : (
        <p className="text-sm text-ink-soft">
          Click a block to edit its content, drag to reposition, and use the corner handle to resize. Blocks snap to
          the grid and to nearby objects automatically.
        </p>
      )}
    </div>
  );
}

interface BlockInspectorProps {
  block: CoverBlock;
  onChangeProps: (props: Record<string, string>) => void;
  onChangeGeometry: (patch: Partial<CoverBlock>) => void;
  onRemove: () => void;
}

function BlockInspector({ block, onChangeProps, onChangeGeometry, onRemove }: BlockInspectorProps) {
  return (
    <div className="space-y-4 rounded-xl border border-line bg-canvas p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{blockTypeLabel(block.type)}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove block
        </Button>
      </div>

      <BlockFields block={block} onChangeProps={onChangeProps} />

      <ColorFields block={block} onChangeProps={onChangeProps} />

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Position and size (mm)</span>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <GeometryInput label="X" value={block.x} onChange={(value) => onChangeGeometry({ x: value })} />
          <GeometryInput label="Y" value={block.y} onChange={(value) => onChangeGeometry({ y: value })} />
          <GeometryInput label="Width" value={block.w} onChange={(value) => onChangeGeometry({ w: value })} />
          <GeometryInput label="Height" value={block.h} onChange={(value) => onChangeGeometry({ h: value })} />
        </div>
      </div>
    </div>
  );
}

function blockTypeLabel(type: CoverBlockType): string {
  switch (type) {
    case "title":
      return "Title block";
    case "student_field":
      return "Student field";
    case "score_box":
      return "Score box";
    case "instructions":
      return "Instructions";
    case "logo":
      return "Logo";
  }
}

const COLOR_FIELDS: Record<CoverBlockType, { key: string; label: string }[]> = {
  title: [
    { key: "kickerColor", label: "Kicker text color" },
    { key: "titleColor", label: "Sheet name color" },
  ],
  student_field: [
    { key: "color", label: "Label color" },
    { key: "fill", label: "Underline color" },
  ],
  score_box: [
    { key: "color", label: "Label color" },
    { key: "fill", label: "Box border color" },
  ],
  instructions: [
    { key: "color", label: "Text color" },
    { key: "fill", label: "Background color" },
  ],
  logo: [{ key: "fill", label: "Placeholder color" }],
};

function ColorFields({ block, onChangeProps }: { block: CoverBlock; onChangeProps: (props: Record<string, string>) => void }) {
  const fields = COLOR_FIELDS[block.type];
  if (fields.length === 0) return null;

  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Colors</span>
      <div className="mt-2 flex flex-wrap gap-4">
        {fields.map((field) => (
          <ColorInput
            key={field.key}
            label={field.label}
            value={block.props[field.key]}
            onChange={(value) => onChangeProps({ [field.key]: value })}
          />
        ))}
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#1b1430"}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-line bg-surface p-1"
        />
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

function GeometryInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        max={PAGE_WIDTH_MM}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function BlockFields({ block, onChangeProps }: { block: CoverBlock; onChangeProps: (props: Record<string, string>) => void }) {
  switch (block.type) {
    case "title":
      return (
        <div className="space-y-3">
          <div>
            <Label htmlFor="cover-kicker">Kicker text (above the title)</Label>
            <Input
              id="cover-kicker"
              value={block.props.text ?? ""}
              onChange={(event) => onChangeProps({ text: event.target.value })}
              placeholder="e.g. Quarterly Assessment"
            />
          </div>
          <div>
            <Label htmlFor="cover-subtitle">Subtitle</Label>
            <Input
              id="cover-subtitle"
              value={block.props.subtitle ?? ""}
              onChange={(event) => onChangeProps({ subtitle: event.target.value })}
              placeholder="e.g. 10th Grade — Algebra"
            />
          </div>
          <p className="text-xs text-ink-faint">The main title is the sheet name, editable at the top of the page.</p>
        </div>
      );
    case "student_field":
    case "score_box":
      return (
        <div>
          <Label htmlFor="cover-label">Label</Label>
          <Input
            id="cover-label"
            value={block.props.label ?? ""}
            onChange={(event) => onChangeProps({ label: event.target.value })}
            placeholder="e.g. Name"
          />
        </div>
      );
    case "instructions":
      return (
        <div className="space-y-2">
          <Label htmlFor="cover-instructions">Instructions text</Label>
          <Textarea
            id="cover-instructions"
            value={block.props.text ?? ""}
            onChange={(event) => onChangeProps({ text: event.target.value })}
            placeholder="e.g. Read each question carefully. Use $\\LaTeX$ for equations."
          />
          {block.props.text ? (
            <div className="rounded-md border border-line bg-surface p-2 text-xs text-ink-soft">
              <Latex text={block.props.text} />
            </div>
          ) : null}
        </div>
      );
    case "logo":
      return <LogoField block={block} onChangeProps={onChangeProps} />;
  }
}

function LogoField({ block, onChangeProps }: { block: CoverBlock; onChangeProps: (props: Record<string, string>) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadLogoAction(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onChangeProps({ url: result.url });
    });

    event.target.value = "";
  }

  return (
    <div className="space-y-2">
      <Label>Logo image</Label>
      {block.props.url ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.props.url} alt="Logo" className="h-14 w-14 rounded-md border border-line object-contain" />
          <Button type="button" variant="outline" size="sm" onClick={() => onChangeProps({ url: "" })}>
            Remove image
          </Button>
        </div>
      ) : (
        <p className="text-xs text-ink-faint">No image uploaded yet.</p>
      )}
      <div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => fileInputRef.current?.click()}>
          {isPending ? "Uploading…" : block.props.url ? "Replace image" : "Upload image"}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-ink-faint">PNG, JPG, or SVG, up to 2 MB.</p>
    </div>
  );
}
