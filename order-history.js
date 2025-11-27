// Order History Page Script

let currentFilter = 'all';
let allOrders = [];

// Load order history for logged-in user
function loadOrderHistory() {
    const user = getCurrentUser();
    
    if (!user) {
        // Show login prompt
        document.getElementById('loginPrompt').style.display = 'block';
        document.getElementById('orderHistoryContent').style.display = 'none';
        return;
    }

    // Hide login prompt, show order history
    document.getElementById('loginPrompt').style.display = 'none';
    document.getElementById('orderHistoryContent').style.display = 'block';

    // Load all orders
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    
    // Filter orders for current user
    allOrders = orders.filter(order => order.userId === user.id);
    
    renderOrders();
    
    // Auto-refresh every 5 seconds to check for status updates
    if (window.orderHistoryRefreshInterval) {
        clearInterval(window.orderHistoryRefreshInterval);
    }
    window.orderHistoryRefreshInterval = setInterval(() => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            const updatedOrders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
            const updatedUserOrders = updatedOrders.filter(order => order.userId === currentUser.id);
            
            // Check if any order status changed
            let hasChanges = false;
            const previousOrders = [...allOrders]; // Save previous state
            
            if (updatedUserOrders.length !== allOrders.length) {
                hasChanges = true;
            } else {
                for (let i = 0; i < updatedUserOrders.length; i++) {
                    const updated = updatedUserOrders[i];
                    const current = previousOrders.find(o => o.id === updated.id);
                    if (!current || 
                        current.deliveryFeePaid !== updated.deliveryFeePaid ||
                        current.mpesaCodeVerified !== updated.mpesaCodeVerified ||
                        current.mpesaCodeRejected !== updated.mpesaCodeRejected ||
                        current.status !== updated.status ||
                        current.mpesaCode !== updated.mpesaCode) {
                        hasChanges = true;
                        break;
                    }
                }
            }
            
            if (hasChanges) {
                // Show notification if payment was verified
                const verifiedOrder = updatedUserOrders.find(o => {
                    const oldOrder = previousOrders.find(old => old.id === o.id);
                    return oldOrder && !oldOrder.mpesaCodeVerified && o.mpesaCodeVerified;
                });
                if (verifiedOrder) {
                    showNotification(`✅ Your M-Pesa payment for Order #${verifiedOrder.id} has been verified!`);
                }
                
                allOrders = updatedUserOrders;
                renderOrders();
            }
        }
    }, 5000); // Check every 5 seconds
}

// Get current user
function getCurrentUser() {
    if (typeof window.userAuth !== 'undefined') {
        return window.userAuth.getCurrentUser();
    }
    const userJson = localStorage.getItem('slayStationCurrentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Render orders
function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');
    
    if (!ordersList) return;

    // Filter orders based on current filter
    let filteredOrders = allOrders;
    if (currentFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }

    // Sort by date (newest first)
    filteredOrders = filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    ordersList.innerHTML = '';

    if (filteredOrders.length === 0) {
        ordersList.style.display = 'none';
        noOrders.style.display = 'block';
        return;
    }

    ordersList.style.display = 'block';
    noOrders.style.display = 'none';

    filteredOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        const statusClass = getStatusClass(order.status);
        const statusIcon = getStatusIcon(order.status);
        const orderDate = new Date(order.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        orderCard.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <h3>Order #${order.id}</h3>
                    <p class="order-date">📅 ${orderDate}</p>
                    <p class="order-customer"><strong>${order.name}</strong></p>
                    <p class="order-phone">📱 ${order.phone}</p>
                    <p class="order-address">📍 ${order.address}</p>
                    <p class="order-payment">💳 Payment: ${order.payment}</p>
                </div>
                <div class="order-status ${statusClass}">
                    <span>${statusIcon} ${order.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="order-items">
                <h4>Items Ordered:</h4>
                ${order.items.map(item => {
                    const imageHTML = item.image && item.image.includes('images/') 
                        ? `<img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; margin-right: 10px;" onerror="this.style.display='none';">`
                        : '';
                    return `
                        <div class="order-item-row" style="display: flex; align-items: center; gap: 10px;">
                            ${imageHTML}
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">${item.name}</div>
                                <div style="font-size: 0.9rem; color: #666;">Qty: ${item.quantity} × KSH ${item.price.toLocaleString()}</div>
                            </div>
                            <div style="font-weight: 600;">KSH ${(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                    `;
                }).join('')}
                ${order.giftWrap ? '<div class="order-item-row"><span>🎀 Gift Wrapping</span><span>KSH 150</span></div>' : ''}
                <div class="order-item-row total-row">
                    <strong>Subtotal:</strong>
                    <strong>KSH ${order.subtotal.toLocaleString()}</strong>
                </div>
                <div class="order-item-row">
                    <span>🚚 Delivery Fee:</span>
                    ${order.deliveryFee === null || order.deliveryFee === undefined ? 
                        `<span style="color: #ff9800;">⏳ Pending Admin Input</span>` :
                        `<span class="${order.deliveryFeePaid ? 'paid' : 'unpaid'}">KSH ${order.deliveryFee.toLocaleString()} ${order.deliveryFeePaid ? '✅ Paid' : '❌ Unpaid'}</span>`
                    }
                </div>
                ${order.mpesaCode ? `
                <div class="order-item-row">
                    <span>M-Pesa Code:</span>
                    <span style="font-family: monospace; background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 5px; font-weight: 600;">${order.mpesaCode}</span>
                    ${order.mpesaCodeVerified ? '<span style="color: #28a745; margin-left: 0.5rem;">✅ Verified</span>' : order.mpesaCodeRejected ? '<span style="color: #dc3545; margin-left: 0.5rem;">❌ Rejected</span>' : '<span style="color: #ffc107; margin-left: 0.5rem;">⏳ Pending</span>'}
                </div>
                ` : ''}
                <div class="order-item-row total-row" style="border-top: 2px solid var(--primary-pink); padding-top: 1rem; margin-top: 0.5rem;">
                    <strong style="font-size: 1.2rem;">Total:</strong>
                    <strong style="font-size: 1.2rem; color: var(--primary-pink);">KSH ${order.total.toLocaleString()}</strong>
                </div>
                ${order.pointsEarned ? `<div class="order-item-row" style="color: var(--purple);"><span>⭐ Points Earned:</span><span>+${order.pointsEarned} points</span></div>` : ''}
            </div>
            
            ${!order.deliveryFeePaid && order.deliveryFee !== null && order.deliveryFee !== undefined ? `
            <div class="delivery-fee-payment-section" style="margin-top: 1.5rem; padding: 1.5rem; background: #f8f9fa; border-radius: 15px; border: 2px solid #e0e0e0;">
                <h4 style="margin-bottom: 1rem; color: var(--dark);">💳 Pay Delivery Fee</h4>
                ${order.mpesaCode && !order.mpesaCodeVerified && !order.mpesaCodeRejected ? `
                    <div style="padding: 1rem; background: #fff3cd; border-radius: 10px; margin-bottom: 1rem;">
                        <p style="margin-bottom: 0.5rem;"><strong>M-Pesa Code Submitted:</strong> <span style="font-family: monospace; font-weight: 600;">${order.mpesaCode}</span></p>
                        <p style="color: #856404; font-size: 0.9rem;">⏳ Waiting for admin verification...</p>
                    </div>
                ` : order.mpesaCodeRejected ? `
                    <div style="padding: 1rem; background: #f8d7da; border-radius: 10px; margin-bottom: 1rem;">
                        <p style="color: #721c24; margin-bottom: 0.5rem;"><strong>❌ M-Pesa Code Rejected</strong></p>
                        <p style="color: #721c24; font-size: 0.9rem;">Please submit a valid M-Pesa confirmation code.</p>
                    </div>
                ` : ''}
                ${!order.mpesaCode || order.mpesaCodeRejected ? `
                    <div style="margin-bottom: 1rem;">
                        <label for="mpesaCode_${order.id}" style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--dark);">M-Pesa Confirmation Code:</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input 
                                type="text" 
                                id="mpesaCode_${order.id}" 
                                placeholder="Enter M-Pesa code (e.g., QH8A2B3C4D)" 
                                style="flex: 1; padding: 0.75rem; border: 2px solid #ddd; border-radius: 10px; font-family: 'Poppins', sans-serif; font-size: 1rem;"
                                maxlength="10"
                                onkeypress="if(event.key === 'Enter') submitMpesaCodeFromHistory(${order.id})"
                            >
                            <button onclick="submitMpesaCodeFromHistory(${order.id})" class="cta-button" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; white-space: nowrap;">Submit 💳</button>
                        </div>
                    </div>
                ` : ''}
                <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">Delivery Fee: <strong>KSH ${order.deliveryFee.toLocaleString()}</strong></p>
            </div>
            ` : order.deliveryFeePaid && order.mpesaCodeVerified ? `
            <div style="margin-top: 1.5rem; padding: 1.5rem; background: #d4edda; border-radius: 15px; border: 2px solid #28a745; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                <p style="color: #155724; font-weight: 600; margin-bottom: 0.5rem;">Delivery Fee Paid!</p>
                <p style="color: #155724; font-size: 0.9rem;">M-Pesa Code: <strong style="font-family: monospace;">${order.mpesaCode}</strong></p>
            </div>
            ` : ''}
            
            <div class="order-actions" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee; display: flex; gap: 1rem; flex-wrap: wrap;">
                <a href="track-order.html?orderId=${order.id}" class="cta-button" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; text-decoration: none; display: inline-block;">Track Order 📍</a>
                ${order.status === 'delivered' ? `<button onclick="reorderItems(${order.id})" class="cta-button" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; background: var(--purple);">Reorder 🛍️</button>` : ''}
            </div>
        `;
        
        ordersList.appendChild(orderCard);
    });
}

// Get status class for styling
function getStatusClass(status) {
    const statusMap = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'delivered': 'status-delivered',
        'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
}

// Get status icon
function getStatusIcon(status) {
    const iconMap = {
        'pending': '⏳',
        'processing': '🔄',
        'delivered': '✅',
        'cancelled': '❌'
    };
    return iconMap[status] || '⏳';
}

// Filter orders
function filterOrders(status) {
    currentFilter = status;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`filter${status.charAt(0).toUpperCase() + status.slice(1)}`).classList.add('active');
    
    renderOrders();
}

// Reorder items
function reorderItems(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    // Get shared cart
    const cart = JSON.parse(localStorage.getItem('slayStationCart') || '[]');
    
    // Add all items from order to cart
    order.items.forEach(item => {
        const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.category === item.category);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            cart.push({...item, quantity: item.quantity});
        }
    });

    localStorage.setItem('slayStationCart', JSON.stringify(cart));
    
    // Show notification
    alert(`🎉 Items added to cart! Redirecting to checkout...`);
    
    // Redirect to home page
    window.location.href = 'index.html#products';
}

// Cart functions (shared)
function getSharedCart() {
    const savedCart = localStorage.getItem('slayStationCart');
    return savedCart ? JSON.parse(savedCart) : [];
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('slayStationCart');
    if (savedCart) {
        updateCartCount();
    }
}

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const allCartItems = getSharedCart();
        const totalItems = allCartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

function toggleCart() {
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartOverlay) {
        cartOverlay.classList.toggle('active');
    }
}

function toggleWishlist() {
    const wishlistOverlay = document.getElementById('wishlistOverlay');
    if (wishlistOverlay) {
        wishlistOverlay.classList.toggle('active');
    }
}

function checkout() {
    window.location.href = 'index.html#products';
}

// Back to top functionality
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide back to top button
window.addEventListener('scroll', function() {
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        if (window.pageYOffset > 300) {
            backToTop.style.display = 'flex';
        } else {
            backToTop.style.display = 'none';
        }
    }
});

// Submit M-Pesa code from order history
function submitMpesaCodeFromHistory(orderId) {
    const mpesaCodeInput = document.getElementById(`mpesaCode_${orderId}`);
    if (!mpesaCodeInput) return;
    
    const mpesaCode = mpesaCodeInput.value.trim().toUpperCase();
    
    if (!mpesaCode) {
        alert('Please enter your M-Pesa confirmation code!');
        mpesaCodeInput.focus();
        return;
    }
    
    if (mpesaCode.length < 8) {
        alert('M-Pesa codes are usually 8-10 characters. Please check your code.');
        mpesaCodeInput.focus();
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found! Please refresh the page.');
        return;
    }
    
    if (!order.deliveryFee || order.deliveryFee === null) {
        alert('Delivery fee has not been set yet. Please wait for the admin to set the delivery fee.');
        return;
    }
    
    if (confirm(`Submit M-Pesa code: ${mpesaCode}?\n\nDelivery Fee: KSH ${order.deliveryFee.toLocaleString()}\n\nThe admin will verify your payment.`)) {
        order.mpesaCode = mpesaCode;
        order.mpesaCodeSubmittedTime = new Date().toISOString();
        order.mpesaCodeVerified = false;
        order.mpesaCodeRejected = false;
        order.mpesaCodeRejectionReason = null;
        
        // Add notification
        order.notifications = order.notifications || [];
        order.notifications.push({
            type: 'mpesa_code_submitted',
            message: `M-Pesa code ${mpesaCode} submitted. Waiting for admin verification.`,
            date: new Date().toISOString(),
            read: false
        });
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = order;
            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        }
        
        // Show success message
        showNotification(`✅ M-Pesa code ${mpesaCode} submitted! Admin will verify your payment.`);
        
        // Refresh orders display
        renderOrders();
    }
}

// Show notification
function showNotification(message) {
    // Add CSS animations if not already added
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
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
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.filterOrders = filterOrders;
    window.reorderItems = reorderItems;
    window.scrollToTop = scrollToTop;
    window.toggleCart = toggleCart;
    window.toggleWishlist = toggleWishlist;
    window.checkout = checkout;
    window.submitMpesaCodeFromHistory = submitMpesaCodeFromHistory;
}

