require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fetch = require("node-fetch");
const db = require("./db");
const { rarityColor, weatherInfo } = require("./gameData");

const API_BASE = process.env.CVP_API_BASE_URL;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "30000", 10);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ---------- API ----------
async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

// ---------- Normalizers (defensive against minor schema differences) ----------
// Accepts either an array [{name, stock, rarity, description}] or an object map {name: stockValue}
function normalizeStockList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((it) => ({
      name: it.name || it.Name || it.title || "Unknown",
      stock:
        it.stock !== undefined
          ? it.stock
          : it.Stock !== undefined
          ? it.Stock
          : it.inStock !== undefined
          ? it.inStock
          : null,
      rarity: it.rarity || it.Rarity || null,
      description: it.description || it.Description || null,
    }));
  }
  // object map form: { "Capybara Egg": "x4 In stock" }
  return Object.entries(raw).map(([name, stock]) => ({ name, stock, rarity: null, description: null }));
}

function stockIsAvailable(stock) {
  if (stock === null || stock === undefined) return false;
  if (typeof stock === "number") return stock > 0;
  const s = String(stock).toLowerCase();
  return !s.includes("no stock") && s !== "0" && s.trim() !== "";
}

function normalizeMerchant(raw) {
  if (!raw) return null;
  if (raw.active === false) return null;
  const name = raw.name || raw.Name || raw.merchant || null;
  if (!name) return null;
  return {
    name,
    timeLeft: raw.timeLeft || raw.TimeLeft || raw.countdown || null,
    items: normalizeStockList(raw.items || raw.Items || []),
  };
}

function normalizeWeather(raw) {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  return raw.current || raw.Current || raw.name || raw.Name || null;
}

// ---------- Embed builders ----------
function buildStockEmbed(title, items, colorFallback = 0x2b2d31) {
  const embed = new EmbedBuilder().setTitle(title).setTimestamp();
  if (items.length === 0) {
    embed.setDescription("No data available right now.").setColor(colorFallback);
    return embed;
  }
  const inStock = items.filter((i) => stockIsAvailable(i.stock));
  const outOfStock = items.filter((i) => !stockIsAvailable(i.stock));

  let desc = "";
  if (inStock.length > 0) {
    desc += inStock.map((i) => `✅ **${i.name}** — ${i.stock}${i.rarity ? ` _(${i.rarity})_` : ""}`).join("\n");
  } else {
    desc += "_Nothing in stock right now._";
  }
  if (outOfStock.length > 0) {
    desc += "\n\n" + outOfStock.map((i) => `❌ ${i.name}`).join("\n");
  }

  embed.setDescription(desc);
  embed.setColor(inStock.length > 0 ? 0x22c55e : colorFallback);
  return embed;
}

function buildMerchantEmbed(merchant) {
  if (!merchant) {
    return new EmbedBuilder()
      .setTitle("🚚 Traveling Merchant")
      .setDescription("No merchant is currently here.")
      .setColor(0x2b2d31)
      .setTimestamp();
  }
  const lines = merchant.items.map(
    (i) => `${stockIsAvailable(i.stock) ? "✅" : "❌"} **${i.name}** — ${i.stock ?? "Unknown"}`
  );
  return new EmbedBuilder()
    .setTitle(`🚚 Traveling Merchant: ${merchant.name}`)
    .setDescription(
      (merchant.timeLeft ? `**Leaves in:** ${merchant.timeLeft}\n\n` : "") +
        (lines.length > 0 ? lines.join("\n") : "_No item data available._")
    )
    .setColor(0xf59e0b)
    .setTimestamp();
}

function buildWeatherEmbed(weather) {
  if (!weather) {
    return new EmbedBuilder()
      .setTitle("🌦️ Weather")
      .setDescription("No weather data available right now.")
      .setColor(0x2b2d31)
      .setTimestamp();
  }
  const info = weatherInfo(weather);
  const embed = new EmbedBuilder()
    .setTitle(`🌦️ Current Weather: ${weather}`)
    .setColor(info ? info.color : 0x3447003)
    .setTimestamp();
  if (info) {
    let desc = info.description;
    if (info.mutation) {
      desc += `\n\n**Mutation chance:** ${info.mutation} (${Math.round(info.mutationChance * 100)}%)`;
    }
    embed.setDescription(desc);
  }
  return embed;
}

// ---------- Slash command handling ----------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "eggshop") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildStockEmbed("🥚 Egg Shop", normalizeStockList(data.eggShop));
      return interaction.editReply({ embeds: [embed] });
    }

    if (interaction.commandName === "gearshop") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildStockEmbed("⚙️ Gear Shop", normalizeStockList(data.gearShop));
      return interaction.editReply({ embeds: [embed] });
    }

    if (interaction.commandName === "merchant") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildMerchantEmbed(normalizeMerchant(data.merchant));
      return interaction.editReply({ embeds: [embed] });
    }

    if (interaction.commandName === "weather") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildWeatherEmbed(normalizeWeather(data.weather));
      return interaction.editReply({ embeds: [embed] });
    }

    if (interaction.commandName === "stock") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embeds = [
        buildStockEmbed("🥚 Egg Shop", normalizeStockList(data.eggShop)),
        buildStockEmbed("⚙️ Gear Shop", normalizeStockList(data.gearShop)),
        buildMerchantEmbed(normalizeMerchant(data.merchant)),
        buildWeatherEmbed(normalizeWeather(data.weather)),
      ];
      return interaction.editReply({ embeds });
    }

    if (interaction.commandName === "setchannel") {
      const channel = interaction.options.getChannel("channel");
      db.setChannel(interaction.guildId, channel.id);
      return interaction.reply({
        content: `✅ Notifications will now be posted in <#${channel.id}>.`,
        ephemeral: true,
      });
    }

    if (interaction.commandName === "setrole") {
      const event = interaction.options.getString("event");
      const role = interaction.options.getRole("role");
      db.setRole(interaction.guildId, event, role.id);
      return interaction.reply({
        content: `✅ <@&${role.id}> will now be pinged for **${event}** notifications.`,
        ephemeral: true,
      });
    }

    if (interaction.commandName === "clearrole") {
      const event = interaction.options.getString("event");
      db.clearRole(interaction.guildId, event);
      return interaction.reply({ content: `✅ Ping role cleared for **${event}**.`, ephemeral: true });
    }

    if (interaction.commandName === "settings") {
      const cfg = db.getGuildConfig(interaction.guildId);
      const roleLines = Object.entries(cfg.roles || {})
        .map(([k, v]) => `**${k}:** <@&${v}>`)
        .join("\n");
      const embed = new EmbedBuilder()
        .setTitle("⚙️ CVP Notifier Settings")
        .setDescription(
          `**Channel:** ${cfg.channelId ? `<#${cfg.channelId}>` : "_Not set — use /setchannel_"}\n\n` +
            `**Ping roles:**\n${roleLines || "_None set — use /setrole_"}`
        )
        .setColor(0x2b2d31);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    const msg = "⚠️ Couldn't reach the CVP data API. Try again in a moment.";
    if (interaction.deferred) {
      await interaction.editReply({ content: msg });
    } else {
      await interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

// ---------- Background poller: detects changes and auto-notifies ----------
let lastState = {
  eggShop: {},
  gearShop: {},
  merchantName: null,
  weather: null,
};

async function broadcast(eventType, embed) {
  const guilds = db.allGuildConfigs();
  for (const [guildId, cfg] of Object.entries(guilds)) {
    if (!cfg.channelId) continue;
    try {
      const channel = await client.channels.fetch(cfg.channelId);
      if (!channel) continue;
      const roleId = cfg.roles && cfg.roles[eventType];
      await channel.send({
        content: roleId ? `<@&${roleId}>` : undefined,
        embeds: [embed],
        allowedMentions: { roles: roleId ? [roleId] : [] },
      });
    } catch (err) {
      console.error(`Failed to notify guild ${guildId}:`, err.message);
    }
  }
}

async function pollOnce() {
  let data;
  try {
    data = await fetchStatus();
  } catch (err) {
    console.error("Poll failed:", err.message);
    return;
  }

  // Egg Shop / Gear Shop: notify only on NO STOCK -> in-stock transitions
  for (const [key, embedTitle, icon] of [
    ["eggShop", "🥚 Egg Shop", "eggShop"],
    ["gearShop", "⚙️ Gear Shop", "gearShop"],
  ]) {
    const items = normalizeStockList(data[key]);
    for (const item of items) {
      const wasAvailable = lastState[key][item.name] || false;
      const isAvailable = stockIsAvailable(item.stock);
      if (isAvailable && !wasAvailable) {
        const embed = new EmbedBuilder()
          .setTitle(`${embedTitle}: ${item.name} In Stock!`)
          .setDescription(`**Stock:** ${item.stock}${item.rarity ? `\n**Rarity:** ${item.rarity}` : ""}`)
          .setColor(item.rarity ? rarityColor(item.rarity) : 0x22c55e)
          .setTimestamp();
        await broadcast(icon, embed);
      }
      lastState[key][item.name] = isAvailable;
    }
  }

  // Merchant: notify when a new merchant name appears
  const merchant = normalizeMerchant(data.merchant);
  const merchantName = merchant ? merchant.name : null;
  if (merchantName && merchantName !== lastState.merchantName) {
    await broadcast("merchant", buildMerchantEmbed(merchant));
  }
  lastState.merchantName = merchantName;

  // Weather: notify on any change
  const weather = normalizeWeather(data.weather);
  if (weather && weather !== lastState.weather) {
    await broadcast("weather", buildWeatherEmbed(weather));
  }
  lastState.weather = weather;
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  pollOnce();
  setInterval(pollOnce, POLL_INTERVAL_MS);
});

client.login(process.env.DISCORD_BOT_TOKEN);
