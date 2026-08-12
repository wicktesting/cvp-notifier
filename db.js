const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

const adapter = new FileSync(path.join(__dirname, "db.json"));
const db = low(adapter);

// Structure:
// guilds: {
//   "<guildId>": {
//     channels: { eggShop: "channelId", gearShop: "channelId", merchant: "channelId", weather: "channelId" },
//     roles: { eggShop: "roleId", gearShop: "roleId", merchant: "roleId", weather: "roleId" }
//   }
// }
db.defaults({ guilds: {} }).write();

function getGuildConfig(guildId) {
  return db.get(`guilds.${guildId}`).value() || { channels: {}, roles: {} };
}

function setChannel(guildId, eventType, channelId) {
  db.set(`guilds.${guildId}.channels.${eventType}`, channelId).write();
}

function getChannel(guildId, eventType) {
  return db.get(`guilds.${guildId}.channels.${eventType}`).value() || null;
}

function setRole(guildId, eventType, roleId) {
  db.set(`guilds.${guildId}.roles.${eventType}`, roleId).write();
}

function clearRole(guildId, eventType) {
  db.unset(`guilds.${guildId}.roles.${eventType}`).write();
}

function allGuildConfigs() {
  return db.get("guilds").value() || {};
}

module.exports = { getGuildConfig, setChannel, getChannel, setRole, clearRole, allGuildConfigs };
