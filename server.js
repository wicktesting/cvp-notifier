const express = require("express");

const app = express();

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// Latest information received from the game
let latestData = {
    updatedAt: null,
    game: null,
    eggShop: {},
    gearShop: {},
    merchant: {},
    weather: {}
};

// Health check
app.get("/", (req, res) => {
    res.json({
        online: true,
        service: "Capybaras vs Plants Notifier",
        version: "1.0.0"
    });
});

// Receive data from the Roblox script
app.post("/api/update", (req, res) => {
    const data = req.body;

    latestData = {
        updatedAt: new Date().toISOString(),
        game: data.game || "CapybarasVsPlants",

        eggShop: data.eggShop || {},
        gearShop: data.gearShop || {},
        merchant: data.merchant || {},
        weather: data.weather || {}
    };

    console.log("Received game data:");
    console.log(JSON.stringify(latestData, null, 2));

    res.json({
        success: true,
        message: "Game data received"
    });
});

// Get the latest game information
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        data: latestData
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("CVP NOTIFIER ONLINE");
    console.log("Port:", PORT);
    console.log("=================================");
});
