import type { ChenleFortune } from '../data/chenleFortunes';
/** Uniform draw over eligible whole records; the immediately preceding card is excluded. */
export function chooseFortune(fortunes: readonly ChenleFortune[], previousId: string | null, random = Math.random): ChenleFortune {
  const eligible = fortunes.filter(f => fortunes.length === 1 || f.id !== previousId);
  if (!eligible.length) throw new Error('No fortunes available');
  return eligible[Math.min(eligible.length - 1, Math.floor(random() * eligible.length))];
}
