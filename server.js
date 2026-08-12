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

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
    res.json({
        online: true,
        service: "Capybaras vs Plants Notifier",
        version: "1.0.0"
    });
});

// ========================================
// RECEIVE GAME DATA
// ========================================

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

// ========================================
// GET CURRENT GAME DATA
// ========================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        data: latestData
    });
});

// ========================================
// TEST NOTIFICATION
// ========================================

app.get("/api/test", (req, res) => {
    const testData = {
        game: "Capybaras vs Plants",

        eggShop: {
            "Capybara Egg": 4,
            "Alpha Capybara Egg": 3,
            "Archer Capybara Egg": 2,
            "Magic Capybara Egg": 2,
            "Ghost Capybara Egg": 1,
            "Golem Capybara Egg": 0,
            "Robot Capybara Egg": 0,
            "Disco Capybara Egg": 0,
            "Angel Capybara Egg": 0
        },

        gearShop: {
            "Hatch Hammer": 2,
            "Nametag": 3,
            "Mutation Sponge": 2,
            "Boombox": 1,
            "Bizarre Stopwatch": 0
        },

        merchant: {
            name: "King Capybara",
            remainingSeconds: 114,

            items: {
                "Gilded Hatch Hammer": 1,
                "Gold Scroll": 0,
                "Totem Of Status": 0
            }
        },

        weather: {
            name: "Rain",
            duration: 270
        }
    };

    res.json({
        success: true,
        notification: testData
    });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("CVP NOTIFIER ONLINE");
    console.log("Port:", PORT);
    console.log("=================================");
});
