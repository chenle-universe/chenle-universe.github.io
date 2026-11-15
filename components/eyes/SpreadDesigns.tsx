import type {ReactNode} from 'react';
import type {Lang} from '../../data/content';
import {scrapbookCopy,throughMyEyesSections,type ScrapbookImage,type ScrapbookSection} from '../../data/throughMyEyes';
import {PhotoTile,PaperNote,SecretSticker} from './ScrapbookPieces';

type DesignProps = {
  section: ScrapbookSection;
  index: number;
  lang: Lang;
  headingId: string;
  onZoom: (image: ScrapbookImage, number: number) => void;
  finalAction: ReactNode;
};
const photo = (p: DesignProps, n: number) => p.section.images[n] && <PhotoTile key={p.section.images[n].id} image={p.section.images[n]} number={n} lang={p.lang} onZoom={() => p.onZoom(p.section.images[n],n)}/>;
const note = (p: DesignProps, n: number) => p.section.notes[n] && <PaperNote key={p.section.notes[n].id} note={p.section.notes[n]} number={n} lang={p.lang}/>;
const sticker = (p: DesignProps, n: number) => p.section.stickers[n] && <SecretSticker key={p.section.stickers[n].id} sticker={p.section.stickers[n]} number={n} lang={p.lang}/>;
const intro = (p: DesignProps) => <p className="eyes-intro">{p.section.intro[p.lang]}</p>;
const quote = (p: DesignProps) => p.section.quotes.map(q => <blockquote className="eyes-design-quote" key={q.id}><p>{q.text[p.lang]}</p>{q.sample && <cite>{scrapbookCopy[p.lang].sampleQuote}</cite>}</blockquote>);

function cover(p: DesignProps) {
  return <div className="eyes-design eyes-cover-board" data-design="risograph-photo-cover">
    <h2 id={p.headingId} className="eyes-sr-only">{p.section.title}</h2>
    <p className="eyes-intro eyes-sr-only">{p.section.intro[p.lang]}</p>
    {photo(p,0)}
  </div>;
}

function photocopy(p: DesignProps) {
  return <div className="eyes-design photocopy-board" data-design="photocopy-typefield">
    <div className="photocopy-main">{photo(p,0)}</div>
    <div className="photocopy-small">{photo(p,1)}</div>
    <header className="photocopy-title"><span>02 / TINY DETAILS</span><h2 id={p.headingId}>{p.section.title}</h2><p>{p.section.subtitle[p.lang]}</p></header>
    <div className="photocopy-type-top" aria-hidden="true">notice<br/>notice<br/>notice</div>
    <div className="photocopy-type-side" aria-hidden="true">a little<br/>closer /</div>
    <div className="photocopy-note-a">{note(p,0)}</div>
    <div className="photocopy-note-b">{note(p,1)}</div>
    <div className="photocopy-note-c">{note(p,2)}</div>
    <div className="photocopy-intro">{intro(p)}</div>
    <div className="photocopy-diamonds">{sticker(p,0)}{sticker(p,1)}</div>
    <span className="photocopy-register" aria-hidden="true">+ + + / 02</span>
  </div>;
}

function stripes(p: DesignProps) {
  return <div className="eyes-design stripe-board" data-design="striped-sticker-collage">
    <header className="stripe-title"><span>03 / SOUND & MOMENTS</span><h2 id={p.headingId}>{p.section.title}</h2><p>{p.section.subtitle[p.lang]}</p></header>
    <div className="stripe-label-a">{note(p,0)}</div><div className="stripe-label-b">{note(p,1)}</div>
    <div className="stripe-main-photo">{photo(p,0)}</div>
    <div className="stripe-overprint">{photo(p,1)}</div>
    <div className="stripe-inset-left">{photo(p,2)}</div>
    <div className="stripe-inset-low">{photo(p,3)}</div>
    <div className="stripe-wing" aria-hidden="true"><svg viewBox="0 0 160 110"><path d="M150 98C113 89 38 58 29 30C25 17 43 13 54 31C19 10 3 26 25 46C2 43 2 64 33 73C14 87 39 99 72 93"/><path d="M108 26C87 1 67 11 75 32C83 47 109 56 109 56C109 56 137 37 138 22C139 4 116 3 108 26Z"/></svg></div>
    <div className="stripe-sticker-a">{sticker(p,0)}</div><div className="stripe-sticker-b">{sticker(p,1)}</div>
    <div className="stripe-quote">{quote(p)}</div><div className="stripe-intro">{intro(p)}</div>
    <span className="stripe-handline" aria-hidden="true">↝</span>
  </div>;
}

function dots(p: DesignProps) {
  return <div className="eyes-design dots-board" data-design="polkadot-double-feature">
    <header className="dots-title"><span>04 / OFF STAGE</span><h2 id={p.headingId}>{p.section.title}</h2><p>{p.section.subtitle[p.lang]}</p></header>
    <div className="dots-profile-panel"><div className="dots-profile">{photo(p,0)}</div><div className="dots-label">{note(p,0)}</div><div className="dots-heart">{sticker(p,0)}</div><div className="dots-pearl">{sticker(p,1)}</div></div>
    <div className="dots-wide-feature">{photo(p,1)}<span aria-hidden="true">little<br/>moments ♡</span></div>
    <div className="dots-overprints"><div>{photo(p,2)}</div><div className="dots-fold">{note(p,1)}</div><div>{photo(p,3)}</div></div>
    <div className="dots-footer">{intro(p)}</div>
  </div>;
}

function poster(p: DesignProps) {
  const words=p.section.title.split(' '), last=words.pop();
  return <div className="eyes-design poster-board" data-design="type-and-portrait-poster">
    <header className="poster-type"><span>05 / A PERSONAL EDITORIAL</span><h2 id={p.headingId} aria-label={p.section.title}><span>{words.join(' ')}</span><strong>{last}</strong></h2></header>
    <div className="poster-portrait">{photo(p,0)}</div>
    <div className="poster-script" aria-hidden="true">still looking</div>
    <div className="poster-color-chips" aria-hidden="true"><i/><i/></div>
    <div className="poster-quote">{quote(p)}</div><div className="poster-intro">{intro(p)}</div>
    <div className="poster-inset">{photo(p,1)}</div>
    <div className="poster-note-a">{note(p,0)}</div><div className="poster-note-b">{note(p,1)}</div>
    <div className="poster-seal">{sticker(p,0)}</div><div className="poster-corner">{sticker(p,1)}</div>
  </div>;
}

function backcover(p: DesignProps) {
  return <div className="eyes-design backcover-board" data-design="envelope-back-cover">
    <header className="backcover-title"><span>06 / THE LAST PAPER</span><h2 id={p.headingId}>{p.section.title}</h2><p>{p.section.subtitle[p.lang]}</p></header>
    <div className="backcover-stamp">{photo(p,0)}</div>
    <div className="backcover-letter">{intro(p)}<div className="backcover-envelope">{note(p,0)}</div></div>
    <div className="backcover-contents"><span>INSIDE THIS LITTLE EDITION</span><ol>{throughMyEyesSections.slice(0,-1).map((s,i)=><li key={s.id}><b>{String(i+1).padStart(2,'0')}</b>{s.title}</li>)}</ol></div>
    <div className="backcover-mark-a">{sticker(p,0)}</div><div className="backcover-mark-b">{sticker(p,1)}</div>
    <div className="backcover-release"><p>{scrapbookCopy[p.lang].end}</p>{p.finalAction}<div className="backcover-barcode" aria-hidden="true"/></div>
  </div>;
}

// Each renderer owns a separate DOM composition, rather than recoloring a shared grid.
export function renderScrapbookDesign(p: DesignProps) {
  switch(p.section.layoutType) {
    case 'first-impression': return cover(p);
    case 'observations': return photocopy(p);
    case 'editorial': return stripes(p);
    case 'moments': return dots(p);
    case 'reflection': return poster(p);
    case 'final-note': return backcover(p);
  }
}
