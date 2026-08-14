const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

// If DB_PATH is set (pointing at a mounted Railway Volume, e.g.
// /data/db.json), settings survive redeploys. Otherwise this
// falls back to a file next to the code, which Railway WIPES on
// every redeploy — fine for quick local testing, but you'll lose
// /setchannel and /setrole settings every time you push a change.
const dbFilePath =
    process.env.DB_PATH ||
    path.join(__dirname, "db.json");

const adapter = new FileSync(dbFilePath);
const db = low(adapter);

console.log(
    `💾 Settings storage: ${dbFilePath}` +
    (
        process.env.DB_PATH
            ? " (persistent volume)"
            : " (⚠️ NOT persistent — wiped on redeploy, set DB_PATH to fix)"
    )
);

// Structure:
// guilds: {
//   "<guildId>": {
//     channels: { eggShop: "channelId", gearShop: "channelId", merchant: "channelId", weather: "channelId" },
//     roles: { eggShop: "roleId", gearShop: "roleId", merchant: "roleId", weather: "roleId" },
//     itemRoles: { "Angel Capybara Egg": "roleId", "Thunder": "roleId", ... }
//   }
// }
db.defaults({ guilds: {} }).write();

function getGuildConfig(guildId) {
  return db.get(`guilds.${guildId}`).value() || { channels: {}, roles: {}, itemRoles: {} };
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

function setItemRole(guildId, itemName, roleId) {
  db.set(`guilds.${guildId}.itemRoles.${itemName}`, roleId).write();
}

function clearItemRole(guildId, itemName) {
  db.unset(`guilds.${guildId}.itemRoles.${itemName}`).write();
}

function allGuildConfigs() {
  return db.get("guilds").value() || {};
}

module.exports = { getGuildConfig, setChannel, getChannel, setRole, clearRole, setItemRole, clearItemRole, allGuildConfigs };
