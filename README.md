# VENNUS Jewelry — Website

A quiet-luxury e-commerce front end for VENNUS, built with plain HTML, CSS, and JavaScript — no build step, no framework. Every file can be opened, edited, and pushed straight to GitHub.

## What's inside

```
vennus-jewelry/
├── index.html      Homepage
├── shop.html        Full product grid with category filters
├── product.html      Product detail page (reads ?id= from the URL)
├── maison.html       Brand story / about page
├── info.html         Services, Orders & Legal (all in one page, anchor-linked)
├── login.html        Sign in / create account
├── css/style.css     All styles and the color palette (edit tokens at the top)
├── js/products.js    ← YOUR PRODUCT CATALOG. Add/edit products here.
├── js/render.js       Builds product grids/detail pages from products.js
├── js/cart.js          Shopping bag logic (localStorage-based)
├── js/main.js           Nav, mobile menu, search, cookie consent
└── images/               Put your real photos here (see below)
```

## Adding or editing products

Open `js/products.js`. Every product on the site — grid cards, detail pages, related items — is generated from the array at the top of that file. Copy an existing entry, give it a new `id`, and fill in the fields. Comments at the top of the file walk through each field.

You do **not** need to touch any HTML file to add a product.

## Adding your own images and video

Every image on the site is currently a labeled placeholder box (a dashed/gradient block with a caption telling you what to put there), so you can see exactly where content goes without it looking broken. To swap one in:

1. Add your image/video file to the `images/` folder.
2. Find the placeholder in the relevant HTML file — search for `PLACEHOLDER` in the file, or `placeholder-block` in the code.
3. Replace the `<div class="placeholder-block">...</div>` with:
   ```html
   <img src="images/your-photo.jpg" alt="Describe the image">
   ```
   or for video:
   ```html
   <video src="images/your-video.mp4" autoplay muted loop playsinline></video>
   ```
4. Product photos (in `product-media` and the product gallery) are generated automatically from `js/products.js` — for those, the simplest approach is to add an `image` field to each product (e.g. `"image": "images/necklace-01.jpg"`) and update the two spots in `js/render.js` that currently build a `placeholder-block` to use that field instead. Happy to make that edit for you if you'd like.

## Colors and fonts

All colors live as CSS variables at the top of `css/style.css`, taken from the swatch palette you shared (Blanc, Craie, Beige Marfa, Chai, Beton, Beige de Weimar), plus a restrained blush-pink and champagne accent. Change the hex values in `:root` to retune the whole site at once.

Fonts are Cormorant Garamond (headings/logo) and Jost (body/nav), loaded from Google Fonts.

## Cookie consent

A bottom banner (Accept All / Decline / Cookie Settings) appears on first visit and stores the choice in the browser. "Cookie Settings" — in the banner or the footer — reopens a preferences modal with toggles for Analytics, Functional, and Marketing cookies. This is front-end only: if you use a real analytics or ad pixel, wire its loading to check `localStorage.getItem('vennus_cookie_consent')` so it only fires when the visitor has actually consented.

## The shopping bag

The bag is fully functional for browsing purposes (add, update quantity, remove, subtotal) and persists in the visitor's browser via `localStorage`. It is **not** connected to real payments. The "Checkout" button currently shows a placeholder message — connect it to a payment processor such as Shopify, Stripe, or Square to accept real orders.

## Forms that need a backend

A few forms are front-end only and show a placeholder confirmation: the newsletter signup, sign in / create account, order tracking, and the "Book an Appointment" button. Each is commented in its HTML file with what to connect it to (an email platform, a customer-account system, a booking tool, etc.).

## Publishing to GitHub Pages

1. Create a new repository on GitHub (e.g. `vennus-jewelry`).
2. Push this folder to it:
   ```
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/vennus-jewelry.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**, set the source branch to `main` and the folder to `/ (root)`, and save.
4. Your site will be live at `https://YOUR-USERNAME.github.io/vennus-jewelry/` within a few minutes.

## A couple of things worth doing before launch

- Have a lawyer review the Terms of Service, Privacy Policy, and Cookie Policy in `info.html` — the current text is placeholder language, clearly marked.
- Replace the placeholder social links (Instagram, Pinterest, Facebook) in the footer with your real profile URLs.
- Decide on a real payment/checkout provider and connect the "Checkout" and "Add to Bag" flow to it.
