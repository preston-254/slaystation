// Admin Dashboard Script
let orders = [];
let filteredOrders = []; // Initialize filtered orders array
const ADMIN_EMAIL = 'preston.mwendwa@riarauniversity.ac.ke'; // Admin email
// Use DELIVERY_FEE from window or default to 200
const DELIVERY_FEE = (typeof window !== 'undefined' && window.DELIVERY_FEE) ? window.DELIVERY_FEE : 200;

// Load orders from localStorage
function loadOrders() {
    const savedOrders = localStorage.getItem('slayStationOrders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    renderOrders();
}

// Save orders to localStorage
function saveOrders() {
    localStorage.setItem('slayStationOrders', JSON.stringify(orders));
}

// Authenticate admin
function authenticateAdmin() {
    const emailInput = document.getElementById('adminEmail');
    if (!emailInput) {
        // Fallback to prompt if input field doesn't exist
        const email = prompt('Enter admin email:');
        if (email && email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase()) {
            const loginSection = document.getElementById('loginSection');
            const adminDashboard = document.getElementById('adminDashboard');
            if (loginSection) loginSection.style.display = 'none';
            if (adminDashboard) adminDashboard.style.display = 'block';
            loadOrders();
            return true;
        } else {
            alert('Invalid email! Access denied.');
            return false;
        }
    }
    
    const email = emailInput.value.trim();
    const errorMsg = document.getElementById('loginError');
    
    if (!email) {
        if (errorMsg) {
            errorMsg.textContent = 'Please enter your email address';
            errorMsg.style.display = 'block';
        }
        return false;
    }
    
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const loginSection = document.getElementById('loginSection');
        const adminDashboard = document.getElementById('adminDashboard');
        if (loginSection) loginSection.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        if (errorMsg) errorMsg.style.display = 'none';
        loadOrders();
        return true;
    } else {
        if (errorMsg) {
            errorMsg.textContent = 'Invalid email! Access denied.';
            errorMsg.style.display = 'block';
        } else {
            alert('Invalid email! Access denied.');
        }
        return false;
    }
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.authenticateAdmin = authenticateAdmin;
    window.loadOrders = loadOrders;
    window.updateOrderStatus = updateOrderStatus;
    window.deleteOrder = deleteOrder;
    window.setDeliveryFee = setDeliveryFee;
    window.confirmAndDispatchNairobi = confirmAndDispatchNairobi;
    window.verifyMpesaCode = verifyMpesaCode;
    window.rejectMpesaCode = rejectMpesaCode;
    window.selectRiderForDispatch = selectRiderForDispatch;
}

// Render orders
function renderOrders() {
    // Check if filters are active
    const searchInput = document.getElementById('orderSearchInput');
    const hasActiveFilters = searchInput && searchInput.value.trim() !== '';
    
    // If filters are active, use filtered orders, otherwise use all orders
    if (hasActiveFilters || filteredOrders.length > 0) {
        if (typeof filterOrders === 'function') {
            filterOrders();
            return;
        }
    }
    
    // Reset filtered orders if no filters
    filteredOrders = [];
    
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">No orders yet! 💝</p>';
        updateStats();
        return;
    }
    
    // Sort orders by date (newest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const statusClass = getStatusClass(order.status);
        const statusIcon = getStatusIcon(order.status);
        
        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.id}</h3>
                    <p class="order-date">${new Date(order.date).toLocaleString()}</p>
                    <p class="order-customer"><strong>${order.name}</strong> - ${order.email}</p>
                    <p class="order-phone">📱 ${order.phone}</p>
                    <p class="order-address">📍 ${order.address}</p>
                </div>
                <div class="order-status ${statusClass}">
                    <span>${statusIcon} ${order.status.toUpperCase()}</span>
                </div>
            </div>
            
            <!-- Customer Communication -->
            <div style="margin-bottom: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 10px;">
                <p style="margin: 0 0 0.75rem 0; font-weight: 600; color: var(--dark);">📞 Contact Customer:</p>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="comm-btn call-btn" onclick="adminCallCustomer('${order.phone}')" title="Call Customer">
                        📞 Call
                    </button>
                    <button class="comm-btn sms-btn" onclick="adminSmsCustomer('${order.phone}', ${order.id})" title="Send SMS">
                        💬 SMS
                    </button>
                    <button class="comm-btn whatsapp-btn" onclick="adminWhatsappCustomer('${order.phone}', ${order.id})" title="WhatsApp">
                        💬 WhatsApp
                    </button>
                    ${order.deliveryProof ? `
                        <button class="comm-btn proof-btn" onclick="viewDeliveryProof(${order.id})" title="View Delivery Proof" style="background: #9C27B0; color: white;">
                            📸 Proof
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="order-items">
                <h4>Items:</h4>
                ${order.items.map(item => `
                    <div class="order-item-row">
                        <span>${item.name} x${item.quantity}</span>
                        <span>KSH ${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                `).join('')}
                ${order.giftWrap ? '<div class="order-item-row"><span>Gift Card with Message 💌</span><span>KSH 80</span></div>' : ''}
                <div class="order-item-row total-row">
                    <strong>Subtotal:</strong>
                    <strong>KSH ${order.subtotal.toLocaleString()}</strong>
                </div>
                <div class="order-item-row">
                    <span>Delivery Fee:</span>
                    ${order.deliveryFee === null || order.deliveryFee === undefined ? 
                        `<span style="color: #ff9800;">⏳ Pending Admin Input</span>` :
                        `<span class="${order.deliveryFeePaid ? 'paid' : 'unpaid'}">KSH ${order.deliveryFee.toLocaleString()} ${order.deliveryFeePaid ? '✅ Paid' : '❌ Unpaid'}</span>`
                    }
                    ${order.outsideNairobi ? 
                        `<div style="font-size: 0.85rem; color: #ff9800; margin-top: 0.25rem; font-weight: 600;">
                            🌍 Outside Nairobi - Manual fee required
                        </div>` : ''
                    }
                    ${order.deliveryFeeAutoCalculated && order.deliveryDistance && order.withinNairobi ? 
                        `<div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                            📍 Auto-calculated (${order.deliveryDistance} km from Parklands, KSH 40/km)
                        </div>` : ''
                    }
                </div>
                ${order.mpesaCode ? `
                <div class="order-item-row">
                    <span>M-Pesa Code:</span>
                    <span style="font-family: monospace; background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 5px;">${order.mpesaCode}</span>
                </div>
                ` : ''}
                <div class="order-item-row total-row">
                    <strong>Total:</strong>
                    <strong>KSH ${order.total.toLocaleString()}</strong>
                </div>
                <div class="order-item-row">
                    <span>Payment Method:</span>
                    <span>${order.payment}</span>
                </div>
            </div>
            
            <div class="order-actions">
                ${order.deliveryFee === null || order.deliveryFee === undefined ? `
                    ${order.outsideNairobi ? `
                        <!-- Only show delivery fee input for orders outside Nairobi -->
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #ffe6e6; border-radius: 10px; border: 2px solid #ff6b6b;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                🌍 Set Delivery Fee (Outside Nairobi):
                            </label>
                            <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: #fff; border-radius: 8px; border-left: 4px solid #ff6b6b;">
                                <div style="font-weight: 600; color: #d32f2f; margin-bottom: 0.25rem;">
                                    ⚠️ Address is outside Nairobi
                                </div>
                                <div style="font-size: 0.85rem; color: #666; margin-top: 0.25rem;">
                                    Please set the delivery fee manually. Customer will be notified when you set the fee.
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="number" id="deliveryFeeInput_${order.id}" 
                                    placeholder="Enter amount" 
                                    min="0" 
                                    style="flex: 1; padding: 0.5rem; border: 2px solid #ddd; border-radius: 5px;">
                                <button class="mark-paid-btn" onclick="setDeliveryFee(${order.id})">Set Fee 💰</button>
                            </div>
                        </div>
                    ` : order.withinNairobi && order.deliveryFeeAutoCalculated && order.deliveryFee ? `
                        <!-- For Nairobi orders with auto-calculated fee, auto-confirm and dispatch -->
                        <div style="margin-bottom: 1rem; padding: 1rem; background: #e7f3ff; border-radius: 10px; border: 2px solid #2196F3;">
                            <div style="font-weight: 600; color: #1976D2; margin-bottom: 0.5rem;">
                                ✅ Nairobi Delivery - Auto-Confirmed
                            </div>
                            <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.75rem;">
                                Delivery Fee: KSH ${order.deliveryFee.toLocaleString()} (Auto-calculated)
                                ${order.deliveryDistance ? ` - ${order.deliveryDistance} km` : ''}
                            </div>
                            ${order.payment === 'mpesa' && order.mpesaCode ? `
                                <div style="background: #e8f5e9; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem; border-left: 4px solid #4CAF50;">
                                    <div style="font-weight: 600; color: #2e7d32; margin-bottom: 0.25rem;">
                                        💳 Payment Confirmed
                                    </div>
                                    <div style="font-size: 0.85rem; color: #666;">
                                        M-Pesa Code: <strong>${order.mpesaCode}</strong>
                                    </div>
                                </div>
                            ` : ''}
                            <button class="mark-paid-btn" onclick="confirmAndDispatchNairobi(${order.id})" 
                                style="width: 100%; background: linear-gradient(135deg, #4CAF50, #45a049);">
                                ✅ Confirm Payment & Dispatch Order
                            </button>
                        </div>
                    ` : ''}
                ` : ''}
                ${order.deliveryFeeSet && order.mpesaCode ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: ${order.mpesaCodeVerified ? '#d4edda' : '#d1ecf1'}; border-radius: 10px; border: 2px solid ${order.mpesaCodeVerified ? '#155724' : '#0c5460'};">
                        <p style="margin-bottom: 0.5rem;">
                            <strong>M-Pesa Code:</strong> 
                            <span style="font-family: monospace; background: white; padding: 0.25rem 0.5rem; border-radius: 5px; font-weight: 600; font-size: 1.1rem;">${order.mpesaCode}</span>
                            ${order.mpesaCodeVerified ? '<span style="color: #155724; margin-left: 0.5rem;">✅ Verified</span>' : '<span style="color: #0c5460; margin-left: 0.5rem;">⏳ Pending Verification</span>'}
                        </p>
                        ${order.mpesaCodeSubmittedTime ? `<p style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Submitted: ${new Date(order.mpesaCodeSubmittedTime).toLocaleString()}</p>` : ''}
                        ${!order.mpesaCodeVerified ? `
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button class="mark-paid-btn" onclick="verifyMpesaCode(${order.id})" style="flex: 1; min-width: 150px;">Verify & Mark Paid ✅</button>
                                <button class="delete-order-btn" onclick="rejectMpesaCode(${order.id})" style="background: #dc3545; flex: 1; min-width: 150px;">Reject Code ❌</button>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                ${order.deliveryFeeSet && !order.mpesaCode && !order.deliveryFeePaid ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #fff3cd; border-radius: 10px; border: 2px solid #ffc107;">
                        <p style="margin-bottom: 0.5rem; color: #856404;"><strong>⏳ Waiting for customer to submit M-Pesa code...</strong></p>
                        <p style="font-size: 0.9rem; color: #666;">Customer has been notified of the delivery fee.</p>
                    </div>
                ` : ''}
                ${order.assignedRider ? `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #e3f2fd; border-radius: 10px; border: 2px solid #2196f3;">
                        <p style="margin-bottom: 0.5rem;"><strong>🚚 Assigned Rider:</strong></p>
                        <p style="color: #1976d2; font-weight: 600;">${order.assignedRider}</p>
                        ${order.assignedTime ? `<p style="font-size: 0.85rem; color: #666; margin-top: 0.5rem;">Assigned: ${new Date(order.assignedTime).toLocaleString()}</p>` : ''}
                    </div>
                ` : ''}
                <input type="checkbox" class="order-checkbox" value="${order.id}" onchange="updateBulkSelection()" style="margin-right: 0.5rem;">
                <select class="status-select" onchange="updateOrderStatus(${order.id}, this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="dispatched" ${order.status === 'dispatched' ? 'selected' : ''}>Dispatched</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="quick-action-btn" onclick="quickConfirm(${order.id})" title="Quick Confirm" style="padding: 0.5rem 1rem; background: #4CAF50; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">✅</button>
                <button class="quick-action-btn" onclick="quickDispatch(${order.id})" title="Quick Dispatch" style="padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">🚚</button>
                <button class="delete-order-btn" onclick="deleteOrder(${order.id})">Delete Order</button>
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
    
    updateStats();
}

// Get status class for styling
function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'processing': 'status-processing',
        'dispatched': 'status-dispatched',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
}

// Get status icon
function getStatusIcon(status) {
    const icons = {
        'pending': '⏳',
        'confirmed': '✅',
        'processing': '🔄',
        'dispatched': '🚚',
        'delivered': '🎉',
        'cancelled': '❌'
    };
    return icons[status] || '⏳';
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // If changing to dispatched, show rider selection
    if (newStatus === 'dispatched' && order.status !== 'dispatched') {
        selectRiderForDispatch(orderId);
        return;
    }
    
    // For other status changes, update directly
    const oldStatus = order.status;
    order.status = newStatus;
    if (newStatus === 'dispatched') {
        order.dispatchTime = new Date().toISOString();
    }
    saveOrders();
    renderOrders();
    showNotification(`Order #${orderId} status updated to ${newStatus}! ✨`);
    
    // Trigger customer notification
    if (typeof window.notifyOrderStatusChange === 'function') {
        window.notifyOrderStatusChange(orderId, newStatus, oldStatus);
    }
}

// Select rider for dispatch
function selectRiderForDispatch(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const RIDER_EMAILS = [
        'preston.mwendwa@riarauniversity.ac.ke',
        'kangethekelvin56@gmail.com'
    ];
    
    // Create rider selection modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 5000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    
    modalContent.innerHTML = `
        <h2 style="margin-bottom: 1rem; color: var(--dark);">🚚 Select Rider for Dispatch</h2>
        <p style="color: #666; margin-bottom: 1.5rem;">Choose which rider to assign Order #${orderId} to:</p>
        <select id="riderSelect" style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 10px; font-family: 'Poppins', sans-serif; font-size: 1rem; margin-bottom: 1.5rem;">
            <option value="">-- Select Rider --</option>
            ${RIDER_EMAILS.map(email => `
                <option value="${email}">${email}</option>
            `).join('')}
        </select>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="cancelDispatch" style="padding: 0.75rem 1.5rem; border: 2px solid #ddd; background: white; border-radius: 10px; cursor: pointer; font-family: 'Poppins', sans-serif;">Cancel</button>
            <button id="confirmDispatch" style="padding: 0.75rem 1.5rem; background: var(--primary-pink); color: white; border: none; border-radius: 10px; cursor: pointer; font-family: 'Poppins', sans-serif; font-weight: 600;">Dispatch Order</button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Handle cancel
    document.getElementById('cancelDispatch').onclick = () => {
        document.body.removeChild(modal);
    };
    
    // Handle confirm
    document.getElementById('confirmDispatch').onclick = () => {
        const selectedRider = document.getElementById('riderSelect').value;
        if (!selectedRider) {
            alert('Please select a rider!');
            return;
        }
        
        order.status = 'dispatched';
        order.dispatchTime = new Date().toISOString();
        order.assignedRider = selectedRider;
        order.assignedTime = new Date().toISOString();
        
        // Add notification
        order.notifications = order.notifications || [];
        order.notifications.push({
            type: 'order_dispatched',
            message: `Your order has been dispatched! Rider: ${selectedRider}`,
            date: new Date().toISOString(),
            read: false
        });
        
        saveOrders();
        renderOrders();
        document.body.removeChild(modal);
        showNotification(`Order #${orderId} dispatched to ${selectedRider}! 🚚`);
    };
}

// Set delivery fee (admin sets the fee)
function setDeliveryFee(orderId, useAutoCalculated = false) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    let fee;
    
    if (useAutoCalculated && order.deliveryFeeAutoCalculated && order.deliveryFee) {
        // Use the auto-calculated fee
        fee = order.deliveryFee;
    } else {
        // Get fee from input field
        const feeInput = document.getElementById(`deliveryFeeInput_${orderId}`);
        if (!feeInput) return;
        
        fee = parseFloat(feeInput.value);
        if (isNaN(fee) || fee < 0) {
            alert('Please enter a valid delivery fee amount!');
            return;
        }
    }
    
    order.deliveryFee = fee;
    order.deliveryFeeSet = true;
    order.deliveryFeeSetTime = new Date().toISOString();
    order.total = order.subtotal + (order.giftWrap ? 80 : 0) + fee;
    
    // Mark that STK push should be sent (simulated)
    order.mpesaStkPushSent = true;
    order.mpesaStkPushTime = new Date().toISOString();
    
    saveOrders();
    renderOrders();
    
    // Notify customer
    if (typeof window.notifyDeliveryFeeSet === 'function') {
        window.notifyDeliveryFeeSet(orderId, fee);
    }
    
    // Notify customer (store notification in order)
    order.deliveryFeeNotificationSent = true;
    order.notifications = order.notifications || [];
    order.notifications.push({
        type: 'delivery_fee_set',
        message: `📱 M-Pesa Payment Request: You will receive a payment prompt on your phone for KSH ${fee.toLocaleString()}. Just enter your M-Pesa PIN when prompted!`,
        date: new Date().toISOString()
    });
    saveOrders();
    
    showNotification(`Delivery fee set to KSH ${fee.toLocaleString()} for Order #${orderId}! Customer will be notified. 📧`);
}

// Auto-confirm payment and dispatch for Nairobi deliveries
function confirmAndDispatchNairobi(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!order.withinNairobi) {
        alert('This function is only for Nairobi deliveries!');
        return;
    }
    
    if (!order.deliveryFeeAutoCalculated || !order.deliveryFee) {
        alert('Delivery fee not calculated! Please set it first.');
        return;
    }
    
    // Confirm payment (if M-Pesa code exists)
    if (order.payment === 'mpesa' && order.mpesaCode) {
        order.deliveryFeePaid = true;
        order.deliveryFeePaidTime = new Date().toISOString();
        order.mpesaCodeVerified = true;
    } else if (order.payment === 'mpesa') {
        // If M-Pesa but no code yet, mark as pending payment
        order.deliveryFeePaid = false;
    } else {
        // Cash on delivery
        order.deliveryFeePaid = false;
    }
    
    // Set delivery fee
    order.deliveryFeeSet = true;
    order.deliveryFeeSetTime = new Date().toISOString();
    order.total = order.subtotal + (order.giftWrap ? 80 : 0) + order.deliveryFee;
    
    // Update status to confirmed and then dispatch
    const oldStatus = order.status;
    order.status = 'confirmed';
    
    // Auto-dispatch
    order.status = 'dispatched';
    order.dispatchTime = new Date().toISOString();
    
    // Add notifications
    order.notifications = order.notifications || [];
    order.notifications.push({
        type: 'order_confirmed',
        message: `✅ Your order has been confirmed and is being prepared!`,
        date: new Date().toISOString()
    });
    order.notifications.push({
        type: 'order_dispatched',
        message: `🚚 Your order has been dispatched! It's on the way to you.`,
        date: new Date().toISOString()
    });
    
    saveOrders();
    renderOrders();
    
    // Trigger notifications
    if (typeof window.notifyOrderStatusChange === 'function') {
        window.notifyOrderStatusChange(orderId, 'confirmed', oldStatus);
        window.notifyOrderStatusChange(orderId, 'dispatched', 'confirmed');
    }
    
    showNotification(`Order #${orderId} confirmed and dispatched! 🚚`);
}

// Verify M-Pesa code and mark as paid
function verifyMpesaCode(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!order.mpesaCode) {
        alert('No M-Pesa code found for this order!');
        return;
    }
    
    if (confirm(`Verify M-Pesa code ${order.mpesaCode} for Order #${orderId}?\n\nDelivery Fee: KSH ${order.deliveryFee.toLocaleString()}\n\nThis will mark the delivery fee as paid and move the order to processing.`)) {
        order.deliveryFeePaid = true;
        order.deliveryFeePaidTime = new Date().toISOString();
        order.mpesaCodeVerified = true;
        const oldStatus = order.status;
        order.status = 'processing'; // Move to processing after payment verified
        
        // Notify customer
        if (typeof window.notifyPaymentReceived === 'function') {
            window.notifyPaymentReceived(orderId);
        }
        
        if (typeof window.notifyOrderStatusChange === 'function') {
            window.notifyOrderStatusChange(orderId, 'processing', oldStatus);
        }
        
        order.notifications = order.notifications || [];
        order.notifications.push({
            type: 'payment_verified',
            message: `✅ Your M-Pesa payment (Code: ${order.mpesaCode}) has been verified! Your order is now being processed.`,
            date: new Date().toISOString(),
            read: false
        });
        
        saveOrders();
        renderOrders();
        showNotification(`✅ M-Pesa code verified! Order #${orderId} marked as paid and moved to processing!`);
    }
}

// Reject M-Pesa code
function rejectMpesaCode(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!order.mpesaCode) {
        alert('No M-Pesa code found for this order!');
        return;
    }
    
    const reason = prompt(`Enter reason for rejecting M-Pesa code ${order.mpesaCode} (optional):`);
    const rejectedCode = order.mpesaCode; // Save the rejected code for notification
    order.mpesaCode = null; // Clear code so customer can submit new one
    order.mpesaCodeRejected = true;
    order.mpesaCodeRejectionReason = reason || 'Invalid code';
    order.mpesaCodeVerified = false;
    
    // Notify customer
    order.notifications = order.notifications || [];
    order.notifications.push({
        type: 'payment_rejected',
        message: `❌ Your M-Pesa code (${rejectedCode}) was rejected. ${reason ? 'Reason: ' + reason : 'Please submit a valid M-Pesa confirmation code.'}`,
        date: new Date().toISOString(),
        read: false
    });
    
    saveOrders();
    renderOrders();
    showNotification(`❌ M-Pesa code rejected for Order #${orderId}. Customer will be notified.`);
}

// Delete order
function deleteOrder(orderId) {
    if (confirm(`Are you sure you want to delete Order #${orderId}?`)) {
        orders = orders.filter(o => o.id !== orderId);
        saveOrders();
        renderOrders();
        showNotification(`Order #${orderId} deleted!`);
    }
}

// Update statistics
function updateStats() {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length;
    const dispatchedOrders = orders.filter(o => o.status === 'dispatched').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('processingOrders').textContent = processingOrders;
    document.getElementById('dispatchedOrders').textContent = dispatchedOrders;
    document.getElementById('deliveredOrders').textContent = deliveredOrders;
    document.getElementById('totalRevenue').textContent = `KSH ${totalRevenue.toLocaleString()}`;
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--primary-pink), var(--purple));
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(255, 107, 157, 0.4);
        z-index: 4000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    // Check if admin is already logged in
    const isLoggedIn = localStorage.getItem('slayStationAdminLoggedIn');
    if (isLoggedIn === 'true') {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadOrders();
    }
});

// Export function to create orders (called from checkout)
if (typeof window !== 'undefined') {
    window.createOrder = function(orderData) {
        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
        const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
        
        const order = {
                id: orderId,
                date: new Date().toISOString(),
                ...orderData,
                status: 'pending',
                deliveryFee: null, // Will be set by admin
                deliveryFeePaid: false,
                deliveryFeeSet: false,
                deliveryFeeNotificationSent: false,
                mpesaCode: null,
                notifications: [],
                subtotal: orderData.subtotal || orderData.total,
                total: orderData.subtotal || orderData.total // Will be updated when delivery fee is set
            };
        
        orders.push(order);
        localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        return order;
    };
}
