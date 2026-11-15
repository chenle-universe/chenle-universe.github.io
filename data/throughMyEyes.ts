export type ScrapbookText = { zh: string; ko: string };
export type ScrapbookLayout = 'first-impression' | 'observations' | 'editorial' | 'moments' | 'reflection' | 'final-note';
export type ScrapbookImage = {
  id: string;
  src: string;
  alt: ScrapbookText;
  caption: ScrapbookText;
  treatment: 'polaroid' | 'torn' | 'film';
  aspectRatio: string;
};
export type ScrapbookNote = {
  id: string;
  label: string;
  text: ScrapbookText;
  folded: boolean;
  tone: 'pink' | 'blue' | 'cream';
  sample: boolean;
};
export type ScrapbookSticker = {
  id: string;
  label: string;
  shape: 'star' | 'heart';
  note: ScrapbookText;
  sample: boolean;
};
export type ScrapbookSection = {
  id: string;
  title: string;
  subtitle: ScrapbookText;
  intro: ScrapbookText;
  images: ScrapbookImage[];
  notes: ScrapbookNote[];
  quotes: { id: string; text: ScrapbookText; sample: boolean }[];
  stickers: ScrapbookSticker[];
  layoutType: ScrapbookLayout;
};
const text = (zh: string, ko: string): ScrapbookText => ({ zh, ko });
export const scrapbookEdition = { preview: false, volume: '01' };
const assetsForScrapbook = ["/images/memory-gacha/photo-01.png", "/images/memory-gacha/photo-02.png", "/images/memory-gacha/photo-03.JPG", "/images/memory-gacha/photo-04.JPG", "/images/memory-gacha/photo-05.JPG", "/images/memory-gacha/photo-06.JPG", "/images/memory-gacha/photo-07.JPG", "/images/memory-gacha/photo-08.JPG", "/images/memory-gacha/photo-09.JPG", "/images/memory-gacha/photo-10.JPG"];
let imageNumber = 0;
const image = (id: string, treatment: ScrapbookImage['treatment'], aspectRatio = '4 / 5'): ScrapbookImage => ({
  id, src: assetsForScrapbook[(imageNumber++) % assetsForScrapbook.length], treatment, aspectRatio,
  alt: text('辰乐的照片', '천러 사진'),
  caption: text('A MOMENT TO KEEP · CHENLE', 'A MOMENT TO KEEP · CHENLE'),
});
const note = (id: string, label: string, zh: string, ko: string, tone: ScrapbookNote['tone'], folded = false): ScrapbookNote => ({
  id, label, text: text(zh, ko), tone, folded, sample: false,
});
const quote = (id: string, zh: string, ko: string) => ({ id, text: text(zh, ko), sample: false });
const stickers = (id: string): ScrapbookSticker[] => [
  { id: `${id}-star`, label: 'tiny detail', shape: 'star', note: text('这里我很喜欢', '여기가 참 좋아'), sample: false },
  { id: `${id}-heart`, label: 'little proof', shape: 'heart', note: text('这一颗小星星，也装着一份应援。', '작은 별에도 응원의 마음을 담아요.'), sample: false },
];

// The cover is a designed print using the supplied lavender-jacket photograph.
// All other empty image sources are intentional. Replace each source/caption and the
// clearly marked sample notes with fan-facing content; never infer personal stories.
export const throughMyEyesSections: ScrapbookSection[] = [
  {
    id: 'first-impression', title: 'THROUGH MY EYES', subtitle: text('封面 · 从粉丝的视角', '표지 · 팬들의 시선으로'),
    intro: text('A Little Scrapbook for All Fans', 'A Little Scrapbook for All Fans'),
    layoutType: 'first-impression',
    images: [{id: 'first-main', src: '/images/through-my-eyes/cover-music-dolphin.webp', treatment: 'film', aspectRatio: '4 / 5', alt: text('钟辰乐照片制作的雾蓝与糖果粉星星、音符和海豚拼贴封面，花体标题 THROUGH MY EYES', '천러 사진으로 만든 미스트 블루와 분홍색 별, 음표, 돌고래 콜라주 표지, THROUGH MY EYES'), caption: text('THROUGH MY EYES · 封面', 'THROUGH MY EYES · 표지')}],
    notes: [], quotes: [], stickers: [],
  },
  {
    id: 'things-i-notice', title: 'THINGS I NOTICE', subtitle: text('一起发现的小细节', '함께 발견한 작은 것들'),
    intro: text('歌声、笑容和小小的表情，都是值得珍藏的理由。', '노래와 웃음, 작은 표정까지 소중히 간직해요.'),
    layoutType: 'observations', images: [image('notice-main', 'polaroid'), image('notice-detail', 'film', '1 / 1')],
    notes: [note('notice-one', 'tiny detail / 01', '很像你会做出来的事', '네가 할 법한 일이야', 'blue'), note('notice-two', 'a folded thought', '这句我记住了', '이 말은 기억해 뒀어', 'pink', true), note('notice-three', 'another detail', '每个人都可以找到自己喜欢的小细节。', '각자 좋아하는 작은 모습을 찾아보아요.', 'cream')],
    quotes: [], stickers: stickers('notice'),
  },
  {
    id: 'on-stage', title: 'ON STAGE', subtitle: text('舞台上的你', '무대 위의 너'),
    intro: text('聚光灯亮起的时候，让掌声成为最温暖的回应。', '조명이 켜지면 따뜻한 박수로 마음을 전해요.'),
    layoutType: 'editorial', images: [image('stage-main', 'torn', '3 / 2'), image('stage-detail', 'film', '3 / 2'), image('stage-inset', 'polaroid', '1 / 1'), image('stage-small', 'polaroid', '3 / 4')],
    notes: [note('stage-note', 'on repeat', '这里我很喜欢', '여기가 참 좋아', 'cream'), note('stage-fold', 'in the margins', '愿每次开口歌唱，都能听见热爱的回声。', '노래할 때마다 사랑의 메아리가 들리길.', 'blue', true)],
    quotes: [quote('stage-quote', '这句我记住了', '이 말은 기억해 뒀어')], stickers: stickers('stage'),
  },
  {
    id: 'little-moments', title: 'LITTLE MOMENTS', subtitle: text('舞台之外的小片段', '무대 밖 작은 순간들'),
    intro: text('也为舞台之外的快乐应援：打球、休息，和自在的日常。', '농구와 휴식, 자유로운 일상의 행복도 응원해요.'),
    layoutType: 'moments', images: [image('moment-main', 'polaroid', '1 / 1'), image('moment-two', 'film', '4 / 3'), image('moment-three', 'polaroid', '1 / 1'), image('moment-four', 'torn', '4 / 3')],
    notes: [note('moment-note', 'this smile again', '这张真的很可爱', '이 사진 정말 귀여워', 'pink'), note('moment-fold', 'a small aside', '很像你会做出来的事', '네가 할 법한 일이야', 'cream', true)],
    quotes: [], stickers: stickers('moments'),
  },
  {
    id: 'still-looking', title: 'WHY I KEEP LOOKING', subtitle: text('还是会想多看一眼', '계속 바라보게 되는 이유'),
    intro: text('让喜欢成为日常里的一束光，也把自己的生活过得闪亮。', '좋아하는 마음을 일상의 빛으로, 자신의 하루도 반짝이게.'),
    layoutType: 'reflection', images: [image('looking-main', 'torn'), image('looking-small', 'polaroid', '1 / 1')],
    notes: [note('looking-note', 'still looking', '这里我很喜欢', '여기가 참 좋아', 'blue'), note('looking-fold', 'one more thought', '因为音乐相遇，也带着快乐继续前行。', '음악으로 만나 행복을 안고 앞으로 걸어요.', 'cream', true)],
    quotes: [quote('looking-quote', 'You look the most like yourself when you laugh.', '웃을 때 가장 너다운 모습이 보여.')], stickers: stickers('looking'),
  },
  {
    id: 'small-final-note', title: 'SMALL FINAL NOTE', subtitle: text('最后的一张小纸条', '마지막 작은 메모'),
    intro: text('来自不同地方的祝福，在这里汇成同一片星空。', '서로 다른 곳의 축하가 하나의 별하늘이 돼요.'),
    layoutType: 'final-note', images: [image('final-photo', 'polaroid', '1 / 1')],
    notes: [note('final-note', 'a note to keep', '生日快乐！愿你自由、健康，永远享受热爱。', '생일 축하해! 자유롭고 건강하게, 좋아하는 것을 즐기길.', 'cream', true)],
    quotes: [], stickers: stickers('final'),
  },
];

export const scrapbookCopy = {
  zh: {
    subtitle: 'A Little Scrapbook for All Fans', preview: 'FAN EDITION',
    previewNote: '封面已使用你提供的照片；内页仍为照片占位与示例短句。',
    photo: '照片占位', sample: '示例批注', sampleQuote: '引语示例',
    index: '章节目录', previous: '上一页', next: '下一页', page: '页',
    enlarge: '放大查看', close: '关闭大图', unfold: '展开纸条',
    hidden: '贴纸里的批注', reward: '收下这颗生日星星', earned: '这颗生日星星已收下',
    swipe: '左右滑动翻页', reader: '可滑动翻阅的电子杂志',
    end: 'end of this little edition',
  },
  ko: {
    subtitle: 'A Little Scrapbook for All Fans', preview: 'FAN EDITION',
    previewNote: '표지에는 제공한 사진을 사용했어요. 내지는 사진 자리와 예시 문장이에요.',
    photo: '사진 자리', sample: '예시 메모', sampleQuote: '인용 예시',
    index: '목차', previous: '이전 페이지', next: '다음 페이지', page: '페이지',
    enlarge: '크게 보기', close: '확대 사진 닫기', unfold: '메모 펼치기',
    hidden: '스티커 속 메모', reward: '생일 별 받기', earned: '생일 별을 받았어요',
    swipe: '좌우로 밀어서 넘기기', reader: '좌우로 넘겨 보는 디지털 진',
    end: 'end of this little edition',
  },
};
