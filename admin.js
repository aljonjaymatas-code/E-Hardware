
        // --- CORE NAVIGATION LOGIC (HTML/JS) ---

        const navContainers = [
            document.getElementById('desktop-nav'),
        ];
        const pageViews = document.querySelectorAll('.page-view');

        function setActiveView(viewId) {
            // 1. Update Page Views
            pageViews.forEach(view => {
                view.classList.remove('active');
                if (view.dataset.viewId === viewId) {
                    view.classList.add('active');
                }
            });

            // 2. Update Nav Links
            navContainers.forEach(container => {
                container.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                    if (item.dataset.view === viewId) {
                        item.classList.add('active');
                    }
                });
            });

            // 3. Reports View Specific Initialization (Only runs when switching to Reports)
            if (viewId === 'reports') {
                renderReportLists();
            }
        }

        // Attach listeners to all navigation items
        navContainers.forEach(container => {
            container.addEventListener('click', (event) => {
                const navItem = event.target.closest('.nav-item');
                if (navItem) {
                    const viewId = navItem.dataset.view;
                    if (viewId) {
                        setActiveView(viewId);
                    }
                }
            });
        });

        // --- REPORT LISTS RENDERING LOGIC (Isolated for Reports View) ---

        /**
         * Renders the placeholder data lists for the Top Selling and Slow Movers reports.
         * This function is only called when the 'reports' view is activated.
         */
        function renderReportLists() {
            const topSellingData = [
                { rank: 1, name: "Rustic Wooden Planter", sales: "150 Units", color: 'text-green-300' },
                { rank: 2, name: "Minimalist Ceramic Pot", sales: "110 Units", color: '' },
                { rank: 3, name: "Premium Soil Mix Bag", sales: "95 Units", color: '' },
                { rank: 4, name: "Small Desk Bonsai Kit", sales: "88 Units", color: 'text-gray-400' },
            ];

            const slowMoversData = [
                { rank: 25, name: "Giant Trellis Kit (Low Demand)", sales: "2 Units", color: 'text-red-300' },
                { rank: 24, name: "Specialized Pruning Shears", sales: "5 Units", color: '' },
                { rank: 23, name: "Vintage Style Watering Can", sales: "6 Units", color: '' },
                { rank: 22, name: "Decorative Garden Gnome", sales: "10 Units", color: 'text-gray-400' },
            ];

            const topSellingContainer = document.getElementById('top-selling-list');
            const slowMoversContainer = document.getElementById('slow-movers-list');

            if (!topSellingContainer || !slowMoversContainer) {
                console.error("Report list containers not found.");
                return;
            }

            // Render Top Selling
            topSellingContainer.innerHTML = topSellingData.map(item => `
                <div class="report-list-item ${item.color}">
                    <span class="rank">#${item.rank}</span>
                    <span class="flex-grow">${item.name}</span>
                    <span class="sales">${item.sales}</span>
                </div>
            `).join('');

            // Render Slow Movers
            slowMoversContainer.innerHTML = slowMoversData.map(item => `
                <div class="report-list-item ${item.color}">
                    <span class="rank">#${item.rank}</span>
                    <span class="flex-grow">${item.name}</span>
                    <span class="sales">${item.sales}</span>
                </div>
            `).join('');
        }

        // --- NESTED TAB LOGIC (Order Fulfillment) ---

        const tabButtons = document.querySelectorAll('#order-tabs .tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane-content');

        function setActiveTab(tabId) {
            // 1. Update Tab Buttons (using CSS classes for design)
            tabButtons.forEach(button => {
                button.classList.remove('active');
                if (button.dataset.tab === tabId) {
                    button.classList.add('active');
                }
            });

            // 2. Update Tab Panes
            tabPanes.forEach(pane => {
                pane.style.display = 'none';
                if (pane.dataset.tabPane === tabId) {
                    pane.style.display = 'block';
                }
            });
        }

        // Attach listeners to all tab buttons
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                setActiveTab(button.dataset.tab);
            });
        });

        // Initialize: Set initial active tab
        setActiveTab('topay');

        // --- INLINE FORM LOGIC (Inventory Add Item) ---

        const inventoryForm = document.getElementById('inline-add-inventory-form');

        // Handles the submission of the new inventory item via the inline form
        function handleAddItemSubmit(event) {
            event.preventDefault();

            // Get form values
            const itemName = document.getElementById('new-item-name').value;
            const category = document.getElementById('new-category').value;
            const unitPrice = parseFloat(document.getElementById('new-unit-price').value).toFixed(2);
            const initialQuantity = parseInt(document.getElementById('new-initial-quantity').value);
            const reorderPoint = parseInt(document.getElementById('new-reorder-point').value);

            // Log the structured data (Placeholder for future Firebase saving)
            console.log('--- Inventory Item Added (Placeholder) ---');
            console.log('Item Name:', itemName);
            console.log('Category:', category);
            console.log('Unit Price:', `₱${unitPrice}`);
            console.log('Initial Quantity:', initialQuantity);
            console.log('Reorder Point:', reorderPoint);
            console.log('-----------------------------------');

            // Temporary function to add the item to the table visually
            addTempItemToTable({ itemName, category, unitPrice, initialQuantity, reorderPoint });

            // Reset the form
            inventoryForm.reset();
        }

        // Function to simulate adding a row to the table
        function addTempItemToTable(item) {
            const tableBody = document.getElementById('inventory-table-body');
            const newId = 'prod-' + Date.now(); // Simple unique ID generation

            // Remove the 'No data' row if it exists
            const noDataRow = tableBody.querySelector('.no-data-row');
            if (noDataRow) {
                noDataRow.remove();
            }

            // Determine badge class for stock
            const badgeClass = item.initialQuantity <= item.reorderPoint ? 'badge-topay' : 'badge-completed';

            const newRow = document.createElement('tr');
            newRow.dataset.itemId = newId; // Assign a unique ID to the row
            newRow.innerHTML = `
                <td>${item.itemName}</td>
                <td>${item.category}</td>
                <td class="price-cell">₱${item.unitPrice}</td>
                <td><span class="badge ${badgeClass}">${item.initialQuantity}</span></td>
                <td>${item.reorderPoint}</td>
                <td>
                    <div style="display: flex; gap: 0.75rem;">
                        <button data-action="edit" class="action-btn">Edit</button>
                        <button data-action="remove" class="action-btn">Remove</button>
                    </div>
                </td>
            `;

            // Add the new row to the start of the table
            tableBody.prepend(newRow);
        }

        // Event Listener for Inline Form Submission
        inventoryForm.addEventListener('submit', handleAddItemSubmit);


        // --- EDIT/REMOVE LOGIC (Inventory Table Actions) ---

        /**
         * Attaches a single event listener to the table body to handle Edit and Remove actions.
         */
        function setupInventoryTableActions() {
            const tableBody = document.getElementById('inventory-table-body');
            tableBody.addEventListener('click', (event) => {
                const target = event.target.closest('.action-btn');
                if (!target) return;

                const action = target.dataset.action;
                const row = target.closest('tr');

                // Extract data from the row
                const cells = row.querySelectorAll('td');
                const itemData = {
                    id: row.dataset.itemId,
                    name: cells[0].textContent,
                    // Category is cells[1] but not included in edit modal for simplicity
                    price: parseFloat(cells[2].textContent.replace('₱', '').replace(',', '')),
                    stock: parseInt(cells[3].querySelector('.badge').textContent),
                    reorder: parseInt(cells[4].textContent)
                };


                if (action === 'edit') {
                    openEditModal(itemData);
                } else if (action === 'remove') {
                    removeItem(row);
                }
            });
        }

        /**
         * Removes the row element from the DOM.
         */
        function removeItem(rowElement) {
            // In a real app, this would trigger a Firebase delete call.
            console.log(`[ACTION] Removing item: ${rowElement.dataset.itemId} - ${rowElement.querySelector('td').textContent}`);

            // Simple removal from DOM
            rowElement.remove();

            // Check if the table is empty and show a placeholder if needed
            checkTableEmpty();
        }

        /**
         * Checks if the inventory table is empty and inserts a placeholder row if so.
         */
        function checkTableEmpty() {
            const tableBody = document.getElementById('inventory-table-body');
            if (tableBody.children.length === 0) {
                const newRow = document.createElement('tr');
                newRow.classList.add('no-data-row');
                newRow.innerHTML = `<td colspan="6" class="text-center text-gray-500 py-4">No inventory items. Add one above!</td>`;
                tableBody.appendChild(newRow);
            }
        }

        /**
         * Populates and displays the edit modal.
         */
        function openEditModal(itemData) {
            const modal = document.getElementById('edit-modal');

            // Store the item ID in the modal element for reference during save
            modal.dataset.editingRowId = itemData.id;

            // Populate form fields with animation
            const fields = [
                { id: 'edit-item-name', value: itemData.name },
                { id: 'edit-unit-price', value: itemData.price },
                { id: 'edit-initial-quantity', value: itemData.stock },
                { id: 'edit-reorder-point', value: itemData.reorder }
            ];

            fields.forEach(field => {
                const element = document.getElementById(field.id);
                element.value = field.value;
                element.style.transition = 'all 0.2s ease';
                element.style.borderColor = 'var(--accent-plain)';
                setTimeout(() => {
                    element.style.borderColor = 'rgba(31, 42, 43, 0.06)';
                }, 500);
            });

            // Show the modal with animation
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            // Focus the first input
            document.getElementById('edit-item-name').focus();
        }

        /**
         * Hides the edit modal.
         */
        function closeEditModal() {
            const modal = document.getElementById('edit-modal');
            
            // Add fade-out animation
            modal.style.opacity = '0';
            modal.style.transform = 'translateY(-10px)';
            
            // Hide after animation
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                modal.style.opacity = '';
                modal.style.transform = '';
            }, 200);
        }

        /**
         * Handles the saving of the edited item data and updates the DOM.
         */
        function saveEdit(event) {
            event.preventDefault();

            const modal = document.getElementById('edit-modal');
            const itemId = modal.dataset.editingRowId;

            // Get new values from the edit form
            const newName = document.getElementById('edit-item-name').value;
            // The category is ignored for now since it's not in the edit modal
            const newPrice = parseFloat(document.getElementById('edit-unit-price').value).toFixed(2);
            const newStock = parseInt(document.getElementById('edit-initial-quantity').value);
            const newReorder = parseInt(document.getElementById('edit-reorder-point').value);

            // 1. Find the corresponding row in the DOM
            const row = document.querySelector(`tr[data-item-id="${itemId}"]`);
            if (row) {
                // 2. Update the row's content
                const cells = row.querySelectorAll('td');

                // Update data values (Name, Price, Stock, Reorder Point are at indices 0, 2, 3, 4)
                cells[0].textContent = newName;
                cells[2].textContent = `₱${newPrice}`;
                cells[4].textContent = newReorder;

                // Update Stock and badge color
                const badge = cells[3].querySelector('.badge');
                badge.textContent = newStock;
                badge.classList.remove('badge-topay', 'badge-completed');
                const badgeClass = newStock <= newReorder ? 'badge-topay' : 'badge-completed';
                badge.classList.add(badgeClass);
            }

            console.log(`[ACTION] Saved changes for item ${itemId}: Name: ${newName}, Stock: ${newStock}`);
            closeEditModal();
        }

        // --- INITIALIZATION ---

        // Add the call to setup listeners when the script runs
        window.addEventListener('load', () => {
            setupInventoryTableActions();
        });


        // --- LOGOUT FUNCTIONALITY ---
        
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    // Clear localStorage session data (change key if needed)
    localStorage.removeItem("ehw_user");
    localStorage.removeItem("ehw_admin"); // optional, if you store admin separately

    alert("✅ You have been logged out.");
    window.location.href = "login.html"; // redirect to your login page
  });
});
