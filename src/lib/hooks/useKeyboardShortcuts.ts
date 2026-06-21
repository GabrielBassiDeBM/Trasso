"use client";

import { useEffect } from "react";

/** Closes on Escape while `open` is true. */
export function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
}

/** Fires `onSave` on Cmd/Ctrl+S, preventing the browser's save-page dialog. */
export function useSaveShortcut(onSave: () => void) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isSaveCombo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
      if (!isSaveCombo) return;
      event.preventDefault();
      onSave();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);
}
