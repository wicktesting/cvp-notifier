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
    PermissionFlagsBits
} = require("discord.js");

const fetch = require("node-fetch");
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
const TEST_GUILD_ID = process.env.DISCORD_TEST_GUILD_ID;

// Permissions:
// View Channel
// Send Messages
// Embed Links
// Read Message History
const INVITE_PERMISSIONS = "216064";

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
    intents: [GatewayIntentBits.Guilds]
});

// ============================================================
// SLASH COMMAND DEFINITIONS
// ============================================================

const commands = [

    new SlashCommandBuilder()
        .setName("eggshop")
        .setDescription("Show the current Egg Shop stock"),

    new SlashCommandBuilder()
        .setName("gearshop")
        .setDescription("Show the current Gear Shop stock"),

    new SlashCommandBuilder()
        .setName("merchant")
        .setDescription(
            "Show the current Traveling Merchant status and stock"
        ),

    new SlashCommandBuilder()
        .setName("weather")
        .setDescription("Show the current in-game weather"),

    new SlashCommandBuilder()
        .setName("stock")
        .setDescription(
            "Show a full overview: Egg Shop, Gear Shop, Merchant, and Weather"
        ),

    new SlashCommandBuilder()
        .setName("setchannel")
        .setDescription(
            "Set the channel where automatic stock notifications are posted"
        )
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("Notification channel")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    new SlashCommandBuilder()
        .setName("setrole")
        .setDescription(
            "Set a role to ping for a specific notification type"
        )
        .addStringOption((option) =>
            option
                .setName("event")
                .setDescription("Which notification type")
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

    new SlashCommandBuilder()
        .setName("clearrole")
        .setDescription(
            "Remove the ping role for a specific notification type"
        )
        .addStringOption((option) =>
            option
                .setName("event")
                .setDescription("Which notification type")
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

    new SlashCommandBuilder()
        .setName("settings")
        .setDescription(
            "View this server's notification configuration"
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild)

].map((command) => command.toJSON());

// ============================================================
// REGISTER SLASH COMMANDS
// ============================================================

async function registerCommands() {

    const rest = new REST({
        version: "10"
    }).setToken(DISCORD_TOKEN);

    try {

        console.log("==========================================");
        console.log("REGISTERING CVP SLASH COMMANDS");
        console.log("==========================================");

        if (TEST_GUILD_ID) {

            console.log(
                `Registering commands to test server: ${TEST_GUILD_ID}`
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
                `✅ Registered ${commands.length} commands to test server.`
            );

        } else {

            console.log(
                "⚠️ DISCORD_TEST_GUILD_ID is not configured."
            );

            console.log(
                "Registering commands globally instead."
            );

            await rest.put(
                Routes.applicationCommands(CLIENT_ID),
                {
                    body: commands
                }
            );

            console.log(
                `✅ Registered ${commands.length} global commands.`
            );
        }

        console.log("==========================================");

    } catch (error) {

        console.error("❌ Failed to register slash commands.");

        if (error?.rawError) {
            console.error(error.rawError);
        } else {
            console.error(error);
        }

    }
}

// ============================================================
// API
// ============================================================

async function fetchStatus() {

    const res = await fetch(
        `${API_BASE}/api/status`
    );

    if (!res.ok) {
        throw new Error(
            `API returned ${res.status}`
        );
    }

    return res.json();
}

// ============================================================
// LINK BUTTONS
// ============================================================

function buildLinkButtons() {

    const inviteUrl =
        `https://discord.com/oauth2/authorize` +
        `?client_id=${CLIENT_ID}` +
        `&scope=bot%20applications.commands` +
        `&permissions=${INVITE_PERMISSIONS}`;

    return new ActionRowBuilder().addComponents(

        new ButtonBuilder()
            .setLabel("Add Bot to Your Server")
            .setStyle(ButtonStyle.Link)
            .setURL(inviteUrl)
            .setEmoji("🤖"),

        new ButtonBuilder()
            .setLabel("Capybaras vs Plants Wiki")
            .setStyle(ButtonStyle.Link)
            .setURL(WIKI_URL)
            .setEmoji("📖")

    );
}

// ============================================================
// STOCK FORMATTING
// ============================================================

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

    const ts = Math.floor(
        new Date(updatedAt).getTime() / 1000
    );

    if (Number.isNaN(ts)) {
        return null;
    }

    return `Updated <t:${ts}:R>`;
}

// ============================================================
// NORMALIZERS
// ============================================================

function normalizeStockList(raw) {

    if (!raw) {
        return [];
    }

    if (Array.isArray(raw)) {

        return raw.map((item) => ({

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

    return Object.entries(raw).map(
        ([name, stock]) => ({
            name,
            stock,
            rarity: null,
            description: null
        })
    );
}

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

    const s = String(stock).toLowerCase();

    return (
        !s.includes("no stock") &&
        s !== "0" &&
        s.trim() !== ""
    );
}

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

        items: normalizeStockList(
            raw.items ||
            raw.Items ||
            []
        )

    };
}

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
// EMBEDS
// ============================================================

function buildStockEmbed(
    title,
    items,
    opts = {}
) {

    const {
        colorFallback = 0x2b2d31,
        updatedAt = null,
        icon = "•"
    } = opts;

    const embed = new EmbedBuilder()
        .setTitle(title);

    if (items.length === 0) {

        embed
            .setDescription(
                "No data available right now."
            )
            .setColor(colorFallback);

        return embed;
    }

    const inStock =
        items.filter((item) =>
            stockIsAvailable(item.stock)
        );

    const outOfStock =
        items.filter((item) =>
            !stockIsAvailable(item.stock)
        );

    let desc = "";

    if (inStock.length > 0) {

        desc += inStock
            .map((item) => {

                let line =
                    `${icon} **${item.name}** ` +
                    `${formatStockBadge(item.stock)}`;

                if (item.rarity) {
                    line += ` _(${item.rarity})_`;
                }

                return line;

            })
            .join("\n");

    } else {

        desc += "_Nothing in stock right now._";
    }

    if (outOfStock.length > 0) {

        desc +=
            "\n\n" +
            outOfStock
                .map(
                    (item) =>
                        `~~${item.name}~~`
                )
                .join(" · ");
    }

    const footer =
        updatedFooterText(updatedAt);

    if (footer) {
        desc += `\n\n${footer}`;
    }

    embed
        .setDescription(desc)
        .setColor(
            inStock.length > 0
                ? 0x22c55e
                : colorFallback
        );

    return embed;
}

// ============================================================
// MERCHANT EMBED
// ============================================================

function buildMerchantEmbed(
    merchant,
    updatedAt = null
) {

    if (!merchant) {

        return new EmbedBuilder()
            .setTitle("🚚 Traveling Merchant")
            .setDescription(
                "No merchant is currently here." +
                (
                    updatedFooterText(updatedAt)
                        ? `\n\n${updatedFooterText(updatedAt)}`
                        : ""
                )
            )
            .setColor(0x2b2d31);
    }

    const lines =
        merchant.items.map(
            (item) =>
                `🛍️ **${item.name}** ` +
                `${formatStockBadge(item.stock)}`
        );

    let desc =
        merchant.timeLeft
            ? `**Leaves in:** ${merchant.timeLeft}\n\n`
            : "";

    desc +=
        lines.length > 0
            ? lines.join("\n")
            : "_No item data available._";

    const footer =
        updatedFooterText(updatedAt);

    if (footer) {
        desc += `\n\n${footer}`;
    }

    return new EmbedBuilder()
        .setTitle(
            `🚚 Traveling Merchant: ${merchant.name}`
        )
        .setDescription(desc)
        .setColor(0xf59e0b);
}

// ============================================================
// WEATHER EMBED
// ============================================================

function buildWeatherEmbed(
    weather,
    updatedAt = null
) {

    if (!weather) {

        return new EmbedBuilder()
            .setTitle("🌦️ Weather")
            .setDescription(
                "No weather data available right now."
            )
            .setColor(0x2b2d31);
    }

    const info = weatherInfo(weather);

    const embed =
        new EmbedBuilder()
            .setTitle(
                `🌦️ Current Weather: ${weather}`
            )
            .setColor(
                info
                    ? info.color
                    : 0x344700
            );

    let desc =
        info
            ? info.description
            : "";

    if (
        info &&
        info.mutation
    ) {

        desc +=
            `\n\n**Mutation chance:** ` +
            `${info.mutation} ` +
            `(${Math.round(
                info.mutationChance * 100
            )}%)`;
    }

    const footer =
        updatedFooterText(updatedAt);

    if (footer) {
        desc += `\n\n${footer}`;
    }

    embed.setDescription(
        desc || null
    );

    return embed;
}

// ============================================================
// SLASH COMMAND HANDLER
// ============================================================

client.on(
    "interactionCreate",
    async (interaction) => {

        if (!interaction.isChatInputCommand()) {
            return;
        }

        try {

            // ------------------------------------------------
            // EGG SHOP
            // ------------------------------------------------

            if (
                interaction.commandName ===
                "eggshop"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embed =
                    buildStockEmbed(
                        "🥚 The Egg Shop",
                        normalizeStockList(
                            data.eggShop
                        ),
                        {
                            icon: "🥚",
                            updatedAt:
                                data.updatedAt
                        }
                    );

                return interaction.editReply({
                    embeds: [embed],
                    components: [
                        buildLinkButtons()
                    ]
                });
            }

            // ------------------------------------------------
            // GEAR SHOP
            // ------------------------------------------------

            if (
                interaction.commandName ===
                "gearshop"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embed =
                    buildStockEmbed(
                        "⚙️ The Gear Shop",
                        normalizeStockList(
                            data.gearShop
                        ),
                        {
                            icon: "⚙️",
                            updatedAt:
                                data.updatedAt
                        }
                    );

                return interaction.editReply({
                    embeds: [embed],
                    components: [
                        buildLinkButtons()
                    ]
                });
            }

            // ------------------------------------------------
            // MERCHANT
            // ------------------------------------------------

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
                        buildLinkButtons()
                    ]
                });
            }

            // ------------------------------------------------
            // WEATHER
            // ------------------------------------------------

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
                        buildLinkButtons()
                    ]
                });
            }

            // ------------------------------------------------
            // FULL STOCK
            // ------------------------------------------------

            if (
                interaction.commandName ===
                "stock"
            ) {

                await interaction.deferReply();

                const data =
                    await fetchStatus();

                const embeds = [

                    buildStockEmbed(
                        "🥚 The Egg Shop",
                        normalizeStockList(
                            data.eggShop
                        ),
                        {
                            icon: "🥚",
                            updatedAt:
                                data.updatedAt
                        }
                    ),

                    buildStockEmbed(
                        "⚙️ The Gear Shop",
                        normalizeStockList(
                            data.gearShop
                        ),
                        {
                            icon: "⚙️",
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

            // ------------------------------------------------
            // SET CHANNEL
            // ------------------------------------------------

            if (
                interaction.commandName ===
                "setchannel"
            ) {

                const channel =
                    interaction.options.getChannel(
                        "channel"
                    );

                db.setChannel(
                    interaction.guildId,
                    channel.id
                );

                return interaction.reply({
                    content:
                        `✅ Notifications will now be posted in <#${channel.id}>.`,
                    ephemeral: true
                });
            }

            // ------------------------------------------------
            // SET ROLE
            // ------------------------------------------------

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

            // ------------------------------------------------
            // CLEAR ROLE
            // ------------------------------------------------

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

            // ------------------------------------------------
            // SETTINGS
            // ------------------------------------------------

            if (
                interaction.commandName ===
                "settings"
            ) {

                const cfg =
                    db.getGuildConfig(
                        interaction.guildId
                    );

                const roleLines =
                    Object.entries(
                        cfg.roles || {}
                    )
                        .map(
                            ([key, value]) =>
                                `**${key}:** <@&${value}>`
                        )
                        .join("\n");

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            "⚙️ CVP Notifier Settings"
                        )
                        .setDescription(
                            `**Channel:** ${
                                cfg.channelId
                                    ? `<#${cfg.channelId}>`
                                    : "_Not set — use /setchannel_"
                            }\n\n` +
                            `**Ping roles:**\n${
                                roleLines ||
                                "_None set — use /setrole_"
                            }`
                        )
                        .setColor(
                            0x2b2d31
                        );

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

        } catch (err) {

            console.error(
                "Interaction error:",
                err
            );

            const message =
                "⚠️ Couldn't reach the CVP data API. Try again in a moment.";

            try {

                if (interaction.deferred) {

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
                    "Failed to send error response:",
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

    eggShop: {},
    gearShop: {},
    merchantName: null,
    weather: null

};

// ============================================================
// BROADCAST
// ============================================================

async function broadcast(
    eventType,
    embed
) {

    const guilds =
        db.allGuildConfigs();

    for (
        const [guildId, cfg]
        of Object.entries(guilds)
    ) {

        if (!cfg.channelId) {
            continue;
        }

        try {

            const channel =
                await client.channels.fetch(
                    cfg.channelId
                );

            if (!channel) {
                continue;
            }

            const roleId =
                cfg.roles &&
                cfg.roles[eventType];

            await channel.send({

                content:
                    roleId
                        ? `<@&${roleId}>`
                        : undefined,

                embeds: [embed],

                components: [
                    buildLinkButtons()
                ],

                allowedMentions: {
                    roles:
                        roleId
                            ? [roleId]
                            : []
                }

            });

        } catch (err) {

            console.error(
                `Failed to notify guild ${guildId}:`,
                err.message
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

    } catch (err) {

        console.error(
            "Poll failed:",
            err.message
        );

        return;
    }

    // --------------------------------------------------------
    // EGG SHOP + GEAR SHOP
    // --------------------------------------------------------

    for (
        const [
            key,
            shopTitle,
            icon,
            eventType
        ]
        of [
            [
                "eggShop",
                "🥚 The Egg Shop has been restocked!",
                "🥚",
                "eggShop"
            ],
            [
                "gearShop",
                "⚙️ The Gear Shop has been restocked!",
                "⚙️",
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
                lastState[key][item.name] ||
                false;

            const isAvailable =
                stockIsAvailable(
                    item.stock
                );

            if (
                isAvailable &&
                !wasAvailable
            ) {

                newlyInStock.push(
                    item
                );
            }

            lastState[key][item.name] =
                isAvailable;
        }

        if (
            newlyInStock.length > 0
        ) {

            const embed =
                buildStockEmbed(
                    shopTitle,
                    newlyInStock,
                    {
                        icon,
                        updatedAt:
                            data.updatedAt
                    }
                );

            await broadcast(
                eventType,
                embed
            );
        }
    }

    // --------------------------------------------------------
    // TRAVELING MERCHANT
    // --------------------------------------------------------

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
            )
        );
    }

    lastState.merchantName =
        merchantName;

    // --------------------------------------------------------
    // WEATHER
    // --------------------------------------------------------

    const weather =
        normalizeWeather(
            data.weather
        );

    if (
        weather &&
        weather !== lastState.weather
    ) {

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
// BOT READY
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
            "=========================================="
        );

        // Register slash commands automatically
        await registerCommands();

        // Initial API check
        await pollOnce();

        // Continue polling
        setInterval(
            pollOnce,
            POLL_INTERVAL_MS
        );

        console.log(
            "✅ CVP automatic notifier is running."
        );
    }
);

// ============================================================
// LOGIN
// ============================================================

client.login(
    DISCORD_TOKEN
);
