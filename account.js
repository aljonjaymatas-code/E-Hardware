document.addEventListener("DOMContentLoaded", () => {
  /* User dropdown removed from markup; no JS required here. *




/* =====================================================
      copilot ni
  ====================================================== */
  // --- Authentication guard: show guest overlay or populate logged-in user's name ---
  (function authGuard() {
    const raw = localStorage.getItem('ehw_user');
    let user = null;
    try { user = raw ? JSON.parse(raw) : null; } catch (e) { user = null; }

    const accountContainer = document.querySelector('.account-container');
    function showGuestOverlay() {
      if (accountContainer) accountContainer.style.display = 'none';

      // create a centered guest prompt under the header
      const wrapper = document.createElement('div');
      wrapper.id = 'guest-account-prompt';
      Object.assign(wrapper.style, {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
      });

      const card = document.createElement('div');
      Object.assign(card.style, {
        maxWidth: '720px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid #e0e0e0',
        padding: '28px',
        borderRadius: '8px',
        background: '#fff'
      });

      const title = document.createElement('h2');
      title.textContent = "You're not signed in";
      const msg = document.createElement('p');
      msg.textContent = 'Please login or register to access your account dashboard and purchases.';

      const btnLogin = document.createElement('a');
      btnLogin.href = 'Login.html';
      btnLogin.textContent = 'Login';
      Object.assign(btnLogin.style, { marginRight: '12px', padding: '10px 16px', background: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '4px' });

      const btnRegister = document.createElement('a');
      btnRegister.href = 'Register.html';
      btnRegister.textContent = 'Register';
      Object.assign(btnRegister.style, { marginRight: '12px', padding: '10px 16px', background: '#28a745', color: '#fff', textDecoration: 'none', borderRadius: '4px' });

      const btnHome = document.createElement('a');
      btnHome.href = 'index.html';
      btnHome.textContent = 'Back to Home';
      Object.assign(btnHome.style, { display: 'inline-block', marginTop: '12px', color: '#333', textDecoration: 'none' });

      card.appendChild(title);
      card.appendChild(msg);
      const actions = document.createElement('div');
      actions.style.marginTop = '16px';
      actions.appendChild(btnLogin);
      actions.appendChild(btnRegister);
      card.appendChild(actions);
      card.appendChild(btnHome);
      wrapper.appendChild(card);

      const main = document.querySelector('body');
      if (main) main.appendChild(wrapper);
    }

    function populateForUser(u) {
      const first = (u && (u.firstName || u.name || u.username || u.email)) ? String(u.firstName || u.name || u.username || u.email).split(/\s+/)[0] : 'Account';

      // update any visible .user-name elements (header and local copies)
      document.querySelectorAll('.user-name').forEach(el => {
        // preserve existing caret or icon nodes if present
        el.textContent = first;
      });

      // sidebar username
      const sidebarName = document.querySelector('.sidebar .user-name');
      if (sidebarName) sidebarName.textContent = first;

      // profile username static field
      const usernameStatic = document.querySelector('.profile-form-layout .static-value');
      if (usernameStatic) usernameStatic.textContent = first;

      // Header: hide Login/Register links and show user menu + dropdown
      try {
        const loginText = document.getElementById('login-text');
        const regLink = document.getElementById('register-link');
        const userMenu = document.getElementById('user-menu');
        const userToggle = document.getElementById('user-toggle');
        const userDropdown = document.getElementById('user-dropdown');

        if (loginText) loginText.style.display = 'none';
        if (regLink) regLink.style.display = 'none';

        if (userMenu) userMenu.style.display = 'inline-block';

        if (userToggle) {
          // set the visible name inside the toggle
          const nameSpan = userToggle.querySelector('.user-name');
          if (nameSpan) nameSpan.textContent = first;

          // set avatar initial if an avatar element exists
          const avatarEl = userToggle.querySelector('.user-avatar');
          if (avatarEl) {
            avatarEl.classList.remove('fa', 'fa-user');
            avatarEl.textContent = first.charAt(0).toUpperCase();
          }

          // ensure dropdown hidden state
          if (userDropdown) {
            userDropdown.setAttribute('aria-hidden', 'true');
            userDropdown.style.display = 'none';
          }

          // toggle handler
          userToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (!userDropdown) return;
            const isHidden = userDropdown.getAttribute('aria-hidden') === 'true';
            userDropdown.setAttribute('aria-hidden', String(!isHidden));
            userDropdown.style.display = isHidden ? 'block' : 'none';
          });

          // close dropdown when clicking elsewhere
          document.addEventListener('click', function (ev) {
            try {
              if (!userMenu.contains(ev.target)) {
                if (userDropdown) { userDropdown.setAttribute('aria-hidden', 'true'); userDropdown.style.display = 'none'; }
              }
            } catch (err) { }
          });
        }

        // Logout handler
        const menuLogout = document.getElementById('menu-logout');
        if (menuLogout) {
          // ensure the link points to the login page so users land there after logout
          try{ menuLogout.setAttribute('href', 'Login.html'); }catch(e){}
          menuLogout.addEventListener('click', function (ev) {
            ev.preventDefault();
            // clear auth keys
            try{ localStorage.removeItem('ehw_user'); }catch(_){ }
            try{ localStorage.removeItem('currentUser'); }catch(_){ }
            try{ localStorage.removeItem('user'); }catch(_){ }
            try{ localStorage.removeItem('ehw_user_v1'); }catch(_){ }
            try{ localStorage.removeItem('fullname'); }catch(_){ }
            try{ localStorage.removeItem('name'); }catch(_){ }
            // notify other parts of the app so the header and indicator update
            try{ window.dispatchEvent(new StorageEvent('storage',{ key: 'ehw_user', newValue: null })); }catch(e){}
            try{ window.dispatchEvent(new CustomEvent('ehw_cart_updated')); }catch(e){}
            try{ document.querySelectorAll('#cart-indicator, .cart-indicator').forEach(el=>{ if(el){ el.textContent=''; el.style.display='none'; } }); }catch(e){}
            try{ if(typeof window.updateAuthUI === 'function') window.updateAuthUI(); }catch(e){}
            try{ if(typeof window.updateCartIndicator === 'function') window.updateCartIndicator(); }catch(e){}
            // navigate to login page
            try{ window.location.href = 'Login.html'; }catch(e){}
          });
        }
      } catch (err) { /* ignore header wiring errors */ }

      // inform global header updater (index.js) if present
      if (window.updateAuthUI) try { window.updateAuthUI(); } catch (e) {}
    }

    if (!user) {
      showGuestOverlay();
      // stop further initialization of the account UI for guests
      return; // early exit from DOMContentLoaded handler
    }

    populateForUser(user);
  })();

  /* =====================================================
    copilot ni
  ====================================================== */


  /* =====================================================
     🔹 SIDEBAR MENU + SECTION SWITCHING
  ====================================================== */
  const accordionHeader = document.querySelector(".accordion-header");
  const submenu = document.getElementById(accordionHeader?.dataset.target);
  const allMenuButtons = document.querySelectorAll(".menu-btn, .submenu-btn");
  const sections = document.querySelectorAll(".content-section");

  const toggleSubmenu = () => {
    const isExpanded = submenu.classList.toggle("expanded");
    accordionHeader.classList.toggle("active", isExpanded);
    accordionHeader.setAttribute("aria-expanded", isExpanded);
  };

  if (accordionHeader && submenu) {
    accordionHeader.addEventListener("click", toggleSubmenu);
  }

  allMenuButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isSubmenuBtn = btn.classList.contains("submenu-btn");
      document.querySelectorAll(".menu-btn, .submenu-btn").forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");

      if (isSubmenuBtn) {
        accordionHeader.classList.add("active");
        if (!submenu.classList.contains("expanded")) toggleSubmenu();
      } else if (btn !== accordionHeader) {
        submenu.classList.remove("expanded");
        accordionHeader.classList.remove("active");
        accordionHeader.setAttribute("aria-expanded", "false");
      }

      sections.forEach((sec) => sec.classList.remove("active"));
      const targetId = btn.dataset.section;
      const target = document.getElementById(targetId);
      if (target) target.classList.add("active");
    });
  });

  /* =====================================================
     🔹 PROFILE EDITABLE FIELDS (EMAIL, PHONE, DOB)
  ====================================================== */
  const saveBtn = document.querySelector(".save-btn-large");
  const nameInput = document.querySelector("#name");
  const emailStatic = document.querySelector(".form-group:nth-child(3) .static-value");
  const phoneStatic = document.querySelector(".form-group:nth-child(4) .static-value");
  const dobStatic = document.querySelector(".form-group:nth-child(6) .static-value");

  // Helper to make inline editable fields
  function makeEditable(field, type) {
    field.style.cursor = "pointer";
    field.addEventListener("click", () => {
      const currentValue = field.textContent.trim() === "Add" ? "" : field.textContent.trim();
      const input = document.createElement("input");
      input.type = type;
      input.value = currentValue;
      input.placeholder =
        type === "email"
          ? "Enter your email"
          : type === "text"
          ? "Enter your phone number"
          : "YYYY-MM-DD";
      input.className = "inline-edit";
      field.replaceWith(input);
      input.focus();

      input.addEventListener("blur", () => saveInlineInput(input, field, type));
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") saveInlineInput(input, field, type);
      });
    });
  }

  [emailStatic, phoneStatic].forEach((field) => {
    makeEditable(field, field === emailStatic ? "email" : "text");
  });

  // Date of Birth is now typeable
  makeEditable(dobStatic, "date");

  // Make sure any "Change" link inside a static-value triggers the inline editor
  document.querySelectorAll('.change-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = link.closest('.static-value');
      if (parent) {
        // dispatch a click so the makeEditable handler opens the input
        parent.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
  });

  // Save inline edit with validation
  function saveInlineInput(input, field, type) {
    const value = input.value.trim();

    if (type === "email" && !isValidEmail(value)) {
      alert("Please enter a valid email address.");
      setTimeout(() => input.focus(), 100);
      return;
    }

    if (type === "text" && field !== dobStatic && !isValidPhone(value)) {
      alert("Please enter a valid Philippine phone number (e.g. 09123456789).");
      setTimeout(() => input.focus(), 100);
      return;
    }

    if (type === "date" && value !== "" && !isValidDate(value)) {
      alert("Please enter a valid date (YYYY-MM-DD).");
      setTimeout(() => input.focus(), 100);
      return;
    }

    const newSpan = document.createElement("span");
    newSpan.className = "static-value";
    newSpan.textContent = value || "Add";
    if (value) newSpan.style.color = "#333";

    input.replaceWith(newSpan);
    makeEditable(newSpan, type);
  }

  /* =====================================================
     🔹 SAVE PROFILE BUTTON
  ====================================================== */
  saveBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = document.querySelector(".form-group:nth-child(3) .static-value").textContent.trim();
    const phone = document.querySelector(".form-group:nth-child(4) .static-value").textContent.trim();
    const dob = document.querySelector(".form-group:nth-child(6) .static-value").textContent.trim();

    if (name === "") {
      alert("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      alert("Invalid email format.");
      return;
    }
    if (!isValidPhone(phone)) {
      alert("Invalid phone number format.");
      return;
    }
    if (!isValidDate(dob)) {
      alert("Invalid date format. Please use YYYY-MM-DD.");
      return;
    }

    const userProfile = { name, email, phone, dob };
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    alert("Profile saved successfully!");
  });

  /* =====================================================
     🔹 VALIDATION HELPERS
  ====================================================== */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function isValidPhone(phone) {
    return /^(09|\+639)\d{9}$/.test(phone);
  }
  function isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  /* =====================================================
     🔹 LOAD SAVED DATA
  ====================================================== */
  const savedProfile = localStorage.getItem("userProfile");
  if (savedProfile) {
    const { name, email, phone, dob } = JSON.parse(savedProfile);
    if (name) nameInput.value = name;
    if (email) emailStatic.textContent = email;
    if (phone) phoneStatic.textContent = phone;
    if (dob) dobStatic.textContent = dob;
  }

  /* =====================================================
     🔹 ADDRESS MODAL + LOCATION PICKER + LABEL BUTTONS
     (same as before, unchanged)
  ====================================================== */
  const modal = document.getElementById("address-modal");
  const openBtn = document.getElementById("open-address-modal");
  const closeBtns = document.querySelectorAll("#address-modal .close-btn");

  const openModal = () => modal.classList.add("active");
  const closeModal = () => modal.classList.remove("active");

  if (openBtn) openBtn.addEventListener("click", openModal);
  closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  const locationDropdownToggle = document.getElementById("location-dropdown-toggle");
  const locationTabs = document.querySelectorAll(".location-tab");
  const locationLists = document.querySelectorAll(".location-list");
  const locationInput = document.getElementById("modal-region-province");

  const switchTab = (tabName) => {
    locationTabs.forEach((t) => t.classList.remove("active"));
    locationLists.forEach((l) => l.classList.remove("active"));
    document.querySelector(`.location-tab[data-tab="${tabName}"]`)?.classList.add("active");
    document.querySelector(`.location-list[data-list="${tabName}"]`)?.classList.add("active");
  };

  if (locationDropdownToggle) {
    locationDropdownToggle.addEventListener("click", (e) => {
      if (!e.target.closest(".location-picker-content")) {
        const open = locationDropdownToggle.classList.toggle("open");
        locationDropdownToggle.setAttribute("aria-expanded", open);
        if (open) switchTab("region");
      }
    });

    document.addEventListener("click", (e) => {
      if (
        locationDropdownToggle.classList.contains("open") &&
        !locationDropdownToggle.contains(e.target)
      ) {
        locationDropdownToggle.classList.remove("open");
        locationDropdownToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  locationTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  locationLists.forEach((list) => {
    list.addEventListener("click", (e) => {
      if (e.target.classList.contains("location-item")) {
        const selectedItem = e.target.textContent.trim();
        const listType = list.getAttribute("data-list");
        let parts = locationInput.value.split(" / ").map((p) => p.trim()).filter((p) => p !== "");

        if (listType === "region") {
          parts = [selectedItem];
          switchTab("province");
        } else if (listType === "province") {
          parts[1] = selectedItem;
          switchTab("city");
        } else if (listType === "city") {
          parts[2] = selectedItem;
          switchTab("barangay");
        } else if (listType === "barangay") {
          parts[3] = selectedItem;
          locationDropdownToggle.classList.remove("open");
        }

        locationInput.value = parts.join(" / ");
      }
    });
  });

  const labelBtns = document.querySelectorAll(".label-btn");
  labelBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      labelBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  /* =====================================================
     🔹 ADD / REMOVE MAP EMBED (Add Location)
  ====================================================== */
  const addLocationBtn = document.querySelector('.add-location-btn');
  if (addLocationBtn) {
    const mapPreviewWrapperClass = 'map-embed-wrapper';
    const mapEmbedInput = document.getElementById('modal-map-embed');

    function extractIframeHtml(val) {
      if (!val) return null;
      const trimmed = val.trim();
      // match the full iframe tag (non-greedy)
      const match = trimmed.match(/<iframe[\s\S]*?<\/iframe>/i);
      return match ? match[0] : null;
    }

    addLocationBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const container = addLocationBtn.closest('.map-placeholder');
      if (!container) return;
      const existing = container.querySelector('.' + mapPreviewWrapperClass);
      if (existing) {
        existing.remove();
        addLocationBtn.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i> Add Location';
        return;
      }

      const raw = mapEmbedInput?.value || '';
      const iframeHtml = extractIframeHtml(raw);
      if (!iframeHtml) {
        const note = document.createElement('div');
        note.className = 'map-embed-wrapper map-note';
        note.style.marginTop = '8px';
        note.textContent = 'Please paste a valid <iframe> embed HTML in the box above, then click Add Location to preview.';
        container.appendChild(note);
        setTimeout(() => note.remove(), 3000);
        return;
      }

      const previewHtml = `<div class="${mapPreviewWrapperClass}" style="margin-top:8px;">${iframeHtml}</div>`;
      container.insertAdjacentHTML('beforeend', previewHtml);
      addLocationBtn.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i> Remove Location';
    });
  }

  /* =====================================================
     🔹 ADDRESS STORAGE, RENDERING & SUBMIT HANDLER
  ====================================================== */
  const addressesKey = 'ehw_addresses';
  const addressesListContainer = document.querySelector('.addresses-list-container');

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>\"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  // Embed-only mode: we will store iframe HTML (mapEmbed) when present in modal

  function renderAddresses() {
    const container = addressesListContainer;
    if (!container) return;

    let addresses = [];
    try { addresses = localStorage.getItem(addressesKey) ? JSON.parse(localStorage.getItem(addressesKey)) : []; } catch (e) { addresses = []; }

    // clear existing
    container.innerHTML = '';

    if (!addresses.length) {
      container.innerHTML = `
        <div class="no-addresses">
          <div class="map-icon" aria-hidden="true"><i class="fa fa-map-marker"></i></div>
          <p>You don't have addresses yet.</p>
        </div>
      `;
      return;
    }

    const list = document.createElement('div');
    list.className = 'addresses-list';

    addresses.forEach((a, idx) => {
      const card = document.createElement('div');
      card.className = 'address-card';
      // card layout: left = info/actions, right = map preview container
      card.innerHTML = `
      <div class="address-row" style="display:flex;gap:12px;align-items:flex-start;">
          <div class="address-info" style="flex:1;">
            <div class="address-card-header">
              <strong>${escapeHtml(a.fullname)}</strong>
              ${a.default ? '<span class="default-badge">Default</span>' : ''}
            </div>
            <div class="address-lines">
              <div class="address-line">${escapeHtml(a.region)}</div>
              <div class="address-line">${escapeHtml(a.street || '')}</div>
              <div class="address-line">Postal: ${escapeHtml(a.postal || '')}</div>
              <div class="address-line">Phone: ${escapeHtml(a.phone)}</div>
              <div class="address-label">${escapeHtml(a.label || '')}</div>
            </div>
            <div class="address-actions">
              <button class="view-map-btn" data-idx="${idx}">${a.mapEmbed ? 'View Map' : 'No Map'}</button>
              <button class="edit-address-btn" data-idx="${idx}">Edit</button>
              <button class="delete-address-btn" data-idx="${idx}">Delete</button>
            </div>
          </div>
          <div class="address-map" style="width:320px;display:none;">
            <!-- map iframe will be inserted here when user clicks View Map -->
          </div>
        </div>
      `;
      list.appendChild(card);
    });

    container.appendChild(list);

    // attach delete handlers
    container.querySelectorAll('.delete-address-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(btn.dataset.idx);
        if (!Number.isFinite(idx)) return;
        addresses.splice(idx, 1);
        localStorage.setItem(addressesKey, JSON.stringify(addresses));
        renderAddresses();
      });
    });

    // attach view-map handlers (embed-only)
    container.querySelectorAll('.view-map-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(btn.dataset.idx);
        if (!Number.isFinite(idx)) return;
        const card = btn.closest('.address-card');
        if (!card) return;
        const mapContainer = card.querySelector('.address-map');
        const addr = addresses[idx];
        if (!addr || !addr.mapEmbed) {
          alert('No map embed saved for this address.');
          return;
        }

        // toggle
        if (mapContainer.innerHTML.trim()) {
          mapContainer.innerHTML = '';
          mapContainer.style.display = 'none';
          btn.textContent = 'View Map';
          return;
        }

        // insert saved iframe HTML directly
        mapContainer.innerHTML = addr.mapEmbed;
        mapContainer.style.display = 'block';
        btn.textContent = 'Hide Map';
      });
    });
  }

  // handle new address submit
  const newAddressForm = document.getElementById('new-address-form');
  if (newAddressForm) {
    newAddressForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullname = document.getElementById('modal-fullname')?.value.trim() || '';
      const phone = document.getElementById('modal-phone')?.value.trim() || '';
      const region = document.getElementById('modal-region-province')?.value.trim() || '';
      const postal = document.getElementById('modal-postal-code')?.value.trim() || '';
      const street = document.getElementById('modal-street-address')?.value.trim() || '';
      const labelEl = document.querySelector('.label-btn.active');
      const label = labelEl ? labelEl.textContent.trim() : '';
      const isDefault = !!document.getElementById('default-address')?.checked;

      if (!fullname) { alert('Please enter full name.'); return; }
      if (!phone) { alert('Please enter phone number.'); return; }
      if (!region) { alert('Please choose a region/province/city/barangay.'); return; }
      if (!postal) { alert('Please enter postal code.'); return; }

      let addressesArr = [];
      try { addressesArr = localStorage.getItem(addressesKey) ? JSON.parse(localStorage.getItem(addressesKey)) : []; } catch (err) { addressesArr = []; }

      if (isDefault) {
        addressesArr = addressesArr.map(a => ({ ...a, default: false }));
      }

      // if user previewed an embed in the modal, capture that iframe HTML
      let mapEmbedHtml = '';
      try {
        const modalIframe = document.querySelector('#address-modal .map-placeholder .map-embed-wrapper iframe');
        if (modalIframe) mapEmbedHtml = modalIframe.outerHTML;
      } catch (err) { mapEmbedHtml = ''; }

      addressesArr.push({ fullname, phone, region, postal, street, label, mapEmbed: mapEmbedHtml, default: !!isDefault, createdAt: new Date().toISOString() });
      localStorage.setItem(addressesKey, JSON.stringify(addressesArr));

      // remove modal preview if present
      try {
        const modalMapPlaceholder = document.querySelector('#address-modal .map-placeholder');
        modalMapPlaceholder?.querySelector('.map-embed-wrapper')?.remove();
      } catch (err) {}

      // reset form, restore label button state
      newAddressForm.reset();
      document.querySelectorAll('.label-btn').forEach(b => b.classList.remove('active'));
      const firstLabel = document.querySelector('.label-btn');
      if (firstLabel) firstLabel.classList.add('active');

      // close modal and re-render
      try { closeModal(); } catch (err) {}
      renderAddresses();
      alert('Address added successfully.');
    });
  }

  // initial render of addresses saved in localStorage
  renderAddresses();
});










// My Purchases tab functionality
(function(){
  const PURCHASES_KEY = 'ehw_purchases_v1';
  function readPurchases(){ try{ return JSON.parse(localStorage.getItem(PURCHASES_KEY)) || []; }catch(e){ return []; } }

  function money(n){ return '₱' + (Number(n)||0).toLocaleString(); }

  function renderPurchases(){
    const section = document.getElementById('purchase-section');
    if(!section) return;
    let list = document.getElementById('purchases-list');
    const noOrders = section.querySelector('.no-orders');
    const purchases = readPurchases();
    if(!list){ list = document.createElement('div'); list.id = 'purchases-list'; list.className = 'purchases-list'; section.appendChild(list); }
    list.innerHTML = '';
    if(!purchases || purchases.length === 0){ if(noOrders) noOrders.style.display = ''; list.style.display = 'none'; return; }
    if(noOrders) noOrders.style.display = 'none'; list.style.display = '';

    purchases.forEach(order => {
      const card = document.createElement('article');
      card.className = 'order-card';
      const created = new Date(order.createdAt).toLocaleString();
      const itemsHtml = (order.items || []).map(it => `
        <div class="order-item">
          <img src="${it.image || 'image/e12.webp'}" alt="${(it.name||'')}" />
          <div class="meta">
            <div class="name">${it.name || ''}</div>
            <div class="qty">Qty: ${it.qty || 1}</div>
            <div class="price">${money((Number(it.price)||0) * (Number(it.qty)||1))}</div>
          </div>
        </div>
      `).join('');

      card.innerHTML = `
        <header class="order-head">
          <div class="oid">Order: ${order.id}</div>
          <div class="status">${order.status || ''}</div>
        </header>
        <div class="order-meta">Placed: ${created} • Items: ${order.itemCount || 0} • Total: ${money(order.total)}</div>
        <div class="order-items">${itemsHtml}</div>
      `;
      list.appendChild(card);
    });
  }

  // render on load when user is present
  document.addEventListener('DOMContentLoaded', function(){ renderPurchases(); });
  // re-render when purchases updated elsewhere
  window.addEventListener('ehw_purchases_updated', renderPurchases);
  window.addEventListener('storage', function(e){ if(e.key === PURCHASES_KEY) renderPurchases(); });

  // ensure opening purchase section triggers render
  const originalOpenSection = window.openSectionFromHash;
  // openSectionFromHash exists later; we also attach to hashchange (already present)
  // so rely on hashchange and manual calls
})();

/* =====================================================
   🔹 AUTO-OPEN SECTION BASED ON URL HASH
===================================================== */
const openSectionFromHash = () => {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (!hash) return;

  // Map hash keywords to section IDs
  const map = {
    profile: 'profile-section',
    addresses: 'addresses-section',
    banks: 'banks-cards-section',
    purchase: 'purchase-section',
    notif: 'notif-section'
  };

  const targetId = map[hash];
  if (!targetId) return;

  // Hide all other sections
  document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));

  // Show target section
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  // Update sidebar button highlight
  document.querySelectorAll('.menu-btn, .submenu-btn').forEach(btn => btn.classList.remove('active'));
  const matchingBtn = document.querySelector(`[data-section="${targetId}"]`);
  if (matchingBtn) matchingBtn.classList.add('active');
};

// Run on load
openSectionFromHash();

// Run when hash changes (optional)
window.addEventListener('hashchange', openSectionFromHash);
