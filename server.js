const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined
});

const defaults = {
  company_name: "S J TOUR AND TRAVELS",
  tagline: "Your Journey, Our Responsibility",
  location: "Add your city / location",
  whatsapp: "",
  phone: "",
  email: "",
  about: "We provide comfortable and reliable travel services. Contact us for your next journey.",
  footer: "© S J Tour and Travels. All rights reserved."
};

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      seats TEXT DEFAULT '',
      ac TEXT DEFAULT 'AC',
      rate TEXT DEFAULT '',
      min_km TEXT DEFAULT '',
      driver_bata TEXT DEFAULT '',
      image TEXT DEFAULT '',
      notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );
  `);

  for (const [key, value] of Object.entries(defaults)) {
    await pool.query(
      "INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING",
      [key, value]
    );
  }

  const count = await pool.query("SELECT COUNT(*)::int AS n FROM vehicles");
  if (count.rows[0].n === 0) {
    await pool.query(
      `INSERT INTO vehicles(name,seats,ac,rate,min_km,driver_bata,image,notes)
       VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8),
       ($9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        "Innova Crysta", "7", "AC", "Add rate", "Add minimum KM",
        "Add driver bata", "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=900",
        "Replace this sample information with your actual vehicle details.",
        "Maruti Ertiga", "7", "AC", "Add rate", "Add minimum KM",
        "Add driver bata", "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900",
        "Replace this sample information with your actual vehicle details."
      ]
    );
  }
}

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "local-development-only-change-before-deploying",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname, "public")));

async function settingsObject() {
  const result = await pool.query("SELECT key,value FROM settings");
  return Object.fromEntries(result.rows.map(row => [row.key, row.value]));
}
async function allVehicles() {
  const result = await pool.query("SELECT * FROM vehicles ORDER BY id DESC");
  return result.rows;
}
const isAdmin = (req, res, next) =>
  req.session.admin ? next() : res.status(401).json({ error: "Please sign in again." });

app.get("/api/public", async (req, res, next) => {
  try {
    res.json({ settings: await settingsObject(), vehicles: await allVehicles() });
  } catch (err) { next(err); }
});

app.get("/api/admin/status", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id FROM admin WHERE id=1");
    res.json({ setupRequired: result.rowCount === 0, signedIn: !!req.session.admin });
  } catch (err) { next(err); }
});

app.post("/api/admin/setup", async (req, res, next) => {
  try {
    const existing = await pool.query("SELECT id FROM admin WHERE id=1");
    if (existing.rowCount) return res.status(403).json({ error: "Admin account already exists. Please sign in." });
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (username.length < 3 || password.length < 10) {
      return res.status(400).json({ error: "Use a username of at least 3 characters and a password of at least 10 characters." });
    }
    const hash = await bcrypt.hash(password, 12);
    await pool.query("INSERT INTO admin(id,username,password_hash) VALUES(1,$1,$2)", [username, hash]);
    req.session.admin = username;
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.post("/api/admin/login", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM admin WHERE id=1");
    const user = result.rows[0];
    if (!user || String(req.body.username || "") !== user.username ||
        !(await bcrypt.compare(String(req.body.password || ""), user.password_hash))) {
      return res.status(401).json({ error: "Incorrect username or password." });
    }
    req.session.admin = user.username;
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/admin/data", isAdmin, async (req, res, next) => {
  try { res.json({ settings: await settingsObject(), vehicles: await allVehicles() }); }
  catch (err) { next(err); }
});

app.put("/api/admin/settings", isAdmin, async (req, res, next) => {
  try {
    for (const key of Object.keys(defaults)) {
      if (req.body && req.body[key] !== undefined) {
        await pool.query(
          "INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",
          [key, String(req.body[key]).slice(0, 3000)]
        );
      }
    }
    res.json({ ok: true, settings: await settingsObject() });
  } catch (err) { next(err); }
});

app.post("/api/admin/vehicles", isAdmin, async (req, res, next) => {
  try {
    const v = req.body || {};
    if (!String(v.name || "").trim()) return res.status(400).json({ error: "Vehicle name is required." });
    const result = await pool.query(
      `INSERT INTO vehicles(name,seats,ac,rate,min_km,driver_bata,image,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [v.name, v.seats || "", v.ac || "AC", v.rate || "", v.min_km || "",
       v.driver_bata || "", v.image || "", v.notes || ""]
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) { next(err); }
});

app.put("/api/admin/vehicles/:id", isAdmin, async (req, res, next) => {
  try {
    const v = req.body || {};
    if (!String(v.name || "").trim()) return res.status(400).json({ error: "Vehicle name is required." });
    await pool.query(
      `UPDATE vehicles SET name=$1,seats=$2,ac=$3,rate=$4,min_km=$5,driver_bata=$6,image=$7,notes=$8 WHERE id=$9`,
      [v.name, v.seats || "", v.ac || "AC", v.rate || "", v.min_km || "",
       v.driver_bata || "", v.image || "", v.notes || "", req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.delete("/api/admin/vehicles/:id", isAdmin, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM vehicles WHERE id=$1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "A server error occurred. Please try again." });
});

initializeDatabase()
  .then(() => app.listen(PORT, () => console.log(`S J Tour and Travels is running on port ${PORT}`)))
  .catch(err => {
    console.error("Could not connect to the database or initialize tables:", err);
    process.exit(1);
  });
