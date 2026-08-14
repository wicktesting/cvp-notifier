require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

const db = require("./db");
const { weatherInfo } = require("./gameData");

// ============================================================
// CONFIG
// ============================================================

const API_BASE = process.env.CVP_API_BASE_URL;

const POLL_INTERVAL_MS = parseInt(
    process.env.POLL_INTERVAL_MS || "30000",
    10
);

const WIKI_URL =
    process.env.WIKI_URL ||
    "https://capybarasvsplants.fandom.com/wiki/Capybaras_vs_Plants_Wiki";

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

// Optional.
// If provided, commands are registered specifically to this guild.
// If not provided, commands are registered to every guild the bot is in.
const TEST_GUILD_ID = process.env.DISCORD_TEST_GUILD_ID;

// ============================================================
// VALIDATION
// ============================================================

if (!DISCORD_TOKEN) {
    console.error("❌ DISCORD_BOT_TOKEN is missing.");
    process.exit(1);
}

if (!CLIENT_ID) {
    console.error("❌ DISCORD_CLIENT_ID is missing.");
    process.exit(1);
}

if (!API_BASE) {
    console.error("❌ CVP_API_BASE_URL is missing.");
    process.exit(1);
}

// ============================================================
// DISCORD CLIENT
// ============================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

// ============================================================
// SLASH COMMANDS
// ============================================================

const commands = [

    // --------------------------------------------------------
    // EGG SHOP
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("eggshop")
        .setDescription("Show the current Egg Shop stock"),

    // --------------------------------------------------------
    // GEAR SHOP
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("gearshop")
        .setDescription("Show the current Gear Shop stock"),

    // --------------------------------------------------------
    // MERCHANT
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("merchant")
        .setDescription(
            "Show the current Traveling Merchant status and stock"
        ),

    // --------------------------------------------------------
    // WEATHER
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("weather")
        .setDescription(
            "Show the current in-game weather"
        ),

    // --------------------------------------------------------
    // FULL STOCK
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("stock")
        .setDescription(
            "Show Egg Shop, Gear Shop, Merchant, and Weather"
        ),

    // --------------------------------------------------------
    // SET CHANNEL
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("setchannel")
        .setDescription(
            "Set the channel for a specific notification type"
        )
        .addStringOption((option) =>
            option
                .setName("event")
                .setDescription("Notification type")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Egg Shop",
                        value: "eggShop"
                    },
                    {
                        name: "Gear Shop",
                        value: "gearShop"
                    },
                    {
                        name: "Traveling Merchant",
                        value: "merchant"
                    },
                    {
                        name: "Weather",
                        value: "weather"
                    }
                )
        )
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("Notification channel")
                .setRequired(true)
                .addChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.GuildAnnouncement
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    // --------------------------------------------------------
    // SET ROLE
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("setrole")
        .setDescription(
            "Set a role to ping for a notification type"
        )
        .addStringOption((option) =>
            option
                .setName("event")
                .setDescription("Notification type")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Egg Shop",
                        value: "eggShop"
                    },
                    {
                        name: "Gear Shop",
                        value: "gearShop"
                    },
                    {
                        name: "Traveling Merchant",
                        value: "merchant"
                    },
                    {
                        name: "Weather",
                        value: "weather"
                    }
                )
        )
        .addRoleOption((option) =>
            option
                .setName("role")
                .setDescription("Role to ping")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    // --------------------------------------------------------
    // CLEAR ROLE
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("clearrole")
        .setDescription(
            "Remove a notification ping role"
        )
        .addStringOption((option) =>
            option
                .setName("event")
                .setDescription("Notification type")
                .setRequired(true)
                .addChoices(
                    {
                        name: "Egg Shop",
                        value: "eggShop"
                    },
                    {
                        name: "Gear Shop",
                        value: "gearShop"
                    },
                    {
                        name: "Traveling Merchant",
                        value: "merchant"
                    },
                    {
                        name: "Weather",
                        value: "weather"
                    }
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    // --------------------------------------------------------
    // SETTINGS
    // --------------------------------------------------------

    new SlashCommandBuilder()
        .setName("settings")
        .setDescription(
            "View this server's notification settings"
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild)

].map(command => command.toJSON());

// ============================================================
// REGISTER SLASH COMMANDS
// ============================================================

async function registerCommands() {

    console.log("");
    console.log("==========================================");
    console.log("🔧 REGISTERING SLASH COMMANDS");
    console.log("==========================================");

    const rest = new REST({
        version: "10"
    }).setToken(DISCORD_TOKEN);

    try {

        // ----------------------------------------------------
        // SPECIFIC TEST GUILD
        // ----------------------------------------------------

        if (TEST_GUILD_ID) {

            console.log(
                `🎯 Target guild from DISCORD_TEST_GUILD_ID: ${TEST_GUILD_ID}`
            );

            await rest.put(
                Routes.applicationGuildCommands(
                    CLIENT_ID,
                    TEST_GUILD_ID
                ),
                {
                    body: commands
                }
            );

            console.log(
                `✅ Successfully registered ${commands.length} commands to ${TEST_GUILD_ID}`
            );

        }

        // ----------------------------------------------------
        // OTHERWISE REGISTER TO EVERY GUILD
        // ----------------------------------------------------

        else {

            console.log(
                "ℹ️ DISCORD_TEST_GUILD_ID is not set."
            );

            console.log(
                `📡 Bot is currently in ${client.guilds.cache.size} guild(s).`
            );

            for (const [guildId, guild] of client.guilds.cache) {

                try {

                    await rest.put(
                        Routes.applicationGuildCommands(
                            CLIENT_ID,
                            guildId
                        ),
                        {
                            body: commands
                        }
                    );

                    console.log(
                        `✅ Registered ${commands.length} commands → ${guild.name} (${guildId})`
                    );

                } catch (guildError) {

                    console.error(
                        `❌ Failed to register commands in ${guild.name} (${guildId})`
                    );

                    console.error(guildError.message);
                }
            }
        }

        console.log("==========================================");
        console.log("✅ COMMAND REGISTRATION COMPLETE");
        console.log("==========================================");
        console.log("");

    } catch (error) {

        console.error("");
        console.error("❌ COMMAND REGISTRATION FAILED");
        console.error("------------------------------------------");

        if (error?.rawError) {
            console.error(error.rawError);
        } else {
            console.error(error);
        }

        console.error("------------------------------------------");
    }
}

// ============================================================
// API
// ============================================================

async function fetchStatus() {

    const response = await fetch(
        `${API_BASE}/api/status`
    );

    if (!response.ok) {

        throw new Error(
            `API returned HTTP ${response.status}`
        );
    }

    return response.json();
}

// ============================================================
// DATA FRESHNESS
//
// If the in-game (Delta) script has disconnected, the API keeps
// serving the LAST data it received — it doesn't know the source
// went offline. Without this check, the bot would keep posting
// "restocked!" messages using increasingly outdated data forever.
// This treats data older than the threshold as untrustworthy and
// pauses broadcasts until fresh data starts arriving again.
// ============================================================

const DATA_STALE_THRESHOLD_MS = 60 * 1000;

function isDataStale(updatedAt) {

    if (!updatedAt) {
        return true;
    }

    const age =
        Date.now() -
        new Date(updatedAt).getTime();

    if (Number.isNaN(age)) {
        return true;
    }

    return age > DATA_STALE_THRESHOLD_MS;
}

// ============================================================
// LINK BUTTONS
// ============================================================

function buildLinkButtons(
    {
        viewAllId = null,
        viewAllLabel = "View All"
    } = {}
) {

    const inviteUrl =
        `https://discord.com/oauth2/authorize` +
        `?client_id=${CLIENT_ID}` +
        `&scope=bot%20applications.commands` +
        `&permissions=216064`;

    // Alternate which single button shows, flipping every 5
    // real-world minutes (xx:00 = invite, xx:05 = wiki, xx:10 =
    // invite, ...) instead of always showing both at once.
    const slot =
        Math.floor(
            Date.now() / (5 * 60 * 1000)
        );

    const showInvite =
        slot % 2 === 0;

    const button =
        showInvite
            ? new ButtonBuilder()
                .setLabel("Add Bot to Your Server")
                .setStyle(ButtonStyle.Link)
                .setURL(inviteUrl)
            : new ButtonBuilder()
                .setLabel("Capybaras vs Plants Wiki")
                .setStyle(ButtonStyle.Link)
                .setURL(WIKI_URL);

    const components = [button];

    if (viewAllId) {

        components.push(
            new ButtonBuilder()
                .setCustomId(viewAllId)
                .setLabel(viewAllLabel)
                .setStyle(ButtonStyle.Secondary)
        );
    }

    return new ActionRowBuilder().addComponents(
        ...components
    );
}

// ============================================================
// STOCK HELPERS
// ============================================================

// ============================================================
// PER-ITEM ICONS
//
// Discord embeds can't show a unique inline image next to each
// line of text — the only way to get a real per-item "photo" is
// a CUSTOM SERVER EMOJI, which Discord renders inline as a small
// icon wherever you reference it as <:name:id> in text.
//
// How to fill this in:
//   1. Server Settings → Emoji → Upload Emoji (one per item,
//      square PNG with transparent background works best,
//      Discord will resize it automatically)
//   2. In any channel, type a backslash then the emoji, e.g.
//      \:capybaraegg:  and send it — Discord replies with the
//      raw code, e.g. <:capybaraegg:1234567890123456789>
//   3. Paste that whole code as the value below, matching the
//      exact item name used in your game/API data (left side).
//
// Anything left as "" just falls back to a plain bullet — no
// crash, no missing-icon error, it just won't have a custom
// icon yet.
// ============================================================

// ============================================================
// CANONICAL DISPLAY ORDER
//
// The scan on the Roblox side finds items in whatever order it
// happens to encounter them in the GUI, which is NOT guaranteed
// to be consistent — so without this, the Discord list order
// jumps around randomly between updates. This forces a fixed,
// intentional order every time instead.
// ============================================================

const EGG_ORDER = [
    "Capybara Egg",
    "Alpha Capybara Egg",
    "Archer Capybara Egg",
    "Magic Capybara Egg",
    "Ghost Capybara Egg",
    "Golem Capybara Egg",
    "Robot Capybara Egg",
    "Disco Capybara Egg",
    "Angel Capybara Egg"
];

const GEAR_ORDER = [
    "Hatch Hammer",
    "Nametag",
    "Mutation Sponge",
    "Boombox",
    "Bizarre Stopwatch"
];

// NOTE: only King Capybara's items are confirmed against real
// in-game text (used by the scanner in script.lua). The other
// three merchants' item names below are best-guess labels for
// display purposes only, based on their emoji names — the
// scanner can't detect them yet until exact in-game text is
// confirmed and added to script.lua's MerchantItems list.
const MERCHANT_CATALOG = {
    "King Capybara": [
        "Gilded Hatch Hammer",
        "Gold Scroll",
        "Totem Of Status"
    ],
    "Martian": [
        "Raygun",
        "Alien Tesla",
        "Totem of Stars"
    ],
    "Timbles": [
        "Totem of Might",
        "Totem of Marrow",
        "Rainbow Scroll"
    ],
    "Jester": [
        "Moonlit",
        "Chilly",
        "Toasty",
        "Tranquil",
        "Shocked",
        "Glitched"
    ]
};

const WEATHER_ORDER = [
    "Sunny",
    "Night",
    "Rain",
    "Snowy",
    "Zen",
    "Meteor Shower",
    "Red Sun",
    "Heatwave",
    "Glitch",
    "Thunder",
    "Reverse Sun",
    "Taco Rain",
    "Blizzard"
];

function sortByCanonicalOrder(
    items,
    order
) {

    if (!order) {
        return items;
    }

    return items
        .map((item, index) => ({
            item,
            index
        }))
        .sort((a, b) => {

            let posA =
                order.indexOf(a.item.name);

            let posB =
                order.indexOf(b.item.name);

            if (posA === -1) {
                posA = order.length + a.index;
            }

            if (posB === -1) {
                posB = order.length + b.index;
            }

            return posA - posB;

        })
        .map(entry => entry.item);
}

const ITEM_EMOJIS = {

    // Eggs
    "Capybara Egg": "<:CapyEgg:1537417025566023730>",
    "Alpha Capybara Egg": "<:AlphaEgg:1537417006557692004>",
    "Archer Capybara Egg": "<:ArcherEgg:1537417013503467590>",
    "Magic Capybara Egg": "<:MagicCapE:1537417289476083722>",
    "Ghost Capybara Egg": "<:GhostEgg:1537417019425558578>",
    "Golem Capybara Egg": "<:GolemEgg:1537417082646298675>",
    "Robot Capybara Egg": "<:RobotEgg:1537417089802047488>",
    "Disco Capybara Egg": "<:DiscoEgg:1537417132537679924>",
    "Angel Capybara Egg": "<:AngelEgg:1537417121775222945>",

    // Gear
    "Hatch Hammer": "<:HatchHam:1537417831468236943>",
    "Nametag": "<:Rename:1537417870915543071>",
    "Mutation Sponge": "<:CVPSponge:1537417823914041385>",
    "Boombox": "<:Boombox:1537417707153264820>",
    "Bizarre Stopwatch": "<:BStopwatch:1537417698844352593>",

    // Merchant items (King Capybara)
    "Gilded Hatch Hammer": "<:GHHammer:1537417996275028108>",
    "Gold Scroll": "<:GoldScroll:1537418388840648815>",
    "Totem Of Status": "<:ToStatus:1537417977501065236>"

    // NOTE: Martian, Timbles, and Jester each sell their own
    // separate item sets (Raygun, Alien Tesla, Totem of Stars,
    // Totem of Might, Totem of Marrow, Rainbow Scroll, Moonlit,
    // Chilly, Toasty, Tranquil, Shocked, Glitched) — you have
    // emojis for these too, but they're not in script.lua's
    // MerchantItems list yet, so the scanner can't detect them
    // in-game. See note below before these will work.
};

function itemIcon(name, fallback = "•") {

    const emoji =
        ITEM_EMOJIS[name];

    return (
        emoji && emoji.trim() !== ""
            ? emoji
            : fallback
    );
}

// ============================================================
// FULL CATALOG EMBEDS ("View All" buttons)
//
// These show every possible item in a category, regardless of
// current stock — for players who just want to know what
// exists at all.
// ============================================================

function buildCatalogListEmbed(
    title,
    names
) {

    const lines =
        names.map(name =>
            `${itemIcon(name)} **${name}**`
        );

    return new EmbedBuilder()
        .setDescription(
            `# ${title}\n\n` +
            lines.join("\n")
        )
        .setColor(0x2b2d31);
}

function buildMerchantCatalogEmbed() {

    const sections =
        Object.entries(MERCHANT_CATALOG)
            .map(([merchantName, itemNames]) => {

                const lines =
                    itemNames.map(name =>
                        `${itemIcon(name)} **${name}**`
                    );

                return (
                    `**${merchantName}**\n` +
                    lines.join("\n")
                );
            });

    return new EmbedBuilder()
        .setDescription(
            "# Traveling Merchant — All Possible Items\n\n" +
            sections.join("\n\n")
        )
        .setColor(0x2b2d31);
}

function formatStockBadge(stock) {

    if (
        stock === null ||
        stock === undefined
    ) {
        return "`Unknown`";
    }

    const s = String(stock);

    const match = s.match(/x\s*(\d+)/i);

    if (match) {
        return `\`x${match[1]}\``;
    }

    return `\`${s}\``;
}

function updatedFooterText(updatedAt) {

    if (!updatedAt) {
        return null;
    }

    const timestamp =
        Math.floor(
            new Date(updatedAt).getTime() / 1000
        );

    if (Number.isNaN(timestamp)) {
        return null;
    }

    return `Updated <t:${timestamp}:R>`;
}

// ============================================================
// NEXT RESTOCK (aligned to the real-world clock, e.g. xx:00,
// xx:05, xx:10 ... xx:55 — not just "N minutes from now")
// ============================================================

function nextRestockUnix(intervalMinutes = 5) {

    const intervalMs = intervalMinutes * 60 * 1000;

    // +1000ms buffer so if we're called exactly ON a boundary,
    // it rolls to the NEXT one instead of showing 0 seconds left.
    const next =
        Math.ceil(
            (Date.now() + 1000) / intervalMs
        ) * intervalMs;

    return Math.floor(next / 1000);
}

function restockFooterText(
    updatedAt,
    {
        showRestockTimer = false,
        intervalMinutes = 5
    } = {}
) {

    const lines = [];

    if (showRestockTimer) {

        lines.push(
            `Restocks every ${intervalMinutes} minutes`
        );

        lines.push(
            `Next restock <t:${nextRestockUnix(intervalMinutes)}:R>`
        );
    }

    const updated = updatedFooterText(updatedAt);

    if (updated) {
        lines.push(updated);
    }

    return lines.join("\n");
}


// ============================================================
// NORMALIZE STOCK
// ============================================================

function normalizeStockList(raw) {

    if (!raw) {
        return [];
    }

    // Array format
    if (Array.isArray(raw)) {

        return raw.map(item => ({

            name:
                item.name ||
                item.Name ||
                item.title ||
                "Unknown",

            stock:
                item.stock !== undefined
                    ? item.stock
                    : item.Stock !== undefined
                        ? item.Stock
                        : item.inStock !== undefined
                            ? item.inStock
                            : null,

            rarity:
                item.rarity ||
                item.Rarity ||
                null,

            description:
                item.description ||
                item.Description ||
                null

        }));
    }

    // Object format
    return Object.entries(raw).map(
        ([name, stock]) => ({
            name,
            stock,
            rarity: null,
            description: null
        })
    );
}

// ============================================================
// STOCK AVAILABLE
// ============================================================

function stockIsAvailable(stock) {

    if (
        stock === null ||
        stock === undefined
    ) {
        return false;
    }

    if (typeof stock === "number") {
        return stock > 0;
    }

    const s =
        String(stock)
            .toLowerCase()
            .trim();

    if (
        s === "" ||
        s === "0" ||
        s.includes("no stock") ||
        s.includes("out of stock")
    ) {
        return false;
    }

    return true;
}

// ============================================================
// MERCHANT NORMALIZER
// ============================================================

function normalizeMerchant(raw) {

    if (!raw) {
        return null;
    }

    if (raw.active === false) {
        return null;
    }

    const name =
        raw.name ||
        raw.Name ||
        raw.merchant ||
        null;

    if (!name) {
        return null;
    }

    return {

        name,

        timeLeft:
            raw.timeLeft ||
            raw.TimeLeft ||
            raw.countdown ||
            null,

        items:
            normalizeStockList(
                raw.items ||
                raw.Items ||
                []
            )
    };
}

// ============================================================
// WEATHER NORMALIZER
// ============================================================

function normalizeWeather(raw) {

    if (!raw) {
        return null;
    }

    if (typeof raw === "string") {
        return raw;
    }

    return (
        raw.current ||
        raw.Current ||
        raw.name ||
        raw.Name ||
        null
    );
}

// ============================================================
// STOCK EMBED
// ============================================================

function buildStockEmbed(
    title,
    items,
    options = {}
) {

    const {
        colorFallback = 0x2b2d31,
        updatedAt = null,
        icon = "•",
        order = null
    } = options;

    items =
        sortByCanonicalOrder(
            items,
            order
        );

    const embed =
        new EmbedBuilder();

    const heading =
        `# ${title}\n\n`;

    if (items.length === 0) {

        embed
            .setDescription(
                heading +
                "No data available right now."
            )
            .setColor(colorFallback);

        return embed;
    }

    const inStock =
        items.filter(item =>
            stockIsAvailable(item.stock)
        );

    let description = heading;
    let lineCount = 0;

    if (inStock.length > 0) {

        description +=
            inStock
                .map(item => {

                    let line =
                        `${itemIcon(item.name, icon)} **${item.name}** ${formatStockBadge(item.stock)}`;

                    if (item.rarity) {
                        line +=
                            ` _(${item.rarity})_`;
                    }

                    return line;

                })
                .join("\n");

        lineCount = inStock.length;

    } else {

        description =
            "_Nothing in stock right now._";

        lineCount = 1;
    }

    // Pad with invisible lines (zero-width space) so the embed
    // is a consistent size regardless of how many items are in
    // stock — capped at a smaller target than the full catalog
    // (e.g. 6, not all 9 eggs) so the gap doesn't get excessive
    // when only a couple items are in stock. On the rare occasion
    // more than the target are in stock at once, the embed just
    // grows slightly that one time instead of clipping anything.
    const targetLines =
        Math.min(
            items.length,
            options.targetLines || 6
        );

    const padCount =
        Math.max(
            0,
            targetLines - lineCount
        );

    if (padCount > 0) {

        description +=
            "\n" +
            Array(padCount)
                .fill("\u200B")
                .join("\n");
    }

    const footer =
        restockFooterText(
            updatedAt,
            {
                showRestockTimer: true,
                intervalMinutes: 5
            }
        );

    if (footer) {
        description +=
            `\n\n${footer}`;
    }

    embed
        .setDescription(description)
        .setColor(
            inStock.length > 0
                ? 0x22c55e
                : colorFallback
        );

    return embed;
}

// ============================================================
// MERCHANT SCHEDULE
//
// The Traveling Merchant runs on a fixed real-world clock, not
// something that needs to be scanned/guessed: shows up right at
// xx:00 / xx:20 / xx:40, stays for 10 minutes, then is gone for
// the next 10 minutes, repeating forever. Since this is 100%
// predictable, we compute it directly instead of depending on
// (fragile) in-game text scanning for the countdown.
// ============================================================

const MERCHANT_CYCLE_MINUTES = 20;
const MERCHANT_ACTIVE_MINUTES = 10;

function merchantSchedule() {

    const epochMinutes =
        Math.floor(
            Date.now() / 60000
        );

    const cyclePos =
        epochMinutes % MERCHANT_CYCLE_MINUTES;

    const isActive =
        cyclePos < MERCHANT_ACTIVE_MINUTES;

    const minutesUntilChange =
        isActive
            ? MERCHANT_ACTIVE_MINUTES - cyclePos
            : MERCHANT_CYCLE_MINUTES - cyclePos;

    const changeAtUnix =
        Math.floor(
            (epochMinutes + minutesUntilChange) * 60
        );

    return {
        isActive,
        changeAtUnix
    };
}

// ============================================================
// MERCHANT EMBED
// ============================================================

function buildMerchantEmbed(
    merchant,
    updatedAt = null
) {

    const schedule =
        merchantSchedule();

    if (!merchant) {

        let description =
            schedule.isActive

                // The clock says the merchant SHOULD be active
                // right now, but scanning didn't detect one —
                // most likely the scanner just hasn't caught up
                // yet (or its item/name list needs updating).
                ? "The merchant should be here right now, but wasn't detected in the last scan.\n\n" +
                  `**Leaves:** <t:${schedule.changeAtUnix}:R>`

                : `**Next merchant:** <t:${schedule.changeAtUnix}:R>`;

        const footer =
            updatedFooterText(updatedAt);

        if (footer) {
            description +=
                `\n\n${footer}`;
        }

        return new EmbedBuilder()
            .setDescription(
                "# Traveling Merchant\n\n" +
                description
            )
            .setColor(0x2b2d31);
    }

    const lines =
        merchant.items.map(item =>
            `${itemIcon(item.name)} **${item.name}** ${formatStockBadge(item.stock)}`
        );

    let description =
        `# Traveling Merchant: ${merchant.name}\n\n` +
        `**Leaves:** <t:${schedule.changeAtUnix}:R>\n\n`;

    description +=
        lines.length > 0
            ? lines.join("\n")
            : "_No item data available._";

    const footer =
        updatedFooterText(updatedAt);

    if (footer) {
        description +=
            `\n\n${footer}`;
    }

    return new EmbedBuilder()
        .setDescription(description)
        .setColor(0xf59e0b);
}

// ============================================================
// WEATHER EMBED
// ============================================================

function buildWeatherEmbed(
    weather,
    updatedAt = null
) {

    // No special weather detected just means it's clear/Sunny —
    // that's the game's baseline state, not missing data.
    if (!weather) {
        weather = "Sunny";
    }

    let info = null;

    try {
        info = weatherInfo(weather);
    } catch (error) {
        console.error(
            "weatherInfo error:",
            error.message
        );
    }

    const embed =
        new EmbedBuilder()
            .setColor(
                info && info.color
                    ? info.color
                    : 0x344700
            );

    let description =
        `# Current Weather: ${weather}\n\n` +
        (
            info && info.description
                ? info.description
                : ""
        );

    if (
        info &&
        info.mutation
    ) {

        const chance =
            info.mutationChance !== undefined
                ? Math.round(
                    info.mutationChance * 100
                )
                : null;

        description +=
            `\n\n**Mutation chance:** ${info.mutation}`;

        if (chance !== null) {
            description +=
                ` (${chance}%)`;
        }
    }

    const footer =
        updatedFooterText(updatedAt);

    if (footer) {
        description +=
            `\n\n${footer}`;
    }

    embed.setDescription(
        description || "No additional information available."
    );

    return embed;
}

// ============================================================
// COMMAND HANDLER
// ============================================================

client.on(
    "interactionCreate",
    async interaction => {

        // ================================================
        // "VIEW ALL" BUTTON CLICKS
        // ================================================

        if (interaction.isButton()) {

            try {

                if (interaction.customId === "viewAll_eggShop") {

                    return interaction.reply({
                        embeds: [
                            buildCatalogListEmbed(
                                "All Eggs",
                                EGG_ORDER
                            )
                        ],
                        ephemeral: true
                    });
                }

                if (interaction.customId === "viewAll_gearShop") {

                    return interaction.reply({
                        embeds: [
                            buildCatalogListEmbed(
                                "All Gear",
                                GEAR_ORDER
                            )
                        ],
                        ephemeral: true
                    });
                }

                if (interaction.customId === "viewAll_merchant") {

                    return interaction.reply({
                        embeds: [
                            buildMerchantCatalogEmbed()
                        ],
                        ephemeral: true
                    });
                }

                if (interaction.customId === "viewAll_weather") {

                    return interaction.reply({
                        embeds: [
                            buildCatalogListEmbed(
                                "All Weather Types",
                                WEATHER_ORDER
                            )
                        ],
                        ephemeral: true
                    });
                }

            } catch (error) {

                console.error(
                    `❌ Error handling button ${interaction.customId}:`,
                    error
                );
            }

            return;
        }

        if (!interaction.isChatInputCommand()) {
            return;
        }

        console.log(
            `📥 Command received: /${interaction.commandName} by ${interaction.user.tag}`
        );

        try {

            // =================================================
            // EGG SHOP
            // =================================================

            if (
                interaction.commandName ===
                "eggshop"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embed =
                    buildStockEmbed(
                        "The Egg Shop",
                        normalizeStockList(
                            data.eggShop
                        ),
                        {
                            icon: "•",
                            order: EGG_ORDER,
                            updatedAt:
                                data.updatedAt
                        }
                    );

                return interaction.editReply({
                    embeds: [embed],
                    components: [
                        buildLinkButtons({
                            viewAllId: "viewAll_eggShop",
                            viewAllLabel: "View All Eggs"
                        })
                    ]
                });
            }

            // =================================================
            // GEAR SHOP
            // =================================================

            if (
                interaction.commandName ===
                "gearshop"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embed =
                    buildStockEmbed(
                        "The Gear Shop",
                        normalizeStockList(
                            data.gearShop
                        ),
                        {
                            icon: "•",
                            order: GEAR_ORDER,
                            updatedAt:
                                data.updatedAt
                        }
                    );

                return interaction.editReply({
                    embeds: [embed],
                    components: [
                        buildLinkButtons({
                            viewAllId: "viewAll_gearShop",
                            viewAllLabel: "View All Gear"
                        })
                    ]
                });
            }

            // =================================================
            // MERCHANT
            // =================================================

            if (
                interaction.commandName ===
                "merchant"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embed =
                    buildMerchantEmbed(
                        normalizeMerchant(
                            data.merchant
                        ),
                        data.updatedAt
                    );

                return interaction.editReply({
                    embeds: [embed],
                    components: [
                        buildLinkButtons({
                            viewAllId: "viewAll_merchant",
                            viewAllLabel: "View All Merchant Items"
                        })
                    ]
                });
            }

            // =================================================
            // WEATHER
            // =================================================

            if (
                interaction.commandName ===
                "weather"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embed =
                    buildWeatherEmbed(
                        normalizeWeather(
                            data.weather
                        ),
                        data.updatedAt
                    );

                return interaction.editReply({
                    embeds: [embed],
                    components: [
                        buildLinkButtons({
                            viewAllId: "viewAll_weather",
                            viewAllLabel: "View All Weather"
                        })
                    ]
                });
            }

            // =================================================
            // FULL STOCK
            // =================================================

            if (
                interaction.commandName ===
                "stock"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embeds = [

                    buildStockEmbed(
                        "The Egg Shop",
                        normalizeStockList(
                            data.eggShop
                        ),
                        {
                            icon: "•",
                            order: EGG_ORDER,
                            updatedAt:
                                data.updatedAt
                        }
                    ),

                    buildStockEmbed(
                        "The Gear Shop",
                        normalizeStockList(
                            data.gearShop
                        ),
                        {
                            icon: "•",
                            order: GEAR_ORDER,
                            updatedAt:
                                data.updatedAt
                        }
                    ),

                    buildMerchantEmbed(
                        normalizeMerchant(
                            data.merchant
                        ),
                        data.updatedAt
                    ),

                    buildWeatherEmbed(
                        normalizeWeather(
                            data.weather
                        ),
                        data.updatedAt
                    )

                ];

                return interaction.editReply({
                    embeds,
                    components: [
                        buildLinkButtons()
                    ]
                });
            }

            // =================================================
            // SET CHANNEL
            // =================================================

            if (
                interaction.commandName ===
                "setchannel"
            ) {

                const event =
                    interaction.options.getString(
                        "event"
                    );

                const channel =
                    interaction.options.getChannel(
                        "channel"
                    );

                db.setChannel(
                    interaction.guildId,
                    event,
                    channel.id
                );

                const eventLabels = {
                    eggShop: "Egg Shop",
                    gearShop: "Gear Shop",
                    merchant: "Traveling Merchant",
                    weather: "Weather"
                };

                return interaction.reply({
                    content:
                        `✅ **${eventLabels[event] || event}** notifications will now be posted in <#${channel.id}>.`,
                    ephemeral: true
                });
            }

            // =================================================
            // SET ROLE
            // =================================================

            if (
                interaction.commandName ===
                "setrole"
            ) {

                const event =
                    interaction.options.getString(
                        "event"
                    );

                const role =
                    interaction.options.getRole(
                        "role"
                    );

                db.setRole(
                    interaction.guildId,
                    event,
                    role.id
                );

                return interaction.reply({
                    content:
                        `✅ <@&${role.id}> will now be pinged for **${event}** notifications.`,
                    ephemeral: true
                });
            }

            // =================================================
            // CLEAR ROLE
            // =================================================

            if (
                interaction.commandName ===
                "clearrole"
            ) {

                const event =
                    interaction.options.getString(
                        "event"
                    );

                db.clearRole(
                    interaction.guildId,
                    event
                );

                return interaction.reply({
                    content:
                        `✅ Ping role cleared for **${event}**.`,
                    ephemeral: true
                });
            }

            // =================================================
            // SETTINGS
            // =================================================

            if (
                interaction.commandName ===
                "settings"
            ) {

                const config =
                    db.getGuildConfig(
                        interaction.guildId
                    );

                const eventLabels = {
                    eggShop: "Egg Shop",
                    gearShop: "Gear Shop",
                    merchant: "Traveling Merchant",
                    weather: "Weather"
                };

                const channels =
                    Object.entries(
                        config.channels || {}
                    );

                const channelLines =
                    channels.length > 0
                        ? channels
                            .map(
                                ([key, value]) =>
                                    `**${eventLabels[key] || key}:** <#${value}>`
                            )
                            .join("\n")
                        : "_None set — use /setchannel_";

                const roles =
                    Object.entries(
                        config.roles || {}
                    );

                const roleLines =
                    roles.length > 0
                        ? roles
                            .map(
                                ([key, value]) =>
                                    `**${eventLabels[key] || key}:** <@&${value}>`
                            )
                            .join("\n")
                        : "_None set — use /setrole_";

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            "CVP Notifier Settings"
                        )
                        .setDescription(
                            `**Notification Channels:**\n${channelLines}\n\n` +
                            `**Ping Roles:**\n${roleLines}`
                        )
                        .setColor(0x2b2d31);

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

        } catch (error) {

            console.error(
                `❌ Error handling /${interaction.commandName}:`,
                error
            );

            const message =
                "⚠️ Couldn't reach the CVP data API. Try again in a moment.";

            try {

                if (
                    interaction.deferred ||
                    interaction.replied
                ) {

                    await interaction.editReply({
                        content: message
                    });

                } else {

                    await interaction.reply({
                        content: message,
                        ephemeral: true
                    });
                }

            } catch (replyError) {

                console.error(
                    "❌ Failed to send error response:",
                    replyError
                );
            }
        }
    }
);

// ============================================================
// AUTOMATIC NOTIFICATIONS
// ============================================================

let lastState = {

    merchantName: null,
    weather: null,

    initialized: false
};

// ============================================================
// BROADCAST
// ============================================================

async function broadcast(
    eventType,
    embed
) {

    const guildConfigs =
        db.allGuildConfigs();

    if (Object.keys(guildConfigs).length === 0) {

        console.warn(
            `⚠️ broadcast(${eventType}): no guild settings saved at all. ` +
            `Has /setchannel been run since the last redeploy?`
        );

        return;
    }

    for (
        const [guildId, config]
        of Object.entries(guildConfigs)
    ) {

        const channelId =
            config.channels &&
            config.channels[eventType];

        if (!channelId) {

            console.log(
                `ℹ️ broadcast(${eventType}): no channel set for guild ${guildId}, skipping`
            );

            continue;
        }

        try {

            const channel =
                await client.channels.fetch(
                    channelId
                );

            if (!channel) {
                continue;
            }

            const roleId =
                config.roles &&
                config.roles[eventType];

            const viewAllMap = {
                eggShop: {
                    viewAllId: "viewAll_eggShop",
                    viewAllLabel: "View All Eggs"
                },
                gearShop: {
                    viewAllId: "viewAll_gearShop",
                    viewAllLabel: "View All Gear"
                },
                merchant: {
                    viewAllId: "viewAll_merchant",
                    viewAllLabel: "View All Merchant Items"
                },
                weather: {
                    viewAllId: "viewAll_weather",
                    viewAllLabel: "View All Weather"
                }
            };

            await channel.send({

                content:
                    roleId
                        ? `<@&${roleId}>`
                        : undefined,

                embeds: [
                    embed
                ],

                components: [
                    buildLinkButtons(
                        viewAllMap[eventType] || {}
                    )
                ],

                allowedMentions: {
                    roles:
                        roleId
                            ? [roleId]
                            : []
                }
            });

            console.log(
                `📢 Sent ${eventType} notification to ${guildId}`
            );

        } catch (error) {

            console.error(
                `❌ Failed to notify guild ${guildId}:`,
                error.message
            );
        }
    }
}

// ============================================================
// POLLER
// ============================================================

async function pollOnce() {

    let data;

    try {

        data =
            await fetchStatus();

    } catch (error) {

        console.error(
            "❌ Poll failed:",
            error.message
        );

        return;
    }

    if (isDataStale(data.updatedAt)) {

        console.warn(
            `⏸️ Skipping poll — data is stale ` +
            `(last update: ${data.updatedAt || "never"}). ` +
            `Is the in-game script still running?`
        );

        return;
    }

    // ========================================================
    // INITIALIZE STATE
    // ========================================================

    // The first poll establishes the current state.
    // It does NOT send fake "restocked" notifications.

    if (!lastState.initialized) {

        console.log(
            "📊 Initializing stock state..."
        );

        const merchant =
            normalizeMerchant(
                data.merchant
            );

        lastState.merchantName =
            merchant
                ? merchant.name
                : null;

        lastState.weather =
            normalizeWeather(
                data.weather
            );

        lastState.initialized = true;

        console.log(
            "✅ Initial state established."
        );

        return;
    }

    // ========================================================
    // MERCHANT
    // ========================================================

    const merchant =
        normalizeMerchant(
            data.merchant
        );

    const merchantName =
        merchant
            ? merchant.name
            : null;

    if (
        merchantName &&
        merchantName !==
            lastState.merchantName
    ) {

        console.log(
            `🚚 New merchant detected: ${merchantName}`
        );

        await broadcast(
            "merchant",
            buildMerchantEmbed(
                merchant,
                data.updatedAt
            )
        );
    }

    lastState.merchantName =
        merchantName;

    // ========================================================
    // WEATHER
    // ========================================================

    const weather =
        normalizeWeather(
            data.weather
        );

    if (
        weather &&
        weather !==
            lastState.weather
    ) {

        console.log(
            `🌦️ Weather changed: ${weather}`
        );

        await broadcast(
            "weather",
            buildWeatherEmbed(
                weather,
                data.updatedAt
            )
        );
    }

    lastState.weather =
        weather;
}

// ============================================================
// RESTOCK BROADCAST (Egg Shop / Gear Shop)
//
// Unlike merchant/weather (which change unpredictably and are
// handled above via diffing), the shops restock on a fixed
// real-world clock — every xx:00, xx:05, xx:10 ... xx:55.
// So instead of diffing, this just posts the FULL current
// in-stock list right after each of those marks.
// ============================================================

async function broadcastFullShopStock() {

    let data;

    try {

        data =
            await fetchStatus();

    } catch (error) {

        console.error(
            "❌ Restock broadcast fetch failed:",
            error.message
        );

        return;
    }

    if (isDataStale(data.updatedAt)) {

        console.warn(
            `⏸️ Skipping restock broadcast — data is stale ` +
            `(last update: ${data.updatedAt || "never"}). ` +
            `Is the in-game script still running?`
        );

        return;
    }

    console.log(
        "🔁 Restock mark reached — broadcasting current shop stock"
    );

    const eggEmbed =
        buildStockEmbed(
            "The Egg Shop has been restocked!",
            normalizeStockList(
                data.eggShop
            ),
            {
                icon: "•",
                            order: EGG_ORDER,
                updatedAt:
                    data.updatedAt
            }
        );

    await broadcast(
        "eggShop",
        eggEmbed
    );

    const gearEmbed =
        buildStockEmbed(
            "The Gear Shop has been restocked!",
            normalizeStockList(
                data.gearShop
            ),
            {
                icon: "•",
                            order: GEAR_ORDER,
                updatedAt:
                    data.updatedAt
            }
        );

    await broadcast(
        "gearShop",
        gearEmbed
    );
}

// How long after the exact xx:00/xx:05 mark to wait before
// broadcasting — gives the in-game script's scan (which now runs
// every 5s) time to pick up the fresh stock and POST it to
// the API first, so the broadcast isn't sent with stale data.
const RESTOCK_BROADCAST_DELAY_MS = 8 * 1000;

function scheduleRestockBroadcast(intervalMinutes = 5) {

    const intervalMs =
        intervalMinutes * 60 * 1000;

    const now = Date.now();

    const nextMark =
        Math.ceil(
            (now + 1000) / intervalMs
        ) * intervalMs;

    const delay =
        (nextMark - now) +
        RESTOCK_BROADCAST_DELAY_MS;

    console.log(
        `⏰ Next restock broadcast in ~${Math.round(delay / 1000)}s`
    );

    setTimeout(
        async () => {

            try {

                await broadcastFullShopStock();

            } catch (error) {

                console.error(
                    "❌ First restock broadcast failed:",
                    error
                );

            } finally {

                // Registered in `finally` so a crash on the
                // first run can NEVER silently cancel every
                // future scheduled broadcast.
                setInterval(
                    () => {

                        broadcastFullShopStock()
                            .catch(error => {

                                console.error(
                                    "❌ Restock broadcast failed:",
                                    error
                                );
                            });
                    },
                    intervalMs
                );
            }
        },
        delay
    );
}

// ============================================================
// READY
// ============================================================

client.once(
    "ready",
    async () => {

        console.log("");
        console.log("==========================================");
        console.log("🤖 CAPYBARAS VS PLANTS DISCORD BOT");
        console.log("==========================================");

        console.log(
            `🤖 Logged in as: ${client.user.tag}`
        );

        console.log(
            `🆔 Client ID: ${CLIENT_ID}`
        );

        console.log(
            `🌐 CVP API: ${API_BASE}`
        );

        console.log(
            `⏱️ Poll interval: ${POLL_INTERVAL_MS}ms`
        );

        console.log(
            `🏠 Guilds: ${client.guilds.cache.size}`
        );

        for (
            const guild
            of client.guilds.cache.values()
        ) {

            console.log(
                `   • ${guild.name} (${guild.id})`
            );
        }

        console.log("==========================================");

        // ----------------------------------------------------
        // REGISTER COMMANDS
        // ----------------------------------------------------

        await registerCommands();

        // ----------------------------------------------------
        // INITIAL API CHECK
        // ----------------------------------------------------

        console.log(
            "🔍 Checking CVP API..."
        );

        try {

            const data =
                await fetchStatus();

            console.log(
                "✅ CVP API is responding."
            );

            console.log(
                `📦 Egg Shop: ${
                    normalizeStockList(
                        data.eggShop
                    ).length
                } items`
            );

            console.log(
                `⚙️ Gear Shop: ${
                    normalizeStockList(
                        data.gearShop
                    ).length
                } items`
            );

        } catch (error) {

            console.error(
                "⚠️ CVP API check failed:",
                error.message
            );
        }

        // ----------------------------------------------------
        // INITIAL POLL
        // ----------------------------------------------------

        await pollOnce();

        // ----------------------------------------------------
        // CONTINUOUS POLLING
        // ----------------------------------------------------

        setInterval(
            pollOnce,
            POLL_INTERVAL_MS
        );

        // ----------------------------------------------------
        // RESTOCK BROADCAST SCHEDULER
        // ----------------------------------------------------

        scheduleRestockBroadcast(5);

        console.log("");
        console.log("==========================================");
        console.log("✅ CVP DISCORD BOT IS FULLY RUNNING");
        console.log("==========================================");
        console.log("");
    }
);

// ============================================================
// GUILD JOIN
// ============================================================

client.on(
    "guildCreate",
    async guild => {

        console.log(
            `➕ Bot joined new guild: ${guild.name} (${guild.id})`
        );

        // Automatically register commands for the new server.
        try {

            const rest =
                new REST({
                    version: "10"
                }).setToken(
                    DISCORD_TOKEN
                );

            await rest.put(
                Routes.applicationGuildCommands(
                    CLIENT_ID,
                    guild.id
                ),
                {
                    body: commands
                }
            );

            console.log(
                `✅ Commands registered in ${guild.name}`
            );

        } catch (error) {

            console.error(
                `❌ Could not register commands in ${guild.name}:`,
                error.message
            );
        }
    }
);

// ============================================================
// LOGIN
// ============================================================

console.log("🔑 Logging into Discord...");

client.login(
    DISCORD_TOKEN
).catch(error => {

    console.error(
        "❌ Discord login failed:"
    );

    console.error(
        error
    );

    process.exit(1);
});
