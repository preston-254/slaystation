// User Authentication and Points System

class UserAuth {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    // Sign up new user
    signup(email, password, name, phone) {
        try {
            const users = this.getUsers();
            
            // Normalize email
            const normalizedEmail = email.toLowerCase().trim();
            
            // Check if user already exists
            const existingUser = users.find(u => u.email.toLowerCase().trim() === normalizedEmail);
            if (existingUser) {
                return { success: false, message: 'Email already registered! Please login instead. 💕' };
            }

            // Create new user
            const newUser = {
                id: Date.now(),
                email: normalizedEmail,
                password: password, // In production, hash this!
                name: name.trim(),
                phone: phone.trim(),
                points: 100, // Welcome bonus points!
                orders: [],
                createdAt: new Date().toISOString(),
                level: 'Bronze',
                pointsHistory: [{
                    amount: 100,
                    reason: 'Welcome bonus',
                    date: new Date().toISOString()
                }]
            };

            users.push(newUser);
            
            // Save users array - ensure it's saved properly
            try {
                localStorage.setItem('slayStationUsers', JSON.stringify(users));
                // Verify save
                const verifyUsers = JSON.parse(localStorage.getItem('slayStationUsers') || '[]');
                if (verifyUsers.length !== users.length) {
                    console.error('User save verification failed');
                    return { success: false, message: 'Failed to save account. Please try again.' };
                }
            } catch (storageError) {
                console.error('Storage error:', storageError);
                return { success: false, message: 'Storage error. Please check browser settings.' };
            }
            
            // Auto login and save user session
            const loginResult = this.login(newUser.email, password);
            
            // Ensure user is saved to session
            if (loginResult.success && loginResult.user) {
                this.currentUser = loginResult.user;
                try {
                    localStorage.setItem('slayStationCurrentUser', JSON.stringify(loginResult.user));
                    // Verify session save
                    const verifySession = localStorage.getItem('slayStationCurrentUser');
                    if (!verifySession) {
                        console.error('Session save failed');
                    }
                } catch (sessionError) {
                    console.error('Session save error:', sessionError);
                }
            }
            
            return { 
                success: true, 
                message: `Welcome ${name}! You've earned 100 welcome points! 🎉✨`,
                user: newUser,
                redirect: loginResult.redirect || null
            };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'An error occurred. Please try again.' };
        }
    }

    // Login user
    login(email, password, isRiderLogin = false) {
        try {
            const users = this.getUsers();
            
            // Case-insensitive email matching
            const emailLower = email.toLowerCase().trim();
            const user = users.find(u => {
                const userEmail = u.email.toLowerCase().trim();
                return userEmail === emailLower && u.password === password;
            });
            
            if (!user) {
                // Check if email exists but password is wrong
                const emailExists = users.find(u => u.email.toLowerCase().trim() === emailLower);
                if (emailExists) {
                    return { success: false, message: 'Incorrect password! Please try again. 💕' };
                }
                return { success: false, message: 'Account not found! Please sign up first. 💕' };
            }

            // Update user data from storage to get latest info
            const updatedUser = users.find(u => u.id === user.id) || user;
            
            this.currentUser = updatedUser;
            
            // Ensure user data is properly saved to session
            try {
                localStorage.setItem('slayStationCurrentUser', JSON.stringify(updatedUser));
                
                // Verify the save worked
                const savedUser = localStorage.getItem('slayStationCurrentUser');
                if (!savedUser) {
                    console.error('Failed to save user session!');
                    return { success: false, message: 'Failed to save session. Please try again.' };
                }
            } catch (storageError) {
                console.error('Session storage error:', storageError);
                return { success: false, message: 'Storage error. Please check browser settings.' };
            }
            
            // Check if user is admin or rider and redirect
            const ADMIN_EMAIL = 'preston.mwendwa@riarauniversity.ac.ke';
            const RIDER_EMAILS = [
                'preston.mwendwa@riarauniversity.ac.ke',
                'kangethekelvin56@gmail.com',
                'prestonmugo83@gmail.com'
            ];
        
            // Normalize email for comparison
            const normalizedEmail = emailLower;
            
            // If logging in from rider-login page, prioritize rider access
            if (isRiderLogin && RIDER_EMAILS.some(e => e.toLowerCase() === normalizedEmail)) {
                // Store rider email for rider dashboard
                localStorage.setItem('riderEmail', email.toLowerCase());
                // Redirect to rider dashboard
                setTimeout(() => {
                    window.location.href = 'rider-dashboard.html';
                }, 500);
                return { success: true, message: `Welcome back, ${updatedUser.name}! Redirecting to rider dashboard... ✨`, user: updatedUser, redirect: 'rider' };
            } else if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
                // Redirect to admin dashboard (only if not a rider login)
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 500);
                return { success: true, message: `Welcome back, ${updatedUser.name}! Redirecting to admin dashboard... ✨`, user: updatedUser, redirect: 'admin' };
            } else if (RIDER_EMAILS.some(e => e.toLowerCase() === normalizedEmail)) {
                // Store rider email for rider dashboard
                localStorage.setItem('riderEmail', email.toLowerCase());
                // Redirect to rider dashboard
                setTimeout(() => {
                    window.location.href = 'rider-dashboard.html';
                }, 500);
                return { success: true, message: `Welcome back, ${updatedUser.name}! Redirecting to rider dashboard... ✨`, user: updatedUser, redirect: 'rider' };
            }
            
            return { success: true, message: `Welcome back, ${updatedUser.name}! ✨`, user: updatedUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login. Please try again.' };
        }
    }

    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('slayStationCurrentUser');
    }

    // Get current user
    getCurrentUser() {
        if (!this.currentUser) {
            this.loadCurrentUser();
        }
        return this.currentUser;
    }

    // Load current user from storage
    loadCurrentUser() {
        const userJson = localStorage.getItem('slayStationCurrentUser');
        if (userJson) {
            try {
                this.currentUser = JSON.parse(userJson);
                // Reload from users to get latest points
                const users = this.getUsers();
                const updatedUser = users.find(u => u.id === this.currentUser.id);
                if (updatedUser) {
                    this.currentUser = updatedUser;
                    localStorage.setItem('slayStationCurrentUser', JSON.stringify(updatedUser));
                } else if (this.currentUser && this.currentUser.id) {
                    // User exists in session but not in users array - keep the session user
                    // This can happen if localStorage was partially cleared
                    // Don't clear the session, just use what we have
                    console.warn('User not found in users array, but session exists. Keeping session.');
                } else {
                    // Invalid user data, clear it
                    this.currentUser = null;
                    localStorage.removeItem('slayStationCurrentUser');
                }
            } catch (error) {
                console.error('Error loading current user:', error);
                this.currentUser = null;
                localStorage.removeItem('slayStationCurrentUser');
            }
        }
    }

    // Get all users
    getUsers() {
        return JSON.parse(localStorage.getItem('slayStationUsers') || '[]');
    }

    // Update user
    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('slayStationUsers', JSON.stringify(users));
            
            // Update current user if it's the same user
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = users[index];
                localStorage.setItem('slayStationCurrentUser', JSON.stringify(users[index]));
            }
            
            return users[index];
        }
        return null;
    }

    // Add points history entry
    addPointsHistory(userId, amount, reason, orderId = null) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return;

        const pointsHistory = user.pointsHistory || [];
        pointsHistory.push({
            amount: amount,
            reason: reason,
            date: new Date().toISOString(),
            orderId: orderId
        });

        // Keep only last 20 entries
        if (pointsHistory.length > 20) {
            pointsHistory.shift();
        }

        this.updateUser(userId, { pointsHistory: pointsHistory });
    }

    // Award points for order
    awardPointsForOrder(userId, orderTotal, orderId = null) {
        // Award 1 point per 100 KSH spent
        const pointsEarned = Math.floor(orderTotal / 100);
        
        const user = this.getUsers().find(u => u.id === userId);
        if (!user) return 0;

        const newPoints = (user.points || 0) + pointsEarned;
        
        // Update user level based on total points
        let level = 'Bronze';
        if (newPoints >= 1000) level = 'Gold';
        else if (newPoints >= 500) level = 'Silver';
        
        this.updateUser(userId, {
            points: newPoints,
            level: level
        });

        // Add to points history
        if (pointsEarned > 0) {
            this.addPointsHistory(userId, pointsEarned, `Order #${orderId || 'N/A'} - ${pointsEarned} points earned`, orderId);
        }
        
        return pointsEarned;
    }

    // Redeem points (for future use)
    redeemPoints(userId, pointsToRedeem) {
        const user = this.getUsers().find(u => u.id === userId);
        if (!user || (user.points || 0) < pointsToRedeem) {
            return { success: false, message: 'Insufficient points! 💕' };
        }

        const newPoints = user.points - pointsToRedeem;
        this.updateUser(userId, { points: newPoints });
        
        return { success: true, remainingPoints: newPoints };
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// Create global instance
const userAuth = new UserAuth();

// Make functions globally available
if (typeof window !== 'undefined') {
    window.userAuth = userAuth;
    
    window.signup = function(email, password, name, phone) {
        try {
            // Validate inputs
            if (!email || !password || !name || !phone) {
                return { success: false, message: 'Please fill in all fields! 💕' };
            }
            
            if (password.length < 6) {
                return { success: false, message: 'Password must be at least 6 characters long! 💕' };
            }
            
            if (!email.includes('@') || !email.includes('.')) {
                return { success: false, message: 'Please enter a valid email address! 💕' };
            }
            
            return userAuth.signup(email, password, name, phone);
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: 'An error occurred during signup. Please try again! 💕' };
        }
    };
    
    window.login = function(email, password) {
        try {
            // Validate inputs
            if (!email || !password) {
                return { success: false, message: 'Please enter both email and password! 💕' };
            }
            
            return userAuth.login(email, password);
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred during login. Please try again! 💕' };
        }
    };
    
    window.logout = function() {
        try {
            userAuth.logout();
            if (window.app) {
                window.app.loadPage('home');
            }
            updateAuthUI();
            
            // Redirect to home if not already there
            if (window.location.pathname.includes('admin.html') || 
                window.location.pathname.includes('rider-dashboard.html')) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    
    window.isLoggedIn = function() {
        return userAuth.isLoggedIn();
    };
    
    window.getCurrentUser = function() {
        return userAuth.getCurrentUser();
    };
}

// Update auth UI (show/hide login buttons, user info)
function updateAuthUI() {
    const user = userAuth.getCurrentUser();
    
    // Update nav bar
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const navActions = document.querySelector('.nav-actions');
    
    // Check if order history link exists, if not create it
    let orderHistoryLink = document.getElementById('orderHistoryLink');
    const navMenu = document.querySelector('.nav-menu');
    
    // Check if admin dashboard button exists
    let adminDashboardBtn = document.getElementById('adminDashboardBtn');
    
    // Admin email check
    const ADMIN_EMAIL = 'preston.mwendwa@riarauniversity.ac.ke';
    const isAdmin = user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    
    if (user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            const profilePic = user.profilePicture || '';
            const profileIcon = profilePic ? `<img src="${profilePic}" alt="Profile" class="profile-icon-img">` : '👤';
            userInfo.innerHTML = `
                <div class="profile-icon">${profileIcon}</div>
                <div class="user-details">
                    <span class="user-name">${user.name}</span>
                    <span class="user-points">⭐ ${user.points || 0} Points</span>
                </div>
            `;
            userInfo.onclick = () => showProfileModal();
        }
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        // Show notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.style.display = 'block';
        }
        
        // Update notification badge
        if (typeof window.updateNotificationBadge === 'function') {
            window.updateNotificationBadge();
        }
        
        // Add Admin Dashboard button if user is admin
        if (isAdmin && navActions) {
            if (!adminDashboardBtn) {
                adminDashboardBtn = document.createElement('a');
                adminDashboardBtn.id = 'adminDashboardBtn';
                adminDashboardBtn.href = 'admin.html';
                adminDashboardBtn.className = 'nav-btn-round nav-btn-admin';
                adminDashboardBtn.innerHTML = '👑 Admin';
                adminDashboardBtn.title = 'Admin Dashboard';
                // Insert before logout button
                if (logoutBtn && logoutBtn.parentNode) {
                    logoutBtn.parentNode.insertBefore(adminDashboardBtn, logoutBtn);
                } else {
                    navActions.appendChild(adminDashboardBtn);
                }
            }
            adminDashboardBtn.style.display = 'block';
        } else if (adminDashboardBtn) {
            adminDashboardBtn.style.display = 'none';
        }
        
        // Add Order History link to nav menu if it doesn't exist
        if (navMenu && !orderHistoryLink) {
            orderHistoryLink = document.createElement('li');
            orderHistoryLink.id = 'orderHistoryLink';
            orderHistoryLink.innerHTML = '<a href="order-history.html">Order History 📦</a>';
            // Insert before Contact link
            const contactLink = navMenu.querySelector('li:last-child');
            if (contactLink) {
                navMenu.insertBefore(orderHistoryLink, contactLink);
            } else {
                navMenu.appendChild(orderHistoryLink);
            }
        } else if (orderHistoryLink) {
            orderHistoryLink.style.display = 'list-item';
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (signupBtn) signupBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminDashboardBtn) adminDashboardBtn.style.display = 'none';
        
        // Hide notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.style.display = 'none';
        }
        
        // Hide Order History link
        if (orderHistoryLink) {
            orderHistoryLink.style.display = 'none';
        }
    }
}

// Update auth UI on page load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure userAuth is initialized and session is loaded
    if (typeof userAuth !== 'undefined' && userAuth) {
        userAuth.loadCurrentUser();
    }
    
    updateAuthUI();
    
    // Refresh every 5 seconds to update points
    setInterval(updateAuthUI, 5000);
});
