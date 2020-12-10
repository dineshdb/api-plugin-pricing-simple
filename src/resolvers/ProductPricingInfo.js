import getCurrencyDefinitionByCode from "@reactioncommerce/api-utils/getCurrencyDefinitionByCode.js";
import getDisplayPrice from "../util/getDisplayPrice.js";

function displayPrice(node) {
  if (node.displayPrice) {
    // Operating in core catalog plugin mode.
    // Use displayPrice directly from mongo.
    // It was computed at publish time.
    return node.displayPrice;
  }
  // Operating in catalog publisher mode.
  // displayPrice was not computed ahead of time.
  // Compute it on the fly now.
  return getDisplayPrice(node.minPrice, node.maxPrice, getCurrencyDefinitionByCode(node.currencyCode));
}

function compareAtPrice({ compareAtPrice: amount, currencyCode }){
  if (typeof amount === "number" && amount > 0) {
    return { amount, currencyCode };
  }
  return null;
}

export default {
  compareAtPrice,
  displayPrice,
  currency: node => getCurrencyDefinitionByCode(node.currencyCode),
  currencyExchangePricing: async (productPrice, {currencyCode: targetCurrencyCode}, context, _currencyExchangePricing) => {
    const {currencyCode} = productPrice;
    const {minPrice, maxPrice, price} = await context.queries.getVariantPrice(context, {currencyCode, pricing: {[currencyCode]: productPrice}}, targetCurrencyCode)
    const compPrice = context.queries.getExchangedPrice(productPrice.compareAtPrice, targetCurrencyCode)
    return {
      minPrice,
      maxPrice,
      price,
      currency: getCurrencyDefinitionByCode(targetCurrencyCode),
      displayPrice: displayPrice({minPrice, maxPrice, currencyCode: targetCurrencyCode}),
      compareAtPrice: compareAtPrice({compareAtPrice: compPrice, targetCurrencyCode}),
      currency: getCurrencyDefinitionByCode(targetCurrencyCode)
    }
  }
};
