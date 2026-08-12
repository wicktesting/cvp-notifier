const express = require("express");

const app = express();

app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;

// ================================
// DISCORD WEBHOOK
// ================================

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// ================================
// LATEST GAME DATA
// ================================

let latestData = {
    updatedAt: null,
    game: null,
    eggShop: {},
    gearShop: {},
    merchant: {},
    weather: {}
};

// ================================
// HELPERS
// ================================

function formatStock(stock) {
    return stock > 0 ? `x${stock}` : "❌ **Out of Stock**";
}

function formatTime(seconds) {
    seconds = Math.max(0, Number(seconds) || 0);

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function shopList(items) {
    if (!items || Object.keys(items).length === 0) {
        return "No data";
    }

    return Object.entries(items)
        .map(([name, stock]) => {
            return `${stock > 0 ? "🟢" : "🔴"} **${name}** — ${formatStock(stock)}`;
        })
        .join("\n");
}

// ================================
// DISCORD NOTIFICATION
// ================================

async function sendDiscordNotification(notification) {
    if (!DISCORD_WEBHOOK_URL) {
        console.log("DISCORD_WEBHOOK_URL is not configured.");
        return false;
    }

    const eggShop = notification.eggShop || {};
    const gearShop = notification.gearShop || {};
    const merchant = notification.merchant || {};
    const weather = notification.weather || {};

    const merchantItems = merchant.items || {};

    const merchantText =
        merchant.name
            ? [
                `**Merchant:** ${merchant.name}`,
                `**Leaves in:** ${formatTime(merchant.remainingSeconds)}`,
                "",
                Object.entries(merchantItems)
                    .map(([name, stock]) =>
                        `${stock > 0 ? "🟢" : "🔴"} **${name}** — ${formatStock(stock)}`
                    )
                    .join("\n") || "No items"
            ].join("\n")
            : "No merchant data";

    const weatherText =
        weather.name
            ? `🌦️ **${weather.name}**\nDuration: **${formatTime(weather.duration)}**`
            : "No active weather";

    const embed = {
        title: "🌱 Capybaras vs Plants",
        description: "Shop and world update",
        color: 0x57F287,

        fields: [
            {
                name: "🥚 Egg Shop",
                value: shopList(eggShop),
                inline: false
            },
            {
                name: "⚙️ Gear Shop",
                value: shopList(gearShop),
                inline: false
            },
            {
                name: "🧙 Traveling Merchant",
                value: merchantText,
                inline: false
            },
            {
                name: "🌦️ Weather",
                value: weatherText,
                inline: false
            }
        ],

        footer: {
            text: "Capybaras vs Plants Notifier"
        },

        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: "CVP Notifier",
                embeds: [embed]
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
        console.error("Discord error:", error);

        return false;
    }
}

// ================================
// HEALTH CHECK
// ================================

app.get("/", (req, res) => {
    res.json({
        online: true,
        service: "Capybaras vs Plants Notifier",
        version: "1.0.0"
    });
});

// ================================
// RECEIVE ROBLOX DATA
// ================================

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

    console.log("=================================");
    console.log("Received game data");
    console.log("=================================");
    console.log(JSON.stringify(latestData, null, 2));

    const discordSent =
        await sendDiscordNotification(latestData);

    res.json({
        success: true,
        discordSent: discordSent,
        notification: latestData
    });
});

// ================================
// GET LATEST STATUS
// ================================

app.get("/api/status", (req, res) => {

    res.json({
        success: true,
        data: latestData
    });

});

// ================================
// START SERVER
// ================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("=================================");
    console.log("CVP NOTIFIER ONLINE");
    console.log("Port:", PORT);
    console.log("=================================");

});
