require("dotenv").config();
const { REST, Routes } = require("discord.js");
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: [] })
  .then(() => console.log("✅ Cleared global commands"));
