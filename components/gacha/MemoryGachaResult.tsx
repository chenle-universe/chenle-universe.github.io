"use client";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "../../data/content";
import type { MemoryGachaPhoto } from "../../data/memoryGacha";

export default function MemoryGachaResult({ photo, lang, capsuleSrc, edge, onAgain }: {
  photo: MemoryGachaPhoto;
  lang: Lang;
  capsuleSrc: string;
  edge: number;
  onAgain: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const caption = lang === "zh" ? photo.captionZh : photo.captionKo;
  useEffect(() => {
    if (zoomed) dialog.current?.showModal();
    else dialog.current?.close();
  }, [zoomed]);
  return <>
    <article className="capsule-prize-card memory-photo-card" aria-label={lang === "zh" ? "抽到的照片卡" : "뽑은 포토 카드"}>
      <img className={`memory-capsule-mini edge-${edge}`} src={capsuleSrc} alt="" aria-hidden="true" draggable={false} />
      <button type="button" className="memory-photo-window memory-photo-button" onClick={() => setZoomed(true)} aria-label={lang === "zh" ? "放大查看照片" : "사진 확대 보기"}>
        <img src={photo.image} width={photo.width} height={photo.height} alt={lang === "zh" ? "辰乐的照片" : "천러 사진"} />
      </button>
      <p className="memory-photo-caption" lang={lang === "zh" ? "zh-CN" : "ko"}>{caption}</p>
      <button type="button" className="memory-one-more" onClick={onAgain}>ONE MORE?</button>
    </article>
    <dialog ref={dialog} className="memory-photo-zoom" onClose={() => setZoomed(false)} onClick={event => { if (event.target === event.currentTarget) setZoomed(false); }} aria-label={lang === "zh" ? "照片大图" : "확대 사진"}>
      <button type="button" className="memory-zoom-close" onClick={() => setZoomed(false)} aria-label={lang === "zh" ? "关闭大图" : "확대 사진 닫기"}>×</button>
      {zoomed && <img src={photo.image} width={photo.width} height={photo.height} alt={lang === "zh" ? "辰乐的照片" : "천러 사진"} />}
    </dialog>
  </>;
}
