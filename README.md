# TSU FindIt: Lost and Found Board for Tarlac State University

Group: WD_TSM3A_GROUP4 (Web Development, Final Term Case Study)

Live website: https://benjulyssesesteban-sys.github.io/tsu-findit/

TSU FindIt is a lost and found website for the TSU community. Students, faculty, and staff can report items they lost or found, search the board, and message the person who posted an item. An administrator reviews every post before it is shown to the public.

## Features

- Browse and search approved posts by keyword, and filter by lost, found, or claimed items
- Report a lost or found item with an optional photo (JPG, PNG, or WEBP, under 5 MB)
- Register and log in with a TSU email that matches the chosen role
- My posts page with post status, reasons for rejected posts, and a Mark as claimed button
- Messages between users about a specific item
- Admin review queue to approve or reject posts, with a written reason for rejections
- Responsive layout for desktop, tablet, and mobile

## How it works

The website is a static site hosted on GitHub Pages. There is no server of its own.

- Each page is a small HTML file. The page content is built in the browser from EJS templates (`js/templates.js`) by `js/static-app.js`.
- Data (users, posts, messages, and photos) is stored in Firebase Firestore through `js/cloud.js`, so every account on every device sees the same data.
- Photos are resized in the browser (up to 640 pixels, JPEG) and saved inside the post record.
- Passwords are hashed with SHA-256 in the browser (Web Crypto) before they are saved. Plain-text passwords are never stored.
- If `js/firebase-config.js` is not filled in, the site falls back to per-browser localStorage, which is only useful for local testing.

## Project structure

```
WD_TSM3A_GROUP4/
  index.html, browse.html, item.html, login.html, register.html,
  profile.html, report.html, my-posts.html, messages.html,
  conversation.html, admin.html, 404.html
  css/style.css          all styles and media queries
  js/ejs.min.js          EJS library
  js/templates.js        page templates
  js/static-app.js       page logic: forms, rules, search
  js/cloud.js            Firestore load and save
  js/firebase-config.js  Firebase project settings
  js/main.js             menu, modal dialogs, interface behavior
  images/                cover.jpg, logo.png, logo-mark.png
  docs/                  SETUP_GUIDE.md, SETUP_GUIDE.docx
  .nojekyll
```

## Demo accounts

Password for the student, faculty, and staff accounts: `12345678`. The admin password is given separately and is not stored in this repository.

| Role | Email |
|---|---|
| Admin | benjesteban@admin.tsu.edu.ph |
| Student | romareimimura@student.tsu.edu.ph |
| Faculty | acetobias@professor.tsu.edu.ph |
| Staff | jboniate@staff.tsu.edu.ph |

New accounts must use the email domain of their role: `@student.tsu.edu.ph`, `@professor.tsu.edu.ph`, or `@staff.tsu.edu.ph`. Passwords need at least 8 characters.

## Deploy on GitHub Pages

1. Create a public repository (for example `tsu-findit`) and upload everything in this folder to the repository root, including `.nojekyll`.
2. Go to Settings > Pages. Set Source to "Deploy from a branch", Branch to `main`, and folder to `/ (root)`. Save.
3. After one or two minutes the site is live at `https://<username>.github.io/tsu-findit/`.
4. Test the live link: browse and search, log in, report an item with a photo, approve it as admin, send a message, and check the mobile view.

## Shared database (Firebase Firestore, free Spark plan)

The full step-by-step guide is in `docs/SETUP_GUIDE.md` (also `docs/SETUP_GUIDE.docx`).

1. In the Firebase console, create a project on the Spark plan and add a Firestore database.
2. Register a web app in Project settings and copy the `firebaseConfig` values into `js/firebase-config.js`.
3. In Firestore > Rules, paste the rules below and publish.
4. Push the changes to GitHub Pages.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
```

These open rules are only for a class demo. For a real deployment, use Firebase Authentication and stricter rules, and do not reuse real passwords.

## Run locally

Use the VS Code Live Server extension or any simple static file server. Do not open the HTML files by double-clicking them, because `file://` blocks some browser features.

Opening any page with `?reset=1` only clears your own login on that browser. It never deletes the shared database.

## Testing

- Lighthouse on the home page (mobile / desktop): Performance 84 / 97, Accessibility 95 / 95, Best Practices 100 / 100, SEO 100 / 100
- Manual checks on the live link: search and filter, form validation, admin review, claiming an item, and messaging between two accounts on two devices

## Credits

HTML, CSS, and JavaScript were written by the group. The logo was designed by the group and the campus photo was taken by the group. Third-party resources: EJS, the Firebase JavaScript SDK, Firebase Firestore, GitHub Pages, Google Fonts (DM Sans and Fraunces), and the Lucide icon set (https://lucide.dev).
