"use client";
import { useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { worldProgress, type Lang } from '../data/content';
import { scrapbookCopy, scrapbookEdition, throughMyEyesSections, type ScrapbookImage } from '../data/throughMyEyes';
import { PhotoContent } from './eyes/ScrapbookPieces';
import CandyMasthead from './eyes/CandyMasthead';
import { renderScrapbookDesign } from './eyes/SpreadDesigns';

export default function ThroughMyEyes({ lang, onComplete, completed = false }: { lang: Lang; onComplete: () => void; completed?: boolean }) {
  const [page, setPage] = useState(0), [zoom, setZoom] = useState<{ image: ScrapbookImage; number: number } | null>(null), [rewarded, setRewarded] = useState(completed), [dragging, setDragging] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), track = useRef<HTMLDivElement>(null), earned = useRef(completed), drag = useRef<{ x: number; left: number; id: number; moved: boolean } | null>(null), suppressClick = useRef(false);
  const copy = scrapbookCopy[lang], total = throughMyEyesSections.length, headingId = useId(), last = page === total - 1;
  const currentPage = useRef(page); currentPage.current = page;
  useEffect(() => { if (completed) { earned.current = true; setRewarded(true); } }, [completed]);
  useEffect(() => { if (zoom) dialog.current?.showModal(); else dialog.current?.close(); }, [zoom]);
  // A rotation/resized viewport must stay on the same paper, rather than between pages.
  useEffect(() => {
    const el = track.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => { el.scrollTo({left: currentPage.current * el.clientWidth, behavior: 'instant'}); });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  function behavior(): ScrollBehavior { return typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'; }
  function turn(next: number) {
    if (next < 0 || next >= total) return;
    setPage(next); setZoom(null);
    track.current?.scrollTo({left: next * track.current.clientWidth, behavior: behavior()});
  }
  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    // Touch and trackpad use the browser's native scroll-snap, including momentum.
    if (event.pointerType !== 'mouse' || event.button !== 0 || (event.target as HTMLElement).closest('summary,details,a,input')) return;
    drag.current = {x: event.clientX, left: event.currentTarget.scrollLeft, id: event.pointerId, moved: false};
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (!start.moved && Math.abs(dx) <= 7) return;
    if (!start.moved) { start.moved = true; suppressClick.current = true; event.currentTarget.style.scrollSnapType = 'none'; setDragging(true); event.currentTarget.setPointerCapture(event.pointerId); }
    event.preventDefault(); event.currentTarget.scrollLeft = start.left - dx;
  }
  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current; drag.current = null;
    if (!start || start.id !== event.pointerId || !start.moved) return;
    event.currentTarget.style.scrollSnapType = '';
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const next = Math.max(0, Math.min(total - 1, Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)));
    turn(next);
  }
  function collectStar() { if (earned.current) return; earned.current = true; setRewarded(true); onComplete(); }
  return <section className="eyes-zine eyes-reader page-enter" onKeyDown={event => {
    if (zoom || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); turn(page + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); turn(page - 1); }
  }}>
    <CandyMasthead volume={scrapbookEdition.volume}/>
    <div className="eyes-reader-topline"><p>{copy.subtitle}</p><span>{copy.swipe} <span aria-hidden="true">↔</span></span></div>
    <div className="eyes-book">
      <div className={`eyes-page-track ${dragging ? 'is-dragging' : ''}`} ref={track} role="region" aria-label={copy.reader} tabIndex={0}
        onScroll={event => {
          const el = event.currentTarget;
          if (!el.clientWidth) return;
          const next = Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / el.clientWidth)));
          setPage(next);
        }}
        onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}
        onDragStart={event => event.preventDefault()}
        onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
        {throughMyEyesSections.map((section, index) => <article key={section.id} className={`eyes-spread layout-${section.layoutType}`} aria-labelledby={`${headingId}-${index}`} aria-hidden={index !== page} inert={index !== page}>
          <div className="eyes-page-paper">
            {renderScrapbookDesign({section, index, lang, headingId: `${headingId}-${index}`,
              onZoom: (image, number) => setZoom({image, number}),
              finalAction: index === total - 1 && (worldProgress.allowPlaceholderCompletion || section.images.some(image => image.src)) ? <button type="button" className="eyes-star-button" disabled={rewarded} onClick={collectStar}>{rewarded ? <Check size={18}/> : <span aria-hidden="true">✦</span>}{rewarded ? copy.earned : copy.reward}</button> : null,
            })}
          </div>
        </article>)}
      </div>
    </div>
    <nav className="eyes-page-controls" aria-label={copy.index}>
      <button type="button" onClick={() => turn(page - 1)} disabled={page === 0} aria-label={copy.previous}><ArrowLeft size={19}/><span>{copy.previous}</span></button>
      <span aria-live="polite" aria-atomic="true"><b>{String(page + 1).padStart(2,'0')}</b> / {String(total).padStart(2,'0')}<small>{throughMyEyesSections[page].subtitle[lang]}</small></span>
      <button type="button" onClick={() => turn(page + 1)} disabled={last} aria-label={copy.next}><span>{copy.next}</span><ArrowRight size={19}/></button>
    </nav>
    <nav className="eyes-chapter-tabs" aria-label={copy.index}>{throughMyEyesSections.map((chapter, index) => <button type="button" key={chapter.id} aria-current={index === page ? 'page' : undefined} aria-label={`${String(index + 1).padStart(2,'0')} · ${chapter.subtitle[lang]}`} title={chapter.subtitle[lang]} onClick={() => turn(index)}><b>{String(index + 1).padStart(2,'0')}</b></button>)}</nav>
    <dialog ref={dialog} className="eyes-photo-dialog" aria-label={copy.enlarge} onClose={() => setZoom(null)} onClick={event => { if (event.target === event.currentTarget) setZoom(null); }}><button type="button" className="eyes-close-photo" onClick={() => setZoom(null)} aria-label={copy.close}><X size={23}/></button>{zoom && <figure><div className="eyes-zoom-media"><PhotoContent image={zoom.image} number={zoom.number} lang={lang}/></div><figcaption>{zoom.image.caption[lang]}</figcaption></figure>}</dialog>
  </section>;
}
