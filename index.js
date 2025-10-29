// Authentication and User Management
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

// Update UI based on auth state
function updateAuthUI() {
    const user = checkAuth();
    const userMenu = document.getElementById('user-menu');
    const userNameElement = document.querySelector('.user-name');

    if (user) {
        if (userMenu) userMenu.style.display = 'block';
        if (userNameElement) userNameElement.textContent = user.username;
    } else {
        if (userMenu) userMenu.style.display = 'none';
    }
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
            localStorage.removeItem('currentUser');
            window.location.reload();
        });
    }
}

// Update cart indicator
function updateCartIndicator() {
    const cartIndicator = document.getElementById('cart-indicator');
    if (cartIndicator) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const itemCount = cart.length;
        cartIndicator.textContent = itemCount;
        cartIndicator.classList.toggle('hidden', itemCount === 0);
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
            <button class="add-cart" onclick="addToCart(${p.id})">Add to Cart</button>
            <button class="view-details" onclick="viewProduct(${p.id})">View Details</button>
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

    // Populate register link text from likely storage keys (fallbacks)
    const keys = ['ehw_user','user','ehw_user_v1','fullname','name'];
    let fullname = null;
    for(const k of keys){
      const raw = localStorage.getItem(k);
      if(!raw) continue;
      try{ const parsed = JSON.parse(raw);
        if(parsed && typeof parsed === 'object'){
          fullname = parsed.firstName || parsed.name || parsed.fullname || parsed.fullName || null;
        } else if(typeof parsed === 'string'){
          fullname = parsed;
        }
      }catch(e){ fullname = raw; }
      if(fullname) break;
    }
    if(fullname && regLink){
      const first = String(fullname).trim().split(/\s+/)[0];
      if(first) regLink.textContent = first;
    }

    // decide UI for logged-in vs guest
    try{
      const raw = localStorage.getItem('ehw_user');
      if(raw){
          const u = JSON.parse(raw);
          // hide simple login/register anchors
          if(loginText) loginText.style.display = 'none';
          if(regLink) regLink.style.display = 'none';
          // show user menu
          if(userMenu){
            userMenu.style.display = 'inline-block';
            const first = (u.firstName || u.name || 'hi').toString().trim().split(/\s+/)[0] || 'hi';
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
    if(menuLogout){ menuLogout.addEventListener('click', function(e){ e.preventDefault(); try{ localStorage.removeItem('ehw_user'); }catch(err){} location.reload(); }); }

  }catch(e){ /* ignore */ }
});




// cart.js - unified cart script with simple auth checks
(function(){
  const STORAGE_KEY = 'ehw_cart_v1';
  const UPDATE_KEY = 'ehw_cart_v1_last_update';

  function isLoggedIn(){
    try{ const raw = localStorage.getItem('ehw_user'); if(!raw) return false; const parsed = JSON.parse(raw); return !!(parsed && (parsed.firstName || parsed.name || parsed.email)); }
    catch(e){ return !!localStorage.getItem('ehw_user'); }
  }

  function readCart(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }catch(e){ return {}; } }
  function writeCart(cart){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); localStorage.setItem(UPDATE_KEY, Date.now()); }catch(e){} }

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
    const total = Object.values(cart).reduce((s,i)=>s + (i.qty||0), 0) || 0;
    indicator.textContent = total;
    indicator.style.display = total ? 'inline-block' : 'none';
  }

  function getToast(){
    let t = document.getElementById('ehw-toast');
    if(!t){ t = document.createElement('div'); t.id = 'ehw-toast'; Object.assign(t.style,{ position:'fixed',right:'20px',bottom:'20px',padding:'10px 14px',background:'#111',color:'#fff',borderRadius:'6px',opacity:'0',transition:'opacity 250ms ease-in-out',zIndex:9999 }); document.body.appendChild(t); }
    return t;
  }

  function showToast(text){ const t = getToast(); t.textContent = text; requestAnimationFrame(()=>{ t.style.opacity = '1'; }); clearTimeout(t._hid); t._hid = setTimeout(()=>{ t.style.opacity = '0'; },1500); }

  function addItemFromButton(btn){
    if(!isLoggedIn()){
      showToast('Please login or register to add items to cart');
      return;
    }
    const card = btn.closest('.product-card'); if(!card) return;
    const name = (card.querySelector('h3') && card.querySelector('h3').textContent.trim()) || 'Item';
    const imgEl = card.querySelector('img'); const image = imgEl ? (imgEl.getAttribute('src') || '') : '';
    const priceText = (card.querySelector('.price') && card.querySelector('.price').textContent.trim()) || '';
    const id = name + '|' + (priceText || image || Math.random().toString(36).slice(2,6));
    const cart = readCart(); if(cart[id]) cart[id].qty = (cart[id].qty||0) + 1; else cart[id] = { name, image, price: priceText, qty: 1 };
    writeCart(cart); updateIndicator(); showToast('Added to cart — ' + name);
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
          showToast('Please login or register to view your cart');
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
          showToast('Please login or register to view or buy items');
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
        if(e.key === 'ehw_user') updateIndicator();
      }catch(err){}
    });
  });

})();




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

let addToCartLock = false; // Prevent double-click duplication

function addToCart(id) {
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

  const itemKey = String(id);

  // ✅ Add or update product (no duplicates)
  if (cart[itemKey]) {
    cart[itemKey].qty += 1;
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
  } catch (e) {
    console.error('Failed to save cart:', e);
  }

  // ✅ Update cart indicator (no duplicates)
  const indicator = document.querySelector('.cart-indicator');
  if (indicator) {
    const totalItems = Object.values(cart).reduce(
      (sum, item) => sum + (item.qty || 0),
      0
    );
    indicator.textContent = totalItems > 0 ? totalItems : '';
    // Make sure the indicator is visible when there are items and hidden when zero
    try {
      indicator.style.display = totalItems ? 'inline-block' : 'none';
      if (totalItems) indicator.classList.remove('hidden'); else indicator.classList.add('hidden');
    } catch (e) { /* ignore styling errors */ }
  }

  // ✅ Optional: simple toast notification (no browser alert)
  showToast(`${product.name} added to cart`);
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

