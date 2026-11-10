# TSU FindIt: Complete Setup Guide (Free Shared Database)

Group 4 · TSM3A

This guide puts TSU FindIt online so every device and every group member sees the same data (accounts, posts, photos, messages). Everything is free: Firebase Firestore (Spark plan, no credit card) for the database and GitHub Pages for hosting. One person does the setup once. Everyone else only opens the website link.

## What you need

- The file `WD_TSM3A_GROUP4_shared-db.zip`
- A Google account (for Firebase)
- A GitHub account (for hosting)
- About 15 minutes

## Part 1: Create the free database (Firebase)

1. Go to **console.firebase.google.com** and sign in with your Google account.
2. Click **Create a project** (or **Add project**). Name it `tsu-findit`. Turn **Google Analytics OFF**. Click **Create project**, then **Continue**.
3. In the left menu open **Build → Firestore Database**, then click **Create database**.
4. Location: choose `asia-southeast1` (Singapore). You cannot change this later.
5. Mode: choose **Production mode**, then click **Create**.
6. Do **not** upgrade to the Blaze plan. Stay on the free Spark plan.
7. Open the **Rules** tab. Delete everything in the editor, paste the rules below, and click **Publish**.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if true; }
  }
}
```

8. Click the gear icon next to "Project Overview" and choose **Project settings**.
9. Scroll to **Your apps** and click the web icon `</>`.
10. App nickname: `tsu-findit-web`. Leave "Firebase Hosting" unchecked. Click **Register app**.
11. You will now see a `firebaseConfig` block with six values: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. Keep this page open for Part 2.

## Part 2: Add your Firebase config to the project

1. Unzip `WD_TSM3A_GROUP4_shared-db.zip`. You get a folder named `WD_TSM3A_GROUP4`.
2. Open `WD_TSM3A_GROUP4/js/firebase-config.js` in Notepad or VS Code.
3. Replace every `PASTE_...` value with the matching value from Firebase. Keep the quotation marks and commas.
4. Save the file.

Example of the finished file (your values will be different):

```
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSy...your-key...",
  authDomain: "tsu-findit-xxxxx.firebaseapp.com",
  projectId: "tsu-findit-xxxxx",
  storageBucket: "tsu-findit-xxxxx.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};
```

The Firebase apiKey is not a secret password. It only identifies your project, so it is normal for it to be public on GitHub.

## Part 3: Put the site online (GitHub Pages)

1. Go to **github.com** and sign in.
2. Click **New repository**. Name: `tsu-findit`. Set it to **Public**. Click **Create repository**.
3. On the empty repository page, click **uploading an existing file**.
4. Open the unzipped `WD_TSM3A_GROUP4` folder. Select **everything inside it** (`index.html`, `css`, `js`, `images`, `docs`, the other `.html` files, and so on) and drag it into the GitHub page. The files must sit at the top level of the repository, not inside another folder.
5. Wait for the upload to finish, then click **Commit changes**.
6. Go to **Settings → Pages**.
7. Under Source choose **Deploy from a branch**. Branch: `main`, folder: `/ (root)`. Click **Save**.
8. Wait 1 to 2 minutes and refresh the Pages screen. Your site address appears: `https://YOUR-USERNAME.github.io/tsu-findit/`
9. Send that link to your group.

Note: if the hidden file `.nojekyll` does not upload, that is fine. This site works without it.

## Part 4: Test with two devices

Use two different devices (for example your laptop and your phone) or two different browsers.

1. **Device A:** open the site and register a new student account. The email must end in `@student.tsu.edu.ph`, and the password must be at least 8 characters.
2. **Device A:** click Report, fill in the form, and submit an item. It shows as "Pending review".
3. **Device B:** log in as admin, open **Admin**, and approve the item.
4. **Device A:** reload the page and open **Browse**. The approved item should appear.
5. Open the item on a second account and send a message to the owner. On the owner's device, open **Messages** and reload to see it.

If these steps work, the shared database is working.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | romareimimura@student.tsu.edu.ph | 12345678 |
| Faculty | acetobias@professor.tsu.edu.ph | 12345678 |
| Staff | jboniate@staff.tsu.edu.ph | 12345678 |
| Admin | benjesteban@admin.tsu.edu.ph | Given privately by Benj. Never write it in GitHub or in a shared document. |

The first person to open the live site creates these accounts in the database automatically.

## Troubleshooting

Open the browser console with **F12 → Console** to see the message.

| What you see | What it means | Fix |
|---|---|---|
| Page says "Cannot reach the shared database" | Config is wrong or rules are not published | Re-check Part 2, and publish the rules in Part 1 step 7 |
| "Missing or insufficient permissions" | Firestore rules not published | Publish the rules in Part 1 step 7 |
| "API key not valid" | The `apiKey` was copied wrongly | Copy it again into `js/firebase-config.js` and re-upload |
| Site works but data is not shared between devices | `firebase-config.js` still contains `PASTE_...` | Fill it in (Part 2) and re-upload |
| Page shows an old version after re-uploading | Browser cache | Hard refresh with Ctrl+Shift+R |
| Site address shows 404 | Pages not ready yet or files in a subfolder | Wait 2 minutes, and check that `index.html` is at the repository root |

## Good to know

- **Free limits (Spark plan):** 1 GiB stored data, 50,000 reads per day, 20,000 writes per day, 20,000 deletes per day. If a limit is reached, the site simply pauses until the next day. You cannot be billed on the Spark plan.
- **Messages are not live.** The other person sees a new message after they reload the page.
- **Photos** are shrunk and stored inside the database, so no paid storage is needed.
- **`?reset=1`** at the end of the site address only logs you out on that browser. It never deletes the shared data.
- **To wipe all demo data:** Firebase console → Firestore Database → delete the `users`, `posts` and `messages` collections. The site recreates the demo accounts on the next visit.

## Security notes (class demo level)

- Passwords are stored as hashes, not plain text, and the admin password is not in the code.
- The Firestore rules above are open so the demo works without Firebase Authentication. Anyone with technical skill could edit the database directly. Do not use real personal information or reused passwords.
- For a real launch, add Firebase Authentication and stricter rules.

## Final checklist

- [ ] Firebase project created on the Spark plan
- [ ] Firestore database created and rules published
- [ ] Config values pasted into `js/firebase-config.js`
- [ ] All files uploaded to the root of the GitHub repository
- [ ] GitHub Pages turned on (`main`, `/ (root)`)
- [ ] Two-device test passed
- [ ] Admin password kept private
