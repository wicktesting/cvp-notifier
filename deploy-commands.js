require('dotenv').config?.();

const {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

const commands = [

  new SlashCommandBuilder()
    .setName('eggshop')
    .setDescription(
      'Show the current Egg Shop'
    ),

  new SlashCommandBuilder()
    .setName('gearshop')
    .setDescription(
      'Show the current Gear Shop'
    ),

  new SlashCommandBuilder()
    .setName('merchant')
    .setDescription(
      'Show the Traveling Merchant'
    ),

  new SlashCommandBuilder()
    .setName('weather')
    .setDescription(
      'Show the current weather'
    ),

  /*
   * NEW
   */

  new SlashCommandBuilder()
    .setName('drcarrot')
    .setDescription(
      'Show the Dr. Carrot Scrap Shop'
    ),

  new SlashCommandBuilder()
    .setName('stock')
    .setDescription(
      'Show all tracked CVP stock'
    ),

  new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription(
      'Set the notification channel'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addChannelOption(
      option =>
        option
          .setName('channel')
          .setDescription(
            'Notification channel'
          )
          .setRequired(true)
          .addChannelTypes(
            ChannelType.GuildText
          )
    ),

  new SlashCommandBuilder()
    .setName('setrole')
    .setDescription(
      'Set a notification role'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addStringOption(
      option =>
        option
          .setName('event')
          .setDescription(
            'Notification type'
          )
          .setRequired(true)
          .addChoices(

            {
              name: 'Egg Shop',
              value: 'eggshop'
            },

            {
              name: 'Gear Shop',
              value: 'gearshop'
            },

            {
              name: 'Merchant',
              value: 'merchant'
            },

            {
              name: 'Weather',
              value: 'weather'
            },

            {
              name: 'Dr. Carrot',
              value: 'drcarrot'
            }
          )
    )
    .addRoleOption(
      option =>
        option
          .setName('role')
          .setDescription(
            'Role to ping'
          )
          .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('clearrole')
    .setDescription(
      'Clear a notification role'
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    )
    .addStringOption(
      option =>
        option
          .setName('event')
          .setDescription(
            'Notification type'
          )
          .setRequired(true)
          .addChoices(

            {
              name: 'Egg Shop',
              value: 'eggshop'
            },

            {
              name: 'Gear Shop',
              value: 'gearshop'
            },

            {
              name: 'Merchant',
              value: 'merchant'
            },

            {
              name: 'Weather',
              value: 'weather'
            },

            {
              name: 'Dr. Carrot',
              value: 'drcarrot'
            }
          )
    ),

  new SlashCommandBuilder()
    .setName('settings')
    .setDescription(
      'Show notifier settings'
    )

].map(
  command =>
    command.toJSON()
);

(async () => {

  if (
    !process.env.DISCORD_BOT_TOKEN ||
    !process.env.DISCORD_CLIENT_ID
  ) {
    throw new Error(
      'Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID'
    );
  }

  const rest =
    new REST({
      version: '10'
    }).setToken(
      process.env.DISCORD_BOT_TOKEN
    );

  const guild =
    process.env.DISCORD_TEST_GUILD_ID;

  if (guild) {

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID,
        guild
      ),
      {
        body: commands
      }
    );

  } else {

    await rest.put(
      Routes.applicationCommands(
        process.env.DISCORD_CLIENT_ID
      ),
      {
        body: commands
      }
    );
  }

  console.log(
    `Registered ${commands.length} commands.`
  );

})().catch(
  console.error
);
