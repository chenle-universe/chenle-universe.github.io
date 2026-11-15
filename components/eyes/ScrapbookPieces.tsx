"use client";
import {useId,useState,type CSSProperties} from "react";
import {ArrowUpRight,ChevronDown} from "lucide-react";
import type {Lang} from "../../data/content";
import {scrapbookCopy,type ScrapbookImage,type ScrapbookNote,type ScrapbookSticker} from "../../data/throughMyEyes";

export function SilverCharm({ heart = false }: { heart?: boolean }) {
  const id = useId();
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
    <defs><linearGradient id={id} x1="12" y1="8" x2="85" y2="95" gradientUnits="userSpaceOnUse"><stop stopColor="#fffef5"/><stop offset=".25" stopColor="#c3cad6"/><stop offset=".48" stopColor="#fff"/><stop offset=".65" stopColor="#8594ab"/><stop offset=".82" stopColor="#eef4ff"/><stop offset="1" stopColor="#b3a0bd"/></linearGradient></defs>
    {heart ? <path d="M50 88C39 76 8 56 8 32C8 7 39 4 50 25C61 4 92 7 92 32C92 56 61 76 50 88Z" fill={`url(#${id})`} stroke="#fff" strokeWidth="2"/> : <><path d="M50 3L61 37L96 47L63 60L51 97L39 62L4 50L38 38Z" fill={`url(#${id})`} stroke="#fff" strokeWidth="2"/><path d="M50 5L51 49L95 47L54 55L51 95L47 53L7 50L46 46Z" fill="#ffffff90"/></>}
  </svg>;
}

export function PhotoContent({ image, number, lang }: { image: ScrapbookImage; number: number; lang: Lang }) {
  return image.src ? <img src={image.src} alt={image.alt[lang]} loading="lazy" /> : <div className="eyes-photo-placeholder">
    <span className="eyes-placeholder-code">IMAGE / {String(number + 1).padStart(2, '0')}</span><b aria-hidden="true">{String(number + 1).padStart(2, '0')}</b><span className="eyes-placeholder-label">{scrapbookCopy[lang].photo}</span><i aria-hidden="true" />
  </div>;
}
export function PhotoTile({ image, number, lang, onZoom }: { image: ScrapbookImage; number: number; lang: Lang; onZoom: () => void }) {
  const copy = scrapbookCopy[lang];
  return <figure className={`eyes-photo photo-${number} treatment-${image.treatment}`} style={{ '--photo-ratio': image.aspectRatio } as CSSProperties}>
    <button type="button" className="eyes-photo-button" onClick={onZoom} aria-label={`${copy.enlarge} · ${image.src ? image.alt[lang] : copy.photo} ${number + 1}`}>
      <span className="eyes-photo-media"><PhotoContent image={image} number={number} lang={lang}/><ArrowUpRight className="eyes-photo-zoom-mark" size={18}/></span><span className="eyes-photo-caption">{image.caption[lang]}</span>
    </button>
  </figure>;
}
export function PaperNote({ note, number, lang }: { note: ScrapbookNote; number: number; lang: Lang }) {
  const body = <><p>{note.text[lang]}</p>{note.sample && <small>{scrapbookCopy[lang].sample}</small>}</>;
  return note.folded ? <details className={`eyes-note note-${number} tone-${note.tone} is-folded`}><summary aria-label={`${scrapbookCopy[lang].unfold} · ${note.label}`}><span>{note.label}</span><ChevronDown size={18}/></summary><div className="eyes-note-inside">{body}</div></details> : <aside className={`eyes-note note-${number} tone-${note.tone}`}><span className="eyes-note-label">{note.label}</span>{body}</aside>;
}
export function SecretSticker({ sticker, number, lang }: { sticker: ScrapbookSticker; number: number; lang: Lang }) {
  const [open, setOpen] = useState(false); const id = useId();
  return <div className={`eyes-sticker sticker-${number}`}><button type="button" aria-label={`${sticker.label} · ${scrapbookCopy[lang].hidden}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}><SilverCharm heart={sticker.shape === 'heart'}/><span>{sticker.label}<i>↗</i></span></button><div className="eyes-secret-note" id={id} hidden={!open}><span>{scrapbookCopy[lang].hidden}</span><p>{sticker.note[lang]}</p>{sticker.sample && <small>{scrapbookCopy[lang].sample}</small>}</div></div>;
}

