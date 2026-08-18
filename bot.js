require('dotenv').config?.();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const db = require('./db');

const {
  normalizeStockList,
  normalizeMerchant,
  normalizeWeather,
  normalizeDrCarrot,
  stockNumber
} = require('./gameData');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const API =
  (
    process.env.CVP_API_BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');

const POLL =
  Number(
    process.env.POLL_INTERVAL_MS || 30000
  );

const WIKI =
  process.env.WIKI_URL ||
  'https://capybaras-vs-plants.fandom.com/';

let previous = null;
let firstPoll = true;

async function getState() {
  const response =
    await fetch(
      `${API}/api/status`
    );

  if (!response.ok) {
    throw new Error(
      `API ${response.status}`
    );
  }

  return response.json();
}

function links() {
  const invite =
    process.env.DISCORD_CLIENT_ID
      ? `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=274877975552&scope=bot%20applications.commands`
      : WIKI;

  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Add Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(invite),

      new ButtonBuilder()
        .setLabel('CVP Wiki')
        .setStyle(ButtonStyle.Link)
        .setURL(WIKI)
    );
}

function stockText(item) {
  const value =
    stockNumber(
      item?.stock ??
      item?.value
    );

  if (value === 0) {
    return 'NO STOCK';
  }

  if (value != null) {
    return `x${value} In stock`;
  }

  return String(
    item?.stock ??
    item?.value ??
    'Unknown'
  );
}

function listEmbed(
  title,
  list,
  color = 0x62d28f
) {
  const items =
    normalizeStockList(
      list || []
    );

  const description =
    items.length
      ? items
          .map(
            (item) =>
              `**${item.name}**` +
              (
                item.rarity
                  ? ` — ${item.rarity}`
                  : ''
              ) +
              `\n${stockText(item)}` +
              (
                item.cost != null
                  ? ` • Cost: ${item.cost}`
                  : ''
              )
          )
          .join('\n\n')
      : 'No data received.';

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(
      description.slice(
        0,
        3900
      )
    )
    .setColor(color)
    .setTimestamp();
}

/*
 * Dr. Carrot Scrap Shop embed
 */

function drCarrotEmbed(dr) {
  dr =
    normalizeDrCarrot(dr);

  if (!dr) {
    return new EmbedBuilder()
      .setTitle(
        '🥕 Dr. Carrot Scrap Shop'
      )
      .setDescription(
        'No Dr. Carrot shop data received yet.'
      )
      .setColor(0xffa62b);
  }

  const lines =
    (dr.stock || [])
      .map((item) => {

        const details = [];

        if (item.rarity) {
          details.push(
            item.rarity
          );
        }

        if (
          item.stock != null
        ) {
          details.push(
            stockText(item)
          );
        } else if (
          item.value != null
        ) {
          details.push(
            typeof item.value === 'object'
              ? JSON.stringify(
                  item.value
                )
              : String(
                  item.value
                )
          );
        }

        if (
          item.cost != null
        ) {
          details.push(
            `Cost: ${item.cost}`
          );
        }

        if (
          item.description
        ) {
          details.push(
            item.description
          );
        }

        return (
          `**${item.name}**\n` +
          (
            details.length
              ? details.join(' • ')
              : 'Data received'
          )
        );
      });

  let footer =
    `Theme: ${
      dr.theme ||
      'DrCarrot'
    }`;

  if (
    dr.restockUntil
  ) {
    footer +=
      ` • RestockUntil: ${
        dr.restockUntil
      }`;
  }

  return new EmbedBuilder()
    .setTitle(
      '🥕 Dr. Carrot Scrap Shop'
    )
    .setDescription(
      (
        lines.length
          ? lines.join('\n\n')
          : 'No items in stock data.'
      ).slice(
        0,
        3900
      )
    )
    .setColor(0xffa62b)
    .setFooter({
      text: footer
    })
    .setTimestamp();
}

function weatherEmbed(weather) {
  return new EmbedBuilder()
    .setTitle(
      '🌦️ Current Weather'
    )
    .setDescription(
      normalizeWeather(
        weather
      ) || 'Unknown'
    )
    .setColor(0x6bb7ff)
    .setTimestamp();
}

function merchantEmbed(merchant) {
  merchant =
    normalizeMerchant(
      merchant
    );

  return new EmbedBuilder()
    .setTitle(
      '🧑‍🌾 Traveling Merchant'
    )
    .setDescription(
      merchant
        ? `**${
            merchant.name ||
            'Unknown'
          }**`
        : 'No merchant data.'
    )
    .addFields(
      merchant?.items?.length
        ? [{
            name: 'Items',
            value:
              merchant.items
                .map(
                  (item) =>
                    `**${item.name}** — ${stockText(item)}`
                )
                .join('\n')
                .slice(
                  0,
                  1024
                )
          }]
        : []
    )
    .setColor(0xc98a42)
    .setTimestamp();
}

function roleMention(
  guild,
  event
) {
  const config =
    db.getGuild(
      guild.id
    );

  const roleId =
    config?.roles?.[event];

  return roleId
    ? `<@&${roleId}>`
    : '';
}

async function sendToGuild(
  guild,
  event,
  embed
) {
  const config =
    db.getGuild(
      guild.id
    );

  if (!config.channelId) {
    return;
  }

  const channel =
    await guild.channels
      .fetch(
        config.channelId
      )
      .catch(() => null);

  if (
    !channel ||
    !channel.isTextBased()
  ) {
    return;
  }

  await channel
    .send({
      content:
        roleMention(
          guild,
          event
        ) || undefined,

      embeds: [embed],

      components: [
        links()
      ]
    })
    .catch(() => {});
}

/*
 * Detect shop restocks.
 */

function shopTransitions(
  oldList,
  newList
) {
  const old =
    new Map(
      normalizeStockList(
        oldList || []
      ).map(
        (item) => [
          item.name,
          stockNumber(
            item.stock
          )
        ]
      )
    );

  return normalizeStockList(
    newList || []
  ).filter(
    (item) => {

      const now =
        stockNumber(
          item.stock
        );

      const before =
        old.get(
          item.name
        );

      return (
        now != null &&
        now > 0 &&
        (
          before == null ||
          before === 0
        )
      );
    }
  );
}

function drCarrotSignature(dr) {
  return JSON.stringify(
    normalizeDrCarrot(
      dr
    )
  );
}

/*
 * Detect changes to Dr. Carrot.
 */

function drCarrotChanges(
  oldDr,
  newDr
) {
  const oldShop =
    normalizeDrCarrot(
      oldDr
    );

  const newShop =
    normalizeDrCarrot(
      newDr
    );

  if (!oldShop && newShop) {
    return true;
  }

  if (
    oldShop &&
    !newShop
  ) {
    return false;
  }

  return (
    drCarrotSignature(
      oldShop
    ) !==
    drCarrotSignature(
      newShop
    )
  );
}

async function poll() {
  try {

    const state =
      await getState();

    if (!previous) {
      previous = state;
    }

    if (!firstPoll) {

      /*
       * Egg Shop
       */

      for (
        const item of
        shopTransitions(
          previous.eggShop,
          state.eggShop
        )
      ) {

        const embed =
          new EmbedBuilder()
            .setTitle(
              '🥚 Egg Shop Restock'
            )
            .setDescription(
              `**${item.name}** is now in stock.\n${stockText(item)}`
            )
            .setColor(
              0x8fd14f
            )
            .setTimestamp();

        for (
          const guild of
          client.guilds.cache.values()
        ) {
          await sendToGuild(
            guild,
            'eggshop',
            embed
          );
        }
      }

      /*
       * Gear Shop
       */

      for (
        const item of
        shopTransitions(
          previous.gearShop,
          state.gearShop
        )
      ) {

        const embed =
          new EmbedBuilder()
            .setTitle(
              '⚙️ Gear Shop Restock'
            )
            .setDescription(
              `**${item.name}** is now in stock.\n${stockText(item)}`
            )
            .setColor(
              0xb58cff
            )
            .setTimestamp();

        for (
          const guild of
          client.guilds.cache.values()
        ) {
          await sendToGuild(
            guild,
            'gearshop',
            embed
          );
        }
      }

      /*
       * Dr. Carrot Scrap Shop
       */

      if (
        drCarrotChanges(
          previous.drCarrot,
          state.drCarrot
        )
      ) {

        const embed =
          drCarrotEmbed(
            state.drCarrot
          );

        for (
          const guild of
          client.guilds.cache.values()
        ) {
          await sendToGuild(
            guild,
            'drcarrot',
            embed
          );
        }
      }

      /*
       * Merchant
       */

      if (
        (
          previous.merchant?.name ||
          null
        ) !==
        (
          state.merchant?.name ||
          null
        )
      ) {

        for (
          const guild of
          client.guilds.cache.values()
        ) {
          await sendToGuild(
            guild,
            'merchant',
            merchantEmbed(
              state.merchant
            )
          );
        }
      }

      /*
       * Weather
       */

      if (
        normalizeWeather(
          previous.weather
        ) !==
        normalizeWeather(
          state.weather
        )
      ) {

        for (
          const guild of
          client.guilds.cache.values()
        ) {
          await sendToGuild(
            guild,
            'weather',
            weatherEmbed(
              state.weather
            )
          );
        }
      }
    }

    previous = state;
    firstPoll = false;

  } catch (error) {
    console.error(
      'Poll failed:',
      error.message
    );
  }
}

client.once(
  'ready',
  async () => {

    console.log(
      `Logged in as ${client.user.tag}`
    );

    await poll();

    setInterval(
      poll,
      POLL
    );
  }
);

client.on(
  'interactionCreate',
  async (interaction) => {

    if (
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    const state =
      await getState()
        .catch(
          () => null
        );

    if (!state) {
      return interaction.reply({
        content:
          'CVP API is unavailable.',
        ephemeral: true
      });
    }

    const command =
      interaction.commandName;

    if (
      command === 'drcarrot'
    ) {
      return interaction.reply({
        embeds: [
          drCarrotEmbed(
            state.drCarrot
          )
        ],
        components: [
          links()
        ]
      });
    }

    if (
      command === 'stock'
    ) {
      return interaction.reply({
        embeds: [
          listEmbed(
            '🥚 Egg Shop',
            state.eggShop
          ),

          listEmbed(
            '⚙️ Gear Shop',
            state.gearShop,
            0xb58cff
          ),

          drCarrotEmbed(
            state.drCarrot
          )
        ],
        components: [
          links()
        ]
      });
    }

    if (
      command === 'eggshop'
    ) {
      return interaction.reply({
        embeds: [
          listEmbed(
            '🥚 Egg Shop',
            state.eggShop
          )
        ],
        components: [
          links()
        ]
      });
    }

    if (
      command === 'gearshop'
    ) {
      return interaction.reply({
        embeds: [
          listEmbed(
            '⚙️ Gear Shop',
            state.gearShop,
            0xb58cff
          )
        ],
        components: [
          links()
        ]
      });
    }

    if (
      command === 'merchant'
    ) {
      return interaction.reply({
        embeds: [
          merchantEmbed(
            state.merchant
          )
        ],
        components: [
          links()
        ]
      });
    }

    if (
      command === 'weather'
    ) {
      return interaction.reply({
        embeds: [
          weatherEmbed(
            state.weather
          )
        ],
        components: [
          links()
        ]
      });
    }

    if (
      command === 'setchannel'
    ) {
      db.setChannel(
        interaction.guild.id,
        interaction.options
          .getChannel(
            'channel'
          )
          .id
      );

      return interaction.reply({
        content:
          'Notification channel saved.',
        ephemeral: true
      });
    }

    if (
      command === 'setrole'
    ) {

      db.setRole(
        interaction.guild.id,

        interaction.options
          .getString(
            'event'
          ),

        interaction.options
          .getRole(
            'role'
          )
          .id
      );

      return interaction.reply({
        content:
          'Notification role saved.',
        ephemeral: true
      });
    }

    if (
      command === 'clearrole'
    ) {

      db.clearRole(
        interaction.guild.id,

        interaction.options
          .getString(
            'event'
          )
      );

      return interaction.reply({
        content:
          'Notification role cleared.',
        ephemeral: true
      });
    }

    if (
      command === 'settings'
    ) {

      const config =
        db.getGuild(
          interaction.guild.id
        );

      const roles =
        config.roles || {};

      return interaction.reply({
        content:
          `Channel: ${
            config.channelId
              ? `<#${config.channelId}>`
              : 'Not set'
          }\n` +

          `Egg Shop: ${
            roles.eggshop
              ? `<@&${roles.eggshop}>`
              : 'Not set'
          }\n` +

          `Gear Shop: ${
            roles.gearshop
              ? `<@&${roles.gearshop}>`
              : 'Not set'
          }\n` +

          `Merchant: ${
            roles.merchant
              ? `<@&${roles.merchant}>`
              : 'Not set'
          }\n` +

          `Weather: ${
            roles.weather
              ? `<@&${roles.weather}>`
              : 'Not set'
          }\n` +

          `Dr. Carrot: ${
            roles.drcarrot
              ? `<@&${roles.drcarrot}>`
              : 'Not set'
          }`,

        ephemeral: true
      });
    }
  }
);

client.login(
  process.env.DISCORD_BOT_TOKEN
).catch(
  (error) =>
    console.error(
      'Discord login failed:',
      error.message
    )
);
