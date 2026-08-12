require("dotenv").config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("eggshop")
    .setDescription("Show the current Egg Shop stock"),

  new SlashCommandBuilder()
    .setName("gearshop")
    .setDescription("Show the current Gear Shop stock"),

  new SlashCommandBuilder()
    .setName("merchant")
    .setDescription("Show the current Traveling Merchant status and stock"),

  new SlashCommandBuilder()
    .setName("weather")
    .setDescription("Show the current in-game weather"),

  new SlashCommandBuilder()
    .setName("stock")
    .setDescription("Show a full overview: Egg Shop, Gear Shop, Merchant, and Weather"),

  new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Set the channel where automatic stock notifications are posted")
    .addChannelOption((opt) =>
      opt.setName("channel").setDescription("Notification channel").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("setrole")
    .setDescription("Set a role to ping for a specific notification type")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which notification type")
        .setRequired(true)
        .addChoices(
          { name: "Egg Shop", value: "eggShop" },
          { name: "Gear Shop", value: "gearShop" },
          { name: "Traveling Merchant", value: "merchant" },
          { name: "Weather", value: "weather" }
        )
    )
    .addRoleOption((opt) =>
      opt.setName("role").setDescription("Role to ping").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("clearrole")
    .setDescription("Remove the ping role for a specific notification type")
    .addStringOption((opt) =>
      opt
        .setName("event")
        .setDescription("Which notification type")
        .setRequired(true)
        .addChoices(
          { name: "Egg Shop", value: "eggShop" },
          { name: "Gear Shop", value: "gearShop" },
          { name: "Traveling Merchant", value: "merchant" },
          { name: "Weather", value: "weather" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("settings")
    .setDescription("View this server's current notification channel and role config")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_TEST_GUILD_ID;

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`Registered ${commands.length} commands to test guild ${guildId} (instant).`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`Registered ${commands.length} commands globally (may take up to 1hr to appear).`);
    }
  } catch (err) {
    console.error(err);
  }
})();
