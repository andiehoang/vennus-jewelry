/* =================================================================
   VENNUS JEWELRY — Product Data
   -----------------------------------------------------------------
   THIS IS THE FILE YOU EDIT TO ADD / REMOVE / CHANGE PRODUCTS.
   Every product on the site (shop grid, product pages, related
   items) is generated from this single array — nothing else needs
   to change when you add a new piece.

   HOW TO ADD A PRODUCT:
   1. Copy an existing object below (from { to },).
   2. Give it a unique "id" (just increase the number by 1).
   3. Fill in name, category, price, description, details.
   4. Set "images" to how many photos you plan to use (this just
      controls how many gallery placeholder boxes appear — once you
      have real photos, see the README for how to swap them in).
   5. Set "inStock" to true or false, and "quantity" to however many
      you have on hand (used for the "low stock" note).

   CATEGORIES currently used across the site's navigation:
   "necklaces", "earrings", "bracelets", "rings"
   Keep category values lowercase and matching the nav exactly.
   ================================================================= */

var VENNUS_PRODUCTS = [
  {
    id: 1,
    name: "Akoya Solitaire Necklace",
    category: "necklaces",
    price: 480,
    compareAt: null,
    tag: "new",
    sku: "VJ-NK-001",
    images: 4,
    description: "A single Akoya pearl suspended on a fine 14k gold-filled chain. Quietly luminous, made to be worn every day and layered on special ones.",
    details: [
      "7–7.5mm AAA Akoya pearl, 14k gold-filled chain",
      "Adjustable length, 16\u201318 in",
      "Hypoallergenic, water-resistant clasp",
      "Comes in a Vennus signature box with care card"
    ],
    options: { label: "Chain Length", values: ["16 in", "17 in", "18 in"] },
    inStock: true,
    quantity: 14
  },
  {
    id: 2,
    name: "Marfa Baroque Pendant",
    category: "necklaces",
    price: 610,
    compareAt: 690,
    tag: "sale",
    sku: "VJ-NK-002",
    images: 4,
    description: "An irregular baroque pearl set in a sculptural gold bezel — organic, understated, and entirely one-of-one in its shape.",
    details: [
      "10\u201312mm freshwater baroque pearl, vermeil bezel",
      "18 in chain with 2 in extender",
      "Each pearl is unique in shape and lustre",
      "Comes in a Vennus signature box with care card"
    ],
    options: { label: "Chain Length", values: ["18 in", "20 in"] },
    inStock: true,
    quantity: 6
  },
  {
    id: 3,
    name: "Tourterelle Pearl Strand",
    category: "necklaces",
    price: 890,
    compareAt: null,
    tag: null,
    sku: "VJ-NK-003",
    images: 5,
    description: "A classic single strand of hand-knotted, colour-matched pearls in the palest dove tone — the quiet foundation piece of any collection.",
    details: [
      "6\u20136.5mm hand-knotted cultured pearls",
      "17 in princess length, sterling silver clasp",
      "Individually hand-strung and knotted",
      "Comes in a Vennus signature box with care card"
    ],
    options: null,
    inStock: true,
    quantity: 9
  },
  {
    id: 4,
    name: "Chai Drop Earrings",
    category: "earrings",
    price: 340,
    compareAt: null,
    tag: "bestseller",
    sku: "VJ-ER-001",
    images: 4,
    description: "Warm-toned pearl drops on delicate gold-filled hooks. A quiet everyday earring with just enough movement.",
    details: [
      "8mm Akoya pearls, 14k gold-filled hooks",
      "Sold as a pair",
      "Weight: 1.2g per earring",
      "Comes in a Vennus signature box with care card"
    ],
    options: null,
    inStock: true,
    quantity: 21
  },
  {
    id: 5,
    name: "Trench Pearl Studs",
    category: "earrings",
    price: 180,
    compareAt: null,
    tag: "new",
    sku: "VJ-ER-002",
    images: 3,
    description: "The essential stud — one perfect pearl, close to the ear, worn from morning meetings to evening dinners without a second thought.",
    details: [
      "6mm Akoya pearl, 14k solid gold post",
      "Sold as a pair",
      "Butterfly backing",
      "Comes in a Vennus signature box with care card"
    ],
    options: null,
    inStock: true,
    quantity: 30
  },
  {
    id: 6,
    name: "Beton Threader Earrings",
    category: "earrings",
    price: 260,
    compareAt: null,
    tag: null,
    sku: "VJ-ER-003",
    images: 3,
    description: "A fine chain threader finished with a single seed pearl — a quiet, architectural line for those who like their jewelry restrained.",
    details: [
      "3mm seed pearls, sterling silver chain",
      "Sold as a pair",
      "Adjustable drop length",
      "Comes in a Vennus signature box with care card"
    ],
    options: null,
    inStock: false,
    quantity: 0
  },
  {
    id: 7,
    name: "Weimar Cuff Bracelet",
    category: "bracelets",
    price: 420,
    compareAt: null,
    tag: null,
    sku: "VJ-BR-001",
    images: 4,
    description: "A structured open cuff in brushed gold vermeil, set with three deep-toned pearls along the front edge.",
    details: [
      "9mm pearls, gold vermeil over sterling silver",
      "One size, adjustable opening",
      "Brushed matte finish",
      "Comes in a Vennus signature box with care card"
    ],
    options: null,
    inStock: true,
    quantity: 11
  },
  {
    id: 8,
    name: "Craie Pearl Bangle",
    category: "bracelets",
    price: 310,
    compareAt: 360,
    tag: "sale",
    sku: "VJ-BR-002",
    images: 3,
    description: "A slender fixed bangle in warm gold, set with a trio of small pearls. Layers quietly with the rest of the Vennus bracelet edit.",
    details: [
      "5mm pearls, 14k gold-filled band",
      "Available in three inner-diameter sizes",
      "Slip-on style",
      "Comes in a Vennus signature box with care card"
    ],
    options: { label: "Size", values: ["S", "M", "L"] },
    inStock: true,
    quantity: 8
  },
  {
    id: 9,
    name: "Sable Strand Bracelet",
    category: "bracelets",
    price: 250,
    compareAt: null,
    tag: null,
    sku: "VJ-BR-003",
    images: 3,
    description: "A soft single strand of small-grade pearls on a silk cord, finished with a hidden gold clasp. Designed to be stacked.",
    details: [
      "4\u20134.5mm cultured pearls, silk cord",
      "7 in length with 1 in extender",
      "14k gold-filled clasp",
      "Comes in a Vennus signature box with care card"
    ],
    options: null,
    inStock: true,
    quantity: 17
  },
  {
    id: 10,
    name: "Blanc Solitaire Ring",
    category: "rings",
    price: 220,
    compareAt: null,
    tag: "bestseller",
    sku: "VJ-RG-001",
    images: 3,
    description: "One pearl, one band, nothing extra. Sits low on the finger and pairs easily with every other ring in your rotation.",
    details: [
      "6mm Akoya pearl, 14k solid gold band",
      "Available sizes 5\u20139 (US)",
      "Comfort-fit interior",
      "Comes in a Vennus signature box with care card"
    ],
    options: { label: "Ring Size", values: ["5", "6", "7", "8", "9"] },
    inStock: true,
    quantity: 25
  },
  {
    id: 11,
    name: "Gris Twist Ring",
    category: "rings",
    price: 275,
    compareAt: null,
    tag: "new",
    sku: "VJ-RG-002",
    images: 3,
    description: "A softly twisted gold band cradling a single grey-toned pearl, for those drawn to the quieter end of the palette.",
    details: [
      "7mm grey Akoya pearl, vermeil band",
      "Available sizes 5\u20138 (US)",
      "Adjustable opening for half-sizes",
      "Comes in a Vennus signature box with care card"
    ],
    options: { label: "Ring Size", values: ["5", "6", "7", "8"] },
    inStock: true,
    quantity: 13
  },
  {
    id: 12,
    name: "Marfa Wrap Ring",
    category: "rings",
    price: 195,
    compareAt: null,
    tag: null,
    sku: "VJ-RG-003",
    images: 3,
    description: "A thin gold band that wraps twice around the finger, anchored by one small warm-toned pearl.",
    details: [
      "5mm pearl, 14k gold-filled wrap band",
      "One size, fully adjustable",
      "Sits comfortably worn alone or stacked",
      "Comes in a Vennus signature box with care card"
    ],
    options: null,
    inStock: true,
    quantity: 19
  }
];

/* Helper used across pages — do not need to edit this. */
function vennusFormatPrice(amount) {
  return "$" + amount.toLocaleString("en-CA");
}
