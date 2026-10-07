# Kalakriti Gallery

A static website (no server needed). Open `index.html` in a browser, or upload the whole folder to any web host.

## Who sees what
On entry the site asks: **visitor, artist or admin?**

| Role | Can do |
|---|---|
| Visitor (name + email) | Browse, save works, follow artists, email artists, place bids, order artworks, see "My orders / My bids / Following" |
| Artist (email + password) | Create a profile (photo, bio, email), upload and edit their own artworks, see orders and followers. Cannot delete works. |
| Admin (username + password) | Admin module: edit or delete **every** artwork, remove artists, manage all orders, read inquiries |

Bids: each artwork can allow bidding. After a visitor bids, the artwork details show the highest bid and the full list of bids. Each bid must beat the highest by `bidIncrement` (js/config.js).

## Demo logins
- Admin: `admin` / `admin123`  (change in `js/config.js`)
- Artists: `meera@kalakriti.example`, `arjun@kalakriti.example`, `sana@kalakriti.example`, password `artist123`
- Visitors: any name and email

## Data is kept
Everything (artists, uploaded images, bids, orders, follows) is saved in the browser's IndexedDB, so it is still there when you close the browser and come back. Delete the demo works from the Admin module when you are ready.

## Important limits (read before going live)
This version has no server, so data lives **in each browser**: an artwork uploaded on one computer is not visible on another computer. For a real public site, the same screens need a backend and database (for example Firebase, Supabase or a Node/Django API). The code is organised so that only `js/storage.js` and `js/market.js` would need to change.
Also, with no server, the admin password is readable in `js/config.js` and role checks run in the browser, so treat this as a working prototype, not a secure system.

## Files
index.html (gallery) · artist.html (artist profile) · dashboard.html (admin / artist / visitor workspace) · css/ · js/
