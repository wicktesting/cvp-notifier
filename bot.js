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

const fetch = require("node-fetch");

const db = require("./db");

const {
    weatherInfo,
    rarityColor
} = require("./gameData");


// ============================================================
// CONFIG
// ============================================================

const API_BASE =
    process.env.CVP_API_BASE_URL;

const POLL_INTERVAL_MS =
    parseInt(
        process.env.POLL_INTERVAL_MS || "30000",
        10
    );

const WIKI_URL =
    process.env.WIKI_URL ||
    "https://capybarasvsplants.fandom.com/wiki/Capybaras_vs_Plants_Wiki";

const DISCORD_TOKEN =
    process.env.DISCORD_BOT_TOKEN;

const CLIENT_ID =
    process.env.DISCORD_CLIENT_ID;

const TEST_GUILD_ID =
    process.env.DISCORD_TEST_GUILD_ID;

const DATA_STALE_THRESHOLD_MS =
    60 * 1000;


// ============================================================
// VALIDATION
// ============================================================

if (!DISCORD_TOKEN) {
    console.error(
        "❌ DISCORD_BOT_TOKEN is missing."
    );

    process.exit(1);
}

if (!CLIENT_ID) {
    console.error(
        "❌ DISCORD_CLIENT_ID is missing."
    );

    process.exit(1);
}

if (!API_BASE) {
    console.error(
        "❌ CVP_API_BASE_URL is missing."
    );

    process.exit(1);
}


// ============================================================
// DISCORD CLIENT
// ============================================================

const client =
    new Client({
        intents: [
            GatewayIntentBits.Guilds
        ]
    });


// ============================================================
// EVENT TYPES
// ============================================================

const EVENT_LABELS = {

    eggShop:
        "Egg Shop",

    gearShop:
        "Gear Shop",

    merchant:
        "Traveling Merchant",

    weather:
        "Weather",

    scrapShop:
        "Dr Carrot Scrap Shop",

    bounties:
        "Bounties"

};


// ============================================================
// SLASH COMMANDS
// ============================================================

const commands = [

    new SlashCommandBuilder()
        .setName("eggshop")
        .setDescription(
            "Show the current Egg Shop stock"
        ),

    new SlashCommandBuilder()
        .setName("gearshop")
        .setDescription(
            "Show the current Gear Shop stock"
        ),

    new SlashCommandBuilder()
        .setName("merchant")
        .setDescription(
            "Show the current Traveling Merchant"
        ),

    new SlashCommandBuilder()
        .setName("weather")
        .setDescription(
            "Show the current in-game weather"
        ),

    new SlashCommandBuilder()
        .setName("scrapshop")
        .setDescription(
            "Show the current Dr Carrot Scrap Shop"
        ),

    new SlashCommandBuilder()
        .setName("bounties")
        .setDescription(
            "Show the current bounties and their token rewards"
        ),

    new SlashCommandBuilder()
        .setName("bountyshop")
        .setDescription(
            "Show the Bounty Shop and token costs"
        ),

    new SlashCommandBuilder()
        .setName("stock")
        .setDescription(
            "Show all current CVP shops, merchant, weather, and bounties"
        ),

    new SlashCommandBuilder()
        .setName("setchannel")
        .setDescription(
            "Set the notification channel for an event"
        )
        .addStringOption(option =>
            option
                .setName("event")
                .setDescription(
                    "Notification type"
                )
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
                    },
                    {
                        name: "Dr Carrot Scrap Shop",
                        value: "scrapShop"
                    },
                    {
                        name: "Bounties",
                        value: "bounties"
                    }
                )
        )
        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription(
                    "Notification channel"
                )
                .setRequired(true)
                .addChannelTypes(
                    ChannelType.GuildText,
                    ChannelType.GuildAnnouncement
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    new SlashCommandBuilder()
        .setName("setrole")
        .setDescription(
            "Set a notification role, optionally for one item"
        )
        .addStringOption(option =>
            option
                .setName("event")
                .setDescription(
                    "Notification type"
                )
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
                    },
                    {
                        name: "Dr Carrot Scrap Shop",
                        value: "scrapShop"
                    },
                    {
                        name: "Bounties",
                        value: "bounties"
                    }
                )
        )
        .addRoleOption(option =>
            option
                .setName("role")
                .setDescription(
                    "Role to ping"
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("item")
                .setDescription(
                    "Optional item-specific ping"
                )
                .setRequired(false)
                .setAutocomplete(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    new SlashCommandBuilder()
        .setName("clearrole")
        .setDescription(
            "Clear a notification role"
        )
        .addStringOption(option =>
            option
                .setName("event")
                .setDescription(
                    "Notification type"
                )
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
                    },
                    {
                        name: "Dr Carrot Scrap Shop",
                        value: "scrapShop"
                    },
                    {
                        name: "Bounties",
                        value: "bounties"
                    }
                )
        )
        .addStringOption(option =>
            option
                .setName("item")
                .setDescription(
                    "Optional item-specific role"
                )
                .setRequired(false)
                .setAutocomplete(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    new SlashCommandBuilder()
        .setName("settings")
        .setDescription(
            "View this server's notification settings"
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

].map(
    command => command.toJSON()
);


// ============================================================
// REGISTER COMMANDS
// ============================================================

async function registerCommands() {

    const rest =
        new REST({
            version: "10"
        }).setToken(
            DISCORD_TOKEN
        );

    try {

        if (TEST_GUILD_ID) {

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
                `✅ Registered ${commands.length} commands to test guild ${TEST_GUILD_ID}`
            );

            return;
        }

        for (
            const guild
            of client.guilds.cache.values()
        ) {

            try {

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
                    `✅ Registered commands in ${guild.name}`
                );

            } catch (error) {

                console.error(
                    `❌ Failed command registration in ${guild.name}:`,
                    error.message
                );

            }

        }

    } catch (error) {

        console.error(
            "❌ Command registration failed:",
            error
        );

    }

}


// ============================================================
// API
// ============================================================

async function fetchStatus() {

    const response =
        await fetch(
            `${API_BASE}/api/status`
        );

    if (!response.ok) {

        throw new Error(
            `API returned HTTP ${response.status}`
        );

    }

    const json =
        await response.json();

    let data =
        json?.latestData ??
        json?.data ??
        json?.gameData ??
        json;

    if (
        data &&
        typeof data === "object" &&
        !data.eggShop &&
        data.data &&
        typeof data.data === "object"
    ) {

        data =
            data.data;

    }

    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "API returned invalid data."
        );

    }

    return data;

}


// ============================================================
// DATA FRESHNESS
// ============================================================

function isDataStale(updatedAt) {

    if (!updatedAt) {
        return true;
    }

    const time =
        new Date(
            updatedAt
        ).getTime();

    if (Number.isNaN(time)) {
        return true;
    }

    return (
        Date.now() - time
        >
        DATA_STALE_THRESHOLD_MS
    );

}


// ============================================================
// DISPLAY ORDER
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


// ============================================================
// ITEM EMOJIS
// ============================================================

const ITEM_EMOJIS = {

    "Capybara Egg":
        "<:CapyEgg:1537417025566023730>",

    "Alpha Capybara Egg":
        "<:AlphaEgg:1537417006557692004>",

    "Archer Capybara Egg":
        "<:ArcherEgg:1537417013503467590>",

    "Magic Capybara Egg":
        "<:MagicCapE:1537417289476083722>",

    "Ghost Capybara Egg":
        "<:GhostEgg:1537417019425558578>",

    "Golem Capybara Egg":
        "<:GolemEgg:1537417082646298675>",

    "Robot Capybara Egg":
        "<:RobotEgg:1537417089802047488>",

    "Disco Capybara Egg":
        "<:DiscoEgg:1537417132537679924>",

    "Angel Capybara Egg":
        "<:AngelEgg:1537417121775222945>",

    "Hatch Hammer":
        "<:HatchHam:1537417831468236943>",

    "Nametag":
        "<:Rename:1537417870915543071>",

    "Mutation Sponge":
        "<:CVPSponge:1537417823914041385>",

    "Boombox":
        "<:Boombox:1537417707153264820>",

    "Bizarre Stopwatch":
        "<:BStopwatch:1537417698844352593>",

    "Gilded Hatch Hammer":
        "<:GHHammer:1537417996275028108>",

    "Gold Scroll":
        "<:GoldScroll:1537418388840648815>",

    "Totem Of Status":
        "<:ToStatus:1537417977501065236>"

};


function itemIcon(
    name,
    fallback = "•"
) {

    return (
        ITEM_EMOJIS[name]
        ||
        fallback
    );

}


// ============================================================
// NORMALIZE STOCK
// ============================================================

function normalizeStockList(raw) {

    if (!raw) {
        return [];
    }

    if (Array.isArray(raw)) {

        return raw.map(
            item => ({

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

            })
        );

    }

    return Object.entries(raw)
        .map(
            ([name, value]) => {

                if (
                    value &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {

                    return {

                        name,

                        stock:
                            value.stock !== undefined
                                ? value.stock
                                : value.Stock !== undefined
                                    ? value.Stock
                                    : null,

                        rarity:
                            value.rarity ||
                            value.Rarity ||
                            null,

                        description:
                            value.description ||
                            value.Description ||
                            null

                    };

                }

                return {

                    name,

                    stock:
                        value,

                    rarity:
                        null,

                    description:
                        null

                };

            }
        );

}


// ============================================================
// STOCK STATE
// ============================================================

function stockIsAvailable(stock) {

    if (
        stock === null ||
        stock === undefined
    ) {

        return false;

    }

    if (
        typeof stock === "number"
    ) {

        return stock > 0;

    }

    const text =
        String(stock)
            .toLowerCase()
            .trim();

    if (
        text === "" ||
        text === "0" ||
        text.includes("no stock") ||
        text.includes("out of stock") ||
        text.includes("sold out")
    ) {

        return false;

    }

    const match =
        text.match(
            /x\s*(\d+)/
        );

    if (match) {
        return Number(match[1]) > 0;
    }

    return true;

}


// ============================================================
// MERCHANT
// ============================================================

function normalizeMerchant(raw) {

    if (!raw || raw === false) {
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
// WEATHER
// ============================================================

function normalizeWeather(raw) {

    if (!raw || raw === false) {
        return [];
    }

    if (typeof raw === "string") {
        return [raw];
    }

    if (Array.isArray(raw)) {
        return raw.filter(Boolean);
    }

    if (
        Array.isArray(raw.names)
    ) {

        return raw.names.filter(
            Boolean
        );

    }

    const single =
        raw.current ||
        raw.Current ||
        raw.name ||
        raw.Name ||
        null;

    return single
        ? [single]
        : [];

}


// ============================================================
// SCRAP SHOP
// ============================================================

function normalizeScrapShop(raw) {

    if (!raw || raw === false) {
        return null;
    }

    const items =
        normalizeStockList(
            raw.items ||
            raw.Items ||
            raw.Stock ||
            raw.stock ||
            []
        );

    return {

        theme:
            raw.theme ||
            raw.Theme ||
            "DrCarrot",

        restockUntil:
            raw.restockUntil ||
            raw.RestockUntil ||
            null,

        restocked:
            raw.restocked === true ||
            raw.Restocked === true,

        items

    };

}


// ============================================================
// BOUNTIES
// ============================================================

function normalizeBounties(raw) {

    if (!raw || raw === false) {
        return [];
    }

    if (
        raw.Bounties &&
        typeof raw.Bounties === "object"
    ) {

        raw =
            raw.Bounties;

    }

    if (
        raw.bounties &&
        typeof raw.bounties === "object"
    ) {

        raw =
            raw.bounties;

    }

    if (Array.isArray(raw)) {
        return raw;
    }

    if (
        raw.Easy ||
        raw.Hard
    ) {

        const result = [];

        if (raw.Easy) {

            result.push({
                difficulty:
                    "Easy",

                ...raw.Easy

            });

        }

        if (raw.Hard) {

            result.push({
                difficulty:
                    "Hard",

                ...raw.Hard

            });

        }

        return result;

    }

    return Object.values(
        raw
    );

}


// ============================================================
// BOUNTY HELPERS
// ============================================================

function bountyDifficulty(
    bounty
) {

    return (
        bounty.difficulty ||
        bounty.Difficulty ||
        bounty.Kind ||
        bounty.kind ||
        "Bounty"
    );

}


function bountyTokens(
    bounty
) {

    if (
        bounty.Tokens !== undefined
    ) {

        return bounty.Tokens;

    }

    if (
        bounty.tokens !== undefined
    ) {

        return bounty.tokens;

    }

    const difficulty =
        String(
            bountyDifficulty(
                bounty
            )
        ).toLowerCase();

    if (difficulty === "easy") {
        return 3;
    }

    if (difficulty === "hard") {
        return 5;
    }

    return "?";

}


function bountyMutations(
    bounty
) {

    const value =
        bounty.Mutations ??
        bounty.mutations ??
        bounty.Mutation ??
        bounty.mutation;

    if (!value) {
        return null;
    }

    if (Array.isArray(value)) {

        return value.join(
            ", "
        );

    }

    return String(value);

}


function bountyPlant(
    bounty
) {

    return (
        bounty.RequiredPlant ||
        bounty.requiredPlant ||
        bounty.PlantName ||
        bounty.plantName ||
        bounty.Plant ||
        bounty.plant ||
        bounty.TargetPlant ||
        bounty.targetPlant ||
        null
    );

}


function bountyRarity(
    bounty
) {

    return (
        bounty.Rarity ||
        bounty.rarity ||
        null
    );

}


function bountyMinSize(
    bounty
) {

    return (
        bounty.MinSize ??
        bounty.minSize ??
        null
    );

}


// ============================================================
// BOUNTY SHOP
// ============================================================

const BOUNTY_SHOP = [

    {
        name:
            "Totem Of Marrow",

        type:
            "Totem",

        cost:
            25
    },

    {
        name:
            "Bounty Hunter Trophy",

        type:
            "Totem",

        cost:
            250
    },

    {
        name:
            "Bounty Hunter Capybara Egg",

        type:
            "Egg",

        cost:
            300
    }

];


// ============================================================
// ORDER
// ============================================================

function sortByOrder(
    items,
    order
) {

    if (!order) {
        return items;
    }

    return items
        .map(
            (item, index) => ({
                item,
                index
            })
        )
        .sort(
            (a, b) => {

                let aPos =
                    order.indexOf(
                        a.item.name
                    );

                let bPos =
                    order.indexOf(
                        b.item.name
                    );

                if (aPos === -1) {
                    aPos =
                        order.length
                        + a.index;
                }

                if (bPos === -1) {
                    bPos =
                        order.length
                        + b.index;
                }

                return (
                    aPos - bPos
                );

            }
        )
        .map(
            entry =>
                entry.item
        );

}


// ============================================================
// FOOTER
// ============================================================

function updatedFooter(
    updatedAt
) {

    if (!updatedAt) {
        return null;
    }

    const timestamp =
        Math.floor(
            new Date(
                updatedAt
            ).getTime()
            / 1000
        );

    if (
        Number.isNaN(
            timestamp
        )
    ) {

        return null;

    }

    return (
        `Updated <t:${timestamp}:R>`
    );

}


// ============================================================
// STOCK EMBED
// ============================================================

function buildStockEmbed(
    title,
    rawItems,
    options = {}
) {

    let items =
        sortByOrder(
            rawItems,
            options.order
        );

    const embed =
        new EmbedBuilder();

    if (items.length === 0) {

        return embed
            .setTitle(title)
            .setDescription(
                "No data available right now."
            )
            .setColor(
                options.colorFallback ||
                0x2b2d31
            );

    }

    const inStock =
        items.filter(
            item =>
                stockIsAvailable(
                    item.stock
                )
        );

    let description =
        "# "
        + title
        + "\n\n";

    if (
        inStock.length === 0
    ) {

        description +=
            "_Nothing in stock right now._";

    } else {

        description +=
            inStock
                .map(
                    item => {

                        let line =
                            `${itemIcon(item.name)} **${item.name}** \`${String(item.stock)}\``;

                        if (
                            item.rarity
                        ) {

                            line +=
                                ` _(${item.rarity})_`;

                        }

                        return line;

                    }
                )
                .join("\n");

    }

    const footer =
        updatedFooter(
            options.updatedAt
        );

    if (footer) {

        description +=
            "\n\n"
            + footer;

    }

    return embed
        .setDescription(
            description
        )
        .setColor(
            inStock.length > 0
                ? 0x22c55e
                : (
                    options.colorFallback
                    || 0x2b2d31
                )
        );

}


// ============================================================
// SCRAP SHOP EMBED
// ============================================================

function buildScrapShopEmbed(
    raw,
    updatedAt
) {

    const shop =
        normalizeScrapShop(
            raw
        );

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🥕 Dr Carrot Scrap Shop"
            )
            .setColor(
                0xf59e0b
            );

    if (
        !shop ||
        shop.items.length === 0
    ) {

        return embed
            .setDescription(
                "No Scrap Shop data received yet."
            );

    }

    const lines =
        shop.items.map(
            item => {

                let line =
                    `${itemIcon(item.name)} **${item.name}** \`${String(item.stock)}\``;

                if (item.rarity) {

                    line +=
                        ` _(${item.rarity})_`;

                }

                if (
                    item.scrap !== undefined &&
                    item.scrap !== null
                ) {

                    line +=
                        ` — 🪙 ${item.scrap} Scrap`;

                }

                return line;

            }
        );

    let description =
        lines.join("\n");

    if (
        shop.restockUntil
    ) {

        const timestamp =
            Number(
                shop.restockUntil
            );

        if (
            Number.isFinite(
                timestamp
            )
        ) {

            description +=
                `\n\n**Restocks:** <t:${Math.floor(timestamp)}:R>`;

        }

    }

    const footer =
        updatedFooter(
            updatedAt
        );

    if (footer) {

        description +=
            "\n"
            + footer;

    }

    return embed
        .setDescription(
            description
        );

}


// ============================================================
// BOUNTY EMBED
// ============================================================

function buildBountiesEmbed(
    raw,
    updatedAt
) {

    const bounties =
        normalizeBounties(
            raw
        );

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🎯 Current Bounties"
            )
            .setColor(
                0xef4444
            );

    if (
        bounties.length === 0
    ) {

        return embed
            .setDescription(
                "No bounty data received yet."
            );

    }

    const sections =
        bounties.map(
            (bounty, index) => {

                const difficulty =
                    bountyDifficulty(
                        bounty
                    );

                const tokens =
                    bountyTokens(
                        bounty
                    );

                const rarity =
                    bountyRarity(
                        bounty
                    );

                const plant =
                    bountyPlant(
                        bounty
                    );

                const minSize =
                    bountyMinSize(
                        bounty
                    );

                const mutations =
                    bountyMutations(
                        bounty
                    );

                let text =
                    `**${index + 1}. ${difficulty}** — 🎟️ **${tokens} Tokens**`;

                if (rarity) {

                    text +=
                        `\n> Rarity: **${rarity}**`;

                }

                if (plant) {

                    text +=
                        `\n> Required Plant: **${plant}**`;

                }

                if (
                    minSize !== null &&
                    minSize !== undefined
                ) {

                    text +=
                        `\n> Minimum Size: **${minSize}**`;

                }

                if (mutations) {

                    text +=
                        `\n> Mutation: **${mutations}**`;

                }

                return text;

            }
        );

    let description =
        sections.join(
            "\n\n"
        );

    const footer =
        updatedFooter(
            updatedAt
        );

    if (footer) {

        description +=
            "\n\n"
            + footer;

    }

    return embed
        .setDescription(
            description
        );

}


// ============================================================
// BOUNTY SHOP EMBED
// ============================================================

function buildBountyShopEmbed() {

    const lines =
        BOUNTY_SHOP.map(
            item =>
                `• **${item.name}** — \`${item.cost}\` Bounty Tokens`
        );

    return new EmbedBuilder()
        .setTitle(
            "🎯 Bounty Shop"
        )
        .setDescription(
            lines.join("\n")
        )
        .setColor(
            0x8b5cf6
        )
        .setFooter({
            text:
                "Earn Bounty Tokens by completing bounties."
        });

}


// ============================================================
// MERCHANT SCHEDULE
// ============================================================

const MERCHANT_CYCLE_MINUTES =
    20;

const MERCHANT_ACTIVE_MINUTES =
    10;


function merchantSchedule() {

    const epochMinutes =
        Math.floor(
            Date.now()
            / 60000
        );

    const position =
        epochMinutes
        % MERCHANT_CYCLE_MINUTES;

    const active =
        position
        < MERCHANT_ACTIVE_MINUTES;

    const minutes =
        active
            ? MERCHANT_ACTIVE_MINUTES - position
            : MERCHANT_CYCLE_MINUTES - position;

    const changeAt =
        Math.floor(
            (
                epochMinutes
                + minutes
            ) * 60
        );

    return {

        active,

        changeAt

    };

}


// ============================================================
// MERCHANT EMBED
// ============================================================

function buildMerchantEmbed(
    raw,
    updatedAt
) {

    const merchant =
        normalizeMerchant(
            raw
        );

    const schedule =
        merchantSchedule();

    if (!merchant) {

        let description =
            "# Traveling Merchant\n\n";

        description +=
            schedule.active
                ? `The merchant should be here right now.\n\n**Leaves:** <t:${schedule.changeAt}:R>`
                : `**Next merchant:** <t:${schedule.changeAt}:R>`;

        const footer =
            updatedFooter(
                updatedAt
            );

        if (footer) {

            description +=
                "\n\n"
                + footer;

        }

        return new EmbedBuilder()
            .setDescription(
                description
            )
            .setColor(
                0x2b2d31
            );

    }

    let description =
        `# Traveling Merchant: ${merchant.name}\n\n`;

    description +=
        `**Leaves:** <t:${schedule.changeAt}:R>\n\n`;

    if (
        merchant.items.length > 0
    ) {

        description +=
            merchant.items
                .map(
                    item =>
                        `${itemIcon(item.name)} **${item.name}** \`${String(item.stock)}\``
                )
                .join("\n");

    } else {

        description +=
            "_No item data available._";

    }

    const footer =
        updatedFooter(
            updatedAt
        );

    if (footer) {

        description +=
            "\n\n"
            + footer;

    }

    return new EmbedBuilder()
        .setDescription(
            description
        )
        .setColor(
            0xf59e0b
        );

}


// ============================================================
// WEATHER EMBED
// ============================================================

function buildWeatherEmbed(
    raw,
    updatedAt
) {

    let weatherList =
        normalizeWeather(
            raw
        );

    if (
        weatherList.length === 0
    ) {

        weatherList =
            ["Sunny"];

    }

    const info =
        weatherInfo(
            weatherList[0]
        );

    let description =
        weatherList.length > 1
            ? `# Current Weather: ${weatherList.join(" + ")}\n\n`
            : `# Current Weather: ${weatherList[0]}\n\n`;

    description +=
        weatherList
            .map(
                name => {

                    const data =
                        weatherInfo(
                            name
                        );

                    let section =
                        weatherList.length > 1
                            ? `**${name}**\n`
                            : "";

                    if (
                        data &&
                        data.description
                    ) {

                        section +=
                            data.description;

                    }

                    if (
                        data &&
                        data.mutation
                    ) {

                        const chance =
                            data.mutationChance !== null &&
                            data.mutationChance !== undefined
                                ? ` (${Math.round(data.mutationChance * 100)}%)`
                                : "";

                        section +=
                            `\n**Mutation:** ${data.mutation}${chance}`;

                    }

                    return section;

                }
            )
            .join("\n\n");

    const footer =
        updatedFooter(
            updatedAt
        );

    if (footer) {

        description +=
            "\n\n"
            + footer;

    }

    return new EmbedBuilder()
        .setDescription(
            description
        )
        .setColor(
            info?.color ||
            0x344700
        );

}


// ============================================================
// LINK BUTTON
// ============================================================

function buildLinkButtons() {

    const inviteUrl =
        "https://discord.com/oauth2/authorize"
        + `?client_id=${CLIENT_ID}`
        + "&scope=bot%20applications.commands"
        + "&permissions=216064";

    return new ActionRowBuilder()
        .addComponents(

            new ButtonBuilder()
                .setLabel(
                    "Add Bot"
                )
                .setStyle(
                    ButtonStyle.Link
                )
                .setURL(
                    inviteUrl
                ),

            new ButtonBuilder()
                .setLabel(
                    "CVP Wiki"
                )
                .setStyle(
                    ButtonStyle.Link
                )
                .setURL(
                    WIKI_URL
                )

        );

}


// ============================================================
// ITEM CANDIDATES FOR AUTOCOMPLETE
// ============================================================

function getAutocompleteItems(
    event
) {

    const base = {

        eggShop:
            EGG_ORDER,

        gearShop:
            GEAR_ORDER,

        merchant:
            Object.values(
                ITEM_EMOJIS
            )
            .length
                ? Object.keys(
                    ITEM_EMOJIS
                )
                : [],

        weather:
            Object.keys(
                require("./gameData")
                    .WEATHER_INFO
            ),

        scrapShop:
            [],

        bounties:
            []

    };

    return base[event] || [];

}


// ============================================================
// INTERACTIONS
// ============================================================

client.on(
    "interactionCreate",
    async interaction => {

        // --------------------------------------------------------
        // AUTOCOMPLETE
        // --------------------------------------------------------

        if (
            interaction.isAutocomplete()
        ) {

            try {

                const event =
                    interaction.options
                        .getString(
                            "event"
                        );

                const focused =
                    interaction.options
                        .getFocused()
                        .toLowerCase();

                const candidates =
                    getAutocompleteItems(
                        event
                    );

                const results =
                    candidates
                        .filter(
                            name =>
                                name
                                    .toLowerCase()
                                    .includes(
                                        focused
                                    )
                        )
                        .slice(
                            0,
                            25
                        )
                        .map(
                            name => ({
                                name,
                                value:
                                    name
                            })
                        );

                await interaction.respond(
                    results
                );

            } catch (error) {

                console.error(
                    "❌ Autocomplete error:",
                    error
                );

            }

            return;

        }


        if (
            !interaction.isChatInputCommand()
        ) {

            return;

        }


        try {

            // ====================================================
            // EGG SHOP
            // ====================================================

            if (
                interaction.commandName ===
                "eggshop"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                return interaction.editReply({
                    embeds: [
                        buildStockEmbed(
                            "The Egg Shop",
                            normalizeStockList(
                                data.eggShop
                            ),
                            {
                                order:
                                    EGG_ORDER,

                                updatedAt:
                                    data.updatedAt
                            }
                        )
                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // GEAR SHOP
            // ====================================================

            if (
                interaction.commandName ===
                "gearshop"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                return interaction.editReply({
                    embeds: [
                        buildStockEmbed(
                            "The Gear Shop",
                            normalizeStockList(
                                data.gearShop
                            ),
                            {
                                order:
                                    GEAR_ORDER,

                                updatedAt:
                                    data.updatedAt
                            }
                        )
                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // MERCHANT
            // ====================================================

            if (
                interaction.commandName ===
                "merchant"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                return interaction.editReply({

                    embeds: [
                        buildMerchantEmbed(
                            data.merchant,
                            data.updatedAt
                        )
                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // WEATHER
            // ====================================================

            if (
                interaction.commandName ===
                "weather"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                return interaction.editReply({

                    embeds: [
                        buildWeatherEmbed(
                            data.weather,
                            data.updatedAt
                        )
                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // SCRAP SHOP
            // ====================================================

            if (
                interaction.commandName ===
                "scrapshop"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                return interaction.editReply({

                    embeds: [
                        buildScrapShopEmbed(
                            data.scrapShop,
                            data.updatedAt
                        )
                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // BOUNTIES
            // ====================================================

            if (
                interaction.commandName ===
                "bounties"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                return interaction.editReply({

                    embeds: [
                        buildBountiesEmbed(
                            data.bounties,
                            data.updatedAt
                        )
                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // BOUNTY SHOP
            // ====================================================

            if (
                interaction.commandName ===
                "bountyshop"
            ) {

                return interaction.reply({

                    embeds: [
                        buildBountyShopEmbed()
                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // FULL STOCK
            // ====================================================

            if (
                interaction.commandName ===
                "stock"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                return interaction.editReply({

                    embeds: [

                        buildStockEmbed(
                            "The Egg Shop",
                            normalizeStockList(
                                data.eggShop
                            ),
                            {
                                order:
                                    EGG_ORDER,

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
                                order:
                                    GEAR_ORDER,

                                updatedAt:
                                    data.updatedAt
                            }
                        ),

                        buildMerchantEmbed(
                            data.merchant,
                            data.updatedAt
                        ),

                        buildWeatherEmbed(
                            data.weather,
                            data.updatedAt
                        ),

                        buildScrapShopEmbed(
                            data.scrapShop,
                            data.updatedAt
                        ),

                        buildBountiesEmbed(
                            data.bounties,
                            data.updatedAt
                        ),

                        buildBountyShopEmbed()

                    ],

                    components: [
                        buildLinkButtons()
                    ]

                });

            }


            // ====================================================
            // SET CHANNEL
            // ====================================================

            if (
                interaction.commandName ===
                "setchannel"
            ) {

                const event =
                    interaction.options
                        .getString(
                            "event"
                        );

                const channel =
                    interaction.options
                        .getChannel(
                            "channel"
                        );

                db.setChannel(
                    interaction.guildId,
                    event,
                    channel.id
                );

                return interaction.reply({

                    content:
                        `✅ **${EVENT_LABELS[event] || event}** notifications will now be posted in <#${channel.id}>.`,

                    ephemeral:
                        true

                });

            }


            // ====================================================
            // SET ROLE
            // ====================================================

            if (
                interaction.commandName ===
                "setrole"
            ) {

                const event =
                    interaction.options
                        .getString(
                            "event"
                        );

                const role =
                    interaction.options
                        .getRole(
                            "role"
                        );

                const item =
                    interaction.options
                        .getString(
                            "item"
                        );

                if (item) {

                    db.setItemRole(
                        interaction.guildId,
                        item,
                        role.id
                    );

                    return interaction.reply({

                        content:
                            `✅ <@&${role.id}> will now be pinged specifically for **${item}**.`,

                        ephemeral:
                            true

                    });

                }

                db.setRole(
                    interaction.guildId,
                    event,
                    role.id
                );

                return interaction.reply({

                    content:
                        `✅ <@&${role.id}> will now be pinged for **${EVENT_LABELS[event] || event}** notifications.`,

                    ephemeral:
                        true

                });

            }


            // ====================================================
            // CLEAR ROLE
            // ====================================================

            if (
                interaction.commandName ===
                "clearrole"
            ) {

                const event =
                    interaction.options
                        .getString(
                            "event"
                        );

                const item =
                    interaction.options
                        .getString(
                            "item"
                        );

                if (item) {

                    db.clearItemRole(
                        interaction.guildId,
                        item
                    );

                    return interaction.reply({

                        content:
                            `✅ Ping role cleared for **${item}**.`,

                        ephemeral:
                            true

                    });

                }

                db.clearRole(
                    interaction.guildId,
                    event
                );

                return interaction.reply({

                    content:
                        `✅ Ping role cleared for **${EVENT_LABELS[event] || event}**.`,

                    ephemeral:
                        true

                });

            }


            // ====================================================
            // SETTINGS
            // ====================================================

            if (
                interaction.commandName ===
                "settings"
            ) {

                const config =
                    db.getGuildConfig(
                        interaction.guildId
                    );

                const channelEntries =
                    Object.entries(
                        config.channels || {}
                    );

                const roleEntries =
                    Object.entries(
                        config.roles || {}
                    );

                const itemRoleEntries =
                    Object.entries(
                        config.itemRoles || {}
                    );

                const channels =
                    channelEntries.length > 0

                        ? channelEntries
                            .map(
                                ([key, value]) =>
                                    `**${EVENT_LABELS[key] || key}:** <#${value}>`
                            )
                            .join("\n")

                        : "_None configured_";

                const roles =
                    roleEntries.length > 0

                        ? roleEntries
                            .map(
                                ([key, value]) =>
                                    `**${EVENT_LABELS[key] || key}:** <@&${value}>`
                            )
                            .join("\n")

                        : "_None configured_";

                const itemRoles =
                    itemRoleEntries.length > 0

                        ? itemRoleEntries
                            .map(
                                ([key, value]) =>
                                    `**${key}:** <@&${value}>`
                            )
                            .join("\n")

                        : "_None configured_";

                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()
                            .setTitle(
                                "⚙️ CVP Notifier Settings"
                            )
                            .setDescription(
                                `**Notification Channels**\n${channels}\n\n` +
                                `**Category Roles**\n${roles}\n\n` +
                                `**Individual Item Roles**\n${itemRoles}`
                            )
                            .setColor(
                                0x2b2d31
                            )

                    ],

                    ephemeral:
                        true

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
                        content:
                            message
                    });

                } else {

                    await interaction.reply({
                        content:
                            message,

                        ephemeral:
                            true
                    });

                }

            } catch (
                replyError
            ) {

                console.error(
                    replyError
                );

            }

        }

    }
);


// ============================================================
// LAST STATE
// ============================================================

let lastState = {

    eggShop: {},

    gearShop: {},

    merchantName:
        null,

    weather: [],

    scrapShopSignature:
        null,

    bountySignature:
        null,

    initialized:
        false

};


// ============================================================
// STABLE JSON
// ============================================================

function stableStringify(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    if (
        typeof value !== "object"
    ) {

        return String(
            value
        );

    }

    if (
        Array.isArray(value)
    ) {

        return JSON.stringify(
            value.map(
                stableStringify
            )
        );

    }

    const sorted =
        Object.keys(value)
            .sort()
            .reduce(
                (obj, key) => {

                    obj[key] =
                        value[key];

                    return obj;

                },
                {}
            );

    return JSON.stringify(
        sorted
    );

}


// ============================================================
// BROADCAST
// ============================================================

async function broadcast(
    eventType,
    embed,
    itemNames = []
) {

    const configs =
        db.allGuildConfigs();

    for (
        const [
            guildId,
            config
        ]
        of Object.entries(
            configs
        )
    ) {

        const channelId =
            config.channels &&
            config.channels[eventType];

        if (!channelId) {
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

            const categoryRole =
                config.roles &&
                config.roles[eventType];

            const itemRoles =
                itemNames
                    .map(
                        name =>
                            config.itemRoles &&
                            config.itemRoles[name]
                    )
                    .filter(
                        Boolean
                    );

            const roleIds =
                [
                    categoryRole,
                    ...itemRoles
                ]
                .filter(
                    Boolean
                )
                .filter(
                    (id, index, array) =>
                        array.indexOf(id)
                        === index
                );

            await channel.send({

                content:
                    roleIds.length > 0
                        ? roleIds
                            .map(
                                id =>
                                    `<@&${id}>`
                            )
                            .join(" ")
                        : undefined,

                embeds: [
                    embed
                ],

                components: [
                    buildLinkButtons()
                ],

                allowedMentions: {
                    roles:
                        roleIds
                }

            });

            console.log(
                `📢 Sent ${eventType} notification to ${guildId}`
            );

        } catch (error) {

            console.error(
                `❌ Failed to notify ${guildId}:`,
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


    if (
        isDataStale(
            data.updatedAt
        )
    ) {

        console.warn(
            "⏸️ API data is stale. Skipping notifications."
        );

        return;

    }


    // ========================================================
    // INITIAL STATE
    // ========================================================

    if (
        !lastState.initialized
    ) {

        for (
            const key
            of [
                "eggShop",
                "gearShop"
            ]
        ) {

            const items =
                normalizeStockList(
                    data[key]
                );

            for (
                const item
                of items
            ) {

                lastState[key][
                    item.name
                ] =
                    stockIsAvailable(
                        item.stock
                    );

            }

        }


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


        const scrap =
            normalizeScrapShop(
                data.scrapShop
            );

        lastState.scrapShopSignature =
            stableStringify(
                scrap
            );


        const bounties =
            normalizeBounties(
                data.bounties
            );

        lastState.bountySignature =
            stableStringify(
                bounties
            );


        lastState.initialized =
            true;

        console.log(
            "✅ Initial state established."
        );

        return;

    }


    // ========================================================
    // EGG + GEAR
    // ========================================================

    for (
        const [
            key,
            title,
            eventType
        ]
        of [
            [
                "eggShop",
                "🥚 The Egg Shop has been restocked!",
                "eggShop"
            ],
            [
                "gearShop",
                "⚙️ The Gear Shop has been restocked!",
                "gearShop"
            ]
        ]
    ) {

        const items =
            normalizeStockList(
                data[key]
            );

        const newlyInStock = [];

        for (
            const item
            of items
        ) {

            const wasAvailable =
                lastState[key][
                    item.name
                ] || false;

            const available =
                stockIsAvailable(
                    item.stock
                );

            if (
                available &&
                !wasAvailable
            ) {

                newlyInStock.push(
                    item
                );

            }

            lastState[key][
                item.name
            ] =
                available;

        }


        if (
            newlyInStock.length > 0
        ) {

            await broadcast(

                eventType,

                buildStockEmbed(
                    title,
                    newlyInStock,
                    {
                        updatedAt:
                            data.updatedAt,

                        order:
                            key === "eggShop"
                                ? EGG_ORDER
                                : GEAR_ORDER
                    }
                ),

                newlyInStock.map(
                    item =>
                        item.name
                )

            );

        }

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

        await broadcast(

            "merchant",

            buildMerchantEmbed(
                merchant,
                data.updatedAt
            ),

            merchant.items.map(
                item =>
                    item.name
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

    const previousWeather =
        lastState.weather ||
        [];

    const weatherChanged =
        weather.length !==
            previousWeather.length
        ||
        weather.some(
            name =>
                !previousWeather.includes(
                    name
                )
        );

    if (
        weather.length > 0 &&
        weatherChanged
    ) {

        const newlyActive =
            weather.filter(
                name =>
                    !previousWeather.includes(
                        name
                    )
            );

        await broadcast(

            "weather",

            buildWeatherEmbed(
                weather,
                data.updatedAt
            ),

            newlyActive

        );

    }

    lastState.weather =
        weather;


    // ========================================================
    // SCRAP SHOP
    // ========================================================

    const scrap =
        normalizeScrapShop(
            data.scrapShop
        );

    const scrapSignature =
        stableStringify(
            scrap
        );

    if (
        scrap &&
        scrapSignature !==
            lastState.scrapShopSignature
    ) {

        const itemNames =
            scrap.items
                .filter(
                    item =>
                        stockIsAvailable(
                            item.stock
                        )
                )
                .map(
                    item =>
                        item.name
                );

        await broadcast(

            "scrapShop",

            buildScrapShopEmbed(
                scrap,
                data.updatedAt
            ),

            itemNames

        );

    }

    lastState.scrapShopSignature =
        scrapSignature;


    // ========================================================
    // BOUNTIES
    // ========================================================

    const bounties =
        normalizeBounties(
            data.bounties
        );

    const bountySignature =
        stableStringify(
            bounties
        );

    if (
        bounties.length > 0 &&
        bountySignature !==
            lastState.bountySignature
    ) {

        await broadcast(

            "bounties",

            buildBountiesEmbed(
                bounties,
                data.updatedAt
            )

        );

    }

    lastState.bountySignature =
        bountySignature;

}


// ============================================================
// FULL RESTOCK BROADCAST
// ============================================================

async function broadcastFullShopStock() {

    let data;

    try {

        data =
            await fetchStatus();

    } catch (error) {

        console.error(
            "❌ Restock fetch failed:",
            error.message
        );

        return;

    }


    if (
        isDataStale(
            data.updatedAt
        )
    ) {

        return;

    }


    const eggItems =
        normalizeStockList(
            data.eggShop
        );

    const gearItems =
        normalizeStockList(
            data.gearShop
        );


    const eggInStock =
        eggItems
            .filter(
                item =>
                    stockIsAvailable(
                        item.stock
                    )
            )
            .map(
                item =>
                    item.name
            );


    const gearInStock =
        gearItems
            .filter(
                item =>
                    stockIsAvailable(
                        item.stock
                    )
            )
            .map(
                item =>
                    item.name
            );


    await broadcast(

        "eggShop",

        buildStockEmbed(
            "The Egg Shop has been restocked!",
            eggItems,
            {
                order:
                    EGG_ORDER,

                updatedAt:
                    data.updatedAt
            }
        ),

        eggInStock

    );


    await broadcast(

        "gearShop",

        buildStockEmbed(
            "The Gear Shop has been restocked!",
            gearItems,
            {
                order:
                    GEAR_ORDER,

                updatedAt:
                    data.updatedAt
            }
        ),

        gearInStock

    );

}


// ============================================================
// RESTOCK SCHEDULER
// ============================================================

const RESTOCK_INTERVAL_MS =
    5 * 60 * 1000;

const RESTOCK_DELAY_MS =
    4000;


function scheduleRestockBroadcast() {

    const now =
        Date.now();

    const nextMark =
        Math.ceil(
            (
                now + 1000
            )
            /
            RESTOCK_INTERVAL_MS
        )
        *
        RESTOCK_INTERVAL_MS;

    const delay =
        (
            nextMark -
            now
        )
        +
        RESTOCK_DELAY_MS;

    console.log(
        `⏰ Next restock broadcast in ~${Math.round(delay / 1000)}s`
    );

    setTimeout(
        async () => {

            try {

                await broadcastFullShopStock();

            } catch (error) {

                console.error(
                    error
                );

            }

            setInterval(
                () => {

                    broadcastFullShopStock()
                        .catch(
                            console.error
                        );

                },
                RESTOCK_INTERVAL_MS
            );

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

        console.log(
            "=========================================="
        );

        console.log(
            `🤖 Logged in as ${client.user.tag}`
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

        console.log(
            "=========================================="
        );


        await registerCommands();


        try {

            const data =
                await fetchStatus();

            console.log(
                "✅ CVP API is responding."
            );

            console.log(
                `🥚 Eggs: ${normalizeStockList(data.eggShop).length}`
            );

            console.log(
                `⚙️ Gear: ${normalizeStockList(data.gearShop).length}`
            );

            console.log(
                `🥕 Scrap: ${normalizeScrapShop(data.scrapShop)?.items?.length || 0}`
            );

            console.log(
                `🎯 Bounties: ${normalizeBounties(data.bounties).length}`
            );

        } catch (error) {

            console.error(
                "⚠️ Initial API check failed:",
                error.message
            );

        }


        await pollOnce();


        setInterval(
            pollOnce,
            POLL_INTERVAL_MS
        );


        scheduleRestockBroadcast();


        console.log(
            "✅ CVP Discord Bot is fully running."
        );

    }
);


// ============================================================
// NEW GUILD
// ============================================================

client.on(
    "guildCreate",
    async guild => {

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
                `❌ Guild registration failed for ${guild.name}:`,
                error.message
            );

        }

    }
);


// ============================================================
// LOGIN
// ============================================================

console.log(
    "🔑 Logging into Discord..."
);

client.login(
    DISCORD_TOKEN
)
.catch(
    error => {

        console.error(
            "❌ Discord login failed:",
            error
        );

        process.exit(1);

    }
);
