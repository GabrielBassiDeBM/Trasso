"use client";

import { X } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/Button";
import { useEscapeToClose } from "@/lib/hooks/useKeyboardShortcuts";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEscapeToClose(open, onCancel);

  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(27,20,48,.42)", backdropFilter: "blur(3px)" }}
      onClick={onCancel}
    >
      <div
        className="modal-content w-full max-w-[400px] overflow-hidden rounded-2xl bg-surface shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className={danger ? "h-2 bg-danger" : "h-2 btn-gradient"} />
        <div className="p-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 id="confirm-dialog-title" className="text-xl font-bold text-ink" style={{ letterSpacing: "-0.01em" }}>
              {title}
            </h2>
            <button
              onClick={onCancel}
              aria-label={cancelLabel}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-ink-soft hover:bg-muted-strong"
            >
              <X size={16} />
            </button>
          </div>

          <p id="confirm-dialog-message" className="text-sm text-ink-soft">
            {message}
          </p>

          <div className="flex justify-end gap-3">
            <button type="button" autoFocus onClick={onCancel} className={buttonStyles("ghost", "sm")}>
              {cancelLabel}
            </button>
            <Button
              type="button"
              variant={danger ? "danger" : "primary"}
              size="sm"
              onClick={onConfirm}
              disabled={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
