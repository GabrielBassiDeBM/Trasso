"use client";

import { useRef, useState, useTransition } from "react";
import { Rnd } from "react-rnd";
import type { CoverBlock, CoverBlockType, CoverLayout } from "@/lib/sheets/defaults";
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

interface BlockPreset {
  type: CoverBlockType;
  label: string;
  w: number;
  h: number;
  props: Record<string, string>;
}

const BLOCK_LIBRARY: BlockPreset[] = [
  { type: "title", label: "Título", w: 174, h: 20, props: { text: "Avaliação", subtitle: "" } },
  { type: "student_field", label: "Campo do aluno", w: 80, h: 10, props: { label: "Campo" } },
  { type: "score_box", label: "Caixa de nota", w: 50, h: 10, props: { label: "Nota" } },
  { type: "instructions", label: "Instruções", w: 174, h: 24, props: { text: "" } },
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

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Adicionar bloco à capa</span>
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
        style={{ width: CANVAS_WIDTH_PX, height: mmToPx(canvasHeightMm) }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedId(null);
        }}
      >
        {layout.blocks.map((block) => {
          const isSelected = block.id === selectedId;
          return (
            <Rnd
              key={block.id}
              bounds="parent"
              size={{ width: mmToPx(block.w), height: mmToPx(block.h) }}
              position={{ x: mmToPx(block.x), y: mmToPx(block.y) }}
              onMouseDown={() => setSelectedId(block.id)}
              onDragStop={(_event, data) => patchBlock(block.id, { x: pxToMm(data.x), y: pxToMm(data.y) })}
              onResizeStop={(_event, _direction, ref, _delta, position) =>
                patchBlock(block.id, {
                  w: pxToMm(ref.offsetWidth),
                  h: pxToMm(ref.offsetHeight),
                  x: pxToMm(position.x),
                  y: pxToMm(position.y),
                })
              }
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
          Clique em um bloco para editar o conteúdo, arraste para reposicionar e use a alça no canto para
          redimensionar.
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
    <div className="space-y-4 rounded-xl border border-ink/10 bg-canvas p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{blockTypeLabel(block.type)}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remover bloco
        </Button>
      </div>

      <BlockFields block={block} onChangeProps={onChangeProps} />

      <div>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Posição e tamanho (mm)</span>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <GeometryInput label="X" value={block.x} onChange={(value) => onChangeGeometry({ x: value })} />
          <GeometryInput label="Y" value={block.y} onChange={(value) => onChangeGeometry({ y: value })} />
          <GeometryInput label="Largura" value={block.w} onChange={(value) => onChangeGeometry({ w: value })} />
          <GeometryInput label="Altura" value={block.h} onChange={(value) => onChangeGeometry({ h: value })} />
        </div>
      </div>
    </div>
  );
}

function blockTypeLabel(type: CoverBlockType): string {
  switch (type) {
    case "title":
      return "Bloco de título";
    case "student_field":
      return "Campo do aluno";
    case "score_box":
      return "Caixa de nota";
    case "instructions":
      return "Instruções";
    case "logo":
      return "Logo";
  }
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
            <Label htmlFor="cover-kicker">Texto de destaque (acima do título)</Label>
            <Input
              id="cover-kicker"
              value={block.props.text ?? ""}
              onChange={(event) => onChangeProps({ text: event.target.value })}
              placeholder="Ex.: Avaliação Bimestral"
            />
          </div>
          <div>
            <Label htmlFor="cover-subtitle">Subtítulo</Label>
            <Input
              id="cover-subtitle"
              value={block.props.subtitle ?? ""}
              onChange={(event) => onChangeProps({ subtitle: event.target.value })}
              placeholder="Ex.: 9º ano — Matemática"
            />
          </div>
          <p className="text-xs text-ink-faint">O título principal é o nome da lista, editável no topo da página.</p>
        </div>
      );
    case "student_field":
    case "score_box":
      return (
        <div>
          <Label htmlFor="cover-label">Rótulo</Label>
          <Input
            id="cover-label"
            value={block.props.label ?? ""}
            onChange={(event) => onChangeProps({ label: event.target.value })}
            placeholder="Ex.: Nome"
          />
        </div>
      );
    case "instructions":
      return (
        <div className="space-y-2">
          <Label htmlFor="cover-instructions">Texto das instruções</Label>
          <Textarea
            id="cover-instructions"
            value={block.props.text ?? ""}
            onChange={(event) => onChangeProps({ text: event.target.value })}
            placeholder="Ex.: Leia atentamente cada questão. Use $\\LaTeX$ para equações."
          />
          {block.props.text ? (
            <div className="rounded-md border border-ink/10 bg-surface p-2 text-xs text-ink-soft">
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
      <Label>Imagem do logo</Label>
      {block.props.url ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.props.url} alt="Logo" className="h-14 w-14 rounded-md border border-ink/10 object-contain" />
          <Button type="button" variant="outline" size="sm" onClick={() => onChangeProps({ url: "" })}>
            Remover imagem
          </Button>
        </div>
      ) : (
        <p className="text-xs text-ink-faint">Nenhuma imagem enviada ainda.</p>
      )}
      <div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => fileInputRef.current?.click()}>
          {isPending ? "Enviando…" : block.props.url ? "Trocar imagem" : "Enviar imagem"}
        </Button>
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <p className="text-xs text-ink-faint">PNG, JPG ou SVG, até 2 MB.</p>
    </div>
  );
}
