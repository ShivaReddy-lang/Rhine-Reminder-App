Rhine Reminder App — Complete project (ready-to-deploy)

FILES INCLUDED:
- index.html (login)
- dashboard.html (dashboard + add reminder)
- reminders.html (full reminders list)
- about.html
- style.css (melancholy theme)
- script.js (client logic - auth, Firestore, FCM token saving)
- firebase-config.js (PLACEHOLDER - replace with your project's config)
- firebase-messaging-sw.js (service worker - PLACEHOLDER for config)
- assets/ (icons - you can add images here)
- functions/index.js (Cloud Function to send scheduled push notifications)
- functions/package.json (Node dependencies)

IMPORTANT — Before using:
1) Create a NEW Firebase project in the Firebase Console.
2) In Project Settings -> SDK setup, copy the Firebase config and paste it into `firebase-config.js` and into `firebase-messaging-sw.js` (replace placeholders).
3) In Firebase Console -> Authentication -> Sign-in method: Enable **Google** and **Email/Password**.
4) In Authentication -> Authorized domains: add your hosted domain (e.g. shivareddy-lang.github.io).
5) In Firestore: create the database (Production mode or test for now).
6) In Cloud Messaging: ensure messaging APIs are enabled (usually default).

DEPLOY FRONTEND (GitHub Pages):
1) Create a new GitHub repo (public).
2) Upload ALL files from this project root (index.html, dashboard.html, reminders.html, style.css, script.js, firebase-config.js, firebase-messaging-sw.js, manifest.json, assets/, functions/).
   - Make sure `firebase-messaging-sw.js` is at the ROOT of the repo (not inside assets).
3) In GitHub repo -> Settings -> Pages: set Source to **main** branch and folder **/ (root)** -> Save.
4) Wait 1-2 minutes for GitHub Pages to build. Your site will be available at: https://<your-username>.github.io/<repo-name>/

DEPLOY FUNCTIONS (Cloud Functions):
1) Install Firebase CLI locally: `npm install -g firebase-tools`
2) Login: `firebase login`
3) Initialize functions inside a local copy of this project: `firebase init functions` (choose existing project)
4) Replace `functions/index.js` with the one in this ZIP and `functions/package.json` as provided
5) Install deps: `cd functions && npm install`
6) Deploy: `firebase deploy --only functions`
   - Note: schedule triggers (every 1 minute) may require enabling Blaze (pay-as-you-go) in Firebase billing for Cloud Scheduler.

TESTING:
- Sign in on your site, allow notifications, create a reminder a minute or two in the future
- The scheduled Cloud Function will send a push and mark the reminder `sent:true` in Firestore

If you want, I can also paste the full commands to initialize and deploy the functions exactly as you'd run them on your computer.
