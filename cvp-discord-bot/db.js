const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

const adapter = new FileSync(path.join(__dirname, "db.json"));
const db = low(adapter);

// Structure:
// guilds: {
//   "<guildId>": {
//     channelId: "123",
//     roles: { eggShop: "roleId", gearShop: "roleId", merchant: "roleId", weather: "roleId" }
//   }
// }
db.defaults({ guilds: {} }).write();

function getGuildConfig(guildId) {
  return db.get(`guilds.${guildId}`).value() || { channelId: null, roles: {} };
}

function setChannel(guildId, channelId) {
  db.set(`guilds.${guildId}.channelId`, channelId).write();
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

module.exports = { getGuildConfig, setChannel, setRole, clearRole, allGuildConfigs };
