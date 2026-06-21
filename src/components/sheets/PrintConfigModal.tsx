"use client";

import { useState } from "react";
import { X, Printer, Shuffle, Accessibility } from "lucide-react";
import { createVariantsAction } from "@/lib/actions/variants";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { useEscapeToClose } from "@/lib/hooks/useKeyboardShortcuts";
import { useT } from "@/lib/i18n/client";

interface PrintConfigModalProps {
  sheetId: string;
  open: boolean;
  onClose: () => void;
  hasAccessibility: boolean;
}

export function PrintConfigModal({ sheetId, open, onClose, hasAccessibility }: PrintConfigModalProps) {
  const t = useT();
  const [versionCount, setVersionCount] = useState(1);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [includeAdapted, setIncludeAdapted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEscapeToClose(open, onClose);

  if (!open) return null;

  async function handlePrint() {
    setCreating(true);
    setError(null);

    if (versionCount > 1 || shuffleOptions) {
      const result = await createVariantsAction(sheetId, versionCount, shuffleOptions);
      setCreating(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      window.open(`/sheets/${sheetId}/print/variants`, "_blank");
    } else {
      setCreating(false);
      window.open(`/sheets/${sheetId}/print`, "_blank");
    }

    if (includeAdapted) {
      window.open(`/sheets/${sheetId}/print?a11y=1`, "_blank");
    }

    onClose();
  }

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content w-full max-w-[440px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-config-title"
      >
        <div className="h-2 btn-gradient" />
        <div className="p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 id="print-config-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              {t("printConfig.title")}
            </h2>
            <button onClick={onClose} aria-label={t("newSheet.close")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft hover:bg-muted-strong">
              <X size={16} />
            </button>
          </div>

          <p className="text-sm text-ink-soft">
            {t("printConfig.desc")}
          </p>

          <div className="max-w-[9rem]">
            <Label htmlFor="version-count">{t("printConfig.versionsLabel")}</Label>
            <Input
              id="version-count"
              type="number"
              min={1}
              max={6}
              value={versionCount}
              onChange={(e) => setVersionCount(Math.max(1, Math.min(6, Number(e.target.value))))}
            />
            <p className="mt-1 text-xs text-ink-faint">{t("printConfig.versionsHint")}</p>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={(e) => setShuffleOptions(e.target.checked)}
              className="h-4 w-4 rounded border-line accent-brand"
            />
            <div>
              <span className="flex items-center gap-1.5 text-sm text-ink">
                <Shuffle size={13} className="text-ink-soft" />
                {t("printConfig.shuffle.label")}
              </span>
              <p className="mt-0.5 text-xs text-ink-faint">{t("printConfig.shuffle.hint")}</p>
            </div>
          </label>

          {hasAccessibility && (
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={includeAdapted}
                onChange={(e) => setIncludeAdapted(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              <div>
                <span className="flex items-center gap-1.5 text-sm text-ink">
                  <Accessibility size={13} className="text-ink-soft" />
                  {t("printConfig.accessible.label")}
                </span>
                <p className="mt-0.5 text-xs text-ink-faint">{t("printConfig.accessible.hint")}</p>
              </div>
            </label>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className={buttonStyles("ghost", "sm")}>{t("newSheet.btn.cancel")}</button>
            <Button type="button" variant="primary" size="sm" onClick={handlePrint} disabled={creating}>
              {creating ? t("printConfig.preparing") : t("printConfig.submit")}
              {!creating && <Printer size={14} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
