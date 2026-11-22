S J TOUR AND TRAVELS — FREE ONLINE DEPLOYMENT EDITION
======================================================

WHAT CHANGED
- The original project used a local SQLite database. Free cloud hosting can erase local files.
- This edition uses PostgreSQL (Neon) so vehicle details, rates, company settings and admin account persist outside the web server.
- The public website and admin panel keep the same URLs and user experience.
- The project requires Node.js 22.

PART 1 — TEST LOCALLY (OPTIONAL)
1. Install Node.js 22 LTS.
2. Create a free PostgreSQL database at https://neon.com/
3. Copy its connection string (DATABASE_URL).
4. In PowerShell, set it for this terminal:
   $env:DATABASE_URL="paste-your-neon-connection-string-here"
   $env:SESSION_SECRET="a-long-random-secret"
5. Run npm.cmd install
6. Run npm.cmd start
7. Visit http://localhost:3000 and http://localhost:3000/admin.html

PART 2 — CREATE A NEON DATABASE
1. Sign up at https://neon.com/
2. Create a project and choose a region near your customers (for example, Singapore if available).
3. Open the Connect panel and copy the connection string for Node.js.
4. Keep the connection string private. It contains a database password.
5. Do not paste it into public GitHub files or send it in chat.

PART 3 — UPLOAD TO GITHUB
1. Sign up at https://github.com/
2. Create a new repository, for example: sj-tour-and-travels.
3. Keep it Private if you prefer.
4. Upload the contents of this folder (package.json, server.js, README.txt, public folder).
5. Do NOT upload node_modules, .env files, database passwords, or secrets.

PART 4 — DEPLOY ON RENDER
1. Sign up at https://render.com/ and choose New → Web Service.
2. Connect your GitHub account and select this repository.
3. Runtime: Node.
4. Build Command: npm install
5. Start Command: npm start
6. Choose the Free instance type.
7. In Environment, add:
   NODE_ENV = production
   DATABASE_URL = (your Neon connection string)
   SESSION_SECRET = (a long random secret; generate one privately)
8. Create Web Service and wait for deployment.
9. Open the public *.onrender.com URL shown by Render.

IMPORTANT FREE-HOSTING LIMITATIONS
- Render free web services spin down after a period without traffic; the first visit after sleep can take around a minute.
- Neon free plan has its own usage limits. Check its current pricing/limits before relying on it for business operations.
- Keep a backup of important business information.
- The free Render service is not guaranteed to be always on.
- Use HTTPS (Render provides it for its public URL).
- Do not share your admin password or DATABASE_URL.
- Create your admin account once at https://YOUR-SITE/admin.html. Choose a unique password of at least 10 characters.
- If you already created an admin account in the old local SQLite version, this new Neon database is separate; create the admin account again after deployment.

PART 5 — BEFORE SHARING WITH CUSTOMERS
1. Open /admin.html and create your admin account.
2. Update company location, phone, WhatsApp number and email.
3. Replace sample vehicle names, photos, rates and minimum kilometres.
4. Test WhatsApp enquiries from a phone.
5. Test admin sign-in, add/edit/delete vehicle, and reload the public page.

LOCAL WINDOWS NOTE
PowerShell may block npm.ps1. Use npm.cmd commands, for example:
  npm.cmd install
  npm.cmd start


VEHICLE PHOTO UPLOAD
- In Admin > Vehicles & rates, choose a JPG, PNG or WEBP photo from your computer.
- Maximum photo size is 5 MB.
- Uploaded photos are stored in the Neon PostgreSQL database, not on Render's temporary disk.
- Make sure your Neon database has enough storage for your photos.
