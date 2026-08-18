const RARITY_ORDER = [
  'Common',
  'Rare',
  'Epic',
  'Legendary',
  'Mythic',
  'Divine',
  'Godly',
  'Secret'
];

function stockNumber(value) {
  if (typeof value === 'number') return value;

  if (typeof value !== 'string') return null;

  const match =
    value.match(/[xX]\s*(\d+)/) ||
    value.match(/(\d+)\s*in stock/i);

  if (match) return Number(match[1]);

  if (
    /no stock|out of stock|sold out/i.test(value)
  ) {
    return 0;
  }

  return null;
}

function normalizeStockList(list) {
  if (!Array.isArray(list)) return [];

  return list.map((x) => ({
    name:
      x?.name ??
      x?.itemName ??
      x?.title ??
      'Unknown',

    stock:
      x?.stock ??
      x?.value ??
      null,

    cost:
      x?.cost ??
      x?.price ??
      null,

    rarity:
      x?.rarity ??
      null,

    description:
      x?.description ??
      null
  }));
}

function normalizeMerchant(merchant) {
  if (!merchant) return null;

  return {
    name: merchant.name ?? 'Traveling Merchant',
    timeLeft: merchant.timeLeft ?? null,
    items: normalizeStockList(
      merchant.items ?? []
    )
  };
}

function normalizeWeather(weather) {
  if (!weather) return null;

  if (typeof weather === 'string') {
    return weather;
  }

  return (
    weather.name ??
    weather.weather ??
    weather.type ??
    null
  );
}

/*
 * Dr. Carrot Scrap Shop
 *
 * The Roblox client receives:
 *
 * ThemePurchases = table
 * Stock = table
 * Theme = DrCarrot
 * RestockUntil = number
 *
 * Stock values can themselves be nested tables,
 * so the notifier intentionally keeps both:
 *   - the item name
 *   - the original value
 */

function normalizeDrCarrot(dr) {
  if (!dr || typeof dr !== 'object') {
    return null;
  }

  const rawStock =
    dr.stock ??
    dr.Stock ??
    {};

  const stock = Array.isArray(rawStock)
    ? rawStock
    : Object.entries(rawStock).map(
        ([name, value]) => ({
          name,
          value
        })
      );

  return {
    theme:
      dr.theme ??
      dr.Theme ??
      'DrCarrot',

    restockUntil:
      dr.restockUntil ??
      dr.RestockUntil ??
      null,

    themePurchases:
      dr.themePurchases ??
      dr.ThemePurchases ??
      null,

    stock: stock.map((x) => ({
      name:
        x.name ??
        x.itemName ??
        x.title ??
        'Unknown',

      value:
        x.value ??
        x.stock ??
        x.amount ??
        null,

      stock:
        x.stock ??
        null,

      cost:
        x.cost ??
        x.price ??
        x.scrapCost ??
        null,

      rarity:
        x.rarity ??
        null,

      description:
        x.description ??
        null
    }))
  };
}

module.exports = {
  RARITY_ORDER,
  stockNumber,
  normalizeStockList,
  normalizeMerchant,
  normalizeWeather,
  normalizeDrCarrot
};
