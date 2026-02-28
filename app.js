/**
 * Recipe Swipe Book - Main Controller
 */

(function () {
  const AppState = {
    recipes: [], currentIndex: 0, currentRecipe: null, likedRecipes: [], savedMenus: [],
    activeDetailsTab: 'ingredients', isViewingSaved: false,
    builderData: { starters: [], mains: [], misc: [], desserts: [] },
    builderIndices: { starters: 0, mains: 0, misc: 0, desserts: 0 },
    menu: { starters: [], mains: [], misc: [], desserts: [] },
    allAreas: [] // שומר את כל האזורים למקרה שאין קטגוריה ב-Quick Mode
  };

  async function init() {
    try {
      const [categories, areas] = await Promise.all([getCategories(), getAreas()]);
      AppState.allAreas = areas.map(a => a.strArea);
      populateFilters({ categories, areas });
      await buildAreaMap(); 
      document.getElementById('app-loader').style.opacity = '0';
      setTimeout(() => document.getElementById('app-loader').remove(), 500);
    } catch (err) { console.error('Failed to init data'); }

    AppState.likedRecipes = getLikedRecipes();
    renderLikedList(AppState.likedRecipes);
    AppState.savedMenus = getSavedMenus();
    renderSavedMenusList(AppState.savedMenus);

    attachEventListeners();
  }

  function setMode(mode) {
    const selector = document.getElementById('mode-selector');
    selector.className = 'mode-selector mode-selector--compact';
    document.getElementById('btn-mode-quick').classList.remove('mode-btn--active');
    document.getElementById('btn-mode-builder').classList.remove('mode-btn--active');
    
    document.getElementById('quick-view').setAttribute('hidden', '');
    document.getElementById('builder-view').setAttribute('hidden', '');
    
    if (mode === 'quick') {
      document.getElementById('btn-mode-quick').classList.add('mode-btn--active');
      document.getElementById('quick-view').removeAttribute('hidden');
      if (AppState.recipes.length === 0) runSearch();
    } else {
      document.getElementById('btn-mode-builder').classList.add('mode-btn--active');
      document.getElementById('builder-view').removeAttribute('hidden');
    }
  }

  /* --- QUICK MEAL LOGIC --- */
  async function updateQuickModeAreas(category) {
    const areaSelectId = 'filter-area';
    if (!category) {
      populateDynamicAreas(areaSelectId, AppState.allAreas);
      return;
    }
    try {
      const meals = (await filterByCategory(category)).meals || [];
      const validAreas = getValidAreasForMeals(meals);
      const currentArea = document.getElementById(areaSelectId).value;
      populateDynamicAreas(areaSelectId, validAreas);
      if (validAreas.includes(currentArea)) document.getElementById(areaSelectId).value = currentArea;
    } catch (err) { console.error("Error updating quick areas", err); }
  }

  async function runSearch() {
    const category = document.getElementById('filter-category')?.value || '';
    const area = document.getElementById('filter-area')?.value || '';
    showResultsLoading(); setResultsSummary('Fetching your menu...');
    try {
      let meals = [];
      if (category && area) {
        const [catData, areaData] = await Promise.all([filterByCategory(category), filterByArea(area)]);
        meals = (catData.meals || []).filter(cm => (areaData.meals || []).some(am => am.idMeal === cm.idMeal));
      } 
      else if (category) meals = (await filterByCategory(category)).meals || [];
      else if (area) meals = (await filterByArea(area)).meals || [];
      else meals = (await filterByCategory('Beef')).meals || [];

      meals = meals.sort(() => 0.5 - Math.random());
      AppState.recipes = meals; AppState.currentIndex = 0;
      setResultsSummary(meals.length ? `Found ${meals.length} matching recipes.` : 'No matches found.');
      renderSwipeCard(AppState.recipes[AppState.currentIndex]);
    } catch (err) { showResultsError('Something went wrong.'); }
  }

  async function handleSwipeLike() {
    const currentMeal = AppState.recipes[AppState.currentIndex];
    if (!currentMeal) return;
    setResultsSummary('Loading recipe details...');
    try {
      const fullMeal = await getRecipeById(currentMeal.idMeal);
      AppState.currentRecipe = fullMeal; AppState.activeDetailsTab = 'ingredients'; AppState.isViewingSaved = false;
      renderRecipeDetailsModal(fullMeal, 'ingredients', false); openRecipeModal();
    } catch (err) { setResultsSummary('Failed to load full details.'); }
  }

  /* --- BUILDER MEAL LOGIC --- */
  async function loadBuilderSection(sectionKey, category, area) {
    const swipeId = `swipe-${sectionKey}`;
    const areaSelectId = `build-area-${sectionKey}`;
    document.getElementById(swipeId).innerHTML = '<p class="results-loading">Loading...</p>';
    
    if (!category) {
      document.getElementById(swipeId).innerHTML = '<p class="results-empty">Select a type first.</p>';
      document.getElementById(areaSelectId).disabled = true;
      return;
    }

    try {
      let meals = (await filterByCategory(category)).meals || [];
      const validAreas = getValidAreasForMeals(meals);
      
      const currentAreaVal = document.getElementById(areaSelectId).value;
      populateDynamicAreas(areaSelectId, validAreas);
      if (validAreas.includes(currentAreaVal)) document.getElementById(areaSelectId).value = currentAreaVal;

      const finalArea = document.getElementById(areaSelectId).value;
      if (finalArea) meals = meals.filter(m => appAreaMap[finalArea].includes(m.idMeal));

      meals = meals.sort(() => 0.5 - Math.random());
      AppState.builderData[sectionKey] = meals;
      AppState.builderIndices[sectionKey] = 0;
      
      showNextBuilderCard(sectionKey);
    } catch (err) { document.getElementById(swipeId).innerHTML = '<p class="results-error">Error loading.</p>'; }
  }

  function showNextBuilderCard(sectionKey) {
    const meal = AppState.builderData[sectionKey][AppState.builderIndices[sectionKey]];
    renderBuilderSwipeCard(sectionKey, meal);
  }

  function updateBuilderUI() {
    renderMenuSummary(AppState.menu);
    ['starters', 'mains', 'misc', 'desserts'].forEach(key => {
      document.getElementById(`count-${key}`).textContent = `(${AppState.menu[key].length}/5)`;
    });
  }

  function handleSaveFeast() {
    const totalItems = Object.values(AppState.menu).flat().length;
    if (totalItems === 0) {
      alert("You cannot save an empty feast! Please add at least one dish.");
      return;
    }
    const menuToSave = { id: Date.now().toString(), date: new Date().toLocaleDateString(), items: JSON.parse(JSON.stringify(AppState.menu)) };
    addSavedMenu(menuToSave);
    AppState.savedMenus = getSavedMenus();
    renderSavedMenusList(AppState.savedMenus);
    alert('Feast saved successfully!');
    
    AppState.menu = { starters: [], mains: [], misc: [], desserts: [] };
    updateBuilderUI();
  }

  async function shareSpecificMenu(menuItemsObj) {
    const { starters, mains, misc, desserts } = menuItemsObj;
    if (starters.length + mains.length + misc.length + desserts.length === 0) return alert('This menu is empty!');
    let text = '🍽️ Look at the Feast I planned!\n\n';
    if (starters.length) text += '🥗 Starters:\n' + starters.map(i => `- ${i.title}`).join('\n') + '\n\n';
    if (mains.length) text += '🥩 Mains:\n' + mains.map(i => `- ${i.title}`).join('\n') + '\n\n';
    if (misc.length) text += '🍟 Sides:\n' + misc.map(i => `- ${i.title}`).join('\n') + '\n\n';
    if (desserts.length) text += '🍰 Desserts:\n' + desserts.map(i => `- ${i.title}`).join('\n');
    
    if (navigator.share) {
      try { await navigator.share({ title: 'My Feast Menu', text: text }); } catch (err) {}
    } else {
      navigator.clipboard.writeText(text); alert('Menu copied to clipboard!');
    }
  }

  /* --- EVENT LISTENERS --- */
  function attachEventListeners() {
    // Top routing
    document.getElementById('go-home-btn').addEventListener('click', () => {
      document.getElementById('mode-selector').className = 'mode-selector mode-selector--full';
      document.getElementById('quick-view').setAttribute('hidden', '');
      document.getElementById('builder-view').setAttribute('hidden', '');
    });
    
    document.getElementById('btn-mode-quick').addEventListener('click', () => setMode('quick'));
    document.getElementById('btn-mode-builder').addEventListener('click', () => setMode('builder'));

    // Quick Mode Logic
    document.getElementById('filter-category')?.addEventListener('change', (e) => {
       updateQuickModeAreas(e.target.value);
    });

    document.getElementById('search-form')?.addEventListener('submit', (e) => { e.preventDefault(); runSearch(); });
    
    document.getElementById('swipe-container')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.id === 'btn-swipe-dislike') { AppState.currentIndex++; renderSwipeCard(AppState.recipes[AppState.currentIndex]); }
      if (btn.id === 'btn-swipe-like') handleSwipeLike();
    });

    // Builder Mode Logic
    ['starters', 'mains', 'misc', 'desserts'].forEach(key => {
      document.getElementById(`toggle-${key}`)?.addEventListener('change', (e) => {
        document.getElementById(`content-${key}`).hidden = !e.target.checked;
        if (!e.target.checked) {
           AppState.menu[key] = []; updateBuilderUI();
        } else {
           const cat = document.getElementById(`build-cat-${key}`)?.value || (key === 'starters' ? 'Starter' : key === 'desserts' ? 'Dessert' : null);
           loadBuilderSection(key, cat, '');
        }
      });
      document.getElementById(`build-area-${key}`)?.addEventListener('change', (e) => {
        const cat = document.getElementById(`build-cat-${key}`)?.value || (key === 'starters' ? 'Starter' : 'Dessert');
        loadBuilderSection(key, cat, e.target.value);
      });
    });

    document.getElementById('build-cat-mains')?.addEventListener('change', (e) => loadBuilderSection('mains', e.target.value, ''));
    document.getElementById('build-cat-misc')?.addEventListener('change', (e) => loadBuilderSection('misc', e.target.value, ''));

    document.getElementById('builder-view')?.addEventListener('click', (e) => {
      const target = e.target.closest('button') || e.target;
      
      // Swipe actions
      if (target.dataset.action === 'builder-skip') {
        const s = target.dataset.section; AppState.builderIndices[s]++; showNextBuilderCard(s);
      }
      if (target.dataset.action === 'builder-add') {
        const s = target.dataset.section;
        const meal = AppState.builderData[s][AppState.builderIndices[s]];
        if (AppState.menu[s].length >= 5) { alert('Limit 5 items per category.'); return; }
        AppState.menu[s].push({ id: meal.idMeal, title: meal.strMeal });
        updateBuilderUI();
        AppState.builderIndices[s]++; showNextBuilderCard(s);
      }
      if (target.dataset.action === 'remove-builder') {
        AppState.menu[target.dataset.section] = AppState.menu[target.dataset.section].filter(i => i.id !== target.dataset.id); updateBuilderUI();
      }
      
      // Current Feast Open Recipe
      if (target.dataset.action === 'view-recipe' || target.closest('[data-action="view-recipe"]')) {
        const id = target.dataset.id || target.closest('[data-action="view-recipe"]').dataset.id;
        openSavedRecipe(id);
      }
      
      // Saved Feasts actions
      if (target.dataset.action === 'delete-menu') {
        removeSavedMenu(target.dataset.id); AppState.savedMenus = getSavedMenus(); renderSavedMenusList(AppState.savedMenus);
      }
      if (target.dataset.action === 'view-feast') {
        const menu = AppState.savedMenus.find(m => m.id === target.dataset.id);
        if (menu) { renderFeastDetailsModal(menu); openFeastModal(); }
      }
      if (target.dataset.action === 'share-feast') {
        const menu = AppState.savedMenus.find(m => m.id === target.dataset.id);
        if (menu) shareSpecificMenu(menu.items);
      }
    });

    document.getElementById('btn-share-menu')?.addEventListener('click', () => shareSpecificMenu(AppState.menu));
    document.getElementById('btn-save-menu')?.addEventListener('click', handleSaveFeast);

    // Modals Handling
    document.getElementById('recipe-details-modal')?.addEventListener('click', (e) => {
      const tab = e.target.closest('button[data-tab]');
      if (tab) { AppState.activeDetailsTab = tab.dataset.tab; renderRecipeDetailsModal(AppState.currentRecipe, tab.dataset.tab, AppState.isViewingSaved); }
      if (e.target.id === 'btn-details-save') {
        if (AppState.currentRecipe) { addLikedRecipe(AppState.currentRecipe); AppState.likedRecipes = getLikedRecipes(); renderLikedList(AppState.likedRecipes); }
        closeRecipeModal(); AppState.currentIndex++; renderSwipeCard(AppState.recipes[AppState.currentIndex]);
      }
      if (e.target.id === 'btn-details-discard' || e.target.id === 'btn-details-close-view' || e.target.id === 'btn-close-recipe-modal' || e.target.id === 'recipe-modal-backdrop') {
         closeRecipeModal();
         if (!AppState.isViewingSaved && !document.getElementById('quick-view').hidden) {
           AppState.currentIndex++; renderSwipeCard(AppState.recipes[AppState.currentIndex]);
         }
      }
    });

    // Feast Modal
    document.getElementById('feast-details-modal')?.addEventListener('click', (e) => {
      const target = e.target.closest('button') || e.target.closest('[data-action="view-recipe"]');
      if (!target && e.target.id !== 'feast-modal-backdrop') return;
      
      if (e.target.id === 'btn-close-feast-modal' || e.target.id === 'feast-modal-backdrop') {
        closeFeastModal();
      }
      if (target?.id === 'btn-modal-share-feast') {
        const menu = AppState.savedMenus.find(m => m.id === target.dataset.id);
        if (menu) shareSpecificMenu(menu.items);
      }
      if (target?.dataset.action === 'view-recipe') {
        openSavedRecipe(target.dataset.id);
      }
    });

    document.getElementById('liked-list')?.addEventListener('click', (e) => {
      const target = e.target.closest('button') || e.target;
      if (target.dataset.action === 'view-liked') openSavedRecipe(target.dataset.mealId);
      if (target.dataset.action === 'remove') { removeLikedRecipe(target.dataset.mealId); AppState.likedRecipes = getLikedRecipes(); renderLikedList(AppState.likedRecipes); }
    });

    document.getElementById('personal-details-button')?.addEventListener('click', openPersonalDetailsModal);
    document.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closePersonalDetailsModal));
  }

  async function openSavedRecipe(mealId) {
    try {
      const fullMeal = await getRecipeById(mealId);
      if (fullMeal) { AppState.currentRecipe = fullMeal; AppState.activeDetailsTab = 'ingredients'; AppState.isViewingSaved = true; renderRecipeDetailsModal(fullMeal, 'ingredients', true); openRecipeModal(); }
    } catch (err) {}
  }

  document.addEventListener('DOMContentLoaded', init);
})();