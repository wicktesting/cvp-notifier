const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const path = require("path");

const adapter =
    new FileSync(
        path.join(
            __dirname,
            "db.json"
        )
    );

const db =
    low(adapter);


// ============================================================
// DEFAULT STRUCTURE
// ============================================================

db.defaults({
    guilds: {}
}).write();


// ============================================================
// NORMALIZE CONFIG
// ============================================================

function normalizeConfig(
    guildId
) {

    let config =
        db.get(
            `guilds.${guildId}`
        ).value();

    if (!config) {

        config = {
            channels: {},
            roles: {},
            itemRoles: {}
        };

        db.set(
            `guilds.${guildId}`,
            config
        ).write();

        return config;

    }


    // --------------------------------------------------------
    // Migrate old channelId format.
    // --------------------------------------------------------

    if (
        config.channelId &&
        !config.channels
    ) {

        config.channels = {

            eggShop:
                config.channelId,

            gearShop:
                config.channelId,

            merchant:
                config.channelId,

            weather:
                config.channelId

        };

    }


    if (!config.channels) {
        config.channels = {};
    }

    if (!config.roles) {
        config.roles = {};
    }

    if (!config.itemRoles) {
        config.itemRoles = {};
    }


    db.set(
        `guilds.${guildId}`,
        config
    ).write();


    return config;

}


// ============================================================
// GET GUILD CONFIG
// ============================================================

function getGuildConfig(
    guildId
) {

    return normalizeConfig(
        guildId
    );

}


// ============================================================
// SET CHANNEL
// ============================================================

function setChannel(
    guildId,
    eventType,
    channelId
) {

    normalizeConfig(
        guildId
    );

    db.set(
        `guilds.${guildId}.channels.${eventType}`,
        channelId
    ).write();

}


// ============================================================
// SET CATEGORY ROLE
// ============================================================

function setRole(
    guildId,
    eventType,
    roleId
) {

    normalizeConfig(
        guildId
    );

    db.set(
        `guilds.${guildId}.roles.${eventType}`,
        roleId
    ).write();

}


// ============================================================
// CLEAR CATEGORY ROLE
// ============================================================

function clearRole(
    guildId,
    eventType
) {

    normalizeConfig(
        guildId
    );

    db.unset(
        `guilds.${guildId}.roles.${eventType}`
    ).write();

}


// ============================================================
// SET INDIVIDUAL ITEM ROLE
// ============================================================

function setItemRole(
    guildId,
    itemName,
    roleId
) {

    normalizeConfig(
        guildId
    );

    db.set(
        `guilds.${guildId}.itemRoles.${itemName}`,
        roleId
    ).write();

}


// ============================================================
// CLEAR INDIVIDUAL ITEM ROLE
// ============================================================

function clearItemRole(
    guildId,
    itemName
) {

    normalizeConfig(
        guildId
    );

    db.unset(
        `guilds.${guildId}.itemRoles.${itemName}`
    ).write();

}


// ============================================================
// ALL GUILD CONFIGS
// ============================================================

function allGuildConfigs() {

    const guilds =
        db.get(
            "guilds"
        ).value()
        || {};

    for (
        const guildId
        of Object.keys(guilds)
    ) {

        normalizeConfig(
            guildId
        );

    }

    return (
        db.get(
            "guilds"
        ).value()
        || {}
    );

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getGuildConfig,

    setChannel,

    setRole,

    clearRole,

    setItemRole,

    clearItemRole,

    allGuildConfigs

};
