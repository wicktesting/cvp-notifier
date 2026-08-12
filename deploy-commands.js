require("dotenv").config();

const {
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

// ============================================================
// CVP NOTIFIER — DISCORD SLASH COMMAND REGISTRATION
// ============================================================

const commands = [

    // --------------------------------------------------------
    // /eggshop
    // --------------------------------------------------------
    new SlashCommandBuilder()
        .setName("eggshop")
        .setDescription("Show the current Egg Shop stock"),

    // --------------------------------------------------------
    // /gearshop
    // --------------------------------------------------------
    new SlashCommandBuilder()
        .setName("gearshop")
        .setDescription("Show the current Gear Shop stock"),

    // --------------------------------------------------------
    // /merchant
    // --------------------------------------------------------
    new SlashCommandBuilder()
        .setName("merchant")
        .setDescription("Show the current Traveling Merchant status and stock"),

    // --------------------------------------------------------
    // /weather
    // --------------------------------------------------------
    new SlashCommandBuilder()
        .setName("weather")
        .setDescription("Show the current in-game weather"),

    // --------------------------------------------------------
    // /stock
    // --------------------------------------------------------
    new SlashCommandBuilder()
        .setName("stock")
        .setDescription(
            "Show a full overview: Egg Shop, Gear Shop, Merchant, and Weather"
        ),

    // --------------------------------------------------------
    // /setchannel
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
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        ),

    // --------------------------------------------------------
    // /setrole
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // /clearrole
    // --------------------------------------------------------
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

    // --------------------------------------------------------
    // /settings
    // --------------------------------------------------------
    new SlashCommandBuilder()
        .setName("settings")
        .setDescription(
            "View this server's current notification channel and role config"
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

].map((command) => command.toJSON());

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_TEST_GUILD_ID;

// ============================================================
// VALIDATION
// ============================================================

if (!token) {
    console.error(
        "❌ DISCORD_BOT_TOKEN is missing from Railway Variables."
    );
    process.exit(1);
}

if (!clientId) {
    console.error(
        "❌ DISCORD_CLIENT_ID is missing from Railway Variables."
    );
    process.exit(1);
}

// ============================================================
// DISCORD REST CLIENT
// ============================================================

const rest = new REST({
    version: "10"
}).setToken(token);

// ============================================================
// REGISTER COMMANDS
// ============================================================

(async () => {

    try {

        console.log("==========================================");
        console.log("CVP NOTIFIER — COMMAND REGISTRATION");
        console.log("==========================================");

        console.log(`Application ID: ${clientId}`);
        console.log(`Commands: ${commands.length}`);

        if (guildId) {

            console.log(`Guild ID: ${guildId}`);
            console.log("Registration type: SERVER / GUILD");
            console.log("Registering commands...");

            await rest.put(
                Routes.applicationGuildCommands(
                    clientId,
                    guildId
                ),
                {
                    body: commands
                }
            );

            console.log("");
            console.log("✅ COMMANDS REGISTERED SUCCESSFULLY!");
            console.log(
                `✅ ${commands.length} commands registered to your server.`
            );
            console.log("They should appear immediately in Discord.");

        } else {

            console.log("⚠️ DISCORD_TEST_GUILD_ID is not set.");
            console.log("Registering commands globally instead.");
            console.log(
                "Global commands can take time to appear."
            );

            await rest.put(
                Routes.applicationCommands(clientId),
                {
                    body: commands
                }
            );

            console.log("");
            console.log("✅ GLOBAL COMMANDS REGISTERED!");
            console.log(
                `✅ ${commands.length} commands registered globally.`
            );
        }

        console.log("");
        console.log("Registered commands:");

        for (const command of commands) {
            console.log(`  /${command.name}`);
        }

        console.log("");
        console.log("==========================================");

    } catch (error) {

        console.error("");
        console.error("❌ COMMAND REGISTRATION FAILED");
        console.error("==========================================");

        console.error(error);

        if (error?.rawError) {
            console.error("");
            console.error("Discord API error:");
            console.error(error.rawError);
        }

        console.error("==========================================");

        process.exit(1);
    }

})();
