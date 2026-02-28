/**
 * Recipe Swipe Book - API Logic
 * Handles all interactions with TheMealDB free API.
 */

const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

// Global cache to enable smart filtering without excessive API calls
let appAreaMap = null; 

async function fetchFromAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error('API Fetch Error:', err);
    throw err;
  }
}

async function searchByName(query) {
  if (!query || !String(query).trim()) return { meals: null };
  return await fetchFromAPI(`search.php?s=${encodeURIComponent(query.trim())}`);
}

async function getRecipeById(mealId) {
  if (!mealId) return null;
  const data = await fetchFromAPI(`lookup.php?i=${encodeURIComponent(mealId)}`);
  return data?.meals && data.meals.length ? data.meals[0] : null;
}

async function filterByCategory(category) {
  if (!category || !String(category).trim()) return { meals: null };
  return await fetchFromAPI(`filter.php?c=${encodeURIComponent(category.trim())}`);
}

async function filterByArea(area) {
  if (!area || !String(area).trim()) return { meals: null };
  return await fetchFromAPI(`filter.php?a=${encodeURIComponent(area.trim())}`);
}

async function getCategories() {
  const data = await fetchFromAPI('list.php?c=list');
  return data?.meals || [];
}

async function getAreas() {
  const data = await fetchFromAPI('list.php?a=list');
  return data?.meals || [];
}

/**
 * Builds a Map of Area -> Array of Meal IDs.
 * This is crucial for the "Dynamic Area Filter" requirement.
 * We fetch this once on startup to allow instant, cross-referenced filtering.
 */
async function buildAreaMap() {
  if (appAreaMap) return appAreaMap;
  try {
    const areas = await getAreas();
    const map = {};
    // Fetch meals for all areas in parallel
    await Promise.all(areas.map(async (a) => {
      const res = await filterByArea(a.strArea);
      map[a.strArea] = (res.meals || []).map(m => m.idMeal);
    }));
    appAreaMap = map;
    return map;
  } catch (error) {
    console.error("Failed to build area map", error);
    return {};
  }
}

/**
 * Given a list of meal objects (e.g. from a category fetch), 
 * checks the AreaMap and returns only the areas that actually contain these meals.
 */
function getValidAreasForMeals(meals) {
  if (!appAreaMap || !meals || meals.length === 0) return [];
  const validAreas = [];
  const mealIds = meals.map(m => m.idMeal);
  
  for (const [area, areaMealIds] of Object.entries(appAreaMap)) {
    // If there is an intersection between the area's meals and our provided meals
    if (areaMealIds.some(id => mealIds.includes(id))) {
      validAreas.push(area);
    }
  }
  return validAreas.sort();
}