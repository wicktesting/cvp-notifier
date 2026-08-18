// Static reference data for Discord embeds.
// Live stock, merchant, Scrap Shop and bounty state
// always comes from the Railway API.

const WEATHER_INFO = {

    "Sunny": {
        color: 0xFFD966,
        description:
            "Clear skies — no special weather event active right now.",
        mutation: null,
        mutationChance: null
    },

    "Night": {
        color: 0x352AD9,
        description:
            "It is night time. Chance for plants, eggs and capybaras to mutate to Moonlit.",
        mutation: "Moonlit",
        mutationChance: 0.325
    },

    "Rain": {
        color: 0x627C7C,
        description:
            "Rain starts to fall. +25% faster plant spawnrate!",
        mutation: null,
        mutationChance: null
    },

    "Snowy": {
        color: 0xD8F4F4,
        description:
            "Snow sprinkles down! Chance for plants, eggs and capybaras to mutate to Chilly.",
        mutation: "Chilly",
        mutationChance: 0.3
    },

    "Zen": {
        color: 0xD0C0AD,
        description:
            "A serene calm falls over the landscape. Chance to mutate to Tranquil.",
        mutation: "Tranquil",
        mutationChance: 0.26
    },

    "Meteor Shower": {
        color: 0x9022DF,
        description:
            "The night sky is bright! Chance to upgrade Moonlit to Celestial.",
        mutation: "Celestial",
        mutationChance: 0.25
    },

    "Red Sun": {
        color: 0xF12906,
        description:
            "The sun blares red. Toasty has a chance to upgrade to Scorched.",
        mutation: "Scorched",
        mutationChance: 0.275
    },

    "Heatwave": {
        color: 0xFFB115,
        description:
            "Sluggish and sweaty. Chance to mutate to Toasty.",
        mutation: "Toasty",
        mutationChance: 0.275
    },

    "Glitch": {
        color: 0x000000,
        description:
            "I'm not sure what's happening... Chance to mutate to Glitched.",
        mutation: "Glitched",
        mutationChance: 0.25
    },

    "Thunder": {
        color: 0xFFFF00,
        description:
            "Thunder and lightning! Chance to mutate to Shocked.",
        mutation: "Shocked",
        mutationChance: 0.325
    },

    "Reverse Sun": {
        color: 0x00F114,
        description:
            "The sun feels... cold on your skin? Chance to mutate to Flipped.",
        mutation: "Flipped",
        mutationChance: 0.45
    },

    "Taco Rain": {
        color: 0xFFCF60,
        description:
            "IT'S RAINING TACOS!!! Chance to mutate to Taco!",
        mutation: "Taco",
        mutationChance: 0.45
    },

    "Blizzard": {
        color: 0x1859F1,
        description:
            "So cold you can't feel your face! Chilly has a chance to upgrade to Permafrost.",
        mutation: "Permafrost",
        mutationChance: 0.275
    }

};


const RARITY_COLORS = {

    "Common": 0x9E9E9E,

    "Rare": 0x3B82F6,

    "Epic": 0x8B5CF6,

    "Legendary": 0xEAB308,

    "Mythic": 0xEC4899,

    "Divine": 0x22D3EE,

    "Godly": 0xF43F5E,

    "Secret": 0x111111,

    "Premium": 0xFACC15,

    "Exclusive": 0xF97316,

    "Limited": 0xA855F7,

    "BOSS": 0x7F1D1D

};


const BOUNTY_SHOP = [

    {
        name:
            "Totem Of Marrow",

        type:
            "Totem",

        cost:
            25
    },

    {
        name:
            "Bounty Hunter Trophy",

        type:
            "Totem",

        cost:
            250
    },

    {
        name:
            "Bounty Hunter Capybara Egg",

        type:
            "Egg",

        cost:
            300
    }

];


const BOUNTY_INFO = {

    Easy: {

        tokens:
            3,

        mutations: [
            "Moonlit",
            "Chilly",
            "Toasty"
        ]

    },

    Hard: {

        tokens:
            5,

        mutations: [
            "Tranquil",
            "Shocked"
        ]

    },

    rotationSeconds:
        900

};


function rarityColor(
    rarity
) {

    return (
        RARITY_COLORS[rarity]
        ||
        0x2B2D31
    );

}


function weatherInfo(
    name
) {

    return (
        WEATHER_INFO[name]
        ||
        null
    );

}


module.exports = {

    WEATHER_INFO,

    RARITY_COLORS,

    BOUNTY_SHOP,

    BOUNTY_INFO,

    rarityColor,

    weatherInfo

};
