# Emini's Mat Shop

Static storefront hosted on GitHub Pages: https://eminiscompany.github.io/emini-mat-shop/

- `index.html`, `shop.css`, `shop.js`: the public shop. Customers can search, filter, build an order and copy it as a Discord DM.
- `stock.json`: the live stock the shop reads.
- `catalog.json` + `icons/`: real FFXIV submarine mat icons and reference prices.

The stock editor is **not** in this repo. It lives in the private `emini-mat-shop-admin` repo and
edits `stock.json` here through the GitHub API, using a token only the owner has.
