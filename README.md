# Emini's Mat Shop

Static site. Host it on GitHub Pages (or any static host).

- `index.html`: the public shop. Customers see no controls.
- `admin-lotus.html`: your editor. Rename it to something only you know, and don't link to it.
- `stock.json`: the live stock the shop reads.
- `catalog.json` + `icons/`: real FFXIV submarine mat icons you can add from the editor.

## Publishing stock
Open your admin page, edit quantities, then click **Save & publish**.
One-time setup in the "Publishing setup" box: `owner/repo`, branch, and a fine-grained
GitHub token limited to this repo with Contents read and write. The token stays in your browser only.
No token? Use **Download stock.json** and commit that file yourself.

Anyone who finds the admin page can edit on their own screen, but only your token can publish.
