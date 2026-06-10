import type { ProductUnit } from "@/src/modules/catalog/domain/catalog-product";

export interface EuropeanFoodEntry {
  id: string;
  name: string;
  description: string;
  unit: ProductUnit;
  category: string;
  categorySlug: string;
  originCountryCodes: string[];
  availableCountryCodes: string[];
  aliases: string[];
}

const CATEGORY_NAMES: Record<string, string> = {
  viennoiserie: "Viennoiserie",
  bread: "Bread",
  "cake-pastry": "Cakes and pastries",
  savoury: "Savoury food",
  coffee: "Coffee",
  tea: "Tea",
  "cold-drinks": "Cold drinks",
  "dairy-alternatives": "Dairy and alternatives",
  ingredients: "Ingredients",
};

function entry(
  id: string,
  name: string,
  description: string,
  unit: ProductUnit,
  categorySlug: string,
  originCountryCodes: string[],
  availableCountryCodes: string[],
  aliases: string[] = [],
): EuropeanFoodEntry {
  return {
    id,
    name,
    description,
    unit,
    category: CATEGORY_NAMES[categorySlug] ?? categorySlug,
    categorySlug,
    originCountryCodes,
    availableCountryCodes,
    aliases,
  };
}

/** Bundled European cafe and bakery catalog — no database required. */
export const EUROPEAN_FOOD_CATALOG: EuropeanFoodEntry[] = [
  entry("croissant", "Croissant", "Classic laminated butter pastry.", "item", "viennoiserie", ["FR"], ["FR", "BE", "DE", "ES", "GB", "IE", "IT", "NL", "PT"], ["butter croissant", "Buttercroissant"]),
  entry("pain-au-chocolat", "Pain au chocolat", "Laminated pastry with dark chocolate batons.", "item", "viennoiserie", ["FR"], ["FR", "BE", "DE", "ES", "GB", "IE", "IT", "NL", "PT"], ["chocolate croissant", "Schokocroissant", "napolitana de chocolate"]),
  entry("pain-aux-raisins", "Pain aux raisins", "Spiral pastry with custard and raisins.", "item", "viennoiserie", ["FR"], ["FR", "BE", "DE", "GB", "IE", "NL"], ["raisin swirl"]),
  entry("chausson-aux-pommes", "Chausson aux pommes", "Puff pastry turnover filled with apple.", "item", "viennoiserie", ["FR"], ["FR", "BE", "GB", "IE"]),
  entry("brioche", "Brioche", "Rich soft bread made with butter and eggs.", "item", "viennoiserie", ["FR"], []),
  entry("cinnamon-bun", "Cinnamon bun", "Sweet rolled bun with cinnamon filling.", "item", "viennoiserie", ["SE"], [], ["kanelbulle"]),
  entry("cardamom-bun", "Cardamom bun", "Nordic sweet bun scented with cardamom.", "item", "viennoiserie", ["SE"], ["SE", "NO", "DK", "FI", "DE", "NL", "GB"], ["kardemummabulle"]),
  entry("pastel-de-nata", "Pastel de nata", "Portuguese custard tart in crisp pastry.", "item", "cake-pastry", ["PT"], [], ["Portuguese custard tart", "nata"]),
  entry("cornetto", "Cornetto", "Italian breakfast pastry, plain or filled.", "item", "viennoiserie", ["IT"], ["IT", "FR", "DE", "ES", "PT"], ["Italian croissant"]),
  entry("ensaimada", "Ensaimada", "Coiled sweet pastry from Mallorca.", "item", "viennoiserie", ["ES"], ["ES", "PT", "FR"]),
  entry("scone", "Scone", "British baked good served plain or with fruit.", "item", "cake-pastry", ["GB"], ["GB", "IE", "FR", "NL", "DE"], ["fruit scone"]),
  entry("muffin", "Muffin", "Individual sweet quick bread.", "item", "cake-pastry", ["GB"], []),
  entry("madeleine", "Madeleine", "Small shell-shaped French sponge cake.", "item", "cake-pastry", ["FR"], []),
  entry("canele", "Canele", "Caramelised rum and vanilla pastry from Bordeaux.", "item", "cake-pastry", ["FR"], ["FR", "BE", "GB"], ["canele de Bordeaux"]),
  entry("eclair", "Eclair", "Choux pastry filled with cream and glazed.", "item", "cake-pastry", ["FR"], []),
  entry("tarte-tatin", "Tarte Tatin", "French upside-down caramelised apple tart.", "portion", "cake-pastry", ["FR"], [], ["upside down apple tart"]),
  entry("lemon-drizzle-cake", "Lemon drizzle cake", "Moist lemon sponge with citrus syrup.", "portion", "cake-pastry", ["GB"], ["GB", "IE", "NL", "DE"]),
  entry("carrot-cake", "Carrot cake", "Spiced carrot sponge with cream cheese icing.", "portion", "cake-pastry", ["GB"], []),
  entry("basque-cheesecake", "Basque cheesecake", "Burnt-top creamy cheesecake from San Sebastian.", "portion", "cake-pastry", ["ES"], [], ["tarta de queso vasca"]),
  entry("tiramisu", "Tiramisu", "Italian coffee and mascarpone dessert.", "portion", "cake-pastry", ["IT"], []),
  entry("apple-strudel", "Apple strudel", "Layered pastry with spiced apple filling.", "portion", "cake-pastry", ["AT"], ["AT", "DE", "CZ", "HU", "NL"], ["Apfelstrudel"]),
  entry("black-forest-cake", "Black Forest cake", "Chocolate, cherry, and cream layer cake.", "portion", "cake-pastry", ["DE"], ["DE", "AT", "CH", "NL"], ["Schwarzwalder Kirschtorte"]),
  entry("baguette", "Baguette", "Long crusty French bread.", "item", "bread", ["FR"], [], ["baguette tradition"]),
  entry("sourdough-loaf", "Sourdough loaf", "Naturally leavened artisan bread.", "item", "bread", [], [], ["pain au levain", "Sauerteigbrot"]),
  entry("ciabatta", "Ciabatta", "Open-crumb Italian white bread.", "item", "bread", ["IT"], []),
  entry("focaccia", "Focaccia", "Olive-oil enriched Italian flatbread.", "portion", "bread", ["IT"], []),
  entry("rye-bread", "Rye bread", "Dense bread made primarily with rye flour.", "item", "bread", ["DE"], ["DE", "DK", "SE", "NO", "FI", "NL", "PL"], ["Roggenbrot"]),
  entry("soda-bread", "Soda bread", "Irish quick bread leavened with bicarbonate.", "item", "bread", ["IE"], ["IE", "GB"]),
  entry("pretzel", "Pretzel", "Baked lye bread with a glossy crust.", "item", "bread", ["DE"], ["DE", "AT", "CH", "NL"], ["Brezel"]),
  entry("bagel", "Bagel", "Boiled and baked ring-shaped bread.", "item", "bread", ["PL"], []),
  entry("ham-cheese-croissant", "Ham and cheese croissant", "Croissant filled with ham and cheese.", "item", "savoury", ["FR"], []),
  entry("quiche-lorraine", "Quiche Lorraine", "Savoury tart with egg, cream, and bacon.", "portion", "savoury", ["FR"], [], ["bacon quiche"]),
  entry("croque-monsieur", "Croque monsieur", "Grilled French ham and cheese sandwich.", "item", "savoury", ["FR"], [], ["French ham cheese toastie"]),
  entry("panini", "Panini", "Pressed Italian-style filled sandwich.", "item", "savoury", ["IT"], []),
  entry("empanada", "Empanada", "Filled baked or fried pastry turnover.", "item", "savoury", ["ES"], ["ES", "PT", "FR", "IT"]),
  entry("tortilla-espanola", "Tortilla espanola", "Spanish potato and egg omelette.", "portion", "savoury", ["ES"], ["ES", "PT", "FR"], ["tortilla de patatas"]),
  entry("sausage-roll", "Sausage roll", "Seasoned sausage meat wrapped in puff pastry.", "item", "savoury", ["GB"], ["GB", "IE"], ["Wurst im Blatterteig"]),
  entry("espresso", "Espresso", "Single concentrated espresso coffee.", "portion", "coffee", ["IT"], []),
  entry("double-espresso", "Double espresso", "Double shot of concentrated espresso.", "portion", "coffee", ["IT"], []),
  entry("americano", "Americano", "Espresso lengthened with hot water.", "portion", "coffee", ["IT"], [], ["cafe allonge"]),
  entry("flat-white", "Flat white", "Espresso with thinly textured steamed milk.", "portion", "coffee", [], [], ["cafe blanc"]),
  entry("cappuccino", "Cappuccino", "Espresso with steamed and foamed milk.", "portion", "coffee", ["IT"], []),
  entry("cafe-latte", "Cafe latte", "Espresso with a larger proportion of steamed milk.", "portion", "coffee", ["IT"], [], ["latte", "cafe latte"]),
  entry("cortado", "Cortado", "Espresso balanced with a small amount of warm milk.", "portion", "coffee", ["ES"], [], ["pingo"]),
  entry("cafe-au-lait", "Cafe au lait", "Coffee served with hot milk.", "portion", "coffee", ["FR"], []),
  entry("filter-coffee", "Filter coffee", "Batch-brewed or hand-filtered coffee.", "portion", "coffee", [], [], ["cafe filtre", "Filterkaffee"]),
  entry("black-tea", "Black tea", "Pot or cup of black tea.", "portion", "tea", [], [], ["the noir", "Schwarztee"]),
  entry("earl-grey", "Earl Grey tea", "Black tea scented with bergamot.", "portion", "tea", ["GB"], []),
  entry("green-tea", "Green tea", "Pot or cup of green tea.", "portion", "tea", [], []),
  entry("fresh-orange-juice", "Fresh orange juice", "Freshly pressed orange juice.", "portion", "cold-drinks", [], [], ["jus orange frais", "zumo de naranja"]),
  entry("still-water", "Still water", "Bottled or filtered still water.", "portion", "cold-drinks", [], []),
  entry("sparkling-water", "Sparkling water", "Carbonated mineral or filtered water.", "portion", "cold-drinks", [], [], ["eau gazeuse", "Sprudelwasser"]),
  entry("whole-milk", "Whole milk", "Full-fat dairy milk.", "l", "dairy-alternatives", [], [], ["lait entier", "Vollmilch"]),
  entry("semi-skimmed-milk", "Semi-skimmed milk", "Reduced-fat dairy milk.", "l", "dairy-alternatives", [], [], ["lait demi-ecreme"]),
  entry("oat-milk", "Oat milk", "Oat-based dairy alternative for drinks.", "l", "dairy-alternatives", [], [], ["lait avoine", "Hafermilch", "leche de avena"]),
  entry("almond-milk", "Almond milk", "Almond-based dairy alternative for drinks.", "l", "dairy-alternatives", [], [], ["lait amande"]),
  entry("soy-milk", "Soy milk", "Soy-based dairy alternative for drinks.", "l", "dairy-alternatives", [], [], ["Sojamilch"]),
  entry("butter", "Butter", "Dairy butter for baking and service.", "kg", "ingredients", [], [], ["beurre", "Butter"]),
  entry("wheat-flour", "Wheat flour", "Wheat flour used for bread and pastry.", "kg", "ingredients", [], [], ["farine de ble", "Weizenmehl"]),
  entry("granulated-sugar", "Granulated sugar", "White granulated sugar.", "kg", "ingredients", [], [], ["sucre semoule"]),
  entry("coffee-beans", "Coffee beans", "Roasted whole coffee beans.", "kg", "ingredients", [], [], ["cafe en grains", "Kaffeebohnen"]),
];

export const EUROPEAN_FOOD_BY_ID = new Map(
  EUROPEAN_FOOD_CATALOG.map((product) => [product.id, product]),
);
