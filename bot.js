require("dotenv").config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fetch = require("node-fetch");
const db = require("./db");
const { weatherInfo } = require("./gameData");

const API_BASE = process.env.CVP_API_BASE_URL;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "30000", 10);
const WIKI_URL = process.env.WIKI_URL || "https://capybarasvsplants.fandom.com/wiki/Capybaras_vs_Plants_Wiki";

// Send Messages + Embed Links + Mention Everyone (for role pings) + View Channel + Read Message History
const INVITE_PERMISSIONS = "216064";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ---------- API ----------
async function fetchStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error(`API returned ${res.status}`);
  return res.json();
}

// ---------- Shared footer buttons ----------
function buildLinkButtons() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=${INVITE_PERMISSIONS}`;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Add Bot to Your Server").setStyle(ButtonStyle.Link).setURL(inviteUrl).setEmoji("🤖"),
    new ButtonBuilder().setLabel("Capybaras vs Plants Wiki").setStyle(ButtonStyle.Link).setURL(WIKI_URL).setEmoji("📖")
  );
}

// ---------- Formatting helpers ----------
function formatStockBadge(stock) {
  if (stock === null || stock === undefined) return "`Unknown`";
  const s = String(stock);
  const match = s.match(/x\s*(\d+)/i);
  if (match) return `\`x${match[1]}\``;
  return `\`${s}\``;
}

function updatedFooterText(updatedAt) {
  if (!updatedAt) return null;
  const ts = Math.floor(new Date(updatedAt).getTime() / 1000);
  if (Number.isNaN(ts)) return null;
  return `Updated <t:${ts}:R>`;
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
function buildStockEmbed(title, items, opts = {}) {
  const { colorFallback = 0x2b2d31, updatedAt = null, icon = "•" } = opts;
  const embed = new EmbedBuilder().setTitle(title);
  if (items.length === 0) {
    embed.setDescription("No data available right now.").setColor(colorFallback);
    return embed;
  }
  const inStock = items.filter((i) => stockIsAvailable(i.stock));
  const outOfStock = items.filter((i) => !stockIsAvailable(i.stock));

  let desc = "";
  if (inStock.length > 0) {
    desc += inStock
      .map((i) => `${icon} **${i.name}** ${formatStockBadge(i.stock)}${i.rarity ? ` _(${i.rarity})_` : ""}`)
      .join("\n");
  } else {
    desc += "_Nothing in stock right now._";
  }
  if (outOfStock.length > 0) {
    desc += "\n\n" + outOfStock.map((i) => `~~${i.name}~~`).join(" · ");
  }
  const footer = updatedFooterText(updatedAt);
  if (footer) desc += `\n\n${footer}`;

  embed.setDescription(desc);
  embed.setColor(inStock.length > 0 ? 0x22c55e : colorFallback);
  return embed;
}

function buildMerchantEmbed(merchant, updatedAt = null) {
  if (!merchant) {
    return new EmbedBuilder()
      .setTitle("🚚 Traveling Merchant")
      .setDescription("No merchant is currently here." + (updatedFooterText(updatedAt) ? `\n\n${updatedFooterText(updatedAt)}` : ""))
      .setColor(0x2b2d31);
  }
  const lines = merchant.items.map(
    (i) => `🛍️ **${i.name}** ${formatStockBadge(i.stock)}`
  );
  let desc = merchant.timeLeft ? `**Leaves in:** ${merchant.timeLeft}\n\n` : "";
  desc += lines.length > 0 ? lines.join("\n") : "_No item data available._";
  const footer = updatedFooterText(updatedAt);
  if (footer) desc += `\n\n${footer}`;

  return new EmbedBuilder()
    .setTitle(`🚚 Traveling Merchant: ${merchant.name}`)
    .setDescription(desc)
    .setColor(0xf59e0b);
}

function buildWeatherEmbed(weather, updatedAt = null) {
  if (!weather) {
    return new EmbedBuilder()
      .setTitle("🌦️ Weather")
      .setDescription("No weather data available right now.")
      .setColor(0x2b2d31);
  }
  const info = weatherInfo(weather);
  const embed = new EmbedBuilder().setTitle(`🌦️ Current Weather: ${weather}`).setColor(info ? info.color : 0x3447003);
  let desc = info ? info.description : "";
  if (info && info.mutation) {
    desc += `\n\n**Mutation chance:** ${info.mutation} (${Math.round(info.mutationChance * 100)}%)`;
  }
  const footer = updatedFooterText(updatedAt);
  if (footer) desc += `\n\n${footer}`;
  embed.setDescription(desc || null);
  return embed;
}

// ---------- Slash command handling ----------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "eggshop") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildStockEmbed("🥚 The Egg Shop", normalizeStockList(data.eggShop), {
        icon: "🥚",
        updatedAt: data.updatedAt,
      });
      return interaction.editReply({ embeds: [embed], components: [buildLinkButtons()] });
    }

    if (interaction.commandName === "gearshop") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildStockEmbed("⚙️ The Gear Shop", normalizeStockList(data.gearShop), {
        icon: "⚙️",
        updatedAt: data.updatedAt,
      });
      return interaction.editReply({ embeds: [embed], components: [buildLinkButtons()] });
    }

    if (interaction.commandName === "merchant") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildMerchantEmbed(normalizeMerchant(data.merchant), data.updatedAt);
      return interaction.editReply({ embeds: [embed], components: [buildLinkButtons()] });
    }

    if (interaction.commandName === "weather") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embed = buildWeatherEmbed(normalizeWeather(data.weather), data.updatedAt);
      return interaction.editReply({ embeds: [embed], components: [buildLinkButtons()] });
    }

    if (interaction.commandName === "stock") {
      await interaction.deferReply();
      const data = await fetchStatus();
      const embeds = [
        buildStockEmbed("🥚 The Egg Shop", normalizeStockList(data.eggShop), { icon: "🥚", updatedAt: data.updatedAt }),
        buildStockEmbed("⚙️ The Gear Shop", normalizeStockList(data.gearShop), { icon: "⚙️", updatedAt: data.updatedAt }),
        buildMerchantEmbed(normalizeMerchant(data.merchant), data.updatedAt),
        buildWeatherEmbed(normalizeWeather(data.weather), data.updatedAt),
      ];
      return interaction.editReply({ embeds, components: [buildLinkButtons()] });
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
        components: [buildLinkButtons()],
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

  // Egg Shop / Gear Shop: notify once per poll when ANY item transitions NO STOCK -> in-stock,
  // bundled into a single "restocked" card (matches the reference style) rather than one
  // message per item.
  for (const [key, shopTitle, icon, eventType] of [
    ["eggShop", "🥚 The Egg Shop has been restocked!", "🥚", "eggShop"],
    ["gearShop", "⚙️ The Gear Shop has been restocked!", "⚙️", "gearShop"],
  ]) {
    const items = normalizeStockList(data[key]);
    const newlyInStock = [];
    for (const item of items) {
      const wasAvailable = lastState[key][item.name] || false;
      const isAvailable = stockIsAvailable(item.stock);
      if (isAvailable && !wasAvailable) newlyInStock.push(item);
      lastState[key][item.name] = isAvailable;
    }
    if (newlyInStock.length > 0) {
      const embed = buildStockEmbed(shopTitle, newlyInStock, { icon, updatedAt: data.updatedAt });
      await broadcast(eventType, embed);
    }
  }

  // Merchant: notify when a new merchant name appears
  const merchant = normalizeMerchant(data.merchant);
  const merchantName = merchant ? merchant.name : null;
  if (merchantName && merchantName !== lastState.merchantName) {
    await broadcast("merchant", buildMerchantEmbed(merchant, data.updatedAt));
  }
  lastState.merchantName = merchantName;

  // Weather: notify on any change
  const weather = normalizeWeather(data.weather);
  if (weather && weather !== lastState.weather) {
    await broadcast("weather", buildWeatherEmbed(weather, data.updatedAt));
  }
  lastState.weather = weather;
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  pollOnce();
  setInterval(pollOnce, POLL_INTERVAL_MS);
});

client.login(process.env.DISCORD_BOT_TOKEN);
