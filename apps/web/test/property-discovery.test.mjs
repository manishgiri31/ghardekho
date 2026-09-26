import assert from "node:assert/strict";
import test from "node:test";
import {
  discoveryApiQuery,
  getDiscoveryState,
  parseDiscoveryQuery,
  propertyDetailsHref,
  updateDiscoveryQuery,
} from "../lib/property-discovery.ts";

test("URL search parameters parse into the supported API search request", () => {
  const parsed = parseDiscoveryQuery("q=park+view&city=Pune&locality=Kothrud&listingType=SALE&propertyType=APARTMENT&minPrice=5000000&maxPrice=10000000&bedrooms=3&minArea=900&maxArea=1400&furnishing=FURNISHED&page=2&limit=12&sort=price_asc");
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.q, "park view");
  assert.equal(parsed.data.city, "Pune");
  assert.equal(parsed.data.bedrooms, 3);
  const params = new URLSearchParams(discoveryApiQuery(parsed.data));
  assert.equal(params.get("q"), "park view");
  assert.equal(params.get("listingType"), "SALE");
  assert.equal(params.get("minArea"), "900");
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("sort"), "price_asc");
  assert.equal(params.has("location"), false);
  const legacyAreaSort = parseDiscoveryQuery("sort=area");
  assert.equal(legacyAreaSort.success && legacyAreaSort.data.sort, "area_desc");
});

test("sorting and pagination updates retain filters and reset the page for a new sort", () => {
  const original = "q=near+park&city=Pune&bedrooms=2&page=4&limit=12&sort=newest";
  const sorted = new URLSearchParams(updateDiscoveryQuery(original, { sort: "price_desc", page: 1 }));
  assert.equal(sorted.get("q"), "near park");
  assert.equal(sorted.get("city"), "Pune");
  assert.equal(sorted.get("bedrooms"), "2");
  assert.equal(sorted.get("page"), "1");
  assert.equal(sorted.get("sort"), "price_desc");

  const nextPage = new URLSearchParams(updateDiscoveryQuery(sorted.toString(), { page: 2 }));
  assert.equal(nextPage.get("page"), "2");
  assert.equal(nextPage.get("city"), "Pune");
  assert.equal(nextPage.get("sort"), "price_desc");
});

test("discovery state covers loading, API error, empty results, and results", () => {
  const empty = { success: true, data: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0, hasNextPage: false } };
  const card = { id: "p1", title: "A bright city home", slug: "bright-city-home", propertyType: "APARTMENT", listingType: "SALE", price: "9000000", area: "1100", areaUnit: "SQFT", bedrooms: 2, bathrooms: 1, locality: "Kothrud", city: "Pune" };
  const populated = { ...empty, data: [card] };
  assert.equal(getDiscoveryState({ loading: true, error: "", result: null }), "loading");
  assert.equal(getDiscoveryState({ loading: false, error: "Network error", result: null }), "error");
  assert.equal(getDiscoveryState({ loading: false, error: "", result: empty }), "empty");
  assert.equal(getDiscoveryState({ loading: false, error: "", result: populated }), "results");
});

test("public property cards link to the existing detail route", () => {
  assert.equal(propertyDetailsHref("central-pune-home"), "/properties/central-pune-home");
  assert.equal(propertyDetailsHref("home with spaces"), "/properties/home%20with%20spaces");
});
