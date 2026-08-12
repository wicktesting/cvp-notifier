const express = require("express");

const app = express();

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

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
// DISCORD
// ========================================

async function sendDiscordMessage(content) {
    if (!DISCORD_WEBHOOK_URL) {
        console.log("DISCORD_WEBHOOK_URL is not configured.");
        return false;
    }

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: content
            })
        });

        if (!response.ok) {
            const errorText = await response.text();

            console.error(
                "Discord webhook failed:",
                response.status,
                errorText
            );

            return false;
        }

        console.log("Discord notification sent.");
        return true;

    } catch (error) {
        console.error("Discord webhook error:", error);
        return false;
    }
}

// ========================================
// FORMAT STOCK
// ========================================

function formatStock(stock) {
    let result = "";

    for (const [item, amount] of Object.entries(stock || {})) {
        if (Number(amount) > 0) {
            result += `🟢 ${item} ×${amount}\n`;
        } else {
            result += `🔴 ${item} — OUT OF STOCK\n`;
        }
    }

    return result || "No stock data.";
}

// ========================================
// FORMAT MERCHANT
// ========================================

function formatTime(seconds) {
    seconds = Number(seconds) || 0;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

// ========================================
// BUILD NOTIFICATION
// ========================================

function buildNotification(data) {
    let message = "";

    message += "🌱 **CAPYBARAS VS PLANTS**\n";
    message += "━━━━━━━━━━━━━━━━━━━━\n\n";

    // Egg Shop
    message += "🥚 **EGG SHOP**\n";
    message += formatStock(data.eggShop);
    message += "\n";

    // Gear Shop
    message += "⚙️ **GEAR SHOP**\n";
    message += formatStock(data.gearShop);
    message += "\n";

    // Merchant
    if (data.merchant && Object.keys(data.merchant).length > 0) {
        message += `🧑‍🌾 **TRAVELING MERCHANT — ${
            data.merchant.name || "Unknown"
        }**\n`;

        message += formatStock(data.merchant.items);

        if (data.merchant.remainingSeconds !== undefined) {
            message += `⏱️ Leaves in **${formatTime(
                data.merchant.remainingSeconds
            )}**\n`;
        }

        message += "\n";
    }

    // Weather
    if (data.weather && data.weather.name) {
        message += `🌦️ **WEATHER — ${data.weather.name}**\n`;

        if (data.weather.duration !== undefined) {
            message += `⏱️ Duration: **${formatTime(
                data.weather.duration
            )}**\n`;
        }

        message += "\n";
    }

    message += "━━━━━━━━━━━━━━━━━━━━\n";
    message += "🤖 CVP Notifier";

    return message;
}

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
    res.json({
        online: true,
        service: "Capybaras vs Plants Notifier",
        version: "1.0.0",
        discordConfigured: !!DISCORD_WEBHOOK_URL
    });
});

// ========================================
// RECEIVE GAME DATA
// ========================================

app.post("/api/update", async (req, res) => {
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
// GET CURRENT DATA
// ========================================

app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        data: latestData
    });
});

// ========================================
// DISCORD TEST
// ========================================

app.get("/api/test", async (req, res) => {

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

    const message = buildNotification(testData);

    const sent = await sendDiscordMessage(message);

    res.json({
        success: true,
        discordSent: sent,
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
    console.log(
        "Discord configured:",
        !!DISCORD_WEBHOOK_URL
    );
    console.log("=================================");
});
