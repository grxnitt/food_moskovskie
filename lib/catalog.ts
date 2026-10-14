export const CENTER: [number, number] = [59.89185, 30.31873];
export const CHECKED_AT = "14.10.2026";
export type Dish = {
  id: string; name: string; venue: string; address: string; coordinates: [number, number];
  price: number; category: "snack" | "lunch" | "coffee"; cuisine: "european" | "asian";
  eatMinutes: number; image: string; description: string; source: string; priceNote?: string;
};
const tseh = "https://www.tseh85.ru/catalog";
const bushe = "https://bushe.ru/products?category=sendvici&cityId=1";
const z28 = { venue: "ЦЕХ85", address: "Заставская ул., 28", coordinates: [59.888677, 30.324438] as [number, number] };
const z46 = { venue: "ЦЕХ85", address: "Заставская ул., 46, к. 1", coordinates: [59.887503, 30.314833] as [number, number] };
const lig = { venue: "ЦЕХ85", address: "Лиговский пр., 287", coordinates: [59.895869, 30.331913] as [number, number] };
const b139 = { venue: "буше", address: "Московский пр., 139, к. 1", coordinates: [59.8798719, 30.3185063] as [number, number] };
export const dishes: Dish[] = [
  { id: "roll", ...z28, name: "Ролл с цыплёнком", price: 279, category: "snack", cuisine: "european", eatMinutes: 12, image: "/images/roll.jpg", source: tseh, description: "Сытный вариант, который удобно взять с собой. Позиция из онлайн-меню сети; наличие в этой пекарне уточните перед визитом." },
  { id: "pasta", ...lig, name: "Паста Болоньезе", price: 319, category: "lunch", cuisine: "european", eatMinutes: 20, image: "/images/pasta.jpg", source: tseh, description: "Паста Болоньезе с говядиной из раздела готовой еды. Подойдёт для полноценного обеда между парами." },
  { id: "coffee", ...z46, name: "Капучино + круассан", price: 348, category: "coffee", cuisine: "european", eatMinutes: 10, image: "/images/coffee.jpg", source: tseh, priceNote: "Капучино 229 ₽ + классический круассан 119 ₽. Это сумма двух позиций, не акция.", description: "Классический круассан и небольшой капучино. Можно посидеть с конспектом или взять кофе по дороге." },
  { id: "sandwich", ...b139, name: "Сэндвич с цыплёнком", price: 320, category: "snack", cuisine: "european", eatMinutes: 12, image: "/images/sandwich.jpg", source: bushe, description: "Сэндвич с цыплёнком и овощами, 210 г. Цена из онлайн-каталога сети; в кафе она может отличаться." },
  { id: "soba", ...z28, name: "Соба с курицей", price: 299, category: "lunch", cuisine: "asian", eatMinutes: 20, image: "/images/soba.png", source: tseh, description: "Соба с курицей и овощами из раздела готовой еды. Для тех, кому хочется чего-то сытнее перекуса." },
  { id: "soup", ...z46, name: "Грибной крем-суп", price: 239, category: "lunch", cuisine: "european", eatMinutes: 15, image: "/images/soup.png", source: tseh, description: "Грибной крем-суп из онлайн-меню сети. Состав и аллергены уточняйте у сотрудников пекарни." },
  { id: "croissant", ...b139, name: "Круассан с моцареллой", price: 330, category: "snack", cuisine: "european", eatMinutes: 12, image: "/images/croissant.jpg", source: bushe, description: "Цельнозерновой круассан с моцареллой, 160 г. Позиция из каталога сэндвичей буше." },
  { id: "cheesecakes", ...lig, name: "Сырники", price: 189, category: "coffee", cuisine: "european", eatMinutes: 12, image: "/images/cheesecakes.png", source: tseh, description: "Сырники из раздела завтраков. Кофе и другие напитки оплачиваются отдельно." },
];
export function distanceMeters(a: [number, number], b: [number, number]) {
  const rad = (v: number) => v * Math.PI / 180;
  const lat = rad(b[0] - a[0]); const lon = rad(b[1] - a[1]);
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(Math.sin(lat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(lon / 2) ** 2), Math.sqrt(1 - (Math.sin(lat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(lon / 2) ** 2))));
}
export function enrichDish(d: Dish) {
  const distance = distanceMeters(CENTER, d.coordinates);
  const walkMinutes = Math.max(2, Math.ceil(distance * 1.25 / 80));
  return { ...d, distance, walkMinutes, totalMinutes: walkMinutes * 2 + d.eatMinutes };
}
export type CatalogDish = ReturnType<typeof enrichDish> & { rating: number | null; reviewCount: number };
