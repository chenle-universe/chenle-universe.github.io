import {defaultLook,type StyleLook} from './styleLab';
export const styleReferenceLooks:{id:string;name:string;nameKo:string;look:StyleLook}[]=[
 {id:'pajama-reference',name:'睡衣派对',nameKo:'파자마 파티',look:{...defaultLook,tops:'pajama-shirt',bottoms:'pajama-pants',accessories:['sleep-mask']}},
 {id:'graffiti-reference',name:'涂鸦舞台',nameKo:'그래피티 무대',look:{...defaultLook,tops:'graffiti-tee',bottoms:'trousers',accessories:['black-gloves','gold-chains']}},
 {id:'denim-reference',name:'牛仔日常',nameKo:'데님 데일리',look:{...defaultLook,tops:'denim-jacket',bottoms:'trousers',accessories:['black-cap']}},
 {id:'sailor-reference',name:'海军舞台',nameKo:'세일러 무대',look:{...defaultLook,hair:'hair-blond',tops:'sailor-shirt',bottoms:'trousers',accessories:[]}},
 {id:'basketball-reference',name:'篮球练习室',nameKo:'농구 연습실',look:{...defaultLook,hair:'hair-rollers',tops:'retro-vest',bottoms:'shorts',accessories:[]}},
];
