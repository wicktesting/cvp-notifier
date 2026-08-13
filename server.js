// CVP Notifier — ingest API
//
// Receives live game data (Egg Shop / Gear Shop / Merchant / Weather) posted by the in-game
// Delta script via POST /api/update, and serves the latest snapshot via GET /api/status for
// the Discord bot (or anything else) to read.
//
// This file lives at the REPOSITORY ROOT because Railway builds/runs from the root by default.

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// Optional shared-secret protection for POST /api/update.
// Set UPDATE_API_KEY in Railway's environment variables to require the game script to send
// a matching header: X-Api-Key: <same value>
// Leave UPDATE_API_KEY unset to accept updates from anyone (matches original "just works" setup).
const UPDATE_API_KEY = process.env.UPDATE_API_KEY || null;

// In-memory latest snapshot. Resets on every deploy/restart — that's expected and fine, since
// the game script re-posts fresh data continuously while running.
let latestData = {
  updatedAt: null,
  game: "Capybaras vs Plants",
  eggShop: [],
  gearShop: [],
  merchant: null,
  weather: null,
};

// ---------- Health check ----------
app.get("/", (req, res) => {
  res.json({
    online: true,
    service: "Capybaras vs Plants Notifier",
    version: "1.0.0",
  });
});

// ---------- Receive game data ----------
app.post("/api/update", (req, res) => {
  if (UPDATE_API_KEY) {
    const provided = req.header("X-Api-Key");
    if (provided !== UPDATE_API_KEY) {
      return res.status(401).json({ success: false, error: "Invalid or missing X-Api-Key" });
    }
  }

  const body = req.body || {};

  // `false` means the script explicitly confirmed "nothing here right
  // now" (e.g. no merchant) and should clear the field. A field that's
  // just missing from the request (undefined) means this update didn't
  // touch it, so the old value is kept.
  function resolveField(incoming, previous) {
    if (incoming === false) {
      return null;
    }
    if (incoming === undefined) {
      return previous;
    }
    return incoming;
  }

  latestData = {
    updatedAt: new Date().toISOString(),
    game: body.game || latestData.game,
    eggShop: body.eggShop !== undefined ? body.eggShop : latestData.eggShop,
    gearShop: body.gearShop !== undefined ? body.gearShop : latestData.gearShop,
    merchant: resolveField(body.merchant, latestData.merchant),
    weather: resolveField(body.weather, latestData.weather),
  };

  res.json({ success: true, updatedAt: latestData.updatedAt });
});

// ---------- Serve latest snapshot ----------
app.get("/api/status", (req, res) => {
  res.json(latestData);
});

app.listen(PORT, () => {
  console.log(`CVP Notifier listening on port ${PORT}`);
});
