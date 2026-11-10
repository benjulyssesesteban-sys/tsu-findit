# TSU FindIt (static GitHub Pages build) - WD_TSM3A_GROUP4

Static version of the TSU FindIt lost-and-found site. Runs fully in the browser:
the original EJS views are rendered client-side (`js/static-app.js`) and data
(users, posts, messages, photos) is kept in the browser's localStorage,
replacing Express + SQLite + multer.

Demo accounts (password `12345678`, except admin, whose password is given separately and is not stored in this repo):
- admin    benjesteban@admin.tsu.edu.ph
- student  romareimimura@student.tsu.edu.ph
- faculty  acetobias@professor.tsu.edu.ph
- staff    jboniate@staff.tsu.edu.ph

## Deploy on GitHub Pages
1. Create a public repo (e.g. `tsu-findit`) and upload everything in this folder (files at the repo root, including `.nojekyll`).
2. Repo > Settings > Pages > Source: "Deploy from a branch", Branch: `main`, folder `/ (root)` > Save.
3. After 1-2 minutes the site is live at `https://<username>.github.io/tsu-findit/`.
4. Test on the live URL: browse/search, login, report an item (with photo), approve as admin, messages, mobile view.

Run locally: `npx serve .` or VS Code "Live Server" (do not open the HTML by double-click; `file://` blocks localStorage on some browsers).
## Shared database (Firebase Firestore, free)
Full step-by-step guide: `docs/SETUP_GUIDE.docx` (also `docs/SETUP_GUIDE.md`).
Data (users, posts, messages, photos) is stored in Firestore so every device sees the same data.
1. console.firebase.google.com > Add project (Spark plan, no card) > Build > Firestore Database > Create database.
2. Project settings > Your apps > Web (</>) > register app > copy the `firebaseConfig` values into `js/firebase-config.js`.
3. Firestore > Rules > paste the rules below > Publish.
4. Push to GitHub Pages. If `firebase-config.js` is not filled in, the site falls back to per-browser localStorage.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
```
(Open rules are fine for a class demo only. Do not reuse real passwords: they are stored as plain text.)
`?reset=1` now only clears your own login on this browser; it never wipes the shared database.
