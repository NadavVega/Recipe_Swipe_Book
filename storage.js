/**
 * Recipe Swipe Book - Local Storage Logic
 */

const STORAGE_KEY = 'recipe-swipe-book-liked';
const MENUS_KEY = 'recipe-swipe-book-menus';

// --- Liked Recipes (Quick Mode) ---
function getLikedRecipes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) { return []; }
}

function addLikedRecipe(recipeObj) {
  if (!recipeObj || !recipeObj.idMeal) return;
  const liked = getLikedRecipes();
  if (liked.some((r) => r.idMeal === recipeObj.idMeal)) return;
  liked.push(recipeObj);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(liked)); } catch (err) {}
}

function removeLikedRecipe(recipeId) {
  if (!recipeId) return;
  const liked = getLikedRecipes().filter((r) => r.idMeal !== String(recipeId));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(liked)); } catch (err) {}
}

// --- Saved Menus (Builder Mode) ---
function getSavedMenus() {
  try {
    const stored = localStorage.getItem(MENUS_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) { return []; }
}

function addSavedMenu(menuObj) {
  if (!menuObj || !menuObj.id) return;
  const menus = getSavedMenus();
  menus.push(menuObj);
  try { localStorage.setItem(MENUS_KEY, JSON.stringify(menus)); } catch (err) {}
}

function removeSavedMenu(menuId) {
  if (!menuId) return;
  const menus = getSavedMenus().filter((m) => m.id !== String(menuId));
  try { localStorage.setItem(MENUS_KEY, JSON.stringify(menus)); } catch (err) {}
}