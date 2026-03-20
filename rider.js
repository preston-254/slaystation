// Rider System Script
const RIDER_EMAILS = [
    'preston.mwendwa@riarauniversity.ac.ke',
    'kangethekelvin56@gmail.com',
    'prestonmugo83@gmail.com'
];

// Authenticate rider (used after successful login)
function authenticateRider(email) {
    if (RIDER_EMAILS.includes(email.toLowerCase())) {
        localStorage.setItem('riderEmail', email.toLowerCase());
        return true;
    } else {
        console.warn('Email not in allowed rider list:', email);
        return false;
    }
}

// Check if current user is an authorized rider
function isAuthorizedRider(email) {
    return RIDER_EMAILS.includes(email.toLowerCase());
}

// Load dispatched orders for rider
function loadRiderOrders() {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const riderEmail = localStorage.getItem('riderEmail');
    
    if (!riderEmail) {
        return;
    }
    
    // Separate active and delivered orders
    const allRiderOrders = orders.filter(order => 
        order.assignedRider && 
        order.assignedRider.toLowerCase() === riderEmail.toLowerCase()
    );
    
    const activeOrders = allRiderOrders.filter(order => 
        !order.completed && (order.status === 'dispatched' || order.status === 'processing')
    );
    
    const deliveredOrders = allRiderOrders.filter(order => 
        order.completed || order.status === 'delivered'
    );
    
    // Update nav badge counts (Uber-style)
    const activeCountEl = document.getElementById('riderActiveCount');
    const deliveredTodayEl = document.getElementById('riderDeliveredToday');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDelivered = deliveredOrders.filter(o => {
        const d = new Date(o.deliveredTime || o.deliveryStartTime || 0);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });
    if (activeCountEl) activeCountEl.textContent = activeOrders.length;
    if (deliveredTodayEl) deliveredTodayEl.textContent = todayDelivered.length;
    
    // Render statistics portal
    renderRiderStats(allRiderOrders, activeOrders, deliveredOrders);
    
    // Render orders
    renderRiderOrders(activeOrders, deliveredOrders);
    
    // Update main map with all active deliveries (Uber-style)
    updateRiderMainMap(activeOrders);
}

// Render rider statistics portal (Daily Statistics)
function renderRiderStats(allOrders, activeOrders, deliveredOrders) {
    const statsPortal = document.getElementById('riderStatsPortal');
    if (!statsPortal) return;
    
    // Get today's date (reset at midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if we need to reset daily stats
    const lastResetDate = localStorage.getItem('riderDailyStatsResetDate');
    if (lastResetDate !== todayStr) {
        // New day - reset daily stats
        localStorage.setItem('riderDailyStatsResetDate', todayStr);
        localStorage.removeItem('riderDailyStats');
    }
    
    // Filter orders for today only
    const todayDeliveredOrders = deliveredOrders.filter(order => {
        const orderDate = new Date(order.deliveredTime || order.deliveryStartTime || order.date);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    });
    
    const todayActiveOrders = activeOrders.filter(order => {
        const orderDate = new Date(order.date);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    });
    
    const todayAllOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date || order.deliveryStartTime || order.deliveredTime);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    });
    
    // Calculate daily statistics
    const dailyTrips = todayAllOrders.length;
    const dailyCompleted = todayDeliveredOrders.length;
    const dailyActive = todayActiveOrders.length;
    
    // Calculate daily earnings (from delivery fees of completed orders)
    const dailyEarnings = todayDeliveredOrders.reduce((sum, order) => {
        return sum + (order.deliveryFee || 0);
    }, 0);
    
    // Calculate average delivery time for today
    const tripsWithTime = todayDeliveredOrders.filter(o => o.estimatedTimeSeconds);
    const avgDeliveryTime = tripsWithTime.length > 0
        ? Math.round(tripsWithTime.reduce((sum, o) => sum + (o.estimatedTimeSeconds || 0), 0) / tripsWithTime.length / 60)
        : 0;
    
    // Calculate total distance for today
    const totalDistance = todayDeliveredOrders.reduce((sum, order) => {
        if (order.distance) {
            const distanceNum = parseFloat(order.distance.replace(' km', '').replace('km', '').trim());
            return sum + (isNaN(distanceNum) ? 0 : distanceNum);
        }
        return sum;
    }, 0);
    
    statsPortal.innerHTML = `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, rgba(255, 107, 157, 0.1), rgba(199, 125, 255, 0.1)); border-radius: 15px; border-left: 4px solid var(--primary-pink);">
            <h3 style="margin: 0; color: var(--dark); font-size: 1.2rem;">📅 Daily Statistics</h3>
            <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">Stats reset daily at midnight</p>
        </div>
        
        <div class="stat-card">
            <span class="stat-icon">📊</span>
            <div class="stat-value">${dailyTrips}</div>
            <div class="stat-label">Today's Trips</div>
            <div class="stat-subtitle">Orders today</div>
        </div>
        
        <div class="stat-card">
            <span class="stat-icon">✅</span>
            <div class="stat-value">${dailyCompleted}</div>
            <div class="stat-label">Completed Today</div>
            <div class="stat-subtitle">Successfully delivered</div>
        </div>
        
        <div class="stat-card">
            <span class="stat-icon">🚚</span>
            <div class="stat-value">${dailyActive}</div>
            <div class="stat-label">Active Now</div>
            <div class="stat-subtitle">In progress</div>
        </div>
        
        <div class="stat-card">
            <span class="stat-icon">💰</span>
            <div class="stat-value">KSH ${dailyEarnings.toLocaleString()}</div>
            <div class="stat-label">Today's Earnings</div>
            <div class="stat-subtitle">From deliveries</div>
        </div>
        
        ${avgDeliveryTime > 0 ? `
        <div class="stat-card">
            <span class="stat-icon">⏱️</span>
            <div class="stat-value">${avgDeliveryTime} min</div>
            <div class="stat-label">Avg Time Today</div>
            <div class="stat-subtitle">Average per trip</div>
        </div>
        ` : ''}
        
        ${totalDistance > 0 ? `
        <div class="stat-card">
            <span class="stat-icon">📍</span>
            <div class="stat-value">${totalDistance.toFixed(1)} km</div>
            <div class="stat-label">Distance Today</div>
            <div class="stat-subtitle">Kilometers covered</div>
        </div>
        ` : ''}
    `;
}

// Render rider orders
function renderRiderOrders(activeOrders, deliveredOrders = []) {
    // Render active orders to active tab
    const activeOrdersList = document.getElementById('dispatchedOrdersList');
    // Render history to history tab
    const historyList = document.getElementById('tripHistoryList');
    
    if (!activeOrdersList) return;
    
    // Store existing map instances before clearing - only for active orders
    const existingMaps = {};
    activeOrders.forEach(order => {
        if (riderMapInstances[order.id]) {
            existingMaps[order.id] = {
                map: riderMapInstances[order.id],
                markers: riderMarkers[order.id],
                polyline: riderPolylines[order.id],
                routing: riderRoutingControls[order.id]
            };
        }
    });
    
    activeOrdersList.innerHTML = '';
    
    // Render active orders section
    if (activeOrders.length === 0) {
        activeOrdersList.innerHTML = `
            <div class="no-orders">
                <h3>No Active Orders 📦</h3>
                <p>There are no active orders at the moment.</p>
                <p style="margin-top: 1rem; color: var(--primary-pink);">✨ Check back soon!</p>
            </div>
        `;
    } else {
        const activeSection = document.createElement('div');
        activeSection.innerHTML = '<h2 style="margin-bottom: 1.5rem; color: var(--dark);">🟢 Active Deliveries</h2>';
        activeOrdersList.appendChild(activeSection);
        
        const ordersContainer = document.createElement('div');
        ordersContainer.className = 'dispatched-orders';
    
        activeOrders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card-rider';
        
        const riderEmail = localStorage.getItem('riderEmail');
        const isAssigned = order.assignedRider === riderEmail;
        const canAccept = !order.assignedRider && order.status === 'dispatched';
        const canStart = isAssigned && !order.deliveryStarted;
        const canComplete = isAssigned && order.deliveryStarted && !order.completed;
        
        orderCard.innerHTML = `
            <h3>Order #${order.id}</h3>
            
            <div class="order-info-rider">
                <p><strong>Customer:</strong> ${order.name}</p>
                <p><strong>Phone:</strong> ${order.phone}</p>
                <p><strong>Address:</strong> ${order.address}</p>
                <p><strong>Status:</strong> ${isAssigned ? '🟢 Assigned to You' : '🟡 Awaiting Rider'}</p>
                ${order.deliveryStarted ? '<p><strong>Delivery Started:</strong> ' + new Date(order.deliveryStartTime).toLocaleString() + '</p>' : ''}
                ${isAssigned && order.deliveryStarted ? `
                    <div style="background: #E3F2FD; padding: 0.75rem; border-radius: 10px; margin-top: 0.5rem;">
                        <p style="margin: 0; color: #1976D2; font-weight: 600;">⏱️ Estimated Arrival: <span id="eta-${order.id}">${order.estimatedTime || 'Calculating...'}</span></p>
                        <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">Distance: <span id="distance-${order.id}">${order.distance || 'Calculating...'}</span></p>
                    </div>
                ` : ''}
                
                <!-- Customer Communication -->
                <div class="customer-communication" style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 10px;">
                    <p style="margin: 0 0 0.75rem 0; font-weight: 600; color: var(--dark);">📞 Contact Customer:</p>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="comm-btn call-btn" onclick="callCustomer('${order.phone}')" title="Call Customer">
                            📞 Call
                        </button>
                        <button class="comm-btn sms-btn" onclick="smsCustomer('${order.phone}', ${order.id})" title="Send SMS">
                            💬 SMS
                        </button>
                        <button class="comm-btn whatsapp-btn" onclick="whatsappCustomer('${order.phone}', ${order.id})" title="WhatsApp">
                            💬 WhatsApp
                        </button>
                    </div>
                </div>
                
                <!-- Message customer -->
                <div class="rider-message-customer" style="margin-top: 1rem; padding: 0.75rem; background: #f0f7ff; border-radius: 10px; border: 1px solid #2196F3;">
                    <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: #1976D2;">💬 Message customer</p>
                    <textarea id="riderMsg-${order.id}" placeholder="e.g. On my way! ETA 10 min." rows="2" style="width: 100%; padding: 0.5rem; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; resize: vertical;"></textarea>
                    <button type="button" onclick="sendMessageToCustomer(${order.id})" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Send message</button>
                </div>
                <!-- Weather Info -->
                <div id="weather-${order.id}" class="weather-info" style="margin-top: 1rem; padding: 0.75rem; background: #e3f2fd; border-radius: 10px; display: none;">
                    <p style="margin: 0; font-weight: 600; color: #1976D2;">🌤️ Weather: <span id="weather-text-${order.id}">Loading...</span></p>
                </div>
            </div>
            
            ${isAssigned && !order.deliveryStarted ? `
                <div style="margin: 1rem 0; padding: 1rem; background: #FFF3E0; border-radius: 10px; border: 2px solid #FF9800;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #E65100;">📍 Enter Delivery Location:</label>
                    <input type="text" id="deliveryLocation-${order.id}" placeholder="Enter address or search location..." 
                        value="${order.address || ''}" 
                        style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-family: 'Poppins', sans-serif; margin-bottom: 0.5rem;">
                    <button onclick="searchLocation(${order.id})" style="padding: 0.5rem 1rem; background: #FF9800; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">🔍 Search Location</button>
                </div>
            ` : ''}
            
            <div class="map-container" id="map-${order.id}">
                <div class="map-wrapper" id="mapWrapper-${order.id}">
                    <div class="google-map" id="googleMap-${order.id}"></div>
                </div>
            </div>
            
            <div class="order-actions-rider">
                ${canAccept ? `
                    <button class="accept-btn" onclick="acceptOrder(${order.id})">
                        Accept Order ✅
                    </button>
                ` : ''}
                ${canStart ? `
                    <button class="start-btn" onclick="startDelivery(${order.id})">
                        Start Delivery 🚚
                    </button>
                ` : ''}
                ${canComplete ? `
                    <button class="complete-btn" onclick="showDeliveryProofModal(${order.id})">
                        Mark as Delivered 🎉
                    </button>
                ` : ''}
                ${order.completed ? '<p style="color: #4CAF50; font-weight: 600; text-align: center; width: 100%;">✅ Delivered</p>' : ''}
            </div>
        `;
        
        ordersContainer.appendChild(orderCard);
        
            // Render map for this order - wait for DOM and Leaflet
            setTimeout(() => {
                // Check if map already exists and reuse it
                if (existingMaps[order.id] && existingMaps[order.id].map) {
                    // Map already exists, just update it
                    const mapElement = document.getElementById(`googleMap-${order.id}`);
                    if (mapElement && !mapElement._leaflet_id) {
                        // Map container was recreated, need to reinitialize
                        delete riderMapInstances[order.id];
                        delete riderMapInitializationAttempted[order.id];
                    } else if (riderMapInstances[order.id]) {
                        // Map still exists, just update markers - don't reinitialize
                        updateRiderMapMarkers(order.id, order, isAssigned && order.deliveryStarted);
                        if (isAssigned && order.deliveryStarted && !order.completed) {
                            startRiderTracking(order.id, order);
                            loadWeatherForOrder(order.id, order);
                        }
                        return;
                    }
                }
                
                // Wait for Leaflet to be available
                const initMap = () => {
                    if ((window.google && google.maps) || (typeof L !== 'undefined' && L.map)) {
                        renderMap(order.id, order, isAssigned && order.deliveryStarted);
                        
                        // Start tracking if delivery has started
                        if (isAssigned && order.deliveryStarted && !order.completed) {
                            startRiderTracking(order.id, order);
                            loadWeatherForOrder(order.id, order);
                        }
                    } else {
                        setTimeout(initMap, 100);
                    }
                };
                initMap();
            }, 300);
        });
        
        activeOrdersList.appendChild(ordersContainer);
    }
    
    // Render delivered orders history section to history tab
    if (historyList) {
        historyList.innerHTML = ''; // Clear previous content
        
        const historyPortal = document.createElement('div');
        historyPortal.className = 'trip-history-portal';
        
        const historyHeader = document.createElement('div');
        historyHeader.className = 'trip-history-header';
        historyHeader.innerHTML = `
            <h2>📜 Trip History</h2>
            <span style="color: #666; font-weight: 600;">${deliveredOrders.length} Completed Trips</span>
        `;
        historyPortal.appendChild(historyHeader);
        
        const historyContainer = document.createElement('div');
        historyContainer.style.display = 'flex';
        historyContainer.style.flexDirection = 'column';
        historyContainer.style.gap = '1rem';
        
        // Sort by most recent first
        deliveredOrders.sort((a, b) => {
            const dateA = new Date(a.deliveredTime || a.deliveryStartTime || 0);
            const dateB = new Date(b.deliveredTime || b.deliveryStartTime || 0);
            return dateB - dateA;
        });
        
        deliveredOrders.forEach(order => {
            const tripCard = document.createElement('div');
            tripCard.className = 'trip-card';
            
            const deliveredDate = order.deliveredTime 
                ? new Date(order.deliveredTime).toLocaleString() 
                : order.deliveryStartTime 
                    ? new Date(order.deliveryStartTime).toLocaleString()
                    : 'Completed';
            
            const orderTotal = order.total ? `KSH ${order.total.toLocaleString()}` : 'N/A';
            const deliveryTime = order.estimatedTime || 'N/A';
            const distance = order.distance || 'N/A';
            
            tripCard.innerHTML = `
                <div class="trip-card-header">
                    <div class="trip-id">Trip #${order.id}</div>
                    <div class="trip-status-badge">✅ Delivered</div>
                </div>
                
                <div class="trip-details">
                    <div class="trip-detail-item">
                        <span class="trip-detail-icon">👤</span>
                        <div>
                            <div class="trip-detail-label">Customer</div>
                            <div class="trip-detail-value">${order.name}</div>
                        </div>
                    </div>
                    
                    <div class="trip-detail-item">
                        <span class="trip-detail-icon">📍</span>
                        <div>
                            <div class="trip-detail-label">Location</div>
                            <div class="trip-detail-value">${order.address || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="trip-detail-item">
                        <span class="trip-detail-icon">💰</span>
                        <div>
                            <div class="trip-detail-label">Order Value</div>
                            <div class="trip-detail-value">${orderTotal}</div>
                        </div>
                    </div>
                    
                    ${distance !== 'N/A' ? `
                    <div class="trip-detail-item">
                        <span class="trip-detail-icon">📏</span>
                        <div>
                            <div class="trip-detail-label">Distance</div>
                            <div class="trip-detail-value">${distance}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${deliveryTime !== 'N/A' ? `
                    <div class="trip-detail-item">
                        <span class="trip-detail-icon">⏱️</span>
                        <div>
                            <div class="trip-detail-label">Delivery Time</div>
                            <div class="trip-detail-value">${deliveryTime}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="trip-date">📅 ${deliveredDate}</div>
            `;
            
            historyContainer.appendChild(tripCard);
        });
        
        if (deliveredOrders.length > 0) {
            historyPortal.appendChild(historyContainer);
        } else {
            // Show empty state for trip history
            const emptyState = document.createElement('div');
            emptyState.style.cssText = 'text-align: center; padding: 3rem; color: #666;';
            emptyState.innerHTML = `
                <div style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.5;">📜</div>
                <h3 style="color: #999; margin-bottom: 0.5rem;">No Trip History Yet</h3>
                <p>Your completed deliveries will appear here</p>
            `;
            historyPortal.appendChild(emptyState);
        }
        historyList.appendChild(historyPortal);
    }
}

// Main overview map (Uber-style: Google when API loaded, else Leaflet)
let riderMainMapInstance = null;
let riderMainMapGoogle = null;
let riderMainDirectionsRenderer = null;
let riderMainGoogleMarkers = [];
let directionsServiceSingleton = null;
const riderGoogleLeafletPolylines = {};

function updateRiderMainMap(activeOrders) {
    window._lastActiveOrders = activeOrders || [];
    const container = document.getElementById('riderMainMap');
    const hint = document.getElementById('riderMapHint');
    if (!container) return;
    if (hint) hint.style.display = activeOrders.length === 0 ? 'block' : 'none';

    if (window.google && google.maps && google.maps.Map) {
        if (riderMainMapInstance && riderMainMapInstance.remove) {
            try {
                riderMainMapInstance.remove();
            } catch (e) { /* ignore */ }
            riderMainMapInstance = null;
        }
        if (!riderMainMapGoogle) {
            riderMainMapGoogle = new google.maps.Map(container, {
                center: { lat: -1.2654, lng: 36.8067 },
                zoom: 12,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true
            });
            riderMainDirectionsRenderer = new google.maps.DirectionsRenderer({
                map: riderMainMapGoogle,
                suppressMarkers: true,
                polylineOptions: { strokeColor: '#c2185b', strokeWeight: 5, strokeOpacity: 0.9 }
            });
        }
        riderMainGoogleMarkers.forEach((m) => m.setMap(null));
        riderMainGoogleMarkers = [];
        const bounds = new google.maps.LatLngBounds();
        (activeOrders || []).forEach((order) => {
            const store = getStoreLatLngFromOrder(order);
            const cust = getCustomerLatLngFromOrder(order);
            const rider = getRiderLatLngFromOrder(order);
            riderMainGoogleMarkers.push(
                new google.maps.Marker({
                    position: store,
                    map: riderMainMapGoogle,
                    title: 'Shop · Order #' + order.id,
                    icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }),
                new google.maps.Marker({
                    position: cust,
                    map: riderMainMapGoogle,
                    title: (order.name || 'Customer') + ' · Order #' + order.id,
                    icon: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
                }),
                new google.maps.Marker({
                    position: rider,
                    map: riderMainMapGoogle,
                    title: 'Rider · Order #' + order.id,
                    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, labelOrigin: new google.maps.Point(0, -2) },
                    label: { text: '🚲', fontSize: '24px' }
                })
            );
            bounds.extend(store);
            bounds.extend(cust);
            bounds.extend(rider);
        });
        const riderEmail = (localStorage.getItem('riderEmail') || '').toLowerCase();
        const primary = (activeOrders || []).find(
            (o) =>
                o.deliveryStarted &&
                !o.completed &&
                o.assignedRider &&
                o.assignedRider.toLowerCase() === riderEmail
        );
        if (primary && riderMainDirectionsRenderer) {
            const ds = directionsServiceSingleton || (directionsServiceSingleton = new google.maps.DirectionsService());
            const origin = getRiderLatLngFromOrder(primary);
            const dest = getCustomerLatLngFromOrder(primary);
            const req = {
                origin,
                destination: dest,
                travelMode: google.maps.TravelMode.DRIVING
            };
            let withTraffic = false;
            if (google.maps.TrafficModel) {
                req.drivingOptions = {
                    departureTime: new Date(),
                    trafficModel: google.maps.TrafficModel.BEST_GUESS
                };
                withTraffic = true;
            }
            ds.route(req, (result, status) => {
                if (status !== 'OK' && withTraffic && req.drivingOptions) {
                    delete req.drivingOptions;
                    ds.route(req, (r2, s2) => {
                        if (s2 === 'OK' && riderMainDirectionsRenderer) riderMainDirectionsRenderer.setDirections(r2);
                    });
                    return;
                }
                if (status === 'OK' && riderMainDirectionsRenderer) riderMainDirectionsRenderer.setDirections(result);
            });
        }
        if (!bounds.isEmpty()) {
            riderMainMapGoogle.fitBounds(bounds, 48);
        } else {
            riderMainMapGoogle.setCenter({ lat: -1.2654, lng: 36.8067 });
            riderMainMapGoogle.setZoom(12);
        }
        setTimeout(function () {
            if (riderMainMapGoogle) google.maps.event.trigger(riderMainMapGoogle, 'resize');
        }, 200);
        return;
    }

    if (riderMainMapGoogle) {
        riderMainMapGoogle = null;
        riderMainDirectionsRenderer = null;
        riderMainGoogleMarkers = [];
        container.innerHTML = '';
    }
    if (typeof L === 'undefined' || !L.map) return;
    if (!riderMainMapInstance) {
        riderMainMapInstance = L.map(container, {
            center: [-1.267, 36.806],
            zoom: 12,
            zoomControl: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(riderMainMapInstance);
        riderMainMapInstance._deliveryMarkers = [];
    }
    (riderMainMapInstance._deliveryMarkers || []).forEach((m) => {
        if (m && riderMainMapInstance.removeLayer) riderMainMapInstance.removeLayer(m);
    });
    riderMainMapInstance._deliveryMarkers = [];
    const bounds = [];
    (activeOrders || []).forEach((order) => {
        const store = getStoreLatLngFromOrder(order);
        const cust = getCustomerLatLngFromOrder(order);
        const rider = getRiderLatLngFromOrder(order);
        const storeIcon = L.divIcon({ className: 'rider-main-marker', html: '🛍️', iconSize: [28, 28], iconAnchor: [14, 14] });
        const customerIcon = L.divIcon({ className: 'rider-main-marker', html: '📍', iconSize: [32, 32], iconAnchor: [16, 16] });
        const riderIcon = L.divIcon({ className: 'rider-main-marker', html: '🏍️', iconSize: [36, 36], iconAnchor: [18, 18] });
        const m1 = L.marker([store.lat, store.lng], { icon: storeIcon }).addTo(riderMainMapInstance).bindPopup('Order #' + order.id + ' – Store');
        const m2 = L.marker([cust.lat, cust.lng], { icon: customerIcon }).addTo(riderMainMapInstance).bindPopup('Order #' + order.id + ' – ' + (order.name || 'Customer'));
        const m3 = L.marker([rider.lat, rider.lng], { icon: riderIcon }).addTo(riderMainMapInstance).bindPopup('Order #' + order.id + ' – Rider');
        riderMainMapInstance._deliveryMarkers.push(m1, m2, m3);
        bounds.push([store.lat, store.lng], [cust.lat, cust.lng], [rider.lat, rider.lng]);
    });
    if (bounds.length > 0 && riderMainMapInstance.fitBounds) riderMainMapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    else riderMainMapInstance.setView([-1.267, 36.806], 12);
    setTimeout(function () {
        if (riderMainMapInstance && riderMainMapInstance.invalidateSize) riderMainMapInstance.invalidateSize();
    }, 100);
}

// Leaflet map instances for each order
const riderMapInstances = {};
const riderMarkers = {};
const riderPolylines = {};
const riderRoutingControls = {};
const riderMapInitializationAttempted = {};
const riderMapErrorShown = {};
const riderGeocoders = {};
const riderGoogleOrderMaps = {};
const riderGoogleOrderMarkers = {};
const riderGoogleOrderRenderers = {};

// Convert percentage coordinates to Nairobi lat/lng
function percentageToLatLngRider(x, y) {
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

function latLngToPercentFlat(lat, lng) {
    const minLat = -1.35;
    const maxLat = -1.20;
    const minLng = 36.70;
    const maxLng = 36.90;
    return {
        x: Math.max(0, Math.min(100, ((lng - minLng) / (maxLng - minLng)) * 100)),
        y: Math.max(0, Math.min(100, ((maxLat - lat) / (maxLat - minLat)) * 100))
    };
}

function getStoreLatLngFromOrder(order) {
    if (order && order.storeLocationLatLng && order.storeLocationLatLng.lat != null) {
        return { lat: order.storeLocationLatLng.lat, lng: order.storeLocationLatLng.lng };
    }
    if (typeof window !== 'undefined' && window.SHOP_LOCATION) {
        return { lat: window.SHOP_LOCATION.lat, lng: window.SHOP_LOCATION.lng };
    }
    const s = (order && order.storeLocation) || { x: 20, y: 70 };
    return percentageToLatLngRider(s.x, s.y);
}

function getCustomerLatLngFromOrder(order) {
    if (order && order.customerLocationLatLng && order.customerLocationLatLng.lat != null) {
        return { lat: order.customerLocationLatLng.lat, lng: order.customerLocationLatLng.lng };
    }
    const c = (order && order.customerLocation) || { x: 75, y: 25 };
    return percentageToLatLngRider(c.x, c.y);
}

function getRiderLatLngFromOrder(order) {
    if (order && order.riderLocationLatLng && order.riderLocationLatLng.lat != null) {
        return { lat: order.riderLocationLatLng.lat, lng: order.riderLocationLatLng.lng };
    }
    const r = (order && order.riderLocation) || (order && order.storeLocation) || { x: 20, y: 70 };
    return percentageToLatLngRider(r.x, r.y);
}

function renderGoogleOrderMap(orderId, order, isActive) {
    if (!window.google || !google.maps) return false;
    const mapElement = document.getElementById(`googleMap-${orderId}`);
    if (!mapElement) return false;
    const storeLatLng = getStoreLatLngFromOrder(order);
    const customerLatLng = getCustomerLatLngFromOrder(order);
    const riderLatLng = getRiderLatLngFromOrder(order);

    if (!riderGoogleOrderMaps[orderId]) {
        riderGoogleOrderMaps[orderId] = new google.maps.Map(mapElement, {
            center: { lat: (storeLatLng.lat + customerLatLng.lat) / 2, lng: (storeLatLng.lng + customerLatLng.lng) / 2 },
            zoom: 12,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: false
        });
        riderGoogleOrderRenderers[orderId] = new google.maps.DirectionsRenderer({
            map: riderGoogleOrderMaps[orderId],
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#FF6B9D', strokeWeight: 5, strokeOpacity: 0.9 }
        });
    }
    const map = riderGoogleOrderMaps[orderId];
    const markers = riderGoogleOrderMarkers[orderId] || {};
    ['store', 'customer', 'rider'].forEach(function (k) {
        if (markers[k]) markers[k].setMap(null);
    });
    riderGoogleOrderMarkers[orderId] = {
        store: new google.maps.Marker({
            position: storeLatLng,
            map: map,
            title: 'Shop',
            icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }),
        customer: new google.maps.Marker({
            position: customerLatLng,
            map: map,
            title: 'Customer',
            icon: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
        }),
        rider: new google.maps.Marker({
            position: riderLatLng,
            map: map,
            title: 'Rider',
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0, labelOrigin: new google.maps.Point(0, -2) },
            label: { text: '🚲', fontSize: '24px' }
        })
    };

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(storeLatLng);
    bounds.extend(customerLatLng);
    bounds.extend(riderLatLng);
    map.fitBounds(bounds, 48);

    if (isActive) {
        const ds = directionsServiceSingleton || (directionsServiceSingleton = new google.maps.DirectionsService());
        const req = {
            origin: riderLatLng,
            destination: customerLatLng,
            travelMode: google.maps.TravelMode.DRIVING
        };
        let withTraffic = false;
        if (google.maps.TrafficModel) {
            req.drivingOptions = { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS };
            withTraffic = true;
        }
        ds.route(req, function (res, status) {
            if (status !== 'OK' && withTraffic) {
                delete req.drivingOptions;
                ds.route(req, function (r2, s2) {
                    if (s2 === 'OK' && riderGoogleOrderRenderers[orderId]) riderGoogleOrderRenderers[orderId].setDirections(r2);
                });
                return;
            }
            if (status === 'OK' && riderGoogleOrderRenderers[orderId]) {
                riderGoogleOrderRenderers[orderId].setDirections(res);
                var leg = res.routes[0].legs[0];
                var sec = (leg.duration_in_traffic && leg.duration_in_traffic.value) ? leg.duration_in_traffic.value : leg.duration.value;
                var distKm = leg.distance ? (leg.distance.value / 1000).toFixed(2) : null;
                var mins = Math.round(sec / 60);
                var etaElement = document.getElementById(`eta-${orderId}`);
                var distanceElement = document.getElementById(`distance-${orderId}`);
                if (etaElement) etaElement.textContent = mins + ' min';
                if (distanceElement && distKm) distanceElement.textContent = distKm + ' km';
            }
        });
    }
    return true;
}

/** Google Directions drawn on Leaflet (traffic when supported). */
function applyGoogleTrafficPolyline(orderId, map, origin, dest, onDone) {
    if (!window.google || !google.maps || !map || !origin || !dest) {
        if (onDone) onDone(null, null);
        return;
    }
    if (!directionsServiceSingleton) directionsServiceSingleton = new google.maps.DirectionsService();
    const run = (useTraffic) => {
        const req = {
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: dest.lat, lng: dest.lng },
            travelMode: google.maps.TravelMode.DRIVING
        };
        if (useTraffic && google.maps.TrafficModel) {
            req.drivingOptions = {
                departureTime: new Date(),
                trafficModel: google.maps.TrafficModel.BEST_GUESS
            };
        }
        directionsServiceSingleton.route(req, (result, status) => {
            if (status !== 'OK' && useTraffic) {
                run(false);
                return;
            }
            if (status !== 'OK' || !result.routes || !result.routes[0]) {
                if (onDone) onDone(null, null);
                return;
            }
            if (riderRoutingControls[orderId]) {
                try {
                    map.removeControl(riderRoutingControls[orderId]);
                } catch (e) { /* ignore */ }
                riderRoutingControls[orderId] = null;
            }
            if (riderPolylines[orderId]) {
                map.removeLayer(riderPolylines[orderId]);
                riderPolylines[orderId] = null;
            }
            const route = result.routes[0];
            const path = route.overview_path.map((p) => [p.lat(), p.lng()]);
            if (riderGoogleLeafletPolylines[orderId]) {
                map.removeLayer(riderGoogleLeafletPolylines[orderId]);
            }
            riderGoogleLeafletPolylines[orderId] = L.polyline(path, {
                color: '#c2185b',
                weight: 5,
                opacity: 0.92
            }).addTo(map);
            const leg = route.legs[0];
            const sec = (leg.duration_in_traffic && leg.duration_in_traffic.value)
                ? leg.duration_in_traffic.value
                : leg.duration.value;
            const distKm = leg.distance ? (leg.distance.value / 1000).toFixed(2) : null;
            const mins = Math.round(sec / 60);
            const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
            const idx = orders.findIndex((o) => o.id === orderId);
            if (idx !== -1) {
                orders[idx].estimatedTime = mins + ' min (traffic-aware)';
                if (distKm) orders[idx].distance = distKm + ' km';
                orders[idx].estimatedTimeSeconds = sec;
                orders[idx].etaTrafficModel = useTraffic ? 'best_guess' : 'default';
                localStorage.setItem('slayStationOrders', JSON.stringify(orders));
            }
            const etaEl = document.getElementById(`eta-${orderId}`);
            const distEl = document.getElementById(`distance-${orderId}`);
            if (etaEl) etaEl.textContent = mins + ' min';
            if (distEl && distKm) distEl.textContent = distKm + ' km';
            if (onDone) onDone(mins, distKm);
        });
    };
    run(true);
}

// Initialize Leaflet Map for rider order
function initRiderGoogleMap(orderId, order, isActive) {
    const mapElement = document.getElementById(`googleMap-${orderId}`);
    if (!mapElement) {
        if (!riderMapErrorShown[orderId]) {
            renderSimpleRiderMap(orderId, order, isActive);
            riderMapErrorShown[orderId] = true;
        }
        return;
    }
    
    // Prevent multiple initialization attempts
    if (riderMapInitializationAttempted[orderId] && riderMapInstances[orderId]) {
        // Map already initialized, just update markers
        updateRiderMapMarkers(orderId, order, isActive);
        return;
    }
    
    riderMapInitializationAttempted[orderId] = true;
    
    // Check if Leaflet is loaded - wait longer if needed
    if (typeof L === 'undefined' || !L.map) {
        // Wait for Leaflet to load
        let attempts = 0;
        const checkLeaflet = setInterval(() => {
            attempts++;
            if (typeof L !== 'undefined' && L.map) {
                clearInterval(checkLeaflet);
                initRiderGoogleMap(orderId, order, isActive);
            } else if (attempts > 20) {
                clearInterval(checkLeaflet);
                if (!riderMapErrorShown[orderId]) {
                    renderSimpleRiderMap(orderId, order, isActive);
                    riderMapErrorShown[orderId] = true;
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
        if (!riderMapErrorShown[orderId]) {
            renderSimpleRiderMap(orderId, order, isActive);
            riderMapErrorShown[orderId] = true;
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
    if (!order.riderLocation && isActive) {
        order.riderLocation = { ...order.storeLocation };
    }
    
    const storeLatLng = getStoreLatLngFromOrder(order);
    const customerLatLng = getCustomerLatLngFromOrder(order);
    
    // Center map between store and customer
    const centerLat = (storeLatLng.lat + customerLatLng.lat) / 2;
    const centerLng = (storeLatLng.lng + customerLatLng.lng) / 2;
    
    // Initialize Leaflet map
    try {
        // Check if map element already has a map instance - if so, don't reinitialize
        if (mapElement._leaflet_id && riderMapInstances[orderId]) {
            // Map already initialized on this element, just update markers
            const map = riderMapInstances[orderId];
            // Clear existing markers but keep routing control visible
            if (riderMarkers[orderId]) {
                if (riderMarkers[orderId].store) map.removeLayer(riderMarkers[orderId].store);
                if (riderMarkers[orderId].customer) map.removeLayer(riderMarkers[orderId].customer);
                if (riderMarkers[orderId].rider) map.removeLayer(riderMarkers[orderId].rider);
            }
            // Keep routing control - don't remove it
            // Only remove polyline if routing control doesn't exist
            if (riderPolylines[orderId] && !riderRoutingControls[orderId]) {
                map.removeLayer(riderPolylines[orderId]);
            }
            // Continue to add markers below
        } else if (!riderMapInstances[orderId] || !mapElement._leaflet_id) {
            // Create new map with dark theme tile layer
            riderMapInstances[orderId] = L.map(mapElement, {
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
            }).addTo(riderMapInstances[orderId]);
        }
        
        const map = riderMapInstances[orderId];
        
        // Clear existing markers for this order (but keep routing)
        if (riderMarkers[orderId]) {
            if (riderMarkers[orderId].store) map.removeLayer(riderMarkers[orderId].store);
            if (riderMarkers[orderId].customer) map.removeLayer(riderMarkers[orderId].customer);
            if (riderMarkers[orderId].rider) map.removeLayer(riderMarkers[orderId].rider);
        }
        // Don't remove routing control - keep it visible
        // Only remove polyline if routing control doesn't exist
        if (riderPolylines[orderId] && !riderRoutingControls[orderId]) {
            map.removeLayer(riderPolylines[orderId]);
        }
        
        riderMarkers[orderId] = {};
        
        // Create custom icons
        const storeIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #4CAF50; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="transform: rotate(45deg); font-size: 16px;">📍</span></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        const customerIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: #FF6B9D; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="transform: rotate(45deg); font-size: 16px;">🏠</span></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
        
        // Motorcycle icon for rider (like in the image)
        const riderIcon = L.divIcon({
            className: 'custom-marker rider-marker-icon',
            html: '<div style="background: linear-gradient(135deg, #4CAF50, #45a049); width: 50px; height: 50px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 15px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; position: relative;"><span style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏍️</span><div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid white;"></div></div>',
            iconSize: [50, 58],
            iconAnchor: [25, 58],
            popupAnchor: [0, -58]
        });
        
        try {
            riderMarkers[orderId].store = L.marker([storeLatLng.lat, storeLatLng.lng], {
                icon: storeIcon,
                title: 'Slay Station shop'
            }).addTo(map);
            riderMarkers[orderId].store.bindPopup('🛍️ Shop (Westlands)');
        } catch (e) {
            console.warn('Could not create store marker:', e);
        }

        // Customer marker
        try {
            riderMarkers[orderId].customer = L.marker([customerLatLng.lat, customerLatLng.lng], {
                icon: customerIcon,
                title: 'Customer Location'
            }).addTo(map);
            riderMarkers[orderId].customer.bindPopup('🏠 Customer');
        } catch (e) {
            console.warn('Could not create customer marker:', e);
        }
        
        // Initialize geocoder for address search
        if (typeof L.Control !== 'undefined' && L.Control.Geocoder && !riderGeocoders[orderId]) {
            riderGeocoders[orderId] = L.Control.Geocoder.nominatim();
        }
        
        // Always show rider marker (replaces store location) - Get actual GPS location
        try {
            // Get rider's actual GPS location
            getRiderLocation(orderId, (riderLatLng) => {
                    if (!riderLatLng) {
                        riderLatLng = getRiderLatLngFromOrder(order);
                    }

                    if (riderMarkers[orderId] && riderMarkers[orderId].rider) {
                        riderMarkers[orderId].rider.setLatLng([riderLatLng.lat, riderLatLng.lng]);
                    } else {
                        riderMarkers[orderId].rider = L.marker([riderLatLng.lat, riderLatLng.lng], {
                            icon: riderIcon,
                            title: 'Your Location'
                        }).addTo(map);
                        riderMarkers[orderId].rider.bindPopup('🏍️ You');
                    }

                    function fitRiderCustomerBounds() {
                        const b = L.latLngBounds([
                            [riderLatLng.lat, riderLatLng.lng],
                            [customerLatLng.lat, customerLatLng.lng],
                            [storeLatLng.lat, storeLatLng.lng]
                        ]);
                        map.fitBounds(b, { padding: [50, 50] });
                    }

                    if (!isActive) {
                        fitRiderCustomerBounds();
                        return;
                    }

                    applyGoogleTrafficPolyline(orderId, map, riderLatLng, customerLatLng, (mins) => {
                        if (mins != null) {
                            fitRiderCustomerBounds();
                            return;
                        }
                        if (typeof L.Routing !== 'undefined') {
                            if (riderRoutingControls[orderId]) {
                                riderRoutingControls[orderId].setWaypoints([
                                    L.latLng(riderLatLng.lat, riderLatLng.lng),
                                    L.latLng(customerLatLng.lat, customerLatLng.lng)
                                ]);
                            } else {
                                riderRoutingControls[orderId] = L.Routing.control({
                                    waypoints: [
                                        L.latLng(riderLatLng.lat, riderLatLng.lng),
                                        L.latLng(customerLatLng.lat, customerLatLng.lng)
                                    ],
                                    routeWhileDragging: false,
                                    router: L.Routing.osrmv1({
                                        serviceUrl: 'https://router.project-osrm.org/route/v1',
                                        profile: 'driving'
                                    }),
                                    createMarker: function () { return null; },
                                    lineOptions: {
                                        styles: [{ color: '#FF6B9D', opacity: 0.9, weight: 6 }]
                                    },
                                    showAlternatives: false,
                                    addWaypoints: false,
                                    fitSelectedRoutes: true
                                }).addTo(map);
                                if (!map._routingControls) map._routingControls = [];
                                map._routingControls.push(riderRoutingControls[orderId]);
                            }
                            if (!riderRoutingControls[orderId]._etaHandlerAttached) {
                                riderRoutingControls[orderId].on('routesfound', function (e) {
                                    const route = e.routes[0];
                                    if (route && route.summary) {
                                        const distance = (route.summary.totalDistance / 1000).toFixed(2);
                                        const timeSeconds = route.summary.totalTime;
                                        const timeMinutes = Math.round(timeSeconds / 60);
                                        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
                                        const orderIndex = orders.findIndex((o) => o.id === orderId);
                                        if (orderIndex !== -1) {
                                            orders[orderIndex].estimatedTime = timeMinutes + ' minutes';
                                            orders[orderIndex].distance = distance + ' km';
                                            orders[orderIndex].estimatedTimeSeconds = timeSeconds;
                                            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
                                        }
                                        const etaElement = document.getElementById(`eta-${orderId}`);
                                        const distanceElement = document.getElementById(`distance-${orderId}`);
                                        if (etaElement) etaElement.textContent = timeMinutes + ' minutes';
                                        if (distanceElement) distanceElement.textContent = distance + ' km';
                                    }
                                });
                                riderRoutingControls[orderId]._etaHandlerAttached = true;
                            }
                            riderRoutingControls[orderId].on('routingerror', function () {
                                if (riderPolylines[orderId]) map.removeLayer(riderPolylines[orderId]);
                                riderPolylines[orderId] = L.polyline(
                                    [
                                        [riderLatLng.lat, riderLatLng.lng],
                                        [customerLatLng.lat, customerLatLng.lng]
                                    ],
                                    { color: '#FF6B9D', weight: 4, opacity: 0.8, dashArray: '10, 10' }
                                ).addTo(map);
                            });
                        } else {
                            riderPolylines[orderId] = L.polyline(
                                [
                                    [riderLatLng.lat, riderLatLng.lng],
                                    [customerLatLng.lat, customerLatLng.lng]
                                ],
                                { color: '#FF6B9D', weight: 4, opacity: 0.8 }
                            ).addTo(map);
                        }
                        fitRiderCustomerBounds();
                    });
                });
        } catch (e) {
            console.warn('Could not create rider marker:', e);
        }
        
        // Fit bounds to show rider and customer markers
        try {
            const bounds = L.latLngBounds([
                [customerLatLng.lat, customerLatLng.lng]
            ]);
            if (riderMarkers[orderId] && riderMarkers[orderId].rider) {
                bounds.extend([riderMarkers[orderId].rider.getLatLng().lat, riderMarkers[orderId].rider.getLatLng().lng]);
            } else {
                // If rider marker not yet created, use store location as fallback
                bounds.extend([storeLatLng.lat, storeLatLng.lng]);
            }
            map.fitBounds(bounds, { padding: [50, 50] });
        } catch (e) {
            console.warn('Could not fit bounds:', e);
        }
    } catch (error) {
        console.error('Error initializing Leaflet Map:', error);
        if (!riderMapErrorShown[orderId] && !riderMapInstances[orderId]) {
            renderSimpleRiderMap(orderId, order, isActive);
            riderMapErrorShown[orderId] = true;
        }
    }
}

// Update map markers without re-initializing
function updateRiderMapMarkers(orderId, order, isActive) {
    if (riderGoogleOrderMaps[orderId]) {
        renderGoogleOrderMap(orderId, order, isActive);
        return;
    }
    if (!riderMapInstances[orderId]) return;
    
    try {
        // Update rider marker position if it exists
        if (isActive && order.riderLocation) {
            const riderLatLng = getRiderLatLngFromOrder(order);
            const customerLatLng = getCustomerLatLngFromOrder(order);
            
            if (riderMarkers[orderId] && riderMarkers[orderId].rider) {
                riderMarkers[orderId].rider.setLatLng([riderLatLng.lat, riderLatLng.lng]);
            } else {
                // Create rider marker if it doesn't exist
                riderMarkers[orderId] = riderMarkers[orderId] || {};
                const riderIcon = L.divIcon({
                    className: 'custom-marker rider-marker-icon',
                    html: '<div style="background: linear-gradient(135deg, #4CAF50, #45a049); width: 50px; height: 50px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 15px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; position: relative;"><span style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏍️</span><div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 8px solid white;"></div></div>',
                    iconSize: [50, 58],
                    iconAnchor: [25, 58],
                    popupAnchor: [0, -58]
                });
                riderMarkers[orderId].rider = L.marker([riderLatLng.lat, riderLatLng.lng], {
                    icon: riderIcon,
                    title: 'Your Location'
                }).addTo(riderMapInstances[orderId]);
                riderMarkers[orderId].rider.bindPopup('🏍️ You');
            }
            
            // Update routing if available - get fresh GPS location
            getRiderLocation(orderId, (gpsLocation) => {
                let currentRiderLatLng = riderLatLng;
                if (gpsLocation) {
                    currentRiderLatLng = gpsLocation;
                    if (riderMarkers[orderId] && riderMarkers[orderId].rider) {
                        riderMarkers[orderId].rider.setLatLng([currentRiderLatLng.lat, currentRiderLatLng.lng]);
                    }
                }
                
                // Update routing with actual roads
                if (typeof L.Routing !== 'undefined' && riderRoutingControls[orderId]) {
                    riderRoutingControls[orderId].setWaypoints([
                        L.latLng(currentRiderLatLng.lat, currentRiderLatLng.lng),
                        L.latLng(customerLatLng.lat, customerLatLng.lng)
                    ]);
                } else if (riderPolylines[orderId]) {
                    riderPolylines[orderId].setLatLngs([
                        [currentRiderLatLng.lat, currentRiderLatLng.lng],
                        [customerLatLng.lat, customerLatLng.lng]
                    ]);
                }
            });
        }
    } catch (e) {
        console.warn('Error updating map markers:', e);
    }
}

// Search location function
function searchLocation(orderId) {
    const input = document.getElementById(`deliveryLocation-${orderId}`);
    if (!input) {
        alert('Location input not found. Please refresh the page.');
        return;
    }
    
    const address = input.value.trim();
    
    if (!address) {
        alert('Please enter a delivery location!');
        input.focus();
        return;
    }
    
    // Show loading state
    const button = input.nextElementSibling;
    if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '🔍 Searching...';
        button.disabled = true;
    }
    
    // Add "Nairobi, Kenya" to improve search results
    const searchQuery = address.includes('Nairobi') || address.includes('Kenya')
        ? address
        : `${address}, Nairobi, Kenya`;

    function finishButton(success) {
        if (!button) return;
        button.disabled = false;
        if (success) {
            button.style.background = '#4CAF50';
            button.innerHTML = '✅ Found!';
            setTimeout(() => {
                button.style.background = '#FF9800';
                button.innerHTML = '🔍 Search Location';
            }, 2000);
        } else {
            button.innerHTML = '🔍 Search Location';
        }
    }

    if (window.google && google.maps && google.maps.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: searchQuery }, (results, status) => {
            finishButton(status === 'OK' && results && results.length > 0);
            if (status === 'OK' && results && results.length > 0) {
                const loc = results[0].geometry.location;
                updateCustomerLocation(orderId, loc.lat(), loc.lng(), results[0].formatted_address || address);
                return;
            }
            alert('Location not found. Please try a more specific address.');
            input.focus();
        });
        return;
    }

    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(searchQuery))
        .then((res) => res.json())
        .then((results) => {
            finishButton(results && results.length > 0);
            if (results && results.length > 0) {
                const r = results[0];
                updateCustomerLocation(orderId, parseFloat(r.lat), parseFloat(r.lon), r.display_name || address);
            } else {
                alert('Location not found. Please try a more specific address.');
                input.focus();
            }
        })
        .catch((error) => {
            finishButton(false);
            console.error('Geocoding error:', error);
            alert('Error searching location. Please check your internet connection and try again.');
        });
}

// Update customer location
function updateCustomerLocation(orderId, lat, lng, address) {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        // Convert lat/lng to percentage for storage
        const minLat = -1.35;
        const maxLat = -1.20;
        const minLng = 36.70;
        const maxLng = 36.90;
        
        const x = ((lng - minLng) / (maxLng - minLng)) * 100;
        const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
        
        order.customerLocation = { x, y };
        order.customerLocationLatLng = { lat, lng };
        order.address = address;
        
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = order;
            localStorage.setItem('slayStationOrders', JSON.stringify(orders));
        }
        
        // Update map without full reload if it exists
        if (riderMapInstances[orderId]) {
            // Map exists, just update it
            const isAssigned = order.assignedRider === localStorage.getItem('riderEmail');
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                initRiderGoogleMap(orderId, order, isAssigned && order.deliveryStarted);
            }, 100);
        } else {
            // Map doesn't exist, reload orders
            loadRiderOrders();
        }
    }
}

// Fallback simple map renderer for rider
function renderSimpleRiderMap(orderId, order, isActive) {
    const mapWrapper = document.getElementById(`mapWrapper-${orderId}`);
    if (!mapWrapper) return;
    
    mapWrapper.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #666; background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); border-radius: 15px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">🗺️ Map Loading...</p>
            <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">Loading OpenStreetMap...</p>
        </div>
    `;
}

// Render map for order
function renderMap(orderId, order, isActive) {
    const mapWrapper = document.getElementById(`mapWrapper-${orderId}`);
    if (!mapWrapper) return;
    if (window.google && google.maps) {
        renderGoogleOrderMap(orderId, order, isActive);
        return;
    }
    
    // Check if map element exists and already has a map instance
    const mapElement = document.getElementById(`googleMap-${orderId}`);
    if (mapElement && mapElement._leaflet_id && riderMapInstances[orderId]) {
        // Map already exists and is initialized, just update markers
        updateRiderMapMarkers(orderId, order, isActive);
        return;
    }
    
    // Initialize or update Leaflet Map
    if (typeof L !== 'undefined' && L.map) {
        // If map is already initialized, just update markers
        if (riderMapInstances[orderId] && mapElement && mapElement._leaflet_id) {
            updateRiderMapMarkers(orderId, order, isActive);
        } else {
            // Only initialize if not already initialized
            if (!riderMapInitializationAttempted[orderId] || !riderMapInstances[orderId]) {
                initRiderGoogleMap(orderId, order, isActive);
            }
        }
    } else {
        // Only show fallback if we haven't already initialized a map
        if (!riderMapInstances[orderId] && !riderMapErrorShown[orderId]) {
            renderSimpleRiderMap(orderId, order, isActive);
        }
    }
    
    // Save customer location if not set
    if (!order.customerLocation) {
        order.customerLocation = {
            x: 75,
            y: 25
        };
        updateOrderInStorage(order);
    }
}

// Accept order
function acceptOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        const riderEmail = localStorage.getItem('riderEmail');
        order.assignedRider = riderEmail;
        order.assignedTime = new Date().toISOString();
        
        updateOrderInStorage(order);
        loadRiderOrders();
        showNotification(`Order #${orderId} accepted! 🎉`);
    }
}

// Start delivery
function startDelivery(orderId) {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.deliveryStarted = true;
        order.deliveryStartTime = new Date().toISOString();

        const shop = (typeof window !== 'undefined' && window.SHOP_LOCATION)
            ? window.SHOP_LOCATION
            : { lat: -1.2654, lng: 36.8067 };
        order.storeLocationLatLng = order.storeLocationLatLng || { lat: shop.lat, lng: shop.lng };
        order.storeLocation = order.storeLocation || latLngToPercentFlat(shop.lat, shop.lng);
        if (!order.customerLocation) {
            order.customerLocation = { x: 75, y: 25 };
        }
        if (!order.customerLocationLatLng && order.customerLocation) {
            order.customerLocationLatLng = percentageToLatLngRider(order.customerLocation.x, order.customerLocation.y);
        }

        order.riderLocation = latLngToPercentFlat(shop.lat, shop.lng);
        order.riderLocationLatLng = { lat: shop.lat, lng: shop.lng };

        updateOrderInStorage(order);
        loadRiderOrders();
        showNotification(`Delivery started for Order #${orderId}! 🚚`);
    }
}

// Complete delivery
// Customer Communication Functions
function callCustomer(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneNumber = cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone.replace(/^0/, '');
    window.location.href = `tel:${phoneNumber}`;
    showNotification('Calling customer... 📞');
}

function smsCustomer(phone, orderId) {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneNumber = cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone.replace(/^0/, '');
    const order = JSON.parse(localStorage.getItem('slayStationOrders') || '[]').find(o => o.id === orderId);
    const message = order ? `Hello ${order.name}, this is your delivery rider. I'm on my way with your order #${orderId}. ETA: ${order.estimatedTime || 'soon'}.` : 'Hello, this is your delivery rider.';
    window.location.href = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    showNotification('Opening SMS... 💬');
}

function whatsappCustomer(phone, orderId) {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneNumber = cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone.replace(/^0/, '');
    const order = JSON.parse(localStorage.getItem('slayStationOrders') || '[]').find(o => o.id === orderId);
    const message = order ? `Hello ${order.name}, this is your delivery rider. I'm on my way with your order #${orderId}. ETA: ${order.estimatedTime || 'soon'}.` : 'Hello, this is your delivery rider.';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    showNotification('Opening WhatsApp... 💬');
}

// Send in-app message to customer (shown on track-order page)
function sendMessageToCustomer(orderId) {
    const textarea = document.getElementById('riderMsg-' + orderId);
    const text = textarea ? textarea.value.trim() : '';
    if (!text) {
        showNotification('Please type a message first.');
        return;
    }
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    order.riderMessages = order.riderMessages || [];
    order.riderMessages.push({
        from: 'rider',
        text: text,
        time: new Date().toISOString()
    });
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) orders[index] = order;
    else orders.push(order);
    localStorage.setItem('slayStationOrders', JSON.stringify(orders));
    textarea.value = '';
    showNotification('Message sent! Customer will see it on their track order page.');
}

// Weather at drop-off (Open-Meteo — no API key)
async function loadWeatherForOrder(orderId, orderOrAddress) {
    const weatherDiv = document.getElementById(`weather-${orderId}`);
    const weatherText = document.getElementById(`weather-text-${orderId}`);
    if (!weatherDiv || !weatherText) return;

    let lat;
    let lng;
    if (orderOrAddress && typeof orderOrAddress === 'object' && orderOrAddress.customerLocationLatLng) {
        lat = orderOrAddress.customerLocationLatLng.lat;
        lng = orderOrAddress.customerLocationLatLng.lng;
    } else if (typeof window !== 'undefined' && window.SHOP_LOCATION) {
        lat = window.SHOP_LOCATION.lat;
        lng = window.SHOP_LOCATION.lng;
    } else {
        weatherDiv.style.display = 'none';
        return;
    }

    weatherText.textContent = 'Checking weather…';
    weatherDiv.style.display = 'block';

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.current_weather) {
            const t = data.current_weather.temperature;
            const code = data.current_weather.weathercode;
            const labels = { 0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 51: 'Drizzle', 61: 'Rain', 80: 'Rain showers', 95: 'Thunderstorm' };
            const label = labels[code] || 'Conditions';
            weatherText.textContent = `${label}, ${t}°C (at drop-off)`;
        } else {
            weatherDiv.style.display = 'none';
        }
    } catch (e) {
        weatherDiv.style.display = 'none';
    }
}

// Share Location
function shareMyLocation(orderId) {
    if (!navigator.geolocation) {
        showNotification('Geolocation not supported by your browser.');
        return;
    }
    
    showNotification('Getting your location... 📍');
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
            const locationText = `My current location: ${locationUrl}`;
            
            const order = JSON.parse(localStorage.getItem('slayStationOrders') || '[]').find(o => o.id === orderId);
            if (!order) return;
            
            // Try Web Share API first
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `Rider Location - Order #${orderId}`,
                        text: locationText,
                        url: locationUrl
                    });
                    showNotification('Location shared! 📍');
                    return;
                } catch (err) {
                    console.log('Share cancelled or failed');
                }
            }
            
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(locationText);
                showNotification('Location copied to clipboard! 📍');
            } catch (err) {
                // Fallback: Show in alert
                prompt('Copy this location:', locationUrl);
            }
        },
        (error) => {
            showNotification('Failed to get location. Please enable location services.');
            console.error('Geolocation error:', error);
        }
    );
}

// Delivery Proof Modal
let currentDeliveryProofOrderId = null;

function showDeliveryProofModal(orderId) {
    currentDeliveryProofOrderId = orderId;
    const modal = document.getElementById('deliveryProofModal');
    if (modal) {
        modal.classList.add('active');
        // Reset form
        const photoPreview = document.getElementById('deliveryPhotoPreview');
        const signatureCanvas = document.getElementById('deliverySignature');
        const deliveryNotes = document.getElementById('deliveryNotes');
        
        if (photoPreview) photoPreview.innerHTML = '<p>Tap to capture photo</p>';
        if (signatureCanvas) {
            const ctx = signatureCanvas.getContext('2d');
            ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        }
        if (deliveryNotes) deliveryNotes.value = '';
    }
}

function closeDeliveryProofModal() {
    const modal = document.getElementById('deliveryProofModal');
    if (modal) {
        modal.classList.remove('active');
    }
    currentDeliveryProofOrderId = null;
}

function captureDeliveryPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const photoPreview = document.getElementById('deliveryPhotoPreview');
                if (photoPreview) {
                    photoPreview.innerHTML = `<img src="${event.target.result}" style="max-width: 100%; border-radius: 10px;" alt="Delivery Photo">`;
                }
                // Store photo data
                if (currentDeliveryProofOrderId) {
                    const proofData = JSON.parse(localStorage.getItem('deliveryProofs') || '{}');
                    proofData[currentDeliveryProofOrderId] = proofData[currentDeliveryProofOrderId] || {};
                    proofData[currentDeliveryProofOrderId].photo = event.target.result;
                    localStorage.setItem('deliveryProofs', JSON.stringify(proofData));
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

function initSignaturePad() {
    const canvas = document.getElementById('deliverySignature');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
        isDrawing = true;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
        ctx.stroke();
    });
    
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Set up canvas
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function submitDeliveryProof() {
    if (!currentDeliveryProofOrderId) return;
    
    const signatureCanvas = document.getElementById('deliverySignature');
    const deliveryNotes = document.getElementById('deliveryNotes');
    
    const proofData = {
        orderId: currentDeliveryProofOrderId,
        timestamp: new Date().toISOString(),
        signature: signatureCanvas ? signatureCanvas.toDataURL() : null,
        notes: deliveryNotes ? deliveryNotes.value : '',
        photo: JSON.parse(localStorage.getItem('deliveryProofs') || '{}')[currentDeliveryProofOrderId]?.photo || null
    };
    
    // Save proof
    const allProofs = JSON.parse(localStorage.getItem('deliveryProofs') || '{}');
    allProofs[currentDeliveryProofOrderId] = proofData;
    localStorage.setItem('deliveryProofs', JSON.stringify(allProofs));
    
    // Complete delivery
    completeDelivery(currentDeliveryProofOrderId);
    
    // Close modal
    closeDeliveryProofModal();
    
    showNotification('Delivery proof saved! ✅');
}

// Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('riderDarkMode', isDark ? 'true' : 'false');
    
    // Update button icon
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) {
        toggleBtn.textContent = isDark ? '☀️' : '🌙';
    }
    
    showNotification(isDark ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️');
}

function initDarkMode() {
    const savedMode = localStorage.getItem('riderDarkMode');
    if (savedMode === 'true') {
        document.body.classList.add('dark-mode');
        const toggleBtn = document.getElementById('darkModeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = '☀️';
        }
    }
}

// Offline Mode
let isOnline = navigator.onLine;
let offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');

function initOfflineMode() {
    // Cache orders for offline access
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    localStorage.setItem('cachedOrders', JSON.stringify(orders));
    
    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial status
    if (!isOnline) {
        handleOffline();
    } else {
        syncOfflineQueue();
    }
}

function handleOnline() {
    isOnline = true;
    showNotification('Back online! Syncing data... 🔄');
    syncOfflineQueue();
}

function handleOffline() {
    isOnline = false;
    showNotification('You are offline. Changes will sync when online. 📴');
}

function syncOfflineQueue() {
    if (offlineQueue.length === 0) return;
    
    // Process queued actions
    offlineQueue.forEach(action => {
        // Process action (update orders, etc.)
        console.log('Syncing offline action:', action);
    });
    
    // Clear queue
    offlineQueue = [];
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
    showNotification('Offline changes synced! ✅');
}

function queueOfflineAction(action) {
    offlineQueue.push({
        ...action,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
}

// Notifications and Alerts
let notificationPermission = Notification.permission;

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            notificationPermission = permission;
            if (permission === 'granted') {
                showNotification('Notifications enabled! 🔔');
            }
        });
    }
}

function showBrowserNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });
    }
}

function checkForNewOrders() {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const riderEmail = localStorage.getItem('riderEmail');
    
    const newOrders = orders.filter(order => 
        order.status === 'dispatched' && 
        !order.assignedRider &&
        !order.notifiedRider
    );
    
    if (newOrders.length > 0) {
        newOrders.forEach(order => {
            order.notifiedRider = true;
            showBrowserNotification(`New Order #${order.id}`, {
                body: `New delivery available: ${order.name} - ${order.address}`,
                tag: `order-${order.id}`
            });
            showNotification(`New order available! #${order.id} 📦`);
        });
        
        // Save updated orders
        localStorage.setItem('slayStationOrders', JSON.stringify(orders));
    }
}

// Initialize features
function initRiderFeatures() {
    initDarkMode();
    initOfflineMode();
    requestNotificationPermission();
    
    // Check for new orders every 30 seconds
    setInterval(checkForNewOrders, 30000);
    
    // Load weather for active orders
    setTimeout(() => {
        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
        const riderEmail = localStorage.getItem('riderEmail');
        const activeOrders = orders.filter(order => 
            order.assignedRider && 
            order.assignedRider.toLowerCase() === riderEmail.toLowerCase() &&
            !order.completed
        );
        activeOrders.forEach(order => {
            if (order.address) {
                loadWeatherForOrder(order.id, order.address);
            }
        });
    }, 2000);
}

function completeDelivery(orderId) {
    // This is called from submitDeliveryProof after proof is collected
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        order.status = 'delivered';
        order.completed = true;
        order.deliveredTime = new Date().toISOString();
        order.riderLocation = order.customerLocation;
        if (order.customerLocationLatLng) {
            order.riderLocationLatLng = { lat: order.customerLocationLatLng.lat, lng: order.customerLocationLatLng.lng };
        }
        
        // Attach delivery proof if available
        const proofs = JSON.parse(localStorage.getItem('deliveryProofs') || '{}');
        if (proofs[orderId]) {
            order.deliveryProof = proofs[orderId];
        }
        
        updateOrderInStorage(order);
        loadRiderOrders();
        createConfetti();
        showNotification(`Order #${orderId} marked as delivered! 🎉✨`);
        
        // Show browser notification
        showBrowserNotification(`Order #${orderId} Delivered`, {
            body: `Successfully delivered to ${order.name}`,
            tag: `delivery-${orderId}`
        });
    }
}

// Start rider tracking (simulates movement)
let trackingIntervals = {};

function startRiderTracking(orderId, order) {
    if (trackingIntervals[orderId]) {
        clearInterval(trackingIntervals[orderId]);
    }
    
    trackingIntervals[orderId] = setInterval(() => {
        const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
        const currentOrder = orders.find(o => o.id === orderId);
        
        if (!currentOrder || currentOrder.completed || !currentOrder.riderLocation) {
            clearInterval(trackingIntervals[orderId]);
            return;
        }
        
        // Simulate movement towards customer
        const dx = (currentOrder.customerLocation.x - currentOrder.riderLocation.x) * 0.02;
        const dy = (currentOrder.customerLocation.y - currentOrder.riderLocation.y) * 0.02;
        
        currentOrder.riderLocation.x += dx;
        currentOrder.riderLocation.y += dy;
        
        // Stop when close to customer
        const distance = Math.sqrt(
            Math.pow(currentOrder.customerLocation.x - currentOrder.riderLocation.x, 2) +
            Math.pow(currentOrder.customerLocation.y - currentOrder.riderLocation.y, 2)
        );
        
        if (distance < 2) {
            currentOrder.riderLocation.x = currentOrder.customerLocation.x;
            currentOrder.riderLocation.y = currentOrder.customerLocation.y;
        }

        const rr = currentOrder.riderLocation;
        currentOrder.riderLocationLatLng = percentageToLatLngRider(rr.x, rr.y);
        
        updateOrderInStorage(currentOrder);
        
        // Update Leaflet Map if available
        if (typeof L !== 'undefined' && L.map && riderMapInstances[orderId]) {
            updateRiderMapMarkers(orderId, currentOrder, true);
        } else {
        renderMap(orderId, currentOrder, true);
        }
    }, 1000);
}

// Update order in storage
function updateOrderInStorage(order) {
    const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
    const index = orders.findIndex(o => o.id === order.id);
    
    if (index !== -1) {
        orders[index] = order;
    } else {
        orders.push(order);
    }
    
    localStorage.setItem('slayStationOrders', JSON.stringify(orders));
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
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Create confetti
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

// Get rider's GPS location
function getRiderLocation(orderId, callback) {
    if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        callback(null);
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Save rider location to order
            const orders = JSON.parse(localStorage.getItem('slayStationOrders') || '[]');
            const order = orders.find(o => o.id === orderId);
            if (order) {
                // Convert to percentage for storage
                const minLat = -1.35;
                const maxLat = -1.20;
                const minLng = 36.70;
                const maxLng = 36.90;
                
                const x = ((lng - minLng) / (maxLng - minLng)) * 100;
                const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
                
                order.riderLocation = { x, y };
                order.riderLocationLatLng = { lat, lng };
                
                const orderIndex = orders.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) {
                    orders[orderIndex] = order;
                    localStorage.setItem('slayStationOrders', JSON.stringify(orders));
                }
            }
            
            callback({ lat, lng });
        },
        (error) => {
            console.warn('Error getting location:', error);
            callback(null);
        },
        options
    );
}

// Make functions globally available
if (typeof window !== 'undefined') {
    window.authenticateRider = authenticateRider;
    window.loadRiderOrders = loadRiderOrders;
    window.renderRiderStats = renderRiderStats;
    window.acceptOrder = acceptOrder;
    window.startDelivery = startDelivery;
    window.completeDelivery = completeDelivery;
    window.callCustomer = callCustomer;
    window.smsCustomer = smsCustomer;
    window.whatsappCustomer = whatsappCustomer;
    window.loadWeatherForOrder = loadWeatherForOrder;
    window.shareMyLocation = shareMyLocation;
    window.showDeliveryProofModal = showDeliveryProofModal;
    window.closeDeliveryProofModal = closeDeliveryProofModal;
    window.captureDeliveryPhoto = captureDeliveryPhoto;
    window.initSignaturePad = initSignaturePad;
    window.submitDeliveryProof = submitDeliveryProof;
    window.toggleDarkMode = toggleDarkMode;
    window.initDarkMode = initDarkMode;
    window.initRiderFeatures = initRiderFeatures;
    window.searchLocation = searchLocation;
    window.getRiderLocation = getRiderLocation;
}
