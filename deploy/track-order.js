// Track Order Script
// Use DELIVERY_FEE from window or default to 200
const DELIVERY_FEE = (typeof window !== 'undefined' && window.DELIVERY_FEE) ? window.DELIVERY_FEE : 200;

function trackOrder() {
    const orderId = parseInt(document.getElementById('orderNumber').value);
    
    if (!orderId || orderId < 1) {
        alert('Please enter a valid order number! 💕');
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        alert('Order not found! Please check your order number. 💕');
        return;
    }
    
    displayOrderDetails(order);
}

function displayOrderDetails(order) {
    const orderDetails = document.getElementById('orderDetails');
    const deliveryFeeSection = document.getElementById('deliveryFeeSection');
    const deliveryTracking = document.getElementById('deliveryTracking');
    
    // Display order info
    document.getElementById('displayOrderId').textContent = order.id;
    document.getElementById('customerName').textContent = order.name;
    document.getElementById('customerEmail').textContent = order.email;
    document.getElementById('customerPhone').textContent = order.phone;
    document.getElementById('customerAddress').textContent = order.address;
    
    // Show order details
    orderDetails.classList.add('active');
    
    // Show/hide delivery fee section
    if (!order.deliveryFeePaid && order.status !== 'cancelled') {
        deliveryFeeSection.style.display = 'block';
        deliveryTracking.style.display = 'none';
        
        // Show appropriate message based on delivery fee status
        const feePending = document.getElementById('deliveryFeePending');
        const feeSet = document.getElementById('deliveryFeeSet');
        const feeAmount = document.getElementById('deliveryFeeAmount');
        
        if (order.deliveryFee === null || order.deliveryFee === undefined) {
            // Fee not set yet
            if (feePending) feePending.style.display = 'block';
            if (feeSet) feeSet.style.display = 'none';
        } else {
            // Fee has been set
            if (feePending) feePending.style.display = 'none';
            if (feeSet) feeSet.style.display = 'block';
            if (feeAmount) feeAmount.textContent = `KSH ${order.deliveryFee.toLocaleString()}`;
            
            // Update STK push amount display
            const stkAmountDisplay = document.getElementById('stkAmountDisplay');
            if (stkAmountDisplay) {
                stkAmountDisplay.textContent = `KSH ${order.deliveryFee.toLocaleString()}`;
            }
            
            // Show STK push prompt if payment not completed
            const stkPaymentStatus = document.getElementById('stkPaymentStatus');
            const mpesaCodeSection = document.getElementById('mpesaCodeSection');
            
            if (!order.deliveryFeePaid) {
                // Show STK push prompt
                if (stkPaymentStatus) {
                    stkPaymentStatus.style.display = 'block';
                }
                
                // Always show code input section so they can enter code after completing payment on phone
                if (mpesaCodeSection) {
                    mpesaCodeSection.style.display = 'block';
                }
            } else {
                // Payment completed - hide prompts
                if (stkPaymentStatus) {
                    stkPaymentStatus.style.display = 'none';
                }
                if (mpesaCodeSection) {
                    mpesaCodeSection.style.display = 'none';
                }
            }
            
            // Show prominent notification if fee was just set (STK push sent)
            if (order.deliveryFeeSet && order.deliveryFeeNotificationSent && !order.deliveryFeePaid && order.mpesaStkPushSent) {
                // Show prominent notification about phone prompt
                setTimeout(() => {
                    showNotification(`📱 Check your phone NOW! You will receive an M-Pesa payment request. Just enter your PIN when prompted. Amount: KSH ${order.deliveryFee.toLocaleString()}`);
                }, 500);
            }
            
            // Show M-Pesa code status if already submitted
            const mpesaStatus = document.getElementById('mpesaStatus');
            const mpesaCodeInput = document.getElementById('mpesaCode');
            const submitMpesaBtn = document.getElementById('submitMpesaBtn');
            
            if (order.mpesaCode) {
                // Code has been submitted
                if (order.mpesaCodeVerified && order.deliveryFeePaid) {
                    // Verified and paid
                    if (mpesaStatus) {
                        mpesaStatus.style.display = 'block';
                        mpesaStatus.style.background = '#d4edda';
                        mpesaStatus.style.color = '#155724';
                        mpesaStatus.innerHTML = `✅ <strong>M-Pesa Payment Verified!</strong><br>Code: <strong style="font-family: monospace;">${order.mpesaCode}</strong><br>Delivery fee paid. Your order is being processed! 🎉`;
                    }
                    if (mpesaCodeInput) mpesaCodeInput.style.display = 'none';
                    if (submitMpesaBtn) submitMpesaBtn.style.display = 'none';
                } else if (order.mpesaCodeRejected) {
                    // Rejected - allow resubmission
                    if (mpesaStatus) {
                        mpesaStatus.style.display = 'block';
                        mpesaStatus.style.background = '#f8d7da';
                        mpesaStatus.style.color = '#721c24';
                        mpesaStatus.innerHTML = `❌ <strong>M-Pesa Code Rejected</strong><br>Previous code was rejected. Please submit a valid M-Pesa confirmation code.`;
                    }
                    if (mpesaCodeInput) {
                        mpesaCodeInput.style.display = 'block';
                        mpesaCodeInput.value = '';
                        mpesaCodeInput.placeholder = 'Enter new M-Pesa code';
                    }
                    if (submitMpesaBtn) submitMpesaBtn.style.display = 'block';
                    order.mpesaCode = null; // Clear rejected code
                } else {
                    // Pending verification
                    if (mpesaStatus) {
                        mpesaStatus.style.display = 'block';
                        mpesaStatus.style.background = '#fff3cd';
                        mpesaStatus.style.color = '#856404';
                        mpesaStatus.innerHTML = `⏳ <strong>M-Pesa Code Submitted</strong><br>Code: <strong style="font-family: monospace;">${order.mpesaCode}</strong><br>Waiting for admin verification...`;
                    }
                    if (mpesaCodeInput) {
                        mpesaCodeInput.style.display = 'none';
                        mpesaCodeInput.value = order.mpesaCode;
                    }
                    if (submitMpesaBtn) submitMpesaBtn.style.display = 'none';
                }
            } else {
                // No code submitted yet - show STK prompt and code input
                const mpesaCodeSection = document.getElementById('mpesaCodeSection');
                if (mpesaCodeSection) {
                    mpesaCodeSection.style.display = 'block';
                }
                
                if (mpesaCodeInput) {
                    mpesaCodeInput.style.display = 'block';
                    mpesaCodeInput.value = '';
                    mpesaCodeInput.placeholder = 'Enter confirmation code from SMS';
                }
                if (submitMpesaBtn) submitMpesaBtn.style.display = 'block';
                if (mpesaStatus) mpesaStatus.style.display = 'none';
            }
        }
    } else if (order.deliveryFeePaid && order.mpesaCodeVerified) {
        // Payment verified - show success message
        deliveryFeeSection.style.display = 'block';
        const feeSet = document.getElementById('deliveryFeeSet');
        if (feeSet) {
            feeSet.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: #d4edda; border-radius: 15px; border: 2px solid #155724;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                    <h3 style="color: #155724; margin-bottom: 0.5rem;">Delivery Fee Paid!</h3>
                    <p style="color: #155724; margin-bottom: 1rem;">M-Pesa Code: <strong style="font-family: monospace; font-size: 1.2rem;">${order.mpesaCode}</strong></p>
                    <p style="color: #666;">Amount: <strong>KSH ${order.deliveryFee.toLocaleString()}</strong></p>
                    <p style="color: #666; margin-top: 1rem;">Your order is now being processed! 🎉</p>
                </div>
            `;
        }
        
        if (order.status === 'dispatched' || order.status === 'delivered') {
            deliveryTracking.style.display = 'block';
            
            // Initialize and render map immediately
            if (!order.storeLocation) {
                order.storeLocation = { x: 20, y: 70 };
            }
            if (!order.customerLocation) {
                order.customerLocation = { x: 75, y: 25 };
            }
            if (!order.riderLocation && order.status === 'dispatched') {
                order.riderLocation = { ...order.storeLocation };
            }
            
            renderDeliveryMap(order, order.status === 'delivered', order.deliveryProgress || 0);
            startDeliveryTracking(order);
        }
    } else {
        deliveryFeeSection.style.display = 'none';
        deliveryTracking.style.display = 'none';
    }
    
    // Render timeline
    renderTimeline(order);
}

function renderTimeline(order) {
    const timeline = document.getElementById('trackingTimeline');
    timeline.innerHTML = '';
    
    const statuses = [
        { key: 'pending', label: 'Order Pending', icon: '⏳', desc: 'Your order is being processed' },
        { key: 'confirmed', label: 'Order Confirmed', icon: '✅', desc: 'Order confirmed and ready' },
        { key: 'processing', label: 'Processing', icon: '🔄', desc: 'Preparing your order' },
        { key: 'dispatched', label: 'Dispatched', icon: '🚚', desc: order.deliveryFeePaid ? 'Order on the way!' : 'Awaiting delivery fee payment' },
        { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Order delivered successfully!' },
    ];
    
    const currentStatusIndex = statuses.findIndex(s => s.key === order.status);
    
    statuses.forEach((status, index) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        if (index < currentStatusIndex) {
            item.classList.add('completed');
        } else if (index === currentStatusIndex) {
            item.classList.add('active');
        }
        
        if (status.key === 'dispatched' && !order.deliveryFeePaid) {
            item.classList.remove('active');
        }
        
        item.innerHTML = `
            <div class="timeline-icon">${status.icon}</div>
            <div class="timeline-content">
                <h4>${status.label}</h4>
                <p>${status.desc}</p>
                ${index === currentStatusIndex && order[status.key + 'Time'] ? 
                    `<p style="font-size: 0.8rem; color: #999;">${new Date(order[status.key + 'Time']).toLocaleString()}</p>` : ''}
            </div>
        `;
        
        timeline.appendChild(item);
    });
}

function submitMpesaCode() {
    const orderId = parseInt(document.getElementById('displayOrderId').textContent);
    const mpesaCodeInput = document.getElementById('mpesaCode');
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
            date: new Date().toISOString()
        });
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = order;
            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        }
        
        // Show success message
        showNotification(`✅ M-Pesa code ${mpesaCode} submitted! Admin will verify your payment.`);
        
        // Refresh display
        displayOrderDetails(order);
    }
}

function showNotification(message) {
    // Create a temporary notification
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

let trackingInterval = null;

function startDeliveryTracking(order) {
    if (trackingInterval) {
        clearInterval(trackingInterval);
    }
    
    if (order.status !== 'dispatched' && order.status !== 'delivered') {
        return;
    }
    
    const deliveryTracking = document.getElementById('deliveryTracking');
    if (deliveryTracking) {
        deliveryTracking.style.display = 'block';
    }
    
    // Initialize locations if not set
    if (!order.storeLocation) {
        order.storeLocation = { x: 20, y: 70 };
    }
    if (!order.customerLocation) {
        order.customerLocation = { x: 75, y: 25 };
    }
    if (!order.riderLocation) {
        order.riderLocation = { ...order.storeLocation };
    }
    
    // Simulate delivery progress
    let progress = order.deliveryProgress || 0;
    const estimatedTime = order.estimatedArrival || calculateEstimatedTime();
    
    if (!order.estimatedArrival) {
        order.estimatedArrival = estimatedTime;
        order.estimatedArrivalTime = estimatedTime;
    }
    
    // Initial render
    renderDeliveryMap(order, false, progress);
    updateDeliveryStatus(progress, estimatedTime, order);
    
    trackingInterval = setInterval(() => {
        // Reload order from storage to get latest updates from rider
        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
        const currentOrder = orders.find(o => o.id === order.id);
        
        if (!currentOrder || currentOrder.status === 'delivered') {
            clearInterval(trackingInterval);
            if (currentOrder && currentOrder.status === 'delivered') {
                displayOrderDetails(currentOrder);
                createConfetti();
            }
            return;
        }
        
        // Update progress if rider location is available
        if (currentOrder.riderLocation) {
            order.riderLocation = currentOrder.riderLocation;
            
            // Calculate progress based on rider position
            const dx = currentOrder.customerLocation.x - currentOrder.riderLocation.x;
            const dy = currentOrder.customerLocation.y - currentOrder.riderLocation.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const totalDistance = Math.sqrt(
                Math.pow(currentOrder.customerLocation.x - currentOrder.storeLocation.x, 2) +
                Math.pow(currentOrder.customerLocation.y - currentOrder.storeLocation.y, 2)
            );
            progress = Math.max(0, Math.min(100, 100 - (distance / totalDistance * 100)));
            
            order.deliveryProgress = progress;
        } else {
            // Simulate progress if no rider location
            progress += 1;
            if (progress > 100) progress = 100;
            
            // Update rider location based on progress
            const startX = order.storeLocation.x;
            const startY = order.storeLocation.y;
            const endX = order.customerLocation.x;
            const endY = order.customerLocation.y;
            
            order.riderLocation = {
                x: startX + (endX - startX) * (progress / 100),
                y: startY + (endY - startY) * (progress / 100)
            };
            order.deliveryProgress = progress;
        }
        
        // Save progress
        const orderIndex = orders.findIndex(o => o.id === order.id);
        if (orderIndex !== -1) {
            orders[orderIndex] = { ...order, ...currentOrder, deliveryProgress: progress, riderLocation: order.riderLocation };
            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        }
        
        updateDeliveryStatus(progress, estimatedTime, order);
        renderDeliveryMap(order, false, progress);
        
        // Check if delivered
        if (currentOrder.status === 'delivered') {
            clearInterval(trackingInterval);
            displayOrderDetails(currentOrder);
            createConfetti();
        }
    }, 2000);
}

function calculateEstimatedTime() {
    // Simulate estimated arrival time (30-60 minutes)
    const minutes = 30 + Math.floor(Math.random() * 30);
    const arrivalTime = new Date(Date.now() + minutes * 60000);
    return arrivalTime.toISOString();
}

function updateDeliveryStatus(progress, estimatedTime, order) {
    const etaDisplay = document.getElementById('etaDisplay');
    const etaTime = document.getElementById('etaTime');
    const deliveryStatus = document.getElementById('deliveryStatus');
    const deliveryGuyName = document.getElementById('deliveryGuyName');
    const deliveryMap = document.getElementById('deliveryMap');
    
    const now = new Date();
    const arrival = new Date(estimatedTime);
    const minutesRemaining = Math.max(0, Math.ceil((arrival - now) / 60000));
    
    if (order.status === 'delivered') {
        etaTime.textContent = 'Delivered! 🎉';
        deliveryStatus.textContent = 'Delivered';
        deliveryGuyName.textContent = 'Order delivered successfully!';
        renderDeliveryMap(order, true);
    } else {
        etaTime.textContent = minutesRemaining > 0 ? `${minutesRemaining} minutes` : 'Arriving soon!';
        deliveryStatus.textContent = `${progress}% Complete`;
        deliveryGuyName.textContent = progress < 50 ? 'Picking up your order...' : progress < 90 ? 'On the way to you!' : 'Almost there!';
        
        // Update map with rider location
        renderDeliveryMap(order, false, progress);
    }
}

// Leaflet map instance
let leafletMapInstance = null;
let customerMarker = null;
let riderMarker = null;
let routePolyline = null;
let mapInitializationAttempted = false;
let mapErrorShown = false;

// Convert percentage coordinates to Nairobi lat/lng
function percentageToLatLng(x, y) {
    // Nairobi area bounds (approximate)
    const minLat = -1.35;
    const maxLat = -1.20;
    const minLng = 36.70;
    const maxLng = 36.90;
    
    // Convert percentage to lat/lng (inverted Y because map coordinates)
    const lat = maxLat - ((y / 100) * (maxLat - minLat));
    const lng = minLng + ((x / 100) * (maxLng - minLng));
    
    return { lat, lng };
}

// Initialize Leaflet Map (OpenStreetMap)
function initGoogleMap(order) {
    const mapElement = document.getElementById('googleMap');
    if (!mapElement) {
        if (!mapErrorShown) {
            renderSimpleMap(order);
            mapErrorShown = true;
        }
        return;
    }
    
    // Prevent multiple initialization attempts
    if (mapInitializationAttempted && leafletMapInstance) {
        // Map already initialized, just update markers
        updateMapMarkers(order);
        return;
    }
    
    mapInitializationAttempted = true;
    
    // Check if Leaflet is loaded - wait longer if needed
    if (typeof L === 'undefined' || !L.map) {
        // Wait for Leaflet to load
        let attempts = 0;
        const checkLeaflet = setInterval(() => {
            attempts++;
            if (typeof L !== 'undefined' && L.map) {
                clearInterval(checkLeaflet);
                initGoogleMap(order);
            } else if (attempts > 20) {
                clearInterval(checkLeaflet);
                if (!mapErrorShown) {
                    renderSimpleMap(order);
                    mapErrorShown = true;
                }
            }
        }, 200);
        return;
    }
    
    try {
        if (!L.map) {
            throw new Error('Leaflet library not fully loaded');
        }
    } catch (error) {
        console.error('Leaflet initialization error:', error);
        if (!mapErrorShown) {
            renderSimpleMap(order);
            mapErrorShown = true;
        }
        return;
    }
    
    // Initialize locations if not set
    if (!order.storeLocation) {
        order.storeLocation = { x: 20, y: 70 };
    }
    if (!order.customerLocation) {
        order.customerLocation = { x: 75, y: 25 };
    }
    
    // Convert to lat/lng - use actual lat/lng if available, otherwise convert from percentage
    const storeLatLng = percentageToLatLng(order.storeLocation.x, order.storeLocation.y);
    let customerLatLng;
    if (order.customerLocationLatLng) {
        customerLatLng = order.customerLocationLatLng;
    } else {
        customerLatLng = percentageToLatLng(order.customerLocation.x, order.customerLocation.y);
    }
    
    // Center map between store and customer
    const centerLat = (storeLatLng.lat + customerLatLng.lat) / 2;
    const centerLng = (storeLatLng.lng + customerLatLng.lng) / 2;
    
    // Initialize Leaflet map
    try {
        if (!leafletMapInstance) {
            // Create map with dark theme tile layer
            leafletMapInstance = L.map(mapElement, {
                center: [centerLat, centerLng],
                zoom: 13,
                zoomControl: true,
                attributionControl: true
            });
            
            // Use CartoDB dark theme (free dark map tiles)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(leafletMapInstance);
        }
        
        // Clear existing markers (but keep routing persistent)
        if (customerMarker) leafletMapInstance.removeLayer(customerMarker);
        if (riderMarker) leafletMapInstance.removeLayer(riderMarker);
        // Don't remove routing control - keep it visible
        // Only remove polyline if it's not a routing control
        if (routePolyline && typeof routePolyline.setWaypoints === 'undefined') {
            leafletMapInstance.removeLayer(routePolyline);
        }
        
        // Create custom icon for customer (pink)
        const customerIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #FF6B9D; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="transform: rotate(45deg); font-size: 16px;">🏠</span></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        // Create custom icon for rider (purple)
        const riderIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #C77DFF; width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; animation: bounce 1s infinite;"><span style="transform: rotate(45deg); font-size: 18px;">🚴</span></div>',
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        });
        
        // Customer marker
        try {
            customerMarker = L.marker([customerLatLng.lat, customerLatLng.lng], {
                icon: customerIcon,
                title: 'Your Location'
            }).addTo(leafletMapInstance);
            customerMarker.bindPopup('🏠 Your Address');
        } catch (e) {
            console.warn('Could not create customer marker:', e);
        }
        
        // Rider marker (replaces store location) - Motorcycle icon
        if (order.status === 'dispatched' && !order.completed) {
            try {
                const riderLatLng = percentageToLatLng(order.riderLocation.x, order.riderLocation.y);
                
                // Motorcycle icon for rider
                const motorcycleIcon = L.divIcon({
                    className: 'custom-marker rider-marker-icon',
                    html: '<div style="background: linear-gradient(135deg, #4CAF50, #45a049); width: 50px; height: 50px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 15px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; position: relative;"><span style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏍️</span><div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid white;"></div></div>',
                    iconSize: [50, 58],
                    iconAnchor: [25, 58],
                    popupAnchor: [0, -58]
                });
                
                riderMarker = L.marker([riderLatLng.lat, riderLatLng.lng], {
                    icon: motorcycleIcon,
                    title: 'Rider Location'
                }).addTo(leafletMapInstance);
                riderMarker.bindPopup('🏍️ Rider');
                
                // Add routing with actual roads - keep it persistent
                if (typeof L.Routing !== 'undefined') {
                    // Update existing routing control instead of removing it
                    if (routePolyline && routePolyline.setWaypoints) {
                        // Update waypoints to keep route visible
                        routePolyline.setWaypoints([
                            L.latLng(riderLatLng.lat, riderLatLng.lng),
                            L.latLng(customerLatLng.lat, customerLatLng.lng)
                        ]);
                    } else {
                        // Create new routing control only if it doesn't exist
                        const routingControl = L.Routing.control({
                            waypoints: [
                                L.latLng(riderLatLng.lat, riderLatLng.lng),
                                L.latLng(customerLatLng.lat, customerLatLng.lng)
                            ],
                            routeWhileDragging: false,
                            router: L.Routing.osrmv1({
                                serviceUrl: 'https://router.project-osrm.org/route/v1',
                                profile: 'driving'
                            }),
                            createMarker: function() { return null; },
                            lineOptions: {
                                styles: [
                                    {color: '#FF6B9D', opacity: 0.9, weight: 6}
                                ]
                            },
                            showAlternatives: false,
                            addWaypoints: false,
                            fitSelectedRoutes: true,
                            show: false, // Hide directions panel on customer side
                            collapsible: false
                        }).addTo(leafletMapInstance);
                        
                        // Store routing control
                        routePolyline = routingControl;
                        
                        // Store reference to prevent garbage collection
                        if (!leafletMapInstance._routingControls) leafletMapInstance._routingControls = [];
                        leafletMapInstance._routingControls.push(routingControl);
                    }
                    
                    // Calculate estimated time when route is found (attach to existing or new control)
                    const controlToUse = routePolyline && routePolyline.setWaypoints ? routePolyline : (routePolyline || null);
                    if (controlToUse && !controlToUse._etaHandlerAttached) {
                        controlToUse.on('routesfound', function(e) {
                            const route = e.routes[0];
                            if (route && route.summary) {
                                const totalDistance = route.summary.totalDistance; // in meters
                                const totalTimeSeconds = route.summary.totalTime; // in seconds
                                
                                // Get current order progress from localStorage
                                const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
                                const currentOrder = orders.find(o => o.id === order.id) || order;
                                const progress = currentOrder.deliveryProgress || 0; // 0-100
                                
                                // Calculate remaining distance and time based on delivery progress
                                // Progress represents how far along the route the rider is
                                const remainingProgress = Math.max(0, Math.min(1, (100 - progress) / 100));
                                const remainingDistance = totalDistance * remainingProgress;
                                const remainingTimeSeconds = totalTimeSeconds * remainingProgress;
                                
                                // Add buffer for traffic/real-world conditions (15% more time)
                                const adjustedTimeSeconds = remainingTimeSeconds * 1.15;
                                const timeMinutes = Math.max(1, Math.round(adjustedTimeSeconds / 60));
                                const distance = (remainingDistance / 1000).toFixed(2);
                                
                                // Update ETA display
                                const etaTime = document.getElementById('etaTime');
                                if (etaTime) {
                                    etaTime.textContent = timeMinutes + ' minutes';
                                }
                                
                                // Update order with remaining time and distance
                                const orderIndex = orders.findIndex(o => o.id === order.id);
                                if (orderIndex !== -1) {
                                    orders[orderIndex].estimatedTime = timeMinutes + ' minutes';
                                    orders[orderIndex].distance = distance + ' km';
                                    orders[orderIndex].estimatedTimeSeconds = adjustedTimeSeconds;
                                    // Calculate arrival time based on remaining time
                                    const arrivalTime = new Date(Date.now() + adjustedTimeSeconds * 1000);
                                    orders[orderIndex].estimatedArrival = arrivalTime.toISOString();
                                    localStorage.setItem('slayStationOrders', JSON.stringify(orders));
                                }
                            }
                        });
                        controlToUse._etaHandlerAttached = true;
                    }
                } else {
                    // Fallback: simple polyline
                    routePolyline = L.polyline([
                        [riderLatLng.lat, riderLatLng.lng],
                        [customerLatLng.lat, customerLatLng.lng]
                    ], {
                        color: '#FF6B9D',
                        weight: 4,
                        opacity: 0.8
                    }).addTo(leafletMapInstance);
                }
            } catch (e) {
                console.warn('Could not create rider marker:', e);
            }
        } else if (!order.completed) {
            // Show route from rider location to customer (even if not started)
            try {
                // Use rider location if available, otherwise use store location
                let startLatLng = storeLatLng;
                if (order.riderLocation) {
                    startLatLng = percentageToLatLng(order.riderLocation.x, order.riderLocation.y);
                }
                
                // Show route using actual roads
                if (typeof L.Routing !== 'undefined') {
                    if (routePolyline && routePolyline.setWaypoints) {
                        // Update existing routing
                        routePolyline.setWaypoints([
                            L.latLng(startLatLng.lat, startLatLng.lng),
                            L.latLng(customerLatLng.lat, customerLatLng.lng)
                        ]);
                    } else {
                        routePolyline = L.Routing.control({
                            waypoints: [
                                L.latLng(startLatLng.lat, startLatLng.lng),
                                L.latLng(customerLatLng.lat, customerLatLng.lng)
                            ],
                            routeWhileDragging: false,
                            router: L.Routing.osrmv1({
                                serviceUrl: 'https://router.project-osrm.org/route/v1',
                                profile: 'driving'
                            }),
                            createMarker: function() { return null; },
                            lineOptions: {
                                styles: [
                                    {color: '#FF6B9D', opacity: 0.7, weight: 5}
                                ]
                            },
                            showAlternatives: false,
                            addWaypoints: false,
                            show: false, // Hide directions panel on customer side
                            collapsible: false
                        }).addTo(leafletMapInstance);
                    }
                } else {
                    // Fallback: simple polyline
                    if (routePolyline && routePolyline.setLatLngs) {
                        routePolyline.setLatLngs([
                            [startLatLng.lat, startLatLng.lng],
                            [customerLatLng.lat, customerLatLng.lng]
                        ]);
                    } else {
                        routePolyline = L.polyline([
                            [startLatLng.lat, startLatLng.lng],
                            [customerLatLng.lat, customerLatLng.lng]
                        ], {
                            color: '#FF6B9D',
                            weight: 3,
                            opacity: 0.5
                        }).addTo(leafletMapInstance);
                    }
                }
            } catch (e) {
                console.warn('Could not create route:', e);
            }
        }
        
        // Fit bounds to show rider and customer markers
        try {
            const bounds = L.latLngBounds([
                [customerLatLng.lat, customerLatLng.lng]
            ]);
            if (riderMarker) {
                bounds.extend([riderMarker.getLatLng().lat, riderMarker.getLatLng().lng]);
            } else {
                // Use store location as fallback if rider marker not available
                bounds.extend([storeLatLng.lat, storeLatLng.lng]);
            }
            leafletMapInstance.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {
            console.warn('Could not fit bounds:', e);
        }
    } catch (error) {
        console.error('Error initializing Leaflet Map:', error);
        if (!mapErrorShown && !leafletMapInstance) {
            renderSimpleMap(order);
            mapErrorShown = true;
        }
    }
}

// Update map markers without re-initializing
function updateMapMarkers(order) {
    if (!leafletMapInstance) return;
    
    try {
        // Update rider marker position if it exists
        if (order.status === 'dispatched' && order.riderLocation && !order.completed) {
            const riderLatLng = percentageToLatLng(order.riderLocation.x, order.riderLocation.y);
            const customerLatLng = percentageToLatLng(order.customerLocation.x, order.customerLocation.y);
            
            if (riderMarker) {
                riderMarker.setLatLng([riderLatLng.lat, riderLatLng.lng]);
            } else {
                // Create rider marker if it doesn't exist - Motorcycle icon
                const motorcycleIcon = L.divIcon({
                    className: 'custom-marker rider-marker-icon',
                    html: '<div style="background: linear-gradient(135deg, #4CAF50, #45a049); width: 50px; height: 50px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 15px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; position: relative;"><span style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏍️</span><div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid white;"></div></div>',
                    iconSize: [50, 58],
                    iconAnchor: [25, 58],
                    popupAnchor: [0, -58]
                });
                riderMarker = L.marker([riderLatLng.lat, riderLatLng.lng], {
                    icon: motorcycleIcon,
                    title: 'Rider Location'
                }).addTo(leafletMapInstance);
                riderMarker.bindPopup('🏍️ Rider');
            }
            
            // Update route - keep it persistent
            if (routePolyline && routePolyline.setWaypoints) {
                // Update routing waypoints (keeps route visible)
                routePolyline.setWaypoints([
                    L.latLng(riderLatLng.lat, riderLatLng.lng),
                    L.latLng(customerLatLng.lat, customerLatLng.lng)
                ]);
            } else if (routePolyline && routePolyline.setLatLngs) {
                // Update polyline
                routePolyline.setLatLngs([
                    [riderLatLng.lat, riderLatLng.lng],
                    [customerLatLng.lat, customerLatLng.lng]
                ]);
            } else if (typeof L.Routing !== 'undefined') {
                // Create new routing if it doesn't exist
                routePolyline = L.Routing.control({
                    waypoints: [
                        L.latLng(riderLatLng.lat, riderLatLng.lng),
                        L.latLng(customerLatLng.lat, customerLatLng.lng)
                    ],
                    routeWhileDragging: false,
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                        profile: 'driving'
                    }),
                    createMarker: function() { return null; },
                    lineOptions: {
                        styles: [
                            {color: '#FF6B9D', opacity: 0.9, weight: 6}
                        ]
                    },
                    showAlternatives: false,
                    addWaypoints: false,
                    show: false, // Hide directions panel on customer side
                    collapsible: false
                }).addTo(leafletMapInstance);
            } else {
                // Fallback: simple polyline
                routePolyline = L.polyline([
                    [riderLatLng.lat, riderLatLng.lng],
                    [customerLatLng.lat, customerLatLng.lng]
                ], {
                    color: '#FF6B9D',
                    weight: 4,
                    opacity: 0.8
                }).addTo(leafletMapInstance);
            }
        }
    } catch (e) {
        console.warn('Error updating map markers:', e);
    }
}

// Fallback simple map renderer
function renderSimpleMap(order) {
    const deliveryMap = document.getElementById('deliveryMap');
    if (!deliveryMap) return;
    
    deliveryMap.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #666; background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border-radius: 15px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">🗺️ Map Loading...</p>
            <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">Loading OpenStreetMap...</p>
        </div>
    `;
}

// Render delivery map with Google Maps
function renderDeliveryMap(order, delivered, progress) {
    const deliveryMap = document.getElementById('deliveryMap');
    if (!deliveryMap) return;
    
    // Initialize locations if not set
    if (!order.storeLocation) {
        order.storeLocation = { x: 20, y: 70 };
    }
    if (!order.customerLocation) {
        order.customerLocation = { x: 75, y: 25 };
    }
    if (!order.riderLocation && order.status === 'dispatched' && !delivered) {
        // Calculate rider position based on progress
        const startX = order.storeLocation.x;
        const startY = order.storeLocation.y;
        const endX = order.customerLocation.x;
        const endY = order.customerLocation.y;
        
        order.riderLocation = {
            x: startX + (endX - startX) * (progress / 100),
            y: startY + (endY - startY) * (progress / 100)
        };
    }
    
    // Initialize or update Leaflet Map
    if (typeof L !== 'undefined' && L.map) {
        // If map is already initialized, just update markers
        if (leafletMapInstance) {
            updateMapMarkers(order);
        } else {
            initGoogleMap(order);
        }
    } else {
        // Only show fallback if we haven't already initialized a map
        if (!leafletMapInstance && !mapErrorShown) {
            renderSimpleMap(order);
        }
    }
    
    // Save updated locations
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === order.id);
    if (orderIndex !== -1) {
        orders[orderIndex] = order;
        localStorage.setItem('slayStationOrders', JSON.stringify(orders));
    }
}

function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.animationDelay = Math.random() * 2 + 's';
        confettiContainer.appendChild(confetti);
    }
    
    document.body.appendChild(confettiContainer);
    
    setTimeout(() => {
        confettiContainer.remove();
    }, 3000);
}

// Allow Enter key to track order
document.getElementById('orderNumber').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        trackOrder();
    }
});

// Make functions globally available
if (typeof window !== 'undefined') {
    window.submitMpesaCode = submitMpesaCode;
    window.trackOrder = trackOrder;
}
