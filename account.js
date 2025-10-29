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
});
