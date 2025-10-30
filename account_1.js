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
          menuLogout.addEventListener('click', function (ev) {
            ev.preventDefault();
            try { localStorage.removeItem('ehw_user'); } catch (err) { }
            // reload to reflect guest UI
            window.location.reload();
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

  // If the page was loaded with a hash (e.g. account.html#purchase-section),
  // activate that section and update the sidebar menu state. This makes
  // header links like "My Purchase" (which point to account.html#purchase-section)
  // open the correct tab on the account page.
  (function activateSectionFromHash() {
    try {
      const hash = (window.location.hash || '').trim();
      if (!hash) return;
      const id = hash.replace('#', '');
      const target = document.getElementById(id);
      if (!target) return;

      // show the requested section
      sections.forEach(sec => sec.classList.remove('active'));
      target.classList.add('active');

      // update sidebar/menu buttons
      document.querySelectorAll('.menu-btn, .submenu-btn').forEach(b => b.classList.remove('active'));
      const btn = document.querySelector(`[data-section="${id}"]`);
      if (btn) {
        btn.classList.add('active');
        if (btn.classList.contains('submenu-btn')) {
          // ensure accordion is expanded when a submenu item is requested
          if (accordionHeader) accordionHeader.classList.add('active');
          if (submenu && !submenu.classList.contains('expanded')) submenu.classList.add('expanded');
          accordionHeader?.setAttribute('aria-expanded', 'true');
        } else if (btn !== accordionHeader) {
          // collapse submenu for other top-level selections
          if (submenu) submenu.classList.remove('expanded');
          if (accordionHeader) { accordionHeader.classList.remove('active'); accordionHeader.setAttribute('aria-expanded', 'false'); }
        }
        try { btn.focus({ preventScroll: true }); } catch (e) { /* ignore focus errors */ }
      }
    } catch (err) { /* ignore any parsing errors */ }
  })();

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










radawd

document.addEventListener("DOMContentLoaded", () => {
  const PURCHASE_KEY = 'ehw_purchases_v1';
  let purchases = [];

  try {
    purchases = JSON.parse(localStorage.getItem(PURCHASE_KEY)) || [];
  } catch {
    purchases = [];
  }

  const noOrders = document.querySelector('.no-orders');
  const tabs = document.querySelectorAll('.tab');
  const tabSections = document.querySelectorAll('.tab-section');

  // 🧹 Helper to save updated list
  const savePurchases = () => {
    localStorage.setItem(PURCHASE_KEY, JSON.stringify(purchases));
  };

  // 🧩 Function to delete an order
  const deleteOrder = (id) => {
    purchases = purchases.filter(p => p.id !== id);
    savePurchases();
    renderAllTabs();
  };

  // 🎨 Render orders by status
  const renderOrders = (status, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Show all purchases for 'All' tab and show specific status for other tabs
    const filtered = 
      status === 'All' ? [...purchases] : purchases.filter(p => p.status === status);

    if (filtered.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:gray;">No orders here.</p>';
      return;
    }

    container.innerHTML = filtered.map(p => `
      <div class="order-item" data-id="${p.id}" style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;background:var(--bg-white);padding:12px;border-radius:8px;box-shadow:var(--shadow-1);">
        <div style="display:flex;align-items:center;gap:16px;">
          <img src="${p.image}" alt="${p.name}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;">
          <div>
            <h4 style="margin:0 0 4px;font-size:1rem;color:var(--text-dark);">${p.name}</h4>
            <p style="margin:0;color:var(--accent-start);font-weight:600;">₱${p.price.toLocaleString()}</p>
            <small style="color:var(--text-muted);">Status: <b>${p.status}</b></small><br>
            <small style="color:var(--text-muted);">Date: ${new Date(p.date).toLocaleDateString()}</small>
          </div>
        </div>
        <button class="delete-btn" style="background:#dc2626;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">
          Delete
        </button>
      </div>
    `).join('');

    // 🗑️ Hook up delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('.order-item').dataset.id);
        if (confirm('Are you sure you want to delete this order?')) {
          deleteOrder(id);
        }
      });
    });
  };

  // 🔄 Render all tabs
  const renderAllTabs = () => {
    // First render the "All" tab which should show everything
    renderOrders('All', 'tab-all');
    
    // Then render each status-specific tab
    renderOrders('To Pay', 'tab-to-pay');
    renderOrders('To Ship', 'tab-to-ship');
    renderOrders('To Receive', 'tab-to-receive');
    renderOrders('Completed', 'tab-completed');
    renderOrders('Cancelled', 'tab-cancelled');
    renderOrders('Return Refund', 'tab-return-refund');

    // Toggle "no orders" message
    if (purchases.length === 0) {
      noOrders.style.display = 'block';
    } else {
      noOrders.style.display = 'none';
    }
  };

  // 🧭 Handle tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      tabSections.forEach(sec => sec.classList.add('hidden'));
      tab.classList.add('active');
      document.getElementById(target).classList.remove('hidden');
    });
  });

  // 🚀 Initial render
  renderAllTabs();

  // 🟢 Auto-open correct tab after Buy Now
  const lastTab = sessionStorage.getItem('purchaseTab');
  if (lastTab) {
    const tabButton = document.querySelector(`[data-target="${lastTab}"]`);
    if (tabButton) tabButton.click();
    sessionStorage.removeItem('purchaseTab');
  }
});


