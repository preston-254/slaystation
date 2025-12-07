// User Authentication and Points System
// Updated: Enhanced storage and retrieval for better persistence

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
                const usersJson = JSON.stringify(users);
                localStorage.setItem('slayStationUsers', usersJson);
                
                // Verify save immediately
                const verifyUsersJson = localStorage.getItem('slayStationUsers');
                if (!verifyUsersJson) {
                    console.error('User save verification failed - no data in storage');
                    return { success: false, message: 'Failed to save account. Please check browser settings and try again.' };
                }
                
                const verifyUsers = JSON.parse(verifyUsersJson);
                if (!Array.isArray(verifyUsers) || verifyUsers.length !== users.length) {
                    console.error('User save verification failed - data mismatch', {
                        expected: users.length,
                        actual: verifyUsers.length
                    });
                    return { success: false, message: 'Failed to save account. Please try again.' };
                }
                
                // Verify the new user is in the saved array
                const savedUser = verifyUsers.find(u => u.id === newUser.id && u.email === normalizedEmail);
                if (!savedUser) {
                    console.error('New user not found in saved array');
                    return { success: false, message: 'Failed to save account. Please try again.' };
                }
                
                console.log('User successfully saved:', { email: normalizedEmail, id: newUser.id, totalUsers: verifyUsers.length });
            } catch (storageError) {
                console.error('Storage error:', storageError);
                return { success: false, message: 'Storage error. Please check browser settings and enable localStorage.' };
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
            console.log(`Login attempt for: ${email}, Total users in storage: ${users.length}`);
            
            // Case-insensitive email matching
            const emailLower = email.toLowerCase().trim();
            
            // Debug: log all user emails
            if (users.length > 0) {
                console.log('Registered user emails:', users.map(u => u.email));
            }
            
            const user = users.find(u => {
                const userEmail = u.email.toLowerCase().trim();
                const emailMatch = userEmail === emailLower;
                const passwordMatch = u.password === password;
                
                if (emailMatch && !passwordMatch) {
                    console.log('Email found but password mismatch');
                }
                
                return emailMatch && passwordMatch;
            });
            
            if (!user) {
                // Check if email exists but password is wrong
                const emailExists = users.find(u => u.email.toLowerCase().trim() === emailLower);
                if (emailExists) {
                    console.log('Email found but password incorrect');
                    return { success: false, message: 'Incorrect password! Please try again. 💕' };
                }
                console.log('Email not found in registered users');
                return { success: false, message: 'Account not found! Please sign up first. 💕' };
            }
            
            console.log('User found, logging in:', { email: user.email, id: user.id });

            // Update user data from storage to get latest info
            const updatedUser = users.find(u => u.id === user.id) || user;
            
            this.currentUser = updatedUser;
            
            // Ensure user data is properly saved to session
            try {
                const userJson = JSON.stringify(updatedUser);
                localStorage.setItem('slayStationCurrentUser', userJson);
                
                // Verify the save worked
                const savedUserJson = localStorage.getItem('slayStationCurrentUser');
                if (!savedUserJson) {
                    console.error('Failed to save user session - no data in storage');
                    return { success: false, message: 'Failed to save session. Please try again.' };
                }
                
                // Verify the saved user matches
                const savedUser = JSON.parse(savedUserJson);
                if (savedUser.id !== updatedUser.id || savedUser.email !== updatedUser.email) {
                    console.error('Session save verification failed - data mismatch');
                    return { success: false, message: 'Failed to save session. Please try again.' };
                }
                
                console.log('User session saved successfully:', { email: updatedUser.email, id: updatedUser.id });
            } catch (storageError) {
                console.error('Session storage error:', storageError);
                return { success: false, message: 'Storage error. Please check browser settings and enable localStorage.' };
            }
            
            // Check if user is admin or rider and redirect
            const ADMIN_EMAILS = [
                'preston.mwendwa@riarauniversity.ac.ke',
                'isabellewambui@gmail.com'
            ];
            const RIDER_EMAILS = [
                'preston.mwendwa@riarauniversity.ac.ke',
                'kangethekelvin56@gmail.com',
                'prestonmugo83@gmail.com'
            ];
            const isAdminEmail = (email) => {
                if (!email) return false;
                const normalizedEmail = email.toLowerCase().trim();
                return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
            };
        
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
            } else if (isAdminEmail(normalizedEmail)) {
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
                const sessionUser = JSON.parse(userJson);
                
                // Reload from users array to get latest data (points, orders, etc.)
                const users = this.getUsers();
                const updatedUser = users.find(u => u.id === sessionUser.id);
                
                if (updatedUser) {
                    // User found in users array - use the latest data
                    this.currentUser = updatedUser;
                    // Update session with latest data
                    localStorage.setItem('slayStationCurrentUser', JSON.stringify(updatedUser));
                    console.log('Current user loaded from storage:', { email: updatedUser.email, id: updatedUser.id });
                } else if (sessionUser && sessionUser.id && sessionUser.email) {
                    // User exists in session but not in users array
                    // This can happen if users array was cleared but session wasn't
                    // Try to restore the user to the users array
                    console.warn('User found in session but not in users array. Attempting to restore...');
                    
                    // Add user back to users array
                    const allUsers = this.getUsers();
                    allUsers.push(sessionUser);
                    localStorage.setItem('slayStationUsers', JSON.stringify(allUsers));
                    
                    this.currentUser = sessionUser;
                    console.log('User restored to users array:', { email: sessionUser.email, id: sessionUser.id });
                } else {
                    // Invalid user data, clear it
                    console.warn('Invalid user data in session, clearing');
                    this.currentUser = null;
                    localStorage.removeItem('slayStationCurrentUser');
                }
            } catch (error) {
                console.error('Error loading current user:', error);
                this.currentUser = null;
                localStorage.removeItem('slayStationCurrentUser');
            }
        } else {
            console.log('No user session found');
        }
    }

    // Get all users
    getUsers() {
        try {
            const usersJson = localStorage.getItem('slayStationUsers');
            if (!usersJson) {
                console.log('No users found in localStorage, initializing empty array');
                return [];
            }
            const users = JSON.parse(usersJson);
            if (!Array.isArray(users)) {
                console.error('Users data is not an array, resetting');
                localStorage.setItem('slayStationUsers', JSON.stringify([]));
                return [];
            }
            console.log(`Retrieved ${users.length} users from storage`);
            return users;
        } catch (error) {
            console.error('Error getting users:', error);
            // Return empty array if there's an error
            return [];
        }
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
    const ADMIN_EMAILS = [
        'preston.mwendwa@riarauniversity.ac.ke',
        'isabellewambui@gmail.com'
    ];
    const isAdminEmail = (email) => {
        if (!email) return false;
        const normalizedEmail = email.toLowerCase().trim();
        return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === normalizedEmail);
    };
    const isAdmin = user && user.email && isAdminEmail(user.email);
    
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
        
        // Debug: Log storage status
        const users = userAuth.getUsers();
        const currentUser = userAuth.getCurrentUser();
        console.log('Auth initialization:', {
            totalUsers: users.length,
            currentUser: currentUser ? { email: currentUser.email, id: currentUser.id } : null,
            localStorageAvailable: typeof Storage !== 'undefined'
        });
    }
    
    updateAuthUI();
    
    // Refresh every 5 seconds to update points
    setInterval(updateAuthUI, 5000);
});

// Debug function to check storage (can be called from browser console)
if (typeof window !== 'undefined') {
    window.debugAuth = function() {
        const users = userAuth.getUsers();
        const currentUser = userAuth.getCurrentUser();
        const usersJson = localStorage.getItem('slayStationUsers');
        const sessionJson = localStorage.getItem('slayStationCurrentUser');
        
        console.log('=== AUTH DEBUG INFO ===');
        console.log('Total users:', users.length);
        console.log('Users:', users.map(u => ({ email: u.email, id: u.id, name: u.name })));
        console.log('Current user:', currentUser ? { email: currentUser.email, id: currentUser.id, name: currentUser.name } : null);
        console.log('Users JSON length:', usersJson ? usersJson.length : 0);
        console.log('Session JSON length:', sessionJson ? sessionJson.length : 0);
        console.log('localStorage available:', typeof Storage !== 'undefined');
        console.log('======================');
        
        return {
            totalUsers: users.length,
            users: users,
            currentUser: currentUser,
            localStorageAvailable: typeof Storage !== 'undefined'
        };
    };
}
