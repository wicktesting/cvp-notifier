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
// LINK BUTTONS
// ============================================================

function buildLinkButtons() {

    const inviteUrl =
        `https://discord.com/oauth2/authorize` +
        `?client_id=${CLIENT_ID}` +
        `&scope=bot%20applications.commands` +
        `&permissions=216064`;

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

const ITEM_EMOJIS = {

    // Eggs
    "Capybara Egg": "",
    "Alpha Capybara Egg": "",
    "Archer Capybara Egg": "",
    "Magic Capybara Egg": "",
    "Ghost Capybara Egg": "",
    "Golem Capybara Egg": "",
    "Robot Capybara Egg": "",
    "Disco Capybara Egg": "",
    "Angel Capybara Egg": "",

    // Gear
    "Hatch Hammer": "",
    "Nametag": "",
    "Mutation Sponge": "",
    "Boombox": "",
    "Bizarre Stopwatch": "",

    // Merchant items
    "Gilded Hatch Hammer": "",
    "Gold Scroll": "",
    "Totem Of Status": ""
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
        icon = "•"
    } = options;

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
// MERCHANT EMBED
// ============================================================

function buildMerchantEmbed(
    merchant,
    updatedAt = null
) {

    if (!merchant) {

        let description =
            "No merchant is currently here.";

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
        `# Traveling Merchant: ${merchant.name}\n\n`;

    if (merchant.timeLeft) {

        description +=
            `**Leaves in:** ${merchant.timeLeft}\n\n`;
    }

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

    if (!weather) {

        return new EmbedBuilder()
            .setDescription(
                "# Weather\n\n" +
                "No weather data available right now."
            )
            .setColor(0x2b2d31);
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
                        buildLinkButtons()
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
                        buildLinkButtons()
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

            await channel.send({

                content:
                    roleId
                        ? `<@&${roleId}>`
                        : undefined,

                embeds: [
                    embed
                ],

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
