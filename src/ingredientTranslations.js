// TheMealDB es una API en inglés: tanto los nombres de ingredientes para
// filtrar (filter.php?i=...) como los que devuelve en cada receta están en
// inglés. Este diccionario traduce los términos en español más habituales
// para que la búsqueda y el cálculo de "ingredientes que faltan" funcionen.
export const INGREDIENT_TRANSLATIONS = {
  // Carnes y pescados
  pollo: 'chicken',
  'pechuga de pollo': 'chicken breast',
  'muslo de pollo': 'chicken thigh',
  carne: 'beef',
  'carne picada': 'ground beef',
  ternera: 'beef',
  cerdo: 'pork',
  jamon: 'ham',
  jamón: 'ham',
  panceta: 'bacon',
  bacon: 'bacon',
  pescado: 'fish',
  atun: 'tuna',
  atún: 'tuna',
  salmon: 'salmon',
  salmón: 'salmon',
  gambas: 'shrimp',
  camarones: 'shrimp',
  langostinos: 'shrimp',

  // Cereales, pasta, panadería
  arroz: 'rice',
  pasta: 'pasta',
  espaguetis: 'spaghetti',
  macarrones: 'macaroni',
  pan: 'bread',
  harina: 'flour',
  patata: 'potato',
  patatas: 'potato',
  papa: 'potato',
  papas: 'potato',

  // Lácteos y huevos
  huevo: 'egg',
  huevos: 'eggs',
  leche: 'milk',
  queso: 'cheese',
  mantequilla: 'butter',
  nata: 'cream',
  crema: 'cream',
  yogur: 'yogurt',
  yogurt: 'yogurt',

  // Condimentos y básicos de despensa
  aceite: 'oil',
  'aceite de oliva': 'olive oil',
  vinagre: 'vinegar',
  sal: 'salt',
  pimienta: 'pepper',
  azucar: 'sugar',
  azúcar: 'sugar',
  miel: 'honey',
  mostaza: 'mustard',
  soja: 'soy sauce',
  'salsa de soja': 'soy sauce',

  // Verduras y hortalizas
  tomate: 'tomato',
  tomates: 'tomato',
  cebolla: 'onion',
  'cebolla morada': 'red onion',
  ajo: 'garlic',
  zanahoria: 'carrot',
  zanahorias: 'carrot',
  pimiento: 'pepper',
  'pimiento rojo': 'red pepper',
  'pimiento verde': 'green pepper',
  calabacin: 'zucchini',
  calabacín: 'zucchini',
  berenjena: 'eggplant',
  espinaca: 'spinach',
  espinacas: 'spinach',
  lechuga: 'lettuce',
  pepino: 'cucumber',
  champinones: 'mushrooms',
  champiñones: 'mushrooms',
  setas: 'mushrooms',
  maiz: 'corn',
  maíz: 'corn',
  guisantes: 'peas',
  'judias verdes': 'green beans',
  'judías verdes': 'green beans',
  garbanzos: 'chickpeas',
  lentejas: 'lentils',
  alubias: 'beans',
  frijoles: 'beans',

  // Frutas
  limon: 'lemon',
  limón: 'lemon',
  lima: 'lime',
  naranja: 'orange',
  manzana: 'apple',
  platano: 'banana',
  plátano: 'banana',
  pina: 'pineapple',
  piña: 'pineapple',
  fresa: 'strawberry',
  fresas: 'strawberries',

  // Hierbas y especias
  romero: 'rosemary',
  tomillo: 'thyme',
  oregano: 'oregano',
  orégano: 'oregano',
  albahaca: 'basil',
  perejil: 'parsley',
  cilantro: 'coriander',
  comino: 'cumin',
  canela: 'cinnamon',
  pimenton: 'paprika',
  pimentón: 'paprika',
  jengibre: 'ginger',
  laurel: 'bay leaf',
  vainilla: 'vanilla',

  // Caldos, vinos y otros
  'vino blanco': 'white wine',
  'vino tinto': 'red wine',
  'caldo de pollo': 'chicken stock',
  'caldo de verduras': 'vegetable stock',
  nuez: 'walnut',
  nueces: 'walnuts',
  almendra: 'almond',
  almendras: 'almonds',
}

// Traduce un ingrediente normalizado (minúsculas, sin espacios sobrantes) a
// su nombre en inglés. Si no hay traducción conocida, devuelve el original
// para no bloquear la búsqueda con términos que el usuario ya escribió en
// inglés o que no estén en el diccionario.
export function translateIngredient(name) {
  return INGREDIENT_TRANSLATIONS[name] || name
}
