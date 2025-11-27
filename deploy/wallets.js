// Product Data - Wallets
const walletProducts = [
    {
        id: 101,
        name: "Classic Leather Wallet",
        description: "Timeless leather wallet with multiple card slots and coin compartment.",
        price: 1500,
        image: "images/wallet/IMG-20251123-WA0022.jpg",
        category: "wallet"
    },
    {
        id: 102,
        name: "Elegant Designer Wallet",
        description: "Sophisticated wallet with premium design and quality finish.",
        price: 1500,
        image: "images/wallet/IMG-20251123-WA0024.jpg",
        category: "wallet"
    },
    {
        id: 103,
        name: "Stylish Compact Wallet",
        description: "Modern compact wallet perfect for everyday use.",
        price: 1500,
        image: "images/wallet/IMG-20251123-WA0057.jpg",
        category: "wallet"
    },
    {
        id: 104,
        name: "Luxury Leather Wallet",
        description: "Premium leather wallet with elegant styling.",
        price: 1500,
        image: "images/wallet/IMG-20251123-WA0059.jpg",
        category: "wallet"
    }
];

// Cart Management (shared across all pages)
let cart = [];

// Load products on page load
document.addEventListener('DOMContentLoaded', function() {
    renderProducts();
    loadCartFromStorage();
    updateCartCount();
});

// Render Products
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';

    walletProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image" style="background: linear-gradient(135deg, var(--secondary-pink), var(--lavender));">
                <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='👛';">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">KSH ${product.price.toLocaleString()}</div>
            <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                Add to Cart 🛍️
            </button>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Get shared cart from localStorage
function getSharedCart() {
    const savedCart = localStorage.getItem('slayStationCart');
    if (savedCart) {
        return JSON.parse(savedCart);
    }
    return [];
}

// Add to Cart (shared across all pages)
function addToCart(productId) {
    const product = walletProducts.find(p => p.id === productId);
    if (!product) return;

    // Get all items from shared cart
    const allCartItems = getSharedCart();
    const existingItem = allCartItems.find(item => item.id === productId && item.category === product.category);
    
    if (existingItem) {
        existingItem.quantity += 1;
        cart = allCartItems;
    } else {
        const itemToAdd = {
            ...product,
            quantity: 1,
            category: product.category || 'wallet'
        };
        allCartItems.push(itemToAdd);
        cart = allCartItems;
    }

    saveCartToStorage();
    updateCartCount();
    showNotification(`${product.name} added to cart! ✨`);
    
    // Update cart display if it's open
    if (document.getElementById('cartOverlay').classList.contains('active')) {
        renderCart();
    }
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => !(item.id === productId));
    saveCartToStorage();
    updateCartCount();
    renderCart();
    showNotification('Item removed from cart');
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCartToStorage();
        updateCartCount();
        renderCart();
    }
}

// Render Cart (shows all items from all pages)
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Load all items from shared cart
    const allCartItems = getSharedCart();
    cart = allCartItems;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty. Start shopping!</p>';
        cartTotal.textContent = '0';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const imageHTML = item.image && item.image.includes('images/') 
            ? `<img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.parentElement.innerHTML='👜';">`
            : item.image || '👜';
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">${imageHTML}</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">KSH ${item.price.toLocaleString()}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span>Qty: ${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})" style="margin-left: auto;">Remove</button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
        total += item.price * item.quantity;
    });

    cartTotal.textContent = total.toLocaleString();
}

// Update Cart Count (shows count from all pages)
function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    // Get total from shared cart to include items from all pages
    const allCartItems = getSharedCart();
    const totalItems = allCartItems.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Toggle Cart
function toggleCart() {
    const cartOverlay = document.getElementById('cartOverlay');
    cartOverlay.classList.toggle('active');
    
    if (cartOverlay.classList.contains('active')) {
        // Reload cart from storage to get latest items from all pages
        loadCartFromStorage();
        renderCart();
    }
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty! Add some items first. 💕');
        return;
    }

    const orderModal = document.getElementById('orderModal');
    const orderSummary = document.getElementById('orderSummary');
    
    // Render order summary
    let summaryHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        summaryHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${item.name} x${item.quantity}</span>
                <span>KSH ${itemTotal.toLocaleString()}</span>
            </div>
        `;
    });
    
    summaryHTML += `
        <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid white; font-weight: bold; font-size: 1.2rem;">
            <span>Total</span>
            <span>KSH ${total.toLocaleString()}</span>
        </div>
    `;
    
    orderSummary.innerHTML = summaryHTML;
    
    // Close cart and open order modal
    document.getElementById('cartOverlay').classList.remove('active');
    orderModal.classList.add('active');
}

// Close Order Modal
function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Handle Order Form Submission
document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;
    
    const orderData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        payment: formData.get('payment'),
        items: cart.map(item => ({...item})),
        subtotal: subtotal,
        total: total
    };
    
    // Check if user is logged in
    let userId = null;
    if (typeof window.getCurrentUser === 'function') {
        const user = window.getCurrentUser();
        if (user) {
            userId = user.id;
            orderData.userId = userId;
        }
    }
    
    // Create order using admin.js function
    let order;
    if (typeof window.createOrder === 'function') {
        order = window.createOrder(orderData);
    } else {
        // Fallback if admin.js not loaded
        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
        const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
        order = {
            id: orderId,
            date: new Date().toISOString(),
            ...orderData,
            status: 'pending',
            deliveryFee: null,
            deliveryFeePaid: false,
            deliveryFeeSet: false,
            deliveryFeeNotificationSent: false,
            mpesaCode: null,
            notifications: []
        };
        orders.push(order);
        localStorage.setItem('slayStationOrders', JSON.stringify(orders));
    }
    
    console.log('Order placed:', order);
    
    // Show success message
    alert(`🎉 Order Placed Successfully! 🎉\n\nThank you ${orderData.name}! Your order has been received.\n\nOrder #${order.id}\n\nSubtotal: KSH ${subtotal.toLocaleString()}\nTotal: KSH ${total.toLocaleString()}\n\n📦 Your order is being processed. The admin will set your delivery fee and notify you.\n\nYou can track your order using Order #${order.id}!\n\nWe'll contact you soon! 💕`);
    
    // Clear cart completely
    cart = [];
    localStorage.setItem('slayStationCart', JSON.stringify([]));
    updateCartCount();
    
    // Update cart display if it's open
    if (document.getElementById('cartOverlay') && document.getElementById('cartOverlay').classList.contains('active')) {
        renderCart();
    }
    
    // Close modal and reset form
    closeOrderModal();
    e.target.reset();
});

// Save Cart to Local Storage
function saveCartToStorage() {
    localStorage.setItem('slayStationCart', JSON.stringify(cart));
}

// Load Cart from Local Storage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('slayStationCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Show Notification
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

// Add CSS animations for notifications
const style = document.createElement('style');
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

// Close cart when clicking outside
document.getElementById('cartOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        toggleCart();
    }
});

// Close modal when clicking outside
document.getElementById('orderModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeOrderModal();
    }
});
