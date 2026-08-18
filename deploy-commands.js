require("dotenv").config();

const {
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");


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
            "Show the current weather"
        ),

    new SlashCommandBuilder()
        .setName("scrapshop")
        .setDescription(
            "Show the Dr Carrot Scrap Shop"
        ),

    new SlashCommandBuilder()
        .setName("bounties")
        .setDescription(
            "Show the current bounties"
        ),

    new SlashCommandBuilder()
        .setName("bountyshop")
        .setDescription(
            "Show the Bounty Shop"
        ),

    new SlashCommandBuilder()
        .setName("stock")
        .setDescription(
            "Show the complete CVP stock overview"
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
            "Set a notification role"
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
                    "Optional item-specific role"
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
            "View notification settings"
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageGuild
        )

].map(
    command =>
        command.toJSON()
);


const token =
    process.env.DISCORD_BOT_TOKEN;

const clientId =
    process.env.DISCORD_CLIENT_ID;

const guildId =
    process.env.DISCORD_TEST_GUILD_ID;


if (!token) {

    console.error(
        "❌ DISCORD_BOT_TOKEN is missing."
    );

    process.exit(1);

}

if (!clientId) {

    console.error(
        "❌ DISCORD_CLIENT_ID is missing."
    );

    process.exit(1);

}


const rest =
    new REST({
        version: "10"
    }).setToken(
        token
    );


(async () => {

    try {

        if (guildId) {

            await rest.put(

                Routes.applicationGuildCommands(
                    clientId,
                    guildId
                ),

                {
                    body:
                        commands
                }

            );

            console.log(
                `✅ Registered ${commands.length} commands to ${guildId}.`
            );

        } else {

            await rest.put(

                Routes.applicationCommands(
                    clientId
                ),

                {
                    body:
                        commands
                }

            );

            console.log(
                `✅ Registered ${commands.length} commands globally.`
            );

        }

    } catch (error) {

        console.error(
            "❌ Command registration failed:"
        );

        console.error(
            error
        );

        process.exit(1);

    }

})();
