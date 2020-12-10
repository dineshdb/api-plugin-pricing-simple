/**
 * @method getVariantPrice
 * @summary This method returns the applicable price and currency code for a selected product.
 * @param {Object} context - App context
 * @param {Object} catalogVariant - A selected product variant.
 * @param {String} currencyCode - The currency code in which to get price
 * @returns {Object} - A cart item price value.
 */
export default async function getVariantPrice(context, catalogVariant, currencyCode) {
  if (!currencyCode) throw new Error("getVariantPrice received no currency code");
  if (!catalogVariant) throw new Error("getVariantPrice received no catalogVariant");
  if (!catalogVariant.pricing) throw new Error(`Catalog variant ${catalogVariant._id} has no pricing information saved`);
  return catalogVariant.pricing[currencyCode] || computeVariantPrice(context, catalogVariant, currencyCode);
}

async function computeVariantPrice(context, {currencyCode: catalogCurrencyCode, pricing, shopId}, currencyCode) {
  if(!catalogCurrencyCode) {
    const shop = await context.queries.shopById(context, shopId);
    catalogCurrencyCode = shop.currency;
  }
  let nativePricing = pricing[catalogCurrencyCode];
  const forex = context.queries.getForexFor(currencyCode);
  if(!nativePricing) {
    return {};
  }

  let {minPrice, maxPrice, price, compareAtPrice} = nativePricing;
  if(minPrice) {
  	price = price? price: minPrice;
  } else if(maxPrice) {
  	price = price? price: maxPrice;
  }
  maxPrice = maxPrice? maxPrice: price;
  minPrice = minPrice? minPrice: price;
  
  if(!forex) {
    return {
      minPrice, maxPrice, price, currencyCode: catalogCurrencyCode  
    }
  }
  const getExchangedPrice = context.queries.getExchangedPrice;
  return {
    compareAtPrice: compareAtPrice && getExchangedPrice(minPrice, currencyCode),
    minPrice: getExchangedPrice(minPrice, currencyCode),
    maxPrice: getExchangedPrice(maxPrice, currencyCode),
    price: getExchangedPrice(price, currencyCode),
    currencyCode
  }
}

