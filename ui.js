/**
 * Recipe Swipe Book - UI Rendering
 */

const categoryEmojis = {
  Beef: '🥩', Chicken: '🍗', Dessert: '🍰', Lamb: '🐑', Miscellaneous: '🍲', 
  Pasta: '🍝', Pork: '🥓', Seafood: '🦐', Side: '🍟', Starter: '🥗', 
  Vegan: '🌱', Vegetarian: '🥦', Breakfast: '🍳', Goat: '🐐'
};

function parseIngredients(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`] || '';
    if (ing && String(ing).trim()) items.push({ ingredient: String(ing).trim(), measure: String(measure).trim() });
  }
  return items;
}

function populateFilters(options) {
  const { categories = [], areas = [] } = options;
  const catSelect = document.getElementById('filter-category');
  if (catSelect && categories.length) {
    catSelect.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(({ strCategory }) => {
      const opt = document.createElement('option');
      opt.value = strCategory; opt.textContent = `${categoryEmojis[strCategory] || '🍽️'} ${strCategory}`;
      catSelect.appendChild(opt);
    });
  }
  const areaSelect = document.getElementById('filter-area');
  if (areaSelect && areas.length) {
    areaSelect.innerHTML = '<option value="">World Wide</option>';
    areas.forEach(({ strArea }) => {
      const opt = document.createElement('option');
      opt.value = strArea; opt.textContent = `🌍 ${strArea}`;
      areaSelect.appendChild(opt);
    });
  }
}

function populateDynamicAreas(selectId, validAreas) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">World Wide</option>';
  if (validAreas.length === 0) { select.disabled = true; return; }
  validAreas.forEach(area => {
    const opt = document.createElement('option');
    opt.value = area; opt.textContent = `🌍 ${area}`;
    select.appendChild(opt);
  });
  select.disabled = false;
}

/* Quick Mode Swiper */
function renderSwipeCard(meal) {
  const container = document.getElementById('swipe-container');
  if (!container) return;
  container.innerHTML = '';
  if (!meal) {
    container.innerHTML = '<p class="results-empty">No more recipes to swipe! Adjust your filters.</p>';
    return;
  }
  const card = document.createElement('div');
  card.className = 'swipe-card';
  card.dataset.mealId = meal.idMeal;

  const img = document.createElement('img'); img.src = meal.strMealThumb; img.className = 'swipe-card__img';
  const info = document.createElement('div'); info.className = 'swipe-card__info';
  const title = document.createElement('h3'); title.className = 'swipe-card__title'; title.textContent = meal.strMeal;
  info.appendChild(title);

  const actions = document.createElement('div'); actions.className = 'swipe-actions';
  const dislikeBtn = document.createElement('button'); dislikeBtn.className = 'btn-swipe btn-swipe--dislike'; dislikeBtn.id = 'btn-swipe-dislike'; dislikeBtn.textContent = '❌';
  const likeBtn = document.createElement('button'); likeBtn.className = 'btn-swipe btn-swipe--like'; likeBtn.id = 'btn-swipe-like'; likeBtn.textContent = '❤️';

  actions.appendChild(dislikeBtn); actions.appendChild(likeBtn);
  card.appendChild(img); card.appendChild(info); card.appendChild(actions);
  container.appendChild(card);
}

/* Builder Mode Swiper */
function renderBuilderSwipeCard(sectionKey, meal) {
  const container = document.getElementById(`swipe-${sectionKey}`);
  if (!container) return;
  container.innerHTML = '';
  
  if (!meal) {
    container.innerHTML = '<p class="results-empty">No more meals here! Try changing the area.</p>';
    return;
  }

  const card = document.createElement('div');
  card.className = 'builder-swipe-card';
  
  const img = document.createElement('img'); img.src = meal.strMealThumb; img.className = 'swipe-card__img';
  const info = document.createElement('div'); info.className = 'swipe-card__info';
  const title = document.createElement('h3'); title.className = 'swipe-card__title'; title.textContent = meal.strMeal;
  title.style.fontSize = '1.1rem';
  info.appendChild(title);

  const actions = document.createElement('div'); actions.className = 'swipe-actions'; actions.style.padding = '0.5rem';
  
  const skipBtn = document.createElement('button'); 
  skipBtn.className = 'btn-swipe btn-swipe--dislike'; skipBtn.textContent = '❌'; skipBtn.style.width = '45px'; skipBtn.style.height = '45px'; skipBtn.style.fontSize = '1.1rem';
  skipBtn.dataset.action = 'builder-skip'; skipBtn.dataset.section = sectionKey;

  const addBtn = document.createElement('button'); 
  addBtn.className = 'btn-swipe btn-swipe--like'; addBtn.textContent = '❤️'; addBtn.style.width = '45px'; addBtn.style.height = '45px'; addBtn.style.fontSize = '1.1rem';
  addBtn.dataset.action = 'builder-add'; addBtn.dataset.section = sectionKey;

  actions.appendChild(skipBtn); actions.appendChild(addBtn);
  card.appendChild(img); card.appendChild(info); card.appendChild(actions);
  container.appendChild(card);
}

function renderMenuSummary(menuObj) {
  const container = document.getElementById('menu-summary');
  if (!container) return;
  let html = ''; let totalItems = 0;
  const renderGroup = (title, items, sectionKey) => {
    if (items.length === 0) return '';
    totalItems += items.length;
    let groupHtml = `<div class="menu-group"><h4>${title}</h4>`;
    items.forEach(item => {
      groupHtml += `<div class="menu-item"><span class="menu-item__name" data-action="view-recipe" data-id="${item.id}">🍽️ ${item.title}</span><button class="btn-remove" data-action="remove-builder" data-section="${sectionKey}" data-id="${item.id}">×</button></div>`;
    });
    return groupHtml + `</div>`;
  };

  html += renderGroup('Starters', menuObj.starters, 'starters');
  html += renderGroup('Main Courses', menuObj.mains, 'mains');
  html += renderGroup('Sides & Misc', menuObj.misc, 'misc');
  html += renderGroup('Desserts', menuObj.desserts, 'desserts');

  container.innerHTML = totalItems === 0 ? '<p class="liked-empty text-center">Your menu is empty.</p>' : html;
}

function renderSavedMenusList(savedMenus) {
  const container = document.getElementById('saved-menus-list');
  if (!container) return;
  container.innerHTML = '';
  if (!savedMenus || savedMenus.length === 0) {
    container.innerHTML = '<p class="liked-empty text-center">No saved feasts yet.</p>';
    return;
  }
  savedMenus.forEach(menu => {
    const totalItems = menu.items.starters.length + menu.items.mains.length + menu.items.misc.length + menu.items.desserts.length;
    const card = document.createElement('div'); card.className = 'saved-menu-card';
    card.innerHTML = `
      <div class="saved-menu-card__info">
        <h4>Feast from ${menu.date}</h4>
        <p>${totalItems} dishes total</p>
      </div>
      <div class="saved-menu-card__actions">
        <button class="btn-icon" data-action="view-feast" data-id="${menu.id}" title="View Feast">👀</button>
        <button class="btn-icon" data-action="share-feast" data-id="${menu.id}" title="Share Feast">📤</button>
        <button class="btn-icon" data-action="delete-menu" data-id="${menu.id}" title="Delete Feast">🗑️</button>
      </div>
    `;
    container.appendChild(card);
  });
}

// מענדר את חלון הצפייה המלא בארוחה השמורה
function renderFeastDetailsModal(menuObj) {
  const container = document.getElementById('feast-details-content');
  if (!container) return;
  container.innerHTML = '';
  
  let html = `<p style="color: var(--color-muted); font-weight: 600; margin-top: 0;">Click on any dish to view its ingredients and recipe!</p>`;
  
  const renderList = (title, items) => {
    if (items.length === 0) return '';
    let group = `<div style="margin-bottom: 1.5rem;"><h4 style="color: var(--color-primary); margin: 0 0 0.5rem 0; font-weight: 800; border-bottom: 2px solid var(--color-border); padding-bottom: 0.2rem;">${title}</h4>`;
    items.forEach(item => {
      group += `
        <div class="feast-dish-item" data-action="view-recipe" data-id="${item.id}">
          <p class="feast-dish-title">${item.title}</p>
          <span class="feast-dish-cat">Open Recipe ➔</span>
        </div>`;
    });
    return group + `</div>`;
  };

  html += renderList('Starters', menuObj.items.starters);
  html += renderList('Main Courses', menuObj.items.mains);
  html += renderList('Sides & Misc', menuObj.items.misc);
  html += renderList('Desserts', menuObj.items.desserts);

  container.innerHTML = html;
  
  // עדכון כפתור השיתוף שידע איזה תפריט לשתף
  const shareBtn = document.getElementById('btn-modal-share-feast');
  if (shareBtn) shareBtn.dataset.id = menuObj.id;
}

function renderRecipeDetailsModal(meal, activeTab = 'ingredients', isViewMode = false) {
  const container = document.getElementById('recipe-details-content');
  const footer = document.getElementById('recipe-modal-footer');
  const title = document.getElementById('modal-recipe-title');
  if (!container || !footer || !title || !meal) return;

  title.textContent = meal.strMeal;
  container.innerHTML = ''; footer.innerHTML = '';

  const img = document.createElement('img'); img.src = meal.strMealThumb; img.className = 'details-img';
  const tabs = document.createElement('div'); tabs.className = 'details-tabs';
  
  const tabIng = document.createElement('button'); tabIng.className = 'details-tab' + (activeTab === 'ingredients' ? ' details-tab--active' : ''); tabIng.textContent = 'Ingredients'; tabIng.dataset.tab = 'ingredients';
  const tabIns = document.createElement('button'); tabIns.className = 'details-tab' + (activeTab === 'instructions' ? ' details-tab--active' : ''); tabIns.textContent = 'Instructions'; tabIns.dataset.tab = 'instructions';
  tabs.appendChild(tabIng); tabs.appendChild(tabIns);

  const content = document.createElement('div');
  const panelIng = document.createElement('div'); panelIng.hidden = activeTab !== 'ingredients';
  const list = document.createElement('ul'); list.className = 'ingredients-list';
  parseIngredients(meal).forEach(({ ingredient, measure }) => {
    const li = document.createElement('li'); li.textContent = measure ? `${measure} ${ingredient}` : ingredient; list.appendChild(li);
  });
  panelIng.appendChild(list);

  const panelIns = document.createElement('div'); panelIns.hidden = activeTab !== 'instructions';
  const text = document.createElement('div'); text.className = 'instructions-text'; text.textContent = meal.strInstructions || 'No instructions available.'; panelIns.appendChild(text);

  content.appendChild(panelIng); content.appendChild(panelIns);
  container.appendChild(img); container.appendChild(tabs); container.appendChild(content);

  if (isViewMode) {
    const closeBtn = document.createElement('button'); closeBtn.className = 'btn btn-primary'; closeBtn.id = 'btn-details-close-view'; closeBtn.textContent = 'Done Reading'; footer.appendChild(closeBtn);
  } else {
    const saveBtn = document.createElement('button'); saveBtn.className = 'btn btn-primary'; saveBtn.id = 'btn-details-save'; saveBtn.textContent = '⭐ Save to Favorites';
    const discardBtn = document.createElement('button'); discardBtn.className = 'btn btn-ghost'; discardBtn.id = 'btn-details-discard'; discardBtn.textContent = 'Discard';
    footer.appendChild(saveBtn); footer.appendChild(discardBtn);
  }
}

function renderLikedList(liked) {
  const list = document.getElementById('liked-list');
  if (!list) return;
  list.innerHTML = '';
  if (!liked || liked.length === 0) { list.innerHTML = '<p class="liked-empty">Your library is empty.</p>'; return; }
  liked.forEach((meal) => {
    const item = document.createElement('div'); item.className = 'liked-item';
    const img = document.createElement('img'); img.src = meal.strMealThumb; img.className = 'liked-item__img'; img.dataset.action = 'view-liked'; img.dataset.mealId = meal.idMeal;
    const title = document.createElement('p'); title.className = 'liked-item__title'; title.textContent = meal.strMeal;
    
    const removeBtn = document.createElement('button'); removeBtn.className = 'btn btn-ghost'; removeBtn.style.padding = '0.2rem'; removeBtn.style.fontSize = '0.75rem'; removeBtn.style.marginTop = '0.3rem'; removeBtn.textContent = 'Trash'; removeBtn.dataset.action = 'remove'; removeBtn.dataset.mealId = meal.idMeal;

    item.appendChild(img); item.appendChild(title); item.appendChild(removeBtn); list.appendChild(item);
  });
}

function setResultsSummary(message) { const el = document.getElementById('results-summary'); if (el) el.textContent = message; }
function showResultsLoading() { const el = document.getElementById('swipe-container'); if (el) el.innerHTML = '<p class="results-loading">Loading recipes…</p>'; }
function showResultsError(msg) { const el = document.getElementById('swipe-container'); if (el) el.innerHTML = `<p class="results-error">${msg}</p>`; }

function openRecipeModal() { const m = document.getElementById('recipe-details-modal'); if (m) { m.removeAttribute('hidden'); m.classList.add('modal--open'); } }
function closeRecipeModal() { const m = document.getElementById('recipe-details-modal'); if (m) { m.setAttribute('hidden', ''); m.classList.remove('modal--open'); } }

function openFeastModal() { const m = document.getElementById('feast-details-modal'); if (m) { m.removeAttribute('hidden'); m.classList.add('modal--open'); } }
function closeFeastModal() { const m = document.getElementById('feast-details-modal'); if (m) { m.setAttribute('hidden', ''); m.classList.remove('modal--open'); } }

function openPersonalDetailsModal() { const m = document.getElementById('personal-details-modal'); if (m) { m.removeAttribute('hidden'); m.classList.add('modal--open'); } }
function closePersonalDetailsModal() { const m = document.getElementById('personal-details-modal'); if (m) { m.setAttribute('hidden', ''); m.classList.remove('modal--open'); } }