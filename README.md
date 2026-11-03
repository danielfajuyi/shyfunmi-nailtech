# Shyfunmi Nails: full-stack website

React (Vite) front end and a Node.js (Express) API, in one project.

## What is included

**Public website**
- Home, Services, Gallery (filters and lightbox), Training (enquiry form), Contact (hours, map link, FAQ)
- Smooth scrolling (Lenis), entrance animations (Framer Motion), light and dark mode
- Online booking in three steps with live availability, based on opening hours, service duration, days off and existing bookings

**Client dashboard** (`/account`)
- Sign up and sign in, loyalty card, next appointment, booking history, cancel bookings, leave reviews, profile and password
- Earlier guest bookings are linked automatically when a client signs up with the same phone number

**Admin dashboard** (`/admin`)
- Overview: pending and upcoming counts, revenue, 6-month chart, popular services
- Bookings: search, filter, change status, reschedule, set price and discount, private notes, WhatsApp the client, add walk-ins
- Services: add, edit, hide, delete (price, duration, description)
- Gallery: upload photos by style, re-categorise, delete
- Clients, Training enquiries, Reviews (approve before they appear), Settings (business info, WhatsApp number, opening hours, days off, loyalty rules)

**Security basics:** hashed passwords (bcrypt), httpOnly cookie sessions (JWT), role checks on every admin route, rate limiting on login and forms, Helmet headers, image-only uploads.

## Run it

Requires Node.js 18 or newer.

```bash
npm run install:all
cp server/.env.example server/.env      # then edit the values
npm run dev
```

- Website: http://localhost:5173 (Vite, proxies the API)
- API: http://localhost:5000

On first start an admin account is created from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`
(default: `admin@shyfunminails.com` / `ChangeMe123!`). Sign in at `/login`, then change the password in your profile or by
editing the env values before first run.

**First things to do in the admin dashboard:** Settings (WhatsApp number, hours), Services (prices), Gallery (upload photos).

## Deploy (one server)

```bash
npm run install:all
npm run build        # builds client/dist
npm start            # Express serves the API and the built site on PORT
```

Set `JWT_SECRET` to a long random string and `COOKIE_SECURE=true` when serving over HTTPS.
Works on any Node host (Render, Railway, a VPS). Keep `server/data` and `server/uploads` on persistent storage:
they hold the database (`db.json`) and uploaded photos. Back them up regularly.

## Notes

- Data is stored in a JSON file (`server/data/db.json`), which suits a single salon with no native dependencies.
  To scale up, replace `server/db.js` with PostgreSQL, MongoDB or SQLite.
- Service prices start at 0 and display as "Price on request" until you set them.
- Fonts: Sora (headings) and Hanken Grotesk (body). Change them in `client/index.html` and the `--display` and `--body` variables at the top of `client/src/styles.css`.
- Colours are the variables at the top of `client/src/styles.css`.

## Structure

```
server/   index.js (API), db.js (storage), auth.js (sessions)
client/   src/pages (Home, Book, Account, Admin...), src/components, src/styles.css
```
