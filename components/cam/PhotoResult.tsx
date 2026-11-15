"use client";
import { useEffect, useRef } from "react";
import type { Lang } from "../../data/content";
import { camCopy } from "../../data/camStudio";
export default function PhotoResult({
  url,
  lang,
  onClose,
}: {
  url: string;
  lang: Lang;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    copy = camCopy[lang];
  useEffect(() => {
    const element = dialog.current;
    const prior = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      prior?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="cam-photo-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={copy.preview}
    >
      <button
        className="cam-dialog-close"
        onClick={onClose}
        aria-label={copy.close}
      >
        ×
      </button>
      <h2>{copy.photoReady}</h2>
      <img src={url} alt={copy.preview} />
      <div className="cam-dialog-actions">
        <button onClick={onClose}>{copy.retake}</button>
        <a
          href={url}
          download={`CHENLE-UNIVERSE-${new Date().toISOString().slice(0, 10)}.png`}
        >
          {copy.save}
        </a>
      </div>
      <p>{copy.mobileSave}</p>
    </dialog>
  );
}
