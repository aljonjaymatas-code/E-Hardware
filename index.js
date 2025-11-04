// Authentication and User Management
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Update UI based on auth state
function updateAuthUI() {
  // Prefer the more complete header render helper if present. That helper
  // understands both legacy and current storage keys (ehw_user, currentUser)
  // and performs a robust DOM update. Falling back to the old simple
  // behaviour keeps backwards compatibility.
  try{
    if(typeof ensureHeaderAuthRendered === 'function'){
      ensureHeaderAuthRendered();
      return;
    }
  }catch(e){ /* ignore and fall back */ }

  const raw = localStorage.getItem('ehw_user') || localStorage.getItem('currentUser') || localStorage.getItem('user');
  const userMenu = document.getElementById('user-menu');
  const userNameElement = document.querySelector('.user-name');
  try{
    if(!raw){ if(userMenu) userMenu.style.display = 'none'; return; }
    let parsed = null;
    try{ parsed = JSON.parse(raw); }catch(e){ parsed = raw; }
    const first = parsed && (parsed.firstName || parsed.name || parsed.username) ? (parsed.firstName || parsed.name || parsed.username) : parsed;
    if(userMenu) userMenu.style.display = 'inline-block';
    if(userNameElement && first) userNameElement.textContent = String(first).split(/\s+/)[0];
  }catch(e){ if(userMenu) userMenu.style.display = 'none'; }
}



// Handle user menu dropdown
function setupUserMenu() {
    const userToggle = document.getElementById('user-toggle');
    const userDropdown = document.getElementById('user-dropdown');

  if (userToggle && userDropdown) {
    userToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = userToggle.getAttribute('aria-expanded') === 'true';
      userToggle.setAttribute('aria-expanded', !isExpanded);
      userDropdown.setAttribute('aria-hidden', isExpanded);
      userDropdown.style.display = isExpanded ? 'none' : 'block';
    });

    // Delay close on mouseleave
    let closeTimeout = null;
    userDropdown.addEventListener('mouseleave', () => {
      closeTimeout = setTimeout(() => {
        userToggle.setAttribute('aria-expanded', 'false');
        userDropdown.setAttribute('aria-hidden', 'true');
        userDropdown.style.display = 'none';
      }, 2000); // 2 seconds delay
    });
    userDropdown.addEventListener('mouseenter', () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });

    // Close dropdown when clicking outside (immediate)
    document.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target) && e.target !== userToggle) {
        userToggle.setAttribute('aria-expanded', 'false');
        userDropdown.setAttribute('aria-hidden', 'true');
        userDropdown.style.display = 'none';
      }
    });
  }
}

// Handle logout
function setupLogout() {
    const menuLogout = document.getElementById('menu-logout');
    if (menuLogout) {
        menuLogout.addEventListener('click', (e) => {
            e.preventDefault();
  try{ localStorage.removeItem('currentUser'); }catch(_){}
  try{ localStorage.removeItem('ehw_user'); }catch(_){}
  try{ localStorage.removeItem('user'); }catch(_){ }
  try{ localStorage.removeItem('ehw_user_v1'); }catch(_){ }
  try{ localStorage.removeItem('fullname'); }catch(_){ }
  try{ localStorage.removeItem('name'); }catch(_){ }
  // Dispatch events so other parts of the app update immediately
  try{ window.dispatchEvent(new StorageEvent('storage',{ key: 'ehw_user', newValue: null })); }catch(e){}
  try{ window.dispatchEvent(new CustomEvent('ehw_cart_updated')); }catch(e){}
  // Immediately hide any visible cart indicators in the DOM
  try{ document.querySelectorAll('#cart-indicator, .cart-indicator').forEach(el=>{ if(el){ el.textContent=''; el.style.display='none'; } }); }catch(e){}
  try{ if(typeof updateAuthUI === 'function') updateAuthUI(); }catch(e){}
  try{ if(typeof updateIndicator === 'function') updateIndicator(); }catch(e){}
        });
    }
}

// Update cart indicator
function updateCartIndicator() {
    const cartIndicator = document.getElementById('cart-indicator');
    if (cartIndicator) {
    try{
      const cartObj = JSON.parse(localStorage.getItem('ehw_cart_v1') || '{}') || {};
  // show unique items count (distinct products with qty>0)
  const uniqueCount = Object.keys(cartObj).filter(k => cartObj[k] && (cartObj[k].qty || 0) > 0).length || 0;
  cartIndicator.textContent = uniqueCount ? String(uniqueCount) : '';
  cartIndicator.classList.toggle('hidden', uniqueCount === 0);
  cartIndicator.style.display = uniqueCount ? 'inline-block' : 'none';
    }catch(e){
      cartIndicator.textContent = '';
      cartIndicator.classList.add('hidden');
      cartIndicator.style.display = 'none';
    }
    }
}

// Handle contact form submission
function setupContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            // Here you would typically send this data to your server
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }
}

// Smooth scroll for navigation links
function setupSmoothScroll() {
  // Smooth scroll that accounts for the fixed header so the section title isn't hidden
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - headerHeight - 8; // small gap
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });

        // update the URL hash without jumping
        if (history.pushState) {
          history.pushState(null, '', '#' + targetId);
        } else {
          location.hash = '#' + targetId;
        }
      }
    });
  });
}






document.addEventListener("DOMContentLoaded", () => {
  // initialize auxiliary UI behaviors
  try{ setupSmoothScroll(); }catch(e){}
  try{ setupUserMenu(); }catch(e){}
  try{ setupLogout(); }catch(e){}
  try{ setupContactForm(); }catch(e){}
  try{ updateAuthUI(); }catch(e){}
  try{ updateCartIndicator(); }catch(e){}
  const pages = document.querySelectorAll(".product-page");
  const pageLinks = document.querySelectorAll(".pagination .page-link");
  const chevLeft = document.querySelector(".pagination .chev-left");
  const chevRight = document.querySelector(".pagination .chev-right");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  let currentPage = 1;
  const totalPages = pages.length;

  // capture original products order and per-page sizes so we can re-render
  const originalProducts = products.slice();
  const pageElems = Array.from(pages);
  const pageSizes = pageElems.map(p => (p.querySelectorAll('.product-card') || []).length || 0);

  // --- Price-sort persistence helpers (keeps sort when navigating back) ---
  function savePriceSort(val){ try{ sessionStorage.setItem('ehw_price_sort', String(val || 'none')); }catch(e){} }
  function loadPriceSort(){ try{ return sessionStorage.getItem('ehw_price_sort') || 'none'; }catch(e){ return 'none'; } }

  function renderProductsToPages(list) {
    // list: array of product objects
    let idx = 0;
    for (let i = 0; i < pageElems.length; i++) {
      const grid = pageElems[i].querySelector('.product-grid');
      if (!grid) continue;
      const count = pageSizes[i] || 0;
      const slice = list.slice(idx, idx + count);
      idx += count;
      grid.innerHTML = slice.map(p => `
        <div class="product-card">
          <img src="${p.images[0]}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p class="details">${p.description}</p>
          <div class="btn-group">
            <button class="add-cart" data-product-id="${p.id}">Add to Cart</button>
            <button class="view-details" data-product-id="${p.id}">Vi====ew Details</button>
            <button class="buy-now">Buy Now</button>
          </div>
        </div>
      `).join('');
    }
  }

  function sortAllPages(direction) {
    // direction: 'asc' or 'desc'
    const sorted = originalProducts.slice().sort((a,b)=>{
      if (a.price === b.price) return 0;
      return (a.price < b.price ? -1 : 1) * (direction === 'asc' ? 1 : -1);
    });
    renderProductsToPages(sorted);
    // After re-rendering, ensure pagination state is preserved
    showPage(1);
  }

  function restoreGlobalDefault() {
    renderProductsToPages(originalProducts);
    showPage(1);
  }

  function showPage(pageNum, updateHash = true) {
    if (pageNum < 1) pageNum = 1;
    if (pageNum > totalPages) pageNum = totalPages;

    // hide/show correct page
    pages.forEach((page, idx) => {
      page.style.display = idx + 1 === pageNum ? "block" : "none";
    });

    // update active pagination number
    pageLinks.forEach(link => link.classList.remove("active"));
    const activeLink = document.querySelector(`.page-link[href="#page-${pageNum}"]`);
    if (activeLink) activeLink.classList.add("active");

    // update chevrons and buttons
    chevLeft?.classList.toggle("disabled", pageNum === 1);
    chevRight?.classList.toggle("disabled", pageNum === totalPages);
    prevBtn?.classList.toggle("disabled", pageNum === 1);
    nextBtn?.classList.toggle("disabled", pageNum === totalPages);

    currentPage = pageNum;
    if (updateHash) {
      // update the url hash only when requested (prevents auto-scrolling on initial load)
      location.hash = `page-${pageNum}`;
    }
  }

  // --- Numbered links ---
  pageLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const pageNum = parseInt(link.textContent.trim());
      showPage(pageNum);
    });
  });

  // --- Chevrons ---
  chevLeft?.addEventListener("click", e => {
    e.preventDefault();
    if (currentPage > 1) showPage(currentPage - 1);
  });

  chevRight?.addEventListener("click", e => {
    e.preventDefault();
    if (currentPage < totalPages) showPage(currentPage + 1);
  });

  // --- Prev / Next buttons ---
  prevBtn?.addEventListener("click", e => {
    e.preventDefault();
    if (currentPage > 1) showPage(currentPage - 1);
  });

  nextBtn?.addEventListener("click", e => {
    e.preventDefault();
    if (currentPage < totalPages) showPage(currentPage + 1);
  });

  // --- Initial load ---
  const match = location.hash.match(/page-(\d+)/);
  const initPage = match ? parseInt(match[1]) : 1;
  // If the URL already contains a page hash, respect it and keep/update the hash.
  // Otherwise, don't set the hash on initial render to avoid the browser auto-scrolling to the product page element.
  showPage(initPage, !!match);

  // If the initial URL contains a non-pagination hash (e.g. #Product), override the
  // browser's automatic jump by resetting to the top and then scrolling to the
  // section heading after a tiny delay. This is more reliable across browsers and
  // ensures the H1 is visible under the fixed header.
  if (location.hash && !match) {
    const targetId = location.hash.slice(1);
    // reset any browser jump first
    try { window.scrollTo(0, 0); } catch (e) {}
    // small timeout to allow layout finishes (images/fonts) then compute offset
    setTimeout(() => {
      const section = document.getElementById(targetId);
      if (!section) return;
      const heading = section.querySelector('h1, h2, h3') || section;
      const header = document.querySelector('.header');
      const headerHeight = header ? header.offsetHeight : 0;
      const rect = heading.getBoundingClientRect();
      const scrollTop = window.pageYOffset + rect.top - headerHeight - 8;
      window.scrollTo({ top: scrollTop, behavior: 'auto' });
      try { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); } catch (e) {}
    }, 60);
  }

  

  // --- CATEGORY FILTER (by page) ---
  const sortSelect = document.getElementById("sort");
  let currentCategory = 'All';

  function filterProductsByCategory(category) {
    currentCategory = category || 'All';
    const norm = String(currentCategory).toLowerCase();

    // show only pages whose data-category matches the selected category
    const visiblePages = Array.from(pages).filter(page => {
      const pageCategory = (page.getAttribute('data-category') || 'All').toLowerCase();
      const match = (norm === 'all' || pageCategory === norm);
      page.style.display = match ? 'block' : 'none';
      return match;
    });

    // If we have visible pages, navigate to the first one (uses original page numbering)
    if (visiblePages.length) {
      const firstId = visiblePages[0].id; // e.g. "page-2"
      const pageNum = parseInt(firstId.replace('page-', ''), 10);
      showPage(pageNum);
    } else {
      // nothing matched: hide all and clear hash
      pages.forEach(p => p.style.display = 'none');
      location.hash = '';
    }
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      filterProductsByCategory(sortSelect.value);
    });
  }

  // Price sort (global across all pages)
  const priceSortGlobal = document.getElementById('price-sort');
  if (priceSortGlobal) {
    priceSortGlobal.addEventListener('change', function(){
      const v = this.value;
      // persist user selection so Back navigation can restore it
      savePriceSort(v);
      if (v === 'high-to-low') sortAllPages('desc');
      else if (v === 'low-to-high') sortAllPages('asc');
      else restoreGlobalDefault();
    });
    // Restore previously selected sort (if any) and apply it. Use sessionStorage so it survives Back/Forward navigation.
    const _saved = loadPriceSort();
    if (_saved && priceSortGlobal.value !== _saved) {
      priceSortGlobal.value = _saved;
      if (_saved === 'high-to-low') sortAllPages('desc');
      else if (_saved === 'low-to-high') sortAllPages('asc');
      else restoreGlobalDefault();
    }
  }

  // Expose helpers for other scripts or inline handlers
  window.filterProductsByCategory = filterProductsByCategory;
  window.viewCategoryPage = function(category){
    if (sortSelect) sortSelect.value = category;
    filterProductsByCategory(category);
  };
});


// Login & Register

// Enhanced header behaviour: accessible user menu (class-based open/close)
document.addEventListener('DOMContentLoaded', function(){
  try{
    const regLink = document.getElementById('register-link');
    const loginText = document.getElementById('login-text');
    const userMenu = document.getElementById('user-menu');
    const userToggle = document.getElementById('user-toggle');
    const userDropdown = document.getElementById('user-dropdown');
    const menuProfile = document.getElementById('menu-profile');
    const menuPurchase = document.getElementById('menu-purchase');
    const menuLogout = document.getElementById('menu-logout');

    // Helper: set tabindex for menu items
    function setMenuTabIndex(val){
      [menuProfile, menuPurchase, menuLogout].forEach(i => { if(i) i.tabIndex = val; });
    }

    // Populate register link text only when an authenticated user is present.
    // This prevents legacy keys (e.g. 'fullname' or 'name') from being shown
    // in the header for guests after logout.
    try{
      const authRaw = localStorage.getItem('ehw_user') || localStorage.getItem('currentUser') || localStorage.getItem('user');
      if(authRaw){
        let fullname = null;
        try{
          const parsed = JSON.parse(authRaw);
          if(parsed && typeof parsed === 'object') fullname = parsed.firstName || parsed.name || parsed.fullname || parsed.fullName || parsed.username || null;
          else if(typeof authRaw === 'string') fullname = authRaw;
        }catch(e){ fullname = authRaw; }
        if(fullname && regLink){ const first = String(fullname).trim().split(/\s+/)[0]; if(first) regLink.textContent = first; }
      }
    }catch(e){ /* ignore */ }

    // decide UI for logged-in vs guest
    try{
      const raw = localStorage.getItem('ehw_user') || localStorage.getItem('currentUser') || localStorage.getItem('user');
      if(raw){
          let u = null;
          try{ u = JSON.parse(raw); }catch(e){ u = raw; }
          // hide simple login/register anchors
          if(loginText) loginText.style.display = 'none';
          if(regLink) regLink.style.display = 'none';
          // show user menu
          if(userMenu){
            userMenu.style.display = 'inline-block';
            const first = (u && (u.firstName || u.name || u.username) ? (u.firstName || u.name || u.username) : (typeof u === 'string' ? u : 'hi')).toString().trim().split(/\s+/)[0] || 'hi';
            if(userToggle){
              // Update the username text node and avatar initial without destroying the caret icon
              const nameSpan = userToggle.querySelector('.user-name');
              const avatarEl = userToggle.querySelector('.user-avatar');
              const caret = userToggle.querySelector('.fa-caret-down');
              if(nameSpan) nameSpan.textContent = first;
              if(avatarEl){
                // remove font-icon classes (if present) and show initial letter
                avatarEl.classList.remove('fa','fa-user');
                avatarEl.textContent = first.charAt(0).toUpperCase();
                avatarEl.setAttribute('aria-hidden', 'true');
              }
              // ensure caret remains the visible caret icon
              if(caret) caret.setAttribute('aria-hidden','true');
              userToggle.setAttribute('aria-expanded','false');
            }
            if(userDropdown) userDropdown.setAttribute('aria-hidden','true');
            setMenuTabIndex(-1);
          }
        } else {
        // guest: show Login/Register, hide user menu
        if(loginText){ loginText.setAttribute('href','Login.html'); loginText.textContent = 'Login'; loginText.style.cursor = 'pointer'; loginText.style.display = 'inline-block'; }
        if(regLink){ regLink.setAttribute('href','Register.html'); regLink.textContent = 'Register'; regLink.style.display = 'inline-block'; }
        if(userMenu) userMenu.style.display = 'none';
      }
    }catch(e){ /* ignore */ }

    // open/close functions
    function openUserMenu(){
      if(!userMenu) return;
      userMenu.classList.add('open');
      if(userDropdown) userDropdown.setAttribute('aria-hidden','false');
      if(userToggle) userToggle.setAttribute('aria-expanded','true');
      setMenuTabIndex(0);
    }
    function closeUserMenu(){
      if(!userMenu) return;
      userMenu.classList.remove('open');
      if(userDropdown) userDropdown.setAttribute('aria-hidden','true');
      if(userToggle) userToggle.setAttribute('aria-expanded','false');
      setMenuTabIndex(-1);
    }

    // Click/tap toggling for touch devices
    if(userToggle){
      userToggle.addEventListener('click', function(e){
        e.preventDefault();
        if(userMenu.classList.contains('open')) closeUserMenu(); else openUserMenu();
      });

      // keyboard support: Enter/Space opens, Escape closes, ArrowDown focuses first item
      userToggle.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openUserMenu(); if(menuProfile) menuProfile.focus(); }
        if(e.key === 'ArrowDown'){ e.preventDefault(); openUserMenu(); if(menuProfile) menuProfile.focus(); }
        if(e.key === 'Escape'){ closeUserMenu(); userToggle.focus(); }
      });
    }

    // Hover for pointer devices
    if(userMenu){
      userMenu.addEventListener('mouseenter', function(){ openUserMenu(); });
      userMenu.addEventListener('mouseleave', function(){ closeUserMenu(); });
    }

    // close dropdown when clicking outside
    document.addEventListener('click', function(e){ try{ if(userMenu && !userMenu.contains(e.target)){ closeUserMenu(); } }catch(e){} });

    // Logout
    if(menuLogout){
      menuLogout.addEventListener('click', function(e){
        e.preventDefault();
  try{ localStorage.removeItem('ehw_user'); }catch(err){}
  try{ localStorage.removeItem('currentUser'); }catch(err){}
  try{ localStorage.removeItem('user'); }catch(err){}
  try{ localStorage.removeItem('ehw_user_v1'); }catch(err){}
  try{ localStorage.removeItem('fullname'); }catch(err){}
  try{ localStorage.removeItem('name'); }catch(err){}
        try{ window.dispatchEvent(new StorageEvent('storage',{ key: 'ehw_user', newValue: null })); }catch(e){}
        try{ window.dispatchEvent(new CustomEvent('ehw_cart_updated')); }catch(e){}
        try{ document.querySelectorAll('#cart-indicator, .cart-indicator').forEach(el=>{ if(el){ el.textContent=''; el.style.display='none'; } }); }catch(e){}
        try{ if(typeof updateAuthUI === 'function') updateAuthUI(); }catch(e){}
        try{ if(typeof updateIndicator === 'function') updateIndicator(); }catch(e){}
      });
    }

  }catch(e){ /* ignore */ }
});




// cart.js - unified cart script with simple auth checks
(function(){
  const STORAGE_KEY = 'ehw_cart_v1';
  const UPDATE_KEY = 'ehw_cart_v1_last_update';

  function isLoggedIn(){
    // Consider any known auth storage keys as evidence of a logged-in user.
    try{
      const raw = localStorage.getItem('ehw_user') || localStorage.getItem('currentUser') || localStorage.getItem('user');
      if(!raw) return false;
      try{ const parsed = JSON.parse(raw); return !!(parsed && (parsed.firstName || parsed.name || parsed.email || parsed.username)); }
      catch(e){ return true; }
    }catch(e){
      return !!(localStorage.getItem('ehw_user') || localStorage.getItem('currentUser') || localStorage.getItem('user'));
    }
  }

  function readCart(){
    try{
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      // lightweight normalization: numeric keys like '1' -> 'product-1' where possible
      const normalized = {};
      Object.keys(raw).forEach(k => {
        try{
          if(/^\d+$/.test(k)){
            const pid = Number(k);
            const prod = (typeof products !== 'undefined' && Array.isArray(products)) ? products.find(p => p.id === pid) : null;
            if(prod){
              normalized[`product-${pid}`] = raw[k];
              return;
            }
          }
          // preserve existing product-<id> keys and others
          normalized[k] = raw[k];
        }catch(e){ normalized[k] = raw[k]; }
      });
      return normalized;
    }catch(e){ return {}; }
  }
  function writeCart(cart){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); localStorage.setItem(UPDATE_KEY, Date.now()); }catch(e){} }
  function writeCart(cart){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      localStorage.setItem(UPDATE_KEY, Date.now());
      // dispatch both storage and custom events so same-tab listeners and
      // pages restored from bfcache update promptly
      try{ window.dispatchEvent(new StorageEvent('storage',{ key: STORAGE_KEY, newValue: JSON.stringify(cart) })); }catch(e){}
      try{ window.dispatchEvent(new CustomEvent('ehw_cart_updated')); }catch(e){}
    }catch(e){}
  }

  function updateIndicator(){
    const indicator = document.getElementById('cart-indicator');
    if(!indicator) return;


    // If user is not logged in, hide the indicator entirely
    if(!isLoggedIn()){
      indicator.textContent = '';
      indicator.style.display = 'none';
      return;
    }
    const cart = readCart();
    // show unique count (number of distinct items with qty>0)
    const unique = Object.keys(cart).filter(k => cart[k] && (cart[k].qty || 0) > 0).length || 0;
    indicator.textContent = unique ? String(unique) : '';
    indicator.style.display = unique ? 'inline-block' : 'none';
  }

  //Please login or register to add items to cart
  function getToast1(){
    let t = document.getElementById('ehw-toast');
    if(!t){ t = document.createElement('div'); t.id = 'ehw-toast'; Object.assign(t.style,{ position:'fixed',right:'2px',top:'9%',padding:'10px 14px',background:'#bd2020ff',color:'#fff',borderRadius:'6px',opacity:'0',transition:'opacity 250ms ease-in-out',zIndex:9999 }); document.body.appendChild(t); }
    return t;
  }
  //Added to cart = Green ;
  function getToast2(){
    let t = document.getElementById('ehw-toast');
    if(!t){ t = document.createElement('div'); t.id = 'ehw-toast'; Object.assign(t.style,{ position:'fixed',right:'2px',top:'9%',padding:'10px 14px',background:'#228529ff',color:'#fff',borderRadius:'6px',opacity:'0',transition:'opacity 250ms ease-in-out',zIndex:9999 }); document.body.appendChild(t); }
    return t;
  }
  //Is Already in your cart = orange
  function getToast3(){
    let t = document.getElementById('ehw-toast');
    if(!t){ t = document.createElement('div'); t.id = 'ehw-toast'; Object.assign(t.style,{ position:'fixed',right:'2px',top:'9%',padding:'10px 14px',background:'#cd7a15ff',color:'#fff',borderRadius:'6px',opacity:'0',transition:'opacity 250ms ease-in-out',zIndex:9999 }); document.body.appendChild(t); }
    return t;
  }

  function showToast1(text){
    const t = getToast1();
    // ensure red background for login prompt
    try{ t.style.background = '#bd2020ff'; t.style.color = '#fff'; }catch(e){}
    t.textContent = text;
    requestAnimationFrame(()=>{ t.style.opacity = '1'; });
    clearTimeout(t._hid);
    t._hid = setTimeout(()=>{ t.style.opacity = '0'; },5000);
  }
  function showToast2(text){
    const t = getToast2();
    // ensure green background for added-to-cart
    try{ t.style.background = '#228529ff'; t.style.color = '#fff'; }catch(e){}
    t.textContent = text;
    requestAnimationFrame(()=>{ t.style.opacity = '1'; });
    clearTimeout(t._hid);
    t._hid = setTimeout(()=>{ t.style.opacity = '0'; },5000);
  }
  function showToast3(text){
    const t = getToast3();
    // ensure orange background for duplicate notification
    try{ t.style.background = '#e8561cff'; t.style.color = '#1b1b1b'; }catch(e){}
    t.textContent = text;
    requestAnimationFrame(()=>{ t.style.opacity = '1'; });
    clearTimeout(t._hid);
    t._hid = setTimeout(()=>{ t.style.opacity = '0'; },5000);
  }


  function addItemFromButton(btn){
    if(!isLoggedIn()){
      showToast1('Please login or register to add items to cart');
      return;
    }
    const card = btn.closest('.product-card'); if(!card) return;
    let name = (card.querySelector('h3') && card.querySelector('h3').textContent.trim()) || 'Item';
    let imgEl = card.querySelector('img'); let image = imgEl ? (imgEl.getAttribute('src') || '') : '';
    let priceText = (card.querySelector('.price') && card.querySelector('.price').textContent.trim()) || '';
    const cart = readCart();

    // Prefer explicit product id (rendered into the card) when present
    let resolvedKey = null;
    try{
      if(btn.dataset && btn.dataset.productId){
        const pid = Number(btn.dataset.productId);
        if(!Number.isNaN(pid)){
          const prod = (typeof products !== 'undefined' && Array.isArray(products)) ? products.find(p => p.id === pid) : null;
          if(prod){
            resolvedKey = `product-${pid}`;
            // canonicalize values from product data
            priceText = prod.price;
            image = prod.images && prod.images[0] ? prod.images[0] : image;
            name = prod.name || name;
          }
        }
      }
    }catch(e){ /* ignore */ }

    // Try to map this card back to a product id from the products array (fallback)
    try{
      if(!resolvedKey){
        const matched = products.find(p => String(p.name).trim() === name.trim());
        if(matched && typeof matched.id !== 'undefined'){
          resolvedKey = `product-${matched.id}`;
        }
      }
    }catch(e){ /* ignore */ }

    // try matching by image filename (some static cards use slightly different titles)
    if(!resolvedKey && image){
      try{
        const file = image.split('/').pop();
        const matchedByImg = products.find(p => p.images && p.images[0] && p.images[0].split('/').pop() === file);
        if(matchedByImg && typeof matchedByImg.id !== 'undefined'){
          resolvedKey = `product-${matchedByImg.id}`;
        }
      }catch(e){ /* ignore */ }
    }

    // fallback key (legacy / for non-standard cards)
    if(!resolvedKey){
      // normalize price to numeric where possible
      let numericPrice = null;
      try{ const n = Number(String(priceText).replace(/[^0-9.-]+/g,'')); if(!Number.isNaN(n)) numericPrice = n; }catch(e){}
      const keyFallback = name + '|' + (priceText || image || Math.random().toString(36).slice(2,6));
      resolvedKey = keyFallback;
      cart[resolvedKey] = { name, image, price: (numericPrice !== null ? numericPrice : priceText), qty: 1 };
      writeCart(cart); updateIndicator(); showToast2('Added to cart — ' + name);
      return;
    }

    if (cart[resolvedKey]){
      // already added -> notify and do not increase quantity
      showToast3(name + ' is already in your cart');
      try{ updateIndicator(); }catch(e){}
      return;
    }

    // If we resolved a product id, prefer numeric price (from products array) and canonical image
    let finalPrice = null;
    try{ const prod = (typeof products !== 'undefined' && Array.isArray(products)) ? products.find(p => `product-${p.id}` === resolvedKey) : null; if(prod) finalPrice = prod.price; }catch(e){}
    if(finalPrice === null){
      try{ const n = Number(String(priceText).replace(/[^0-9.-]+/g,'')); if(!Number.isNaN(n)) finalPrice = n; }catch(e){}
      if(finalPrice === null) finalPrice = priceText;
    }

    cart[resolvedKey] = { name, image, price: finalPrice, qty: 1 };
    writeCart(cart); updateIndicator(); showToast2('Added to cart — ' + name);
  }

  function findProductInfoFromCard(btn){ const card = btn.closest('.product-card'); if(!card) return null; const img = card.querySelector('img') ? card.querySelector('img').getAttribute('src') : ''; const title = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : ''; const priceEl = card.querySelector('.price'); const price = priceEl ? priceEl.textContent.trim() : ''; return { id: title + '|' + img, name: title, price, image: img }; }

  // central click handler: add-to-cart, and block view/buy for guests
  document.addEventListener('click', function(e){
    try{
      // Block cart icon for guests
      const cartLink = e.target.closest && e.target.closest('.cart-container, #cart-link');
      if(cartLink){
        if(!isLoggedIn()){
          e.preventDefault();
          showToast1('Please login or register to view your cart');
          return;
        }
        // allow default for logged-in users (link will navigate)
      }
      const addBtn = e.target.closest && e.target.closest('.add-cart');
      if (addBtn) {
        // If this button has an inline onclick attribute, prefer that (prevents double-calls
        // when both inline onclick and delegated handler exist). Otherwise use delegated handler.
        try {
          if (addBtn.hasAttribute && addBtn.hasAttribute('onclick')) {
            // allow the inline onclick to run; don't call delegated handler
            return;
          }
        } catch (e) { /* ignore and fall back to delegated handler */ }

        e.preventDefault();
        addItemFromButton(addBtn);
        return;
      }

      const actionBtn = e.target.closest && e.target.closest('.view-details, .buy-now');
      if(actionBtn){
        if(!isLoggedIn()){
          e.preventDefault();
          showToast1('Please login or register to view or buy items');
          return;
        }
        // allow default behaviour for logged-in users (onclick handlers will run)
      }
    }catch(err){ /* ignore */ }
  });

  // initialize indicator on DOM ready and listen for cross-tab updates and login changes
  document.addEventListener('DOMContentLoaded', function(){
    updateIndicator();
    window.addEventListener('storage', function(e){
      try{
        if(!e.key) return;
        if(e.key === UPDATE_KEY) updateIndicator();
        if(e.key === 'ehw_user'){
          try{ if(typeof updateAuthUI === 'function') updateAuthUI(); }catch(err){}
          try{ updateIndicator(); }catch(err){}
        }
      }catch(err){}
    });
  });

  // delegated quick-buy: if a .buy-now button is clicked and it has no inline onclick,
  // create a single-item purchase and redirect to purchases page.
  document.addEventListener('click', function(e){
    try{
      const btn = e.target.closest && e.target.closest('.buy-now');
      if(!btn) return;
      // if element defines an inline onclick handler, prefer that (avoid double-run)
      try{ if (btn.hasAttribute && btn.hasAttribute('onclick')) return; }catch(e){ }

      e.preventDefault();
      if(!isLoggedIn()){
        if(window.showToast1) return window.showToast1('Please login or register to view or buy items');
        return alert('Please login or register to view or buy items');
      }

      const info = findProductInfoFromCard(btn) || { name: 'Item', price: 0, image: '' };
      // attempt to save purchase immediately
      try{
        if (window.savePurchaseFromSingle && typeof window.savePurchaseFromSingle === 'function'){
          window.savePurchaseFromSingle({ key: info.id || info.name, name: info.name, image: info.image, price: Number(info.price)||0, qty: 1 }, { status: 'To Pay' });
          if (window.showToast2) window.showToast2('Purchase saved — view it in My Purchase');
          else alert('Purchase saved — view it in My Purchase');
          setTimeout(()=>{ window.location.href = 'account.html#purchase'; }, 350);
          return;
        }
      }catch(err){ /* fall through to default behaviour */ }
    }catch(err){ /* ignore */ }
  });

})();

// --- Cross-page / same-window cart update helpers ---
// Notify any indicator updater on this window/tab. Some pages expose either
// `updateCartIndicator` or `updateIndicator` (different scopes). Call both if present.
function ehw_notify_cart_listeners(){
  try{ if(typeof updateCartIndicator === 'function') updateCartIndicator(); }catch(e){}
  try{ if(typeof updateIndicator === 'function') updateIndicator(); }catch(e){}
  try{ if(typeof updateAuthUI === 'function') updateAuthUI(); }catch(e){}
}

// React to custom event and to visibility/navigation events so pages restored from
// history/back/forward update their UI immediately.
window.addEventListener('ehw_cart_updated', function(){ ehw_notify_cart_listeners(); });
window.addEventListener('storage', function(e){ if(!e.key) return; if(e.key === 'ehw_cart_v1' || e.key === 'ehw_cart_v1_last_update' || e.key === 'ehw_user') ehw_notify_cart_listeners(); });
window.addEventListener('pageshow', function(){ ehw_notify_cart_listeners(); });
document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'visible') ehw_notify_cart_listeners(); });
window.addEventListener('popstate', function(){ ehw_notify_cart_listeners(); });

// -- Purchases helpers (save orders to localStorage)
(function(){
  const PURCHASES_KEY = 'ehw_purchases_v1';
  function readPurchases(){ try{ return JSON.parse(localStorage.getItem(PURCHASES_KEY)) || []; }catch(e){ return []; } }
  function writePurchases(arr){ try{ localStorage.setItem(PURCHASES_KEY, JSON.stringify(arr)); window.dispatchEvent(new CustomEvent('ehw_purchases_updated')); }catch(e){} }
  function genOrderId(){ return 'ORD-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,6); }

  // Save a purchase built from an items map or single-item map
  window.savePurchaseFromItems = function(itemsMap, opts){
    // itemsMap: { key: { name, image, price, qty } }
    const purchases = readPurchases();
    const items = Object.keys(itemsMap).map(k => Object.assign({ key:k }, itemsMap[k]));
    const subtotal = items.reduce((s,i)=> s + ((Number(i.price)||0) * (Number(i.qty)||0)), 0);
    const itemCount = items.reduce((s,i)=> s + (Number(i.qty)||0), 0);
    const shipping = itemCount ? 120 : 0;
    const total = subtotal + shipping;
    let user = null;
    try{ user = JSON.parse(localStorage.getItem('ehw_user')) || null; }catch(e){ user = null; }

    const order = {
      id: genOrderId(),
      createdAt: new Date().toISOString(),
      items, subtotal, shipping, total, itemCount,
      user: user ? { firstName: user.firstName || user.name || user.email, email: user.email } : null,
      status: (opts && opts.status) || 'To Pay',
      meta: opts && opts.meta || {}
    };

    purchases.unshift(order);
    writePurchases(purchases);
    return order;
  };

  // convenience: save single-item object { key,name,image,price,qty }
  window.savePurchaseFromSingle = function(singleItem, opts){
    const map = {};
    const key = singleItem.key || (singleItem.id ? String(singleItem.id) : (singleItem.name || 'item') + '|' + (singleItem.price||0));
    map[key] = { name: singleItem.name, image: singleItem.image, price: Number(singleItem.price)||0, qty: Number(singleItem.qty)||1 };
    return window.savePurchaseFromItems(map, opts);
  };
})();


// Normalize legacy inline onclicks created by templates: convert
// addToCart(123) -> data-product-id="123" so delegated handlers work
document.addEventListener('DOMContentLoaded', function(){
  try{
    document.querySelectorAll('.add-cart').forEach(btn => {
      try{
        if(btn.hasAttribute && btn.hasAttribute('onclick')){
          const v = btn.getAttribute('onclick') || '';
          const m = v.match(/addToCart\s*\(\s*(\d+)\s*\)/);
          if(m){ btn.removeAttribute('onclick'); btn.dataset.productId = m[1]; return; }
        }
        // If button has no explicit product id, attempt to resolve from nearby title
        if(!btn.dataset.productId){
          const card = btn.closest && btn.closest('.product-card');
          if(card){
            const title = card.querySelector && card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : '';
            if(title){
              try{ const prod = (typeof products !== 'undefined' && Array.isArray(products)) ? products.find(p => String(p.name).trim() === title) : null; if(prod) btn.dataset.productId = prod.id; }catch(e){}
            }
          }
        }
      }catch(e){}
    });
  }catch(e){}
});

// When this script writes the cart directly in other places it already dispatches
// a StorageEvent — but some handlers may not see it (bfcache/history). Ensure
// we also dispatch the custom event from add-to-cart implementations. We also
// expose a small helper to dispatch from other scripts if needed.
function ehw_dispatch_cart_update(){
  try{ window.dispatchEvent(new CustomEvent('ehw_cart_updated')); }catch(e){}
  try{ window.dispatchEvent(new StorageEvent('storage',{ key: 'ehw_cart_v1', newValue: localStorage.getItem('ehw_cart_v1') })); }catch(e){}
}

// Minimal, non-invasive safeguard: ensure header user menu is rendered when a user is present.
// This runs in addition to existing updateAuthUI to cover cases where the header didn't re-render.
function ensureHeaderAuthRendered(){
  try{
    const raw = localStorage.getItem('ehw_user') || localStorage.getItem('currentUser') || localStorage.getItem('user');
    const userMenu = document.getElementById('user-menu');
    const loginText = document.getElementById('login-text');
    const regLink = document.getElementById('register-link');
    const userToggle = document.getElementById('user-toggle');
    if(!raw){
      // guest: ensure login/register visible, reset texts, and hide user menu
      if(loginText){ loginText.style.display = 'inline-block'; loginText.setAttribute('href','Login.html'); loginText.textContent = 'Login'; loginText.style.cursor = 'pointer'; }
      if(regLink){ regLink.style.display = 'inline-block'; regLink.setAttribute('href','Register.html'); regLink.textContent = 'Register'; }
      if(userMenu) userMenu.style.display = 'none';
      return;
    }
    // if we have a user, try to show the menu
    let parsed = null;
    try{ parsed = JSON.parse(raw); }catch(e){ parsed = raw; }
    const first = (parsed && (parsed.firstName || parsed.name || parsed.fullName)) ? String(parsed.firstName || parsed.name || parsed.fullName).split(/\s+/)[0] : null;
    if(userMenu) userMenu.style.display = 'inline-block';
    if(loginText) loginText.style.display = 'none';
    if(regLink) regLink.style.display = 'none';
    if(userToggle){
      const nameSpan = userToggle.querySelector('.user-name');
      const avatarEl = userToggle.querySelector('.user-avatar');
      if(nameSpan && first) nameSpan.textContent = first;
      if(avatarEl && first){ avatarEl.textContent = first.charAt(0).toUpperCase(); avatarEl.classList.remove('fa','fa-user'); }
    }
  }catch(e){ /* no-op */ }
}

// Ensure the mini-cart indicators are hidden for guests. Some pages update the
// badge independently; this central guard enforces the rule in one place.
function ensureIndicatorVisibility(){
  try{
    const logged = (function(){ try{ return !!(localStorage.getItem('ehw_user')||localStorage.getItem('currentUser')||localStorage.getItem('user')); }catch(e){ return false; } })();
    if(!logged){
      document.querySelectorAll('#cart-indicator, .cart-indicator').forEach(el=>{ try{ el.textContent=''; el.style.display='none'; }catch(e){} });
    } else {
      try{ if(typeof updateIndicator === 'function') updateIndicator(); }catch(e){}
    }
  }catch(e){}
}

// Wire the guard to common cross-tab and navigation signals
window.addEventListener('ehw_cart_updated', ensureIndicatorVisibility);
window.addEventListener('storage', function(e){ try{ if(e && (e.key === 'ehw_user' || e.key === null)) ensureIndicatorVisibility(); }catch(e){} });
document.addEventListener('DOMContentLoaded', ensureIndicatorVisibility);
window.addEventListener('pageshow', ensureIndicatorVisibility);

// Run this on common events so the header reliably shows the user UI when logged in.
document.addEventListener('DOMContentLoaded', ensureHeaderAuthRendered);
window.addEventListener('pageshow', ensureHeaderAuthRendered);
window.addEventListener('ehw_cart_updated', ensureHeaderAuthRendered);
window.addEventListener('storage', function(e){ if(e && e.key === 'ehw_user') ensureHeaderAuthRendered(); });


// Product Page




const products = [
  {
    id: 1,
    name: "Hammer",
    price: 1899,
    description: "Used for driving nails, fitting parts, and breaking objects apart.",
    rating: "5.0",
    sold: "45",
    available: 4,
    images: ["hand-tools/hammer.jpg"]
  },
  {
    id: 2,
    name: "Flat Crewdriver",
    price: 599,
    description: "Has a flat tip; used for turning screws with a straight, slotted head.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/flat.jpg"]
  },

  {
    id: 3,
    name: "Stars Crewdriver",
    price: 599,
    description: "Features a cross-shaped tip; fits screws with a cross slot.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/star.jpg"]
  },

  {
    id: 4,
    name: "Adjustable Wrench",
    price: 599,
    description: "A versatile wrench with a movable jaw for gripping different bolt sizes.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/adjustatble.jpg"]
  },

  {
    id: 5,
    name: "Pliers",
    price: 599,
    description: "Used for gripping, bending, or cutting wires and other materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Pliers.webp"]
  },

  {
    id: 6,
    name: "Measuring Tape",
    price: 1200,
    description: "A retractable ruler used for measuring length, width, or height of objects.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Measuring Tape.jpg"]
  },

  {
    id: 7,
    name: "Utility Knife",
    price: 900,
    description: "A sharp, retractable blade used for cutting materials like cardboard or plastic.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Utility Knife.jpg"]
  },

  {
    id: 8,
    name: "Spirit Level",
    price: 599,
    description: "Used to check if surfaces are level (horizontal) or plumb (vertical).",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Spirit Level.jpg"]
  },

  {
    id: 9,
    name: "Chisel",
    price: 599,
    description: "A sharp-edged hand tool used for carving or cutting hard materials like wood or metal.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Chisel.jpg"]
  },

  {
    id: 10,
    name: "Allen Key(Hex Key)",
    price: 599,
    description: "A small L-shaped tool used to drive bolts and screws with hexagonal sockets.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Allen Key(Hex Key).jpg"]
  },

  {
    id: 11,
    name: "Hand Saw",
    price: 599,
    description: "Used for manually cutting wood, plastic, or metal.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Hand Saw.jpg"]
  },

  {
    id: 12,
    name: "Wire Cutter",
    price: 599,
    description: "Designed for cutting electrical wires or small metal cables.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Wire Cutter.jpg"]
  },

  {
    id: 13,
    name: "File",
    price: 599,
    description: "A rough-surfaced tool used to smooth, shape, or remove small amounts of material.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/File.jpg"]
  },

  {
    id: 14,
    name: "Nail Set/Punch",
    price: 599,
    description: "Used to drive the head of a nail below the surface of the wood.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Nail Set_Punch..jpg"]
  },

  {
    id: 15,
    name: "Small Brush",
    price: 599,
    description: "Used to clean tools, surfaces, or apply finishing materials in small areas.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/paint-brush.jpg"]
  },

  {
    id: 16,
    name: "Duct Tape",
    price: 599,
    description: "A strong, multipurpose adhesive tape used for repairs, sealing, or binding materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Duct Tape.jpg"]
  },

  {
    id: 17,
    name: "Mallet",
    price: 599,
    description: "A hammer with a rubber or wooden head used to strike without damaging the surface.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Mallet.jpg"]
  },

  {
    id: 18,
    name: "Scissors",
    price: 599,
    description: "Used for cutting paper, fabric, or thin materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Scissors.jpg"]
  },

  {
    id: 19,
    name: "Ruler",
    price: 599,
    description: "A straight-edged measuring tool for drawing lines or measuring short distances.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Ruler.jpg"]
  },

  {
    id: 20,
    name: "Toolbox",
    price: 599,
    description: "A container used to organize, carry, and protect hand tools and small hardware.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["hand-tools/Toolbox.jpg"]
  },


// Page 2

  {
    id: 21,
    name: "Electric Drill",
    price: 599,
    description: "A powerful tool used for drilling holes in various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Electric Drill.jpg"]
  },

  {
    id: 22,
    name: "Cordless Drill",
    price: 599,
    description: "A portable drill powered by a rechargeable battery for convenience.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Cordless Drill.jpg"]
  },

  {
    id: 23,
    name: "Angle Grinder",
    price: 599,
    description: "A versatile tool used for cutting, grinding, and polishing various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Angle Grinder.jpg"]
  },

  {
    id: 24,
    name: "Circular Saw",
    price: 599,
    description: "A powerful tool used for making straight cuts in wood, metal, or other materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Circular Saw.jpg"]
  },

  {
    id: 25,
    name: "Jigsaw",
    price: 599,
    description: "A versatile tool used for making intricate cuts in wood, metal, or other materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Jigsaw.jpg"]
  },

  {
    id: 26,
    name: "Sander",
    price: 599,
    description: "A power tool used for smoothing surfaces by abrasion with sandpaper.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Sander.png"]
  },
  {
    id: 27,
    name: "Heat Gun",
    price: 599,
    description: "A tool used to apply heat to various materials for bending, shaping, or removing paint.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Heat Gun.jpg"]
  },
  {
    id: 28,
    name: "Rotary Tool",
    price: 599,
    description: "A versatile tool used for cutting, grinding, and polishing various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Rotary Tool.jpg"]
  },
  {
    id: 29,
    name: "Impact Driver",
    price: 599,
    description: "A tool designed to deliver high torque output with minimal exertion.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Impact Driver.jpg"]
  },
  {
    id: 30,
    name: "Electric Screwdriver",
    price: 599,
    description: "A tool used for driving screws with precision and ease.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Electric Screwdriver.jpg"]
  },
  {
    id: 31,
    name: "Air Compressor",
    price: 599,
    description: "A powerful tool used for inflating tires, powering pneumatic tools, and other applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Air Compressor.jpg"]
  },
  {
    id: 32,
    name: "Nail Gun",
    price: 599,
    description: "A tool used for driving nails into various materials with precision and speed.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Nail Gun.jpg"]
  },
  {
    id: 33,
    name: "Power Washer",
    price: 599,
    description: "A powerful tool used for cleaning surfaces with high-pressure water.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Power Washer.jpg"]
  },
  {
    id: 34,
    name: "Electric Cutter",
    price: 599,
    description: "A versatile tool used for cutting various materials with precision.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Electric Cutter.jpg"]
  },
  {
    id: 35,
    name: "Drill Bit",
    price: 599,
    description: "A durable drill bit designed for precision drilling in various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Drill Bit.jpg"]
  },
  {
    id: 36,
    name: "Saw Blade",
    price: 599,
    description: "A durable saw blade designed for precision cutting in various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Saw Blade.jpg"]
  },
  {
    id: 37,
    name: "Sanding Disc",
    price: 599,
    description: "A durable sanding disc designed for use with power sanders.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Sanding Disc.jpg"]
  },
  {
    id: 38,
    name: "Cutting Disc",
    price: 599,
    description: "A durable cutting disc designed for use with power tools.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Cutting Disc.jpg"]
  },
  {
    id: 39,
    name: "Extension Cord",
    price: 599,
    description: "A durable extension cord designed for powering tools and equipment.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Extension Cord.jpg"]
  },
  {
    id: 40,
    name: "Battery Pack",
    price: 599,
    description: "A high-capacity battery pack designed for powering cordless tools.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["power-tools/Battery.avif"]
  },


// Page 33333333333333


  {
    id: 61,
    name: "Paint Brush",
    price: 599,
    description: "A versatile tool used for cutting, grinding, and polishing various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/61tPaint Brush.jpg"]
  },

  {
    id: 62,
    name: "Paint Roller",
    price: 599,
    description: "A tool used for applying paint to large surfaces quickly and evenly.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Roller.jpg"]
  },

  {
    id: 63,
    name: "Paint Tray",
    price: 599,
    description: "A durable paint tray designed for holding paint and allowing for easy application.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Tray.jpg"]
  },

  {
    id: 64,
    name: "Putty Knife",
    price: 599,
    description: "A versatile tool used for applying and smoothing putty or filler.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Putty Knife.jpg"]
  },

  {
    id: 65,
    name: "Paint Scraper",
    price: 599,
    description: "A durable paint scraper designed for removing paint and other materials from surfaces.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Scraper.jpg"]
  },

  {
    id: 66,
    name: "Sandpaper",
    price: 599,
    description: "A versatile tool used for smoothing surfaces and preparing them for painting.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Sandpaper.jpg"]
  },

  {
    id: 67,
    name: "Paint Mixer",
    price: 599,
    description: "A durable paint mixer designed for efficiently blending paint and other materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Mixer.jpg"]
  },

  {
    id: 68,
    name: "Drop Cloth",
    price: 599,
    description: "A durable drop cloth designed for protecting surfaces during painting.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Drop Cloth.jpg"]
  },

  {
    id: 69,
    name: "Paint Sprayer",
    price: 599,
    description: "A versatile tool designed for applying paint evenly and efficiently.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Sprayer.jpg"]
  },

  {
    id: 70,
    name: "Paint Can Opener",
    price: 599,
    description: "A durable paint can opener designed for easily opening paint cans.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Can Opener.jpg"]
  },

  {
    id: 71,
    name: "Paint Stirrer",
    price: 599,
    description: "A durable paint stirrer designed for mixing paint and other materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Stirrer.jpg"]
  },

  {
    id: 72,
    name: "Masking Tape",
    price: 599,
    description: "A high-quality masking tape designed for clean paint lines and easy removal.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Masking Tape.jpg"]
  },

  {
    id: 73,
    name: "Paint Edger",
    price: 599,
    description: "A versatile tool used for cutting, grinding, and polishing various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Edger.jpg"]
  },

  {
    id: 74,
    name: "Paint Bucket",
    price: 599,
    description: "A durable paint bucket designed for holding and mixing paint.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Bucket.jpg"]
  },

  {
    id: 75,
    name: "Caulking Gun",
    price: 599,
    description: "A durable caulking gun designed for precise application of caulk and sealants.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Caulking Gun.jpg"]
  },

  {
    id: 76,
    name: "Sponge",
    price: 599,
    description: "A versatile tool used for applying and smoothing putty or filler.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Sponge.jpg"]
  },
  {
    id: 77,
    name: "Wire Brush",
    price: 599,
    description: "A durable wire brush designed for removing rust and paint from surfaces.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Wire Brush.jpg"]
  },
  {
    id: 78,
    name: "Dust Mask",
    price: 599,
    description: "A durable dust mask designed for protecting the user from inhaling dust and debris.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Dust Mask.jpg"]
  },
  {
    id: 79,
    name: "Paint Roller Extension Pole",
    price: 599,
    description: "A durable paint roller extension pole designed for reaching high areas while painting.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Protective Goggles.jpg"]
  },
  {
    id: 80,
    name: "Cleaning Rag",
    price: 599,
    description: "A durable cleaning rag designed for various cleaning tasks.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["painting-tools/Paint Roller Extension Pole.jpg"]
  },


  // Page 44444444444444

  {
    id: 41,
    name: "Combination Pliers",
    price: 599,
    description: "A versatile tool designed for gripping and twisting various materials.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Combination Pliers.jpg.jpg"]
  },
  {
    id: 42,
    name: "Water Pump Pliers",
    price: 599,
    description: "A durable water pump pliers designed for gripping and turning various shapes.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Water Pump Pliers.jpg.jpg"]
  },
  {
    id: 43,
    name: "Locking Clamp",
    price: 599,
    description: "A durable locking clamp designed for holding materials securely in place.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Locking Clamp.jpg.jpg"]
  },
  {
    id: 44,
    name: "Ratcheting Wrench",
    price: 599,
    description: "A durable ratcheting wrench designed for easy tightening and loosening of fasteners.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Ratcheting Wrench.jpg.jpg"]
  },
  {
    id: 45,
    name: "Box-End Wrench",
    price: 599,
    description: "A durable box-end wrench designed for easy tightening and loosening of fasteners.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Box-End Wrench.jpg.jpg"]
  },
  {
    id: 46,
    name: "Crowfoot Wrench",
    price: 599,
    description: "A durable crowfoot wrench designed for easy tightening and loosening of fasteners.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Crowfoot Wrench.jpg.jpg"]
  },
  {
    id: 47,
    name: "Speed Wrench",
    price: 599,
    description: "A durable speed wrench designed for quick and easy tightening of fasteners.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Speed Wrench.jpg.jpg"]
  },
  {
    id: 48,
    name: "T-Handle Wrench",
    price: 599,
    description: "A durable T-handle wrench designed for easy tightening and loosening of fasteners.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/T-Handle Wrench.jpg.jpg"]
  },
  {
    id: 49,
    name: "Torque Multiplier",
    price: 599,
    description: "A durable torque multiplier designed for easy tightening of fasteners.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Torque Multiplier.jpg.jpg"]
  },

  {
    id: 50,
    name: "Nut Splitter",
    price: 599,
    description: "A durable nut splitter designed for easily removing damaged nuts.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Nut Splitter.jpg.jpg"]
  },

  {
     id: 51,
    name: "Snap Ring Pliers",
    price: 1899,
    description: "A durable snap ring pliers designed for easily removing and installing snap rings.",
    rating: "5.0",
    sold: "45",
    available: 4,
    images: ["fastening-tools/Snap Ring Pliers.jpg.jpg"]
  },
  {
    id: 52,
    name: "Hog Ring Pliers",
    price: 599,
    description: "A durable hog ring pliers designed for easily removing and installing hog rings.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Hog Ring Pliers.jpg.jpg"]
  },

  {
    id: 53,
    name: "Caulking Gun",
    price: 599,
    description: "A durable caulking gun designed for easy application of caulk and sealants.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Caulking Gun.jpg.jpg"]
  },

  {
    id: 54,
    name: "Pop Riveter",
    price: 599,
    description: "A durable pop riveter designed for easy installation of pop rivets.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Pop Riveter.jpg.jpg"]
  },

  {
    id: 55,
    name: "Spring Clamp",
    price: 599,
    description: "A durable spring clamp designed for holding materials securely in place.",
    rating: "4.9",
    sold: "30",
    available: 10,
  images: ["fastening-tools/Spring Clamp.jpg.jpg"]
  },

  {
    id: 56,
    name: "Bar Clamp",
    price: 599,
    description: "A durable bar clamp designed for holding materials securely in place.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Bar Clamp.jpg.jpg"]
  },

  {
    id: 57,
    name: "Toggle Clamp",
    price: 599,
    description: "A durable toggle clamp designed for holding materials securely in place.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Toggle Clamp.jpg.jpg"]
  },

  {
    id: 58,
    name: "Bench Vise",
    price: 599,
    description: "A durable bench vise designed for holding workpieces securely in place.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Bench Vise.jpg.jpg"]
  },

  {
    id: 59,
    name: "Anchor Setting Tool",
    price: 599,
    description: "A durable anchor setting tool designed for easy installation of anchors.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Anchor Setting Tool.jpg.jpg"]
  },

  {
    id: 60,
    name: "Wire Twisting Pliers",
    price: 599,
    description: "A durable wire twisting pliers designed for easily twisting and securing wires.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["fastening-tools/Wire Twister Pliers.jpg.jpg"]
  },


// Page 5555555555




  {
    id: 81,
    name: "Hex Bolt",
    price: 599,
    description: "A durable hex bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Hex bolt.jpg.jpg"]
  },
  {
    id: 82,
    name: "Carriage Bolt",
    price: 599,
    description: "A durable carriage bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Carriage Bolt.jpg.jpg"]
  },
  {
    id: 83,
    name: "Lag Bolt",
    price: 599,
    description: "A durable lag bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Lag Bolt.jpg.jpg"]
  },
  {
    id: 84,
    name: "Anchor Bolt",
    price: 599,
    description: "A durable anchor bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Anchor Bolt.jpg.jpg"]
  },
  {
    id: 85,
    name: "Eye Bolt",
    price: 599,
    description: "A durable eye bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Eye Bolt.jpg.jpg"]
  },
  {
    id: 86,
    name: "J-Bolt",
    price: 599,
    description: "A durable J-bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/J-Bolt.jpg.jpg"]
  },
  {
    id: 87,
    name: "U-Bolt",
    price: 599,
    description: "A durable U-bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/U-Bolt.jpg.jpg"]
  },
  {
    id: 88,
    name: "Flange Bolt",
    price: 599,
    description: "A durable flange bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Flange Bolt.jpg.jpg"]
  },
  {
    id: 89,
    name: "Shoulder Bolt",
    price: 599,
    description: "A durable shoulder bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Shoulder Bolt.jpg.jpg"]
  },
  {
    id: 90,
    name: "Machine Bolt",
    price: 599,
    description: "A durable machine bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Machine Bolt.jpg.jpg"]
  },
  {
    id: 91,
    name: "Stud Bolt",
    price: 599,
    description: "A durable stud bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Stud Bolt.jpg.jpg"]
  },
  {
    id: 92,
    name: "T-Bolt",
    price: 599,
    description: "A durable T-bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/T Bolt.jpg.jpg"]
  },
  {
    id: 93,
    name: "Socket Head Bolt",
    price: 599,
    description: "A durable socket head bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Socket Head Bolt.jpg.jpg"]
  },
  {
    id: 94,
    name: "Square Head Bolt",
    price: 599,
    description: "A durable square head bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Square Head Bolt.jpg.jpg"]
  },
  {
    id: 95,
    name: "Elevator Bolt",
    price: 599,
    description: "A durable elevator bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Elevator Bolt.jpg.jpg"]
  },
  {
    id: 96,
    name: "Toggle Bolt",
    price: 599,
    description: "A durable toggle bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Toggle Bolt.jpg.jpg"]
  },
  {
    id: 97,
    name: "Chicago Bolt",
    price: 599,
    description: "A durable Chicago bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Chicago Bolt.jpg.jpg"]
  },
  {
    id: 98,
    name: "Roofing Bolt",
    price: 599,
    description: "A durable roofing bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Roofing Bolt.jpg.jpg"]
  },
  {
    id: 99,
    name: "Step Bolt",
    price: 599,
    description: "A durable step bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Step Bolt.jpg.jpg"]
  },

  {
    id: 100,
    name: "Hanger Bolt",
    price: 599,
    description: "A durable hanger bolt designed for high-strength fastening applications.",
    rating: "4.9",
    sold: "30",
    available: 10,
    images: ["Bolts/Hanger Bolt.jpg.jpg"]
  },
  // Add the rest of your 40 products here
];




// ===== SORTING FUNCTIONS =====

// ===== SHOW PRODUCTS ON INDEX.HTML =====
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("product-container");
  if (!container) return;

  // cache the original static HTML so we can restore without reloading
  const _originalProductContainerHTML = container.innerHTML;

  container.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.images[0]}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p><a href="products.html?id=${p.id}" class="price-link">₱${p.price.toLocaleString()}</a></p>
      <button onclick="viewProduct(${p.id})">View Product</button>
    </div>
  `).join('');

  // wire price sort control if present
  const priceSort = document.getElementById('price-sort');
  if (priceSort) {
    priceSort.addEventListener('change', function(){
      const v = this.value;
      if (v === 'high-to-low') sortCurrentPage('desc');
      else if (v === 'low-to-high') sortCurrentPage('asc');
      else restoreDefaultOrder();
    });
  }
});

// ===== VIEW PRODUCT BUTTON FUNCTION =====
function viewProduct(id) {
  window.location.href = `products.html?id=${id}`;
}

// // DIRI E BUTANG
// function addToCart(id) {
//   const product = products.find(p => p.id === id);
//   if (!product) {
//     console.warn('Product not found:', id);
//     return;
//   }

//   const STORAGE_KEY = 'ehw_cart_v1';
//   let cart;
//   try {
//     cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
//   } catch(e) {
//     cart = {};
//   }

//   const itemKey = String(id); // ensure consistent key type
//   if (cart[id].qty > 0) {
//             cart[id].qty -= 1;
//             if(cart[id].qty === 0) {
//               delete cart[id];
//             }
//           }


//   // Check if product exists in cart by id
//   if (cart[itemKey]) {
//     // Update quantity of existing item
//     cart[itemKey].qty = (cart[itemKey].qty || 0) + 1;
//   } else {
//     // Add new item with quantity 1
//     cart[itemKey] = {
//       id: product.id,
//       name: product.name,
//       price: product.price, // numeric price
//       image: product.images[0],
//       qty: 1
//     };
//   }

//   // Save cart and update the UI indicator if present
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
//     localStorage.setItem('ehw_cart_v1_last_update', Date.now());

//     // Update cart indicator if it exists
//     const indicator = document.querySelector('.cart-indicator');
//     if (indicator) {
//       const totalItems = Object.values(cart).reduce((sum, item) => sum + (item.qty || 0), 0);
//       indicator.textContent = totalItems || '';
//     }
//   } catch(e) {
//     console.warn('Failed to save cart:', e);
//   }

//   alert(`${product.name} added to your cart!`);
// }



// ===== ADD TO CART FUNCTION =====

let addToCartLock = false; // Prevent double-click duplication

function addToCart(id) {
  // --- Prevent guests from adding to cart ---
  const _isLoggedIn = (function(){
    try{
      const raw = localStorage.getItem('ehw_user') || localStorage.getItem('currentUser') || localStorage.getItem('user') || localStorage.getItem('ehw_user_v1');
      if(!raw) return false;
      try{ const parsed = JSON.parse(raw); return !!(parsed && (parsed.firstName || parsed.name || parsed.username || parsed.email)); }catch(e){ return true; }
    }catch(e){ return false; }
  })();

  if(!_isLoggedIn){
    // prefer the site's toast if available, otherwise fallback to alert
    try{ if(typeof showToast === 'function') { showToast('Please login or register to add items to cart', 'error'); } else { alert('Please login or register to add items to cart'); } }catch(e){ try{ alert('Please login or register to add items to cart'); }catch(_){} }
    // optional: redirect to login page after showing message (commented out)
    // window.location.href = 'Login.html';
    return;
  }

  const product = products.find(p => p.id === id);
  if (!product) {
    console.warn('Product not found:', id);
    return;
    setTimeout(() => (addToCartLock = false), 500); // unlock after 0.5s
  }

  const STORAGE_KEY = 'ehw_cart_v1';
  let cart = {};

  // Read cart safely
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) cart = JSON.parse(stored);
  } catch (e) {
    console.warn('Error reading cart from storage, resetting cart.');
  }

  const itemKey = `product-${id}`;

  // ✅ Add or update product (no duplicates)
  if (cart[itemKey]) {
    // already added -> notify and do not increase quantity
  try{ if(typeof showToast3 === 'function') showToast3(product.name + ' is already in your cart'); else if(typeof showToast === 'function') showToast(product.name + ' is already in your cart'); else alert(product.name + ' is already in your cart'); }catch(e){ try{ alert(product.name + ' is already in your cart'); }catch(_){} }
    try{ updateIndicator(); }catch(e){}
  } else {
    cart[itemKey] = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      qty: 1
    };
  }

  // ✅ Save updated cart
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    try{ localStorage.setItem(UPDATE_KEY, Date.now()); }catch(e){}
    // notify other listeners (including in same window) about cart change
    try{ window.dispatchEvent(new StorageEvent('storage',{ key: STORAGE_KEY, newValue: JSON.stringify(cart) })); }catch(e){}
  } catch (e) {
    console.error('Failed to save cart:', e);
  }

  // ✅ Update cart indicator (show unique distinct-item count)
    try{ updateIndicator(); }catch(e){}

  // ✅ Optional: simple toast notification (no browser alert)
  try{ if(typeof showToast2 === 'function') showToast2(`${product.name} added to cart`); else if(typeof showToast === 'function') showToast(`${product.name} added to cart`); else alert(`${product.name} added to cart`); }catch(e){ try{ alert(`${product.name} added to cart`); }catch(_){} }
}

// Small, reusable toast system (upper-right). Usage: showToast(message, type)
// types: 'success' (green), 'error' (red), 'warn' (orange), 'info' (blue/default)
function showToast(message, type){
  try{
    // create container if missing
    var container = document.querySelector('.ehw-toast-container');
    if(!container){
      container = document.createElement('div');
      container.className = 'ehw-toast-container';
      container.setAttribute('aria-live','polite');
      document.body.appendChild(container);

      // basic styles (keeps changes local, non-invasive)
      var style = document.createElement('style');
      style.textContent = '\n.ehw-toast-container{position:fixed;top:16px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:10px;align-items:flex-end}\n.ehw-toast{min-width:220px;max-width:360px;padding:10px 14px;border-radius:6px;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,0.12);font-family:Segoe UI, Roboto, Arial, sans-serif;font-size:13px;opacity:0;transform:translateY(-6px) scale(0.98);transition:opacity .18s ease,transform .18s ease}\n.ehw-toast.ehw-show{opacity:1;transform:translateY(0) scale(1)}\n.ehw-toast.ehw-success{background:#27ae60}\n.ehw-toast.ehw-error{background:#e74c3c}\n.ehw-toast.ehw-warn{background:#f39c12;color:#1b1b1b}\n.ehw-toast.ehw-info{background:#2980b9}\n';
      document.head.appendChild(style);
    }

    var toast = document.createElement('div');
    toast.className = 'ehw-toast ehw-' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);

    // show animation
    requestAnimationFrame(function(){ toast.classList.add('ehw-show'); });

    // auto remove after timeout
    var timeout = 3500;
    if(type === 'error') timeout = 4500;
    if(type === 'warn') timeout = 3200;

    setTimeout(function(){
      toast.classList.remove('ehw-show');
      setTimeout(function(){ try{ toast.remove(); }catch(e){} }, 220);
    }, timeout);
  }catch(e){
    // fallback: alert if toast fails
    try{ alert(message); }catch(_){ }
  }
}



// End of file

// ------------------ Quick Sort & Helpers (DOM reordering) ------------------
// Quick-sort implementation for arrays of DOM nodes with comparator
function quickSort(arr, compare) {
  if (!Array.isArray(arr) || arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = [], right = [], equal = [];
  for (const el of arr) {
    const cmp = compare(el, pivot);
    if (cmp < 0) left.push(el);
    else if (cmp > 0) right.push(el);
    else equal.push(el);
  }
  return quickSort(left, compare).concat(equal, quickSort(right, compare));
}

function getPriceFromCard(card) {
  // Try to find price via products array using title match
  const titleEl = card.querySelector('h3');
  const title = titleEl ? titleEl.textContent.trim() : null;
  if (!title) return 0;
  let prod = products.find(p => p.name === title || String(p.id) === title);
  if (prod) return Number(prod.price) || 0;
  // fallback: try to match by image filename
  const img = card.querySelector('img');
  const src = img ? img.getAttribute('src') : '';
  if (src) {
    const file = src.split('/').pop();
    prod = products.find(p => p.images && p.images[0] && p.images[0].split('/').pop() === file);
    if (prod) return Number(prod.price) || 0;
  }
  return 0;
}

function sortCurrentPage(direction) {
  // direction: 'asc' or 'desc'
  // find currently visible product-page (by hash or .active)
  const hash = (window.location.hash || '#page-1');
  const pageId = hash.replace('#','');
  const page = document.getElementById(pageId) || document.querySelector('.product-page');
  if (!page) return;
  const grid = page.querySelector('.product-grid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.product-card'));
  const sorted = quickSort(cards, (a,b) => {
    const pa = getPriceFromCard(a);
    const pb = getPriceFromCard(b);
    if (pa === pb) return 0;
    return (pa < pb ? -1 : 1) * (direction === 'asc' ? 1 : -1);
  });
  // re-insert in sorted order
  sorted.forEach(c => grid.appendChild(c));
}

function restoreDefaultOrder() {
  // Try to restore the original product-container markup if available.
  try{
    const container = document.getElementById('product-container');
    if(container && typeof _originalProductContainerHTML !== 'undefined'){
      container.innerHTML = _originalProductContainerHTML;
      return;
    }
  }catch(e){}
  // fallback: reload the page
  window.location.reload();
}




// price-sort is now wired in the main pagination initializer; duplicate wiring removed

// SEARCH FUNCTIONALITY =======================



function setupSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Scroll to Product section when starting to type
        if (searchTerm.length === 1) {
            const productSection = document.getElementById('Product');
            if (productSection) {
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const scrollPosition = productSection.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        }
        
        // Process search
        filterProductsByLetter(searchTerm);
    });

    // Hide results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-bar')) {
            hideSearchResults();
        }
    });
}

function filterProductsByLetter(term) {
    const allPages = document.querySelectorAll('.product-page');
    const firstPage = document.querySelector('.page-1');
    const paginationButtons = document.querySelector('.pagination-buttons');
    
    if (!firstPage) return;

    // If search is empty, restore original pagination
    if (!term) {
        allPages.forEach((page, index) => {
            page.style.display = index === 0 ? '' : 'none';
            // Move products back to their original pages
            if (index > 0) {
                const products = page.querySelectorAll('.product-card');
                products.forEach(product => {
                    product.style.display = '';
                    if (product.parentElement !== page.querySelector('.product-grid')) {
                        page.querySelector('.product-grid').appendChild(product);
                    }
                });
            }
        });
        currentPage = 1;
        paginationButtons.style.display = '';
        updatePaginationButtons();
        return;
    }

    // Hide pagination buttons during search
    paginationButtons.style.display = 'none';
    
    // Show only first page for search results
    allPages.forEach((page, index) => {
        if (index === 0) {
            page.style.display = '';
        } else {
            page.style.display = 'none';
        }
    });

    // Get the first page's grid to hold all matching products
    const firstPageGrid = firstPage.querySelector('.product-grid');
    let foundMatches = false;

    // Search through all products in all pages
    allPages.forEach(page => {
        const products = page.querySelectorAll('.product-card');
        products.forEach(product => {
            const productName = product.querySelector('h3')?.textContent || '';
            const matches = productName.toLowerCase().includes(term.toLowerCase());
            
            if (matches) {
                foundMatches = true;
                product.style.display = '';
                // Move matching product to first page if it's not already there
                if (page !== firstPage) {
                    firstPageGrid.appendChild(product);
                }
            } else {
                product.style.display = 'none';
            }
        });
    });
}

function displaySearchResults(results) {
    let resultsContainer = document.querySelector('.search-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        document.querySelector('.search-bar').appendChild(resultsContainer);
    }

    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No products found</div>';
        resultsContainer.style.display = 'block';
        return;
    }

    const html = results.map(product => `
        <a href="#Product" class="search-result-item" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}">
            <div class="result-details">
                <div class="result-name">${product.name}</div>
                <div class="result-price">₱${product.price}</div>
            </div>
        </a>
    `).join('');

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';

    // Add click handlers for search results
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const productId = item.dataset.productId;
            // Here you can add logic to show the product details
            hideSearchResults();
            document.querySelector('.search-bar input').value = '';
        });
    });
}

function hideSearchResults() {
    const resultsContainer = document.querySelector('.search-results');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

// Store original products for filtering
let originalProducts = [];

// Initialize search functionality
function setupSearchBar() {
    try {
        const wrapper = document.querySelector('.search-bar-wrapper');
        if (!wrapper) return;
        
        const input = wrapper.querySelector('input[type="text"]');
        const icon = wrapper.querySelector('.fa-search');
        if (!input) return;

        // Store all products initially
        originalProducts = Array.from(document.querySelectorAll('.product-item, .product'))
            .map(el => ({
                element: el,
                name: el.querySelector('.product-title, h3, h4')?.textContent || '',
                description: el.querySelector('.product-description')?.textContent || ''
            }));

        // Enter key -> search
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch(input.value);
            }
        });

        // Click search icon
        if (icon) {
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => doSearch(input.value));
        }

        // Auto-run when a single letter is typed
        input.addEventListener('input', () => {
            const v = String(input.value || '').trim();
            if (v.length === 1) doSearch(v);
            if (v.length === 0) {
                // restore full listing
                showAllProducts();
            }
        });

        // Check URL for search query
        try {
            const params = new URLSearchParams(window.location.search);
            const q = params.get('q');
            if (q) {
                input.value = q;
                doSearch(q);
            }
        } catch (e) {}
    } catch (e) {
        console.log('Search setup error:', e);
    }
}

// Perform the search
function doSearch(term) {
    term = String(term || '').trim();
    if (!term) {
        showAllProducts();
        return;
    }

    filterProductsByQuery(term);

    // Scroll to product section
    const productSection = document.getElementById('Product');
    if (productSection) {
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        const rect = productSection.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - headerHeight - 8;
        window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }

    // Update URL with search term
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('q', term);
        history.replaceState(null, '', url.toString());
    } catch (e) {}
}

// Filter products based on search query
function filterProductsByQuery(term) {
    const q = String(term || '').toLowerCase().trim();
    if (!q) {
        showAllProducts();
        return;
    }

    originalProducts.forEach(product => {
        if (q.length === 1) {
            // Single letter - match start of product name
            const name = String(product.name || '').trim();
            const firstChar = name.charAt(0).toLowerCase();
            product.element.style.display = firstChar === q ? '' : 'none';
        } else {
            // Multiple letters - match anywhere in name
            const name = String(product.name || '').toLowerCase();
            product.element.style.display = name.includes(q) ? '' : 'none';
        }
    });
}

// Show all products
function showAllProducts() {
    originalProducts.forEach(product => {
        product.element.style.display = '';
    });
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete('q');
        history.replaceState(null, '', url.toString());
    } catch (e) {}
}


// Function to filter and show/hide products
function filterProducts(searchTerm) {
    // Select all product elements with class 'item' or that contain 'product' in class name
    const products = document.querySelectorAll('.product-item, .product');
    
    products.forEach(product => {
        // Look specifically for the product name/title only
        const productName = product.querySelector('h3, h4, .product-title, .item-title')?.textContent || '';
        
        // Check if the product name contains the search term (case insensitive)
        const matches = productName.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Show/hide based on match
        product.style.display = searchTerm === '' || matches ? '' : 'none';
    });

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        // Get all product elements
        const products = document.querySelectorAll('.product-card');
        let matches = [];
        
        products.forEach(product => {
            const title = (product.querySelector('.product-title')?.textContent || '').toLowerCase();
            const category = (product.getAttribute('data-category') || '').toLowerCase();
            
            // Check if product matches search (case insensitive)
            // Now works with any length of search term, including single letters
            if (title.includes(searchTerm) || category.includes(searchTerm)) {
                matches.push({
                    title: product.querySelector('.product-title')?.textContent || '',
                    element: product
                });
            }
            
            // Initially hide all products
            product.style.display = 'none';
        });

        // Update suggestion box
        if (searchTerm && matches.length > 0) {
            suggestBox.innerHTML = matches.map(match => `
                <div class="suggestion-item" style="padding: 8px; cursor: pointer; hover: background-color: #f0f0f0;">
                    ${match.title}
                </div>
            `).join('');
            
            suggestBox.style.display = 'block';

            // Add click handlers for suggestions
            suggestBox.querySelectorAll('.suggestion-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    // Show only the clicked product
                    products.forEach(p => p.style.display = 'none');
                    matches[index].element.style.display = '';
                    
                    // Update search input and hide suggestions
                    searchInput.value = matches[index].title;
                    suggestBox.style.display = 'none';
                    
                    // Scroll to the product
                    matches[index].element.scrollIntoView({ behavior: 'smooth' });
                });
            });
        } else {
            suggestBox.style.display = 'none';
            // If search is empty, show all products
            if (!searchTerm) {
                products.forEach(p => p.style.display = '');
            }
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-bar')) {
            suggestBox.style.display = 'none';
        }
    });
}

// Initialize all page functionality
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupPagination();
});

// Initialize all functionality
document.addEventListener('DOMContentLoaded', () => {
    handleSearch(); // Initialize search functionality
});