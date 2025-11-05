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

            // 3. Dashboard Specific Initialization (Reports are now here)
            if (viewId === 'dashboard') {
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

        // --- REPORT LISTS RENDERING LOGIC (Now part of Dashboard) ---

        /**
         * Renders the placeholder data lists for the Top Selling and Slow Movers reports.
         * This function is now called when the 'dashboard' view is activated.
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


        // --- ORDER RENDERING AND PROCESSING LOGIC ---

            const ADMIN_KEY = 'ehw_admin_orders_v1';

            // Global variable to hold the ID and current status of the order being processed
            let currentProcessingOrder = { id: null, status: null };

            /**
             * Calculates the total quantity of items in an order's cart.
             * @param {Object} order The order object containing the cart array.
             * @returns {number} The sum of quantities in the cart.
             */
            function calculateTotalQuantity(order) {
                if (!order || !order.cart || !Array.isArray(order.cart)) {
                    return 0;
                }
                return order.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
            }

            /**
             * Small HTML-escape helper used when rendering order/customer names
             */
            function escapeHtml(str) {
                return String(str || '').replace(/[&<>"']/g, function (m) {
                    return ({ '&': '&amp;', '<': '&lt;', '>': '&quot;', "'": '&#39;' })[m];
                });
            }

            /**
             * Determines the appropriate badge class based on order status.
             */
            function getBadgeClass(status) {
                const s = (status || '').toLowerCase();
                if (s.includes('pay') || s.includes('pending')) return 'badge-topay';
                if (s.includes('ship')) return 'badge-toship';
                if (s.includes('receive') || s.includes('transit')) return 'badge-toreceive'; // RE-ADDED TO RECEIVE
                if (s.includes('complete')) return 'badge-completed';
                if (s.includes('cancel')) return 'badge-cancelled';
                if (s.includes('return')) return 'badge-returned';
                if (s.includes('refund')) return 'badge-refunded';
                return 'badge'; // Default badge
            }

            /**
             * Generates an HTML row for an order, specific to the required columns of the pane.
             */
            function createOrderRow(order, paneId) {
                const customer = (order.user && (order.user.firstName || order.user.email)) ? (order.user.firstName || order.user.email) : (order.customer || 'Guest');
                const badgeClass = getBadgeClass(order.status);
                const totalAmount = Number(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
                const date = new Date(order.createdAt).toLocaleString();
                const totalQuantity = calculateTotalQuantity(order);

                let actionButton = '';
                let cells = '';
                let colspan = 0;

                // SVG icon for package (used for quantity column)
                const packageIcon = `
                    <svg viewBox="0 0 24 24" class="text-gray-400 stroke-2" style="width:1rem; height:1rem; min-width:1rem;">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                `;

                // Common cell for quantity display
                const quantityCell = `
                    <td class="font-bold text-center" style="min-width: 60px;" title="Total Items: ${totalQuantity}">
                        <span style="display:inline-flex; align-items:center; gap:0.25rem; font-weight: 700; color: var(--text);">
                            ${packageIcon}
                            ${totalQuantity}
                        </span>
                    </td>
                `;

                switch (paneId) {
                    case 'topay':
                        actionButton = `<button data-action="process-order" data-order-id="${order.id}" data-current-status="To Pay" class="action-btn">Process Order</button>`;
                        cells = `
                            <td class="font-semibold text-gray-700">#${order.id}</td>
                            <td class="font-medium">${escapeHtml(String(customer))}</td>
                            <td class="price-cell">₱${totalAmount}</td>
                            ${quantityCell}
                            <td>${date}</td>
                            <td><span class="badge ${badgeClass}">${order.status || 'Pending'}</span></td>
                            <td class="action-cell-wrapper" style="min-width: 150px;">${actionButton}</td>
                        `;
                        colspan = 7;
                        break;
                    case 'toship':
                        actionButton = `<button data-action="process-order" data-order-id="${order.id}" data-current-status="To Ship" class="action-btn">Mark In Transit</button>`; // REVERTED ACTION
                        cells = `
                            <td class="font-semibold text-gray-700">#${order.id}</td>
                            <td class="font-medium">${escapeHtml(String(customer))}</td>
                            <td class="price-cell">₱${totalAmount}</td>
                            ${quantityCell}
                            <td>${date}</td>
                            <td class="action-cell-wrapper" style="min-width: 220px;">${actionButton}</td>
                        `;
                        colspan = 6;
                        break;
                    case 'toreceive': // RE-ADDED CASE: NO ADMIN ACTION
                        cells = `
                            <td class="font-semibold text-gray-700">#${order.id}</td>
                            <td class="font-medium">${escapeHtml(String(customer))}</td>
                            <td class="price-cell">₱${totalAmount}</td>
                            ${quantityCell}
                            <td>${date}</td>
                            <td><span class="badge ${badgeClass}">${order.status || 'In Transit'}</span></td>
                        `;
                        colspan = 6;
                        break;
                    case 'completed':
                        cells = `
                            <td class="font-semibold text-gray-700">#${order.id}</td>
                            <td class="font-medium">${escapeHtml(String(customer))}</td>
                            <td class="price-cell">₱${totalAmount}</td>
                            ${quantityCell}
                            <td>${date}</td>
                            <td><span class="badge ${badgeClass}">${order.status || 'Completed'}</span></td>
                        `;
                        colspan = 6;
                        break;
                    case 'cancelled':
                    case 'returned':
                    case 'refunded':
                        const specialDate = (paneId === 'cancelled' && order.cancellationDate) ? new Date(order.cancellationDate).toLocaleString() :
                                            (paneId === 'returned' && order.returnDate) ? new Date(order.returnDate).toLocaleString() :
                                            (paneId === 'refunded' && order.refundDate) ? new Date(order.refundDate).toLocaleString() : date;
                        cells = `
                            <td class="font-semibold text-gray-700">#${order.id}</td>
                            <td class="font-medium">${escapeHtml(String(customer))}</td>
                            <td class="price-cell">₱${totalAmount}</td>
                            <td>${specialDate}</td>
                        `;
                        colspan = 4; // Headers are different for these panes
                        break;
                    default:
                        cells = `<td>#${order.id}</td><td>${escapeHtml(String(customer))}</td><td class="price-cell">₱${totalAmount}</td><td>${date}</td><td><span class="badge ${badgeClass}">${order.status || 'Other'}</span></td>`;
                        colspan = 5;
                        break;
                }

                // If cells are generated, wrap them in a <tr>
                if (cells) {
                    const tr = document.createElement('tr');
                    tr.dataset.orderId = order.id;
                    tr.innerHTML = cells;
                    return tr;
                }

                // Fallback for empty state row structure
                return { emptyRow: true, colspan: colspan };
            }

            /**
             * Renders admin orders into the appropriate table based on status.
             */
            function renderAdminOrders() {
                const orders = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];

                // Group orders by status (toreceive is back)
                const groupedOrders = { topay: [], toship: [], toreceive: [], completed: [], cancelled: [], returned: [], refunded: [] };

                orders.forEach(o => {
                    const s = (o.status || '').toLowerCase();
                    if (s.includes('pay') || s.includes('pending')) groupedOrders.topay.push(o);
                    else if (s.includes('ship')) groupedOrders.toship.push(o);
                    else if (s.includes('receive') || s.includes('transit')) groupedOrders.toreceive.push(o); // RE-ADDED LOGIC
                    else if (s.includes('complete')) groupedOrders.completed.push(o);
                    else if (s.includes('cancel')) groupedOrders.cancelled.push(o);
                    else if (s.includes('return')) groupedOrders.returned.push(o);
                    else if (s.includes('refund')) groupedOrders.refunded.push(o);
                });

                // Map of pane IDs to their corresponding table body IDs and empty messages
                const paneMap = {
                    topay: { id: 'orders-topay-body', cols: 7, msg: 'No orders awaiting payment.' },
                    toship: { id: 'orders-toship-body', cols: 6, msg: 'No orders ready for shipment.' },
                    toreceive: { id: 'orders-toreceive-body', cols: 6, msg: 'Orders currently in transit and awaiting customer action.' }, // RE-ADDED
                    completed: { id: 'orders-completed-body', cols: 6, msg: 'No recently completed orders.' },
                    cancelled: { id: 'orders-cancelled-body', cols: 4, msg: 'No cancelled orders found.' },
                    returned: { id: 'orders-returned-body', cols: 4, msg: 'No items awaiting return processing.' },
                    refunded: { id: 'orders-refunded-body', cols: 4, msg: 'No recent refunds issued.' },
                };

                // Update tab button labels and render all tables
                const tabLabels = {
                    topay: 'To Pay', toship: 'To Ship', toreceive: 'To Receive', // RE-ADDED
                    completed: 'Completed', cancelled: 'Cancelled', returned: 'Returned', refunded: 'Refunded'
                };

                Object.keys(paneMap).forEach(key => {
                    const btn = document.querySelector(`#order-tabs .tab-button[data-tab="${key}"]`);
                    if (btn) btn.textContent = `${tabLabels[key]} (${groupedOrders[key].length})`;

                    const container = document.getElementById(paneMap[key].id);
                    if (container) {
                        container.innerHTML = ''; // Clear previous content

                        if (!groupedOrders[key].length) {
                            container.innerHTML = `<tr><td colspan="${paneMap[key].cols}" class="text-center text-gray-500 py-4">${paneMap[key].msg}</td></tr>`;
                        } else {
                            groupedOrders[key].forEach(o => {
                                const row = createOrderRow(o, key);
                                if (row && !row.emptyRow) {
                                    container.appendChild(row);
                                }
                            });
                        }
                    }
                });

                // Call action setup after rendering the tables
                setupOrdersTableActions();
            }


            /**
             * Opens the Order Process modal for a specific order.
             */
            function openOrderProcessModal(orderId, currentStatus) {
                const modal = document.getElementById('order-process-modal');
                const idDisplay = document.getElementById('process-order-id');
                const buttonsContainer = document.getElementById('process-modal-buttons');
                const promptDisplay = document.getElementById('process-order-prompt');

                currentProcessingOrder.id = orderId;
                currentProcessingOrder.status = currentStatus;
                idDisplay.textContent = orderId;
                buttonsContainer.innerHTML = ''; // Clear existing buttons

                // Define next possible actions based on current status
                let actions = [];
                let prompt = 'Select the next status for this order:';

                if (currentStatus === 'To Pay' || currentStatus === 'Pending') {
                    prompt = 'Select how to proceed with this payment-pending order:';
                    actions = [
                        { status: 'To Ship', label: 'Mark as Paid & Ready to Ship', color: 'var(--accent-plain)' },
                        { status: 'Cancelled', label: 'Cancel Order', color: 'var(--danger)' },
                        { status: 'Refunded', label: 'Issue Refund', color: 'var(--success)' },
                    ];
                } else if (currentStatus === 'To Ship') {
                    prompt = 'Mark this order as having been shipped and move it to the customer "To Receive" queue:';
                    actions = [
                        // REVERTED: Now changes to 'In Transit' which falls under the 'toreceive' bucket
                        { status: 'In Transit', label: 'Mark In Transit / Shipped', color: 'var(--success)' },
                        { status: 'Cancelled', label: 'Cancel Order (Before Shipping)', color: 'var(--danger)' },
                    ];
                } else if (currentStatus.includes('Receive') || currentStatus.includes('Transit')) {
                    // CRITICAL: Block all actions for admin on To Receive status
                    prompt = 'Admin action is not authorized for this status. The order is awaiting customer receipt, cancellation, or return.';
                    actions = []; // Empty array means no buttons will be shown
                }

                promptDisplay.textContent = prompt;

                // Create and inject buttons
                if (actions.length > 0) {
                    actions.forEach(action => {
                        const btn = document.createElement('button');
                        btn.className = 'status-btn';
                        btn.dataset.status = action.status;
                        btn.style.backgroundColor = action.color;
                        btn.style.color = 'white';
                        btn.textContent = action.label;
                        buttonsContainer.appendChild(btn);
                    });
                } else {
                    // Show a message if no actions are available
                     buttonsContainer.innerHTML = `<p style="color: var(--danger); font-weight: 600;">No actions available for the admin on this order status.</p>`;
                }

                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }

            /**
             * Hides the Order Process modal.
             */
            function closeOrderProcessModal() {
                const modal = document.getElementById('order-process-modal');

                // Add fade-out animation
                modal.style.opacity = '0';
                modal.style.transform = 'translateY(-10px)';

                // Hide after animation
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    modal.style.opacity = '';
                    modal.style.transform = '';
                    currentProcessingOrder.id = null; // Clear the stored ID
                    currentProcessingOrder.status = null;
                }, 200);
            }

            /**
             * Handles the click event for status update buttons inside the modal.
             */
            function handleStatusUpdate(event) {
                const target = event.target.closest('.status-btn');
                if (!target) return;

                const newStatus = target.dataset.status;
                const orderId = currentProcessingOrder.id;

                if (!orderId) {
                    console.error("No order ID found for status update.");
                    return;
                }

                let orders = JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];

                // Find and update the specific order
                const updatedOrders = orders.map(o => {
                    if (String(o.id) === String(orderId)) {
                        console.log(`[ACTION] Updating Order ${orderId} status from ${o.status} to: ${newStatus}`);

                        const updateData = { status: newStatus, lastUpdated: new Date().toISOString() };

                        // Add specific dates for final statuses (for better history tracking)
                        if (newStatus === 'Completed') updateData.completionDate = new Date().toISOString();
                        if (newStatus === 'Cancelled') updateData.cancellationDate = new Date().toISOString();
                        if (newStatus === 'Returned') updateData.returnDate = new Date().toISOString();
                        if (newStatus === 'Refunded') updateData.refundDate = new Date().toISOString();
                        if (newStatus === 'In Transit') updateData.shippingDate = new Date().toISOString(); // RE-ADDED shipping date

                        return { ...o, ...updateData };
                    }
                    return o;
                });

                localStorage.setItem(ADMIN_KEY, JSON.stringify(updatedOrders));

                // After updating the underlying data, re-render the tables and close the modal
                renderAdminOrders();
                closeOrderProcessModal();

                // Simple confirmation
                // Note: Using alert() for consistency with existing logout/login logic
                alert(`Order ${orderId} successfully marked as ${newStatus}!`);
            }

            /**
             * Attaches event listeners for order actions (Process Order buttons).
             */
            function setupOrdersTableActions() {
                // Remove existing listeners to prevent duplicates
                document.querySelectorAll('.data-table tbody').forEach(tbody => {
                    tbody.removeEventListener('click', handleProcessOrderClick);
                });

                // Attach a single delegated listener to the main content area for all table action buttons
                document.getElementById('view-orders').addEventListener('click', handleProcessOrderClick);

                function handleProcessOrderClick(event) {
                    const target = event.target.closest('button[data-action="process-order"]');
                    if (!target) return;

                    const orderId = target.dataset.orderId;
                    const currentStatus = target.dataset.currentStatus;
                    if (orderId && currentStatus) {
                        openOrderProcessModal(orderId, currentStatus);
                    }
                }

                // Setup listener for status buttons inside the modal
                const processModal = document.getElementById('order-process-modal');
                processModal.removeEventListener('click', handleStatusUpdate);
                processModal.addEventListener('click', handleStatusUpdate);
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
            // Ensure no duplicate listeners are attached for the Inventory table
            tableBody.removeEventListener('click', handleInventoryAction);
            tableBody.addEventListener('click', handleInventoryAction);

            // Also setup the Order actions here, as this runs on load
            setupOrdersTableActions();
        }

        function handleInventoryAction(event) {
            const target = event.target.closest('.action-btn');
            if (!target) return;

            const action = target.dataset.action;
            const row = target.closest('tr');

            // Prevent confusion with the new order button
            if (action && action.startsWith('process-')) return;

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
            renderReportLists(); // Call reports render on initial load
        });


        // --- LOGOUT FUNCTIONALITY ---

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", () => {
    // Note: Using confirm() for consistency with existing code pattern.
    // Replace with custom modal in a non-iframe environment
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    // Clear localStorage session data (change key if needed)
    localStorage.removeItem("ehw_user");
    localStorage.removeItem("ehw_admin"); // optional, if you store admin separately

    // Note: Using alert() for consistency with existing code pattern.
    // Replace with custom modal in a non-iframe environment
    alert("✅ You have been logged out.");
    window.location.href = "login.html"; // redirect to your login page
  });
});


// --- LOAD ORDERS ON STARTUP ---
window.addEventListener('storage', e => {
  if (e.key === ADMIN_KEY) renderAdminOrders();
});

// ✅ Render on page load
document.addEventListener('DOMContentLoaded', renderAdminOrders);

// Also listen for same-window updates when orders are created in the same document
window.addEventListener('ehw_admin_orders_updated', function (e) {
    // optional: you can inspect e.detail for the newly created order
    renderAdminOrders();
});