// GERAMA Portal - Core: Supabase Auth check, Sidebar toggle, Profile
(function() {
    const currentPage = window.location.pathname.split('/').pop();
    const isAuthPage = currentPage === 'login.html' || currentPage === 'signup.html';
    
    // Initialize Supabase if available
    if (typeof window.geramaSupabase !== 'undefined') {
        // Check current session
        window.geramaSupabase.auth.getSession().then(({ data: { session } }) => {
            const isLoggedIn = !!session;
            
            // Redirect only if not on auth page and not logged in
            if (!isLoggedIn && !isAuthPage) {
                window.location.href = 'login.html';
                return;
            }
            
            // If logged in, show sidebar elements
            if (isLoggedIn && !isAuthPage) {
                initializeSidebar();
                updateSidebarProfile();
            }
        });
        
        // Listen for auth changes
        window.geramaSupabase.auth.onAuthStateChange((event, session) => {
            const isLoggedIn = !!session;
            
            if (event === 'SIGNED_OUT' && !isAuthPage) {
                sessionStorage.removeItem('gerama_loggedIn');
                window.location.href = 'login.html';
            } else if (event === 'SIGNED_IN' && !isAuthPage) {
                sessionStorage.setItem('gerama_loggedIn', 'true');
                initializeSidebar();
                updateSidebarProfile();
            }
        });
    } else {
        // Fallback to sessionStorage if Supabase not loaded
        const isLoggedIn = sessionStorage.getItem('gerama_loggedIn') === 'true';
        if (!isLoggedIn && !isAuthPage) {
            window.location.href = 'login.html';
            return;
        }
        if (isLoggedIn && !isAuthPage) {
            initializeSidebar();
            updateSidebarProfile();
        }
    }

    function initializeSidebar() {
        const header = document.querySelector('header');
        if (header && !document.querySelector('.menu-icon')) {
            const menuIcon = document.createElement('div');
            menuIcon.className = 'menu-icon';
            menuIcon.innerHTML = '☰';
            menuIcon.style.cssText = 'font-size:1.8rem; cursor:pointer; background:rgba(255,255,255,0.2); width:45px; height:45px; display:flex; align-items:center; justify-content:center; border-radius:12px; transition:0.3s; margin-right:1rem;';
            menuIcon.onclick = toggleSidebar;
            const logo = document.querySelector('.logo-container');
            if (logo) logo.parentNode.insertBefore(menuIcon, logo);
        }
    }

    function toggleSidebar() {
        const drawer = document.getElementById('sidebarDrawer');
        const overlay = document.getElementById('drawerOverlay');
        if (drawer) drawer.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
    }

    function closeSidebar() {
        const drawer = document.getElementById('sidebarDrawer');
        const overlay = document.getElementById('drawerOverlay');
        if (drawer) drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
    }

    // Inject sidebar HTML if not present
    if (!document.getElementById('sidebarDrawer') && !isAuthPage) {
        const sidebarHTML = `
            <div id="sidebarDrawer" class="sidebar-drawer">
                <div class="drawer-header">
                    <img id="drawerAvatar" src="https://via.placeholder.com/80?text=Avatar" alt="Profile">
                    <h3 id="drawerName">Student</h3>
                    <p id="drawerProgram">Program: --</p>
                </div>
                
                <!-- Dashboard Stats -->
                <div class="drawer-stats">
                    <div class="stat-item">
                        <i class="fas fa-download"></i>
                        <div class="stat-info">
                            <span class="stat-number" id="downloadCount">0</span>
                            <span class="stat-label">Downloads</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-upload"></i>
                        <div class="stat-info">
                            <span class="stat-number" id="contributionCount">0</span>
                            <span class="stat-label">Contributions</span>
                        </div>
                    </div>
                </div>
                
                <div class="drawer-nav">
                    <a href="index.html"><i class="fas fa-home"></i> Home</a>
                    <a href="resources.html"><i class="fas fa-book"></i> Resources</a>
                    <a href="about.html"><i class="fas fa-users"></i> About</a>
                    <a href="contact.html"><i class="fas fa-envelope"></i> Contact</a>
                </div>
                
                <!-- Edit Profile Section -->
                <div class="drawer-profile-section">
                    <button id="editProfileBtn" class="edit-profile-btn">
                        <i class="fas fa-user-edit"></i> Edit Profile
                    </button>
                </div>
                
                <div class="drawer-footer">
                    <button id="drawerLogoutBtn" class="logout-drawer">Logout</button>
                </div>
            </div>
            <div id="drawerOverlay" class="overlay"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', sidebarHTML);
    }

    // Update sidebar profile from localStorage
    function updateSidebarProfile() {
        const profile = JSON.parse(localStorage.getItem('gerama_profile') || '{"name":"","program":"","img":""}');
        const avatar = document.getElementById('drawerAvatar');
        const nameSpan = document.getElementById('drawerName');
        const progSpan = document.getElementById('drawerProgram');
        if (avatar) avatar.src = profile.img || 'https://via.placeholder.com/80?text=Avatar';
        if (nameSpan) nameSpan.innerText = profile.name || 'Student';
        if (progSpan) progSpan.innerText = profile.program || 'Not set';
    }
    updateSidebarProfile();

    // Attach overlay close
    const overlay = document.getElementById('drawerOverlay');
    if (overlay) overlay.onclick = closeSidebar;

    // Logout from sidebar
    const drawerLogout = document.getElementById('drawerLogoutBtn');
    if (drawerLogout) {
        drawerLogout.onclick = async () => {
            try {
                if (typeof window.geramaSupabase !== 'undefined') {
                    await window.geramaSupabase.auth.signOut();
                }
                sessionStorage.removeItem('gerama_loggedIn');
                window.location.href = 'login.html';
            } catch (err) {
                console.error('Logout error:', err);
                sessionStorage.removeItem('gerama_loggedIn');
                window.location.href = 'login.html';
            }
        };
    }

    // Also handle top logout button if exists
    const topLogout = document.getElementById('logoutBtn');
    if (topLogout) {
        topLogout.onclick = async (e) => {
            e.preventDefault();
            try {
                if (typeof window.geramaSupabase !== 'undefined') {
                    await window.geramaSupabase.auth.signOut();
                }
                sessionStorage.removeItem('gerama_loggedIn');
                window.location.href = 'login.html';
            } catch (err) {
                console.error('Logout error:', err);
                sessionStorage.removeItem('gerama_loggedIn');
                window.location.href = 'login.html';
            }
        };
    }

    // Handle edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.onclick = () => {
            // Simple profile edit modal
            const profile = JSON.parse(localStorage.getItem('gerama_profile') || '{"name":"","program":"","img":""}');
            const newName = prompt('Enter your name:', profile.name);
            if (newName && newName.trim()) {
                profile.name = newName.trim();
                profile.img = 'https://via.placeholder.com/80?text=' + newName.charAt(0).toUpperCase();
                localStorage.setItem('gerama_profile', JSON.stringify(profile));
                updateSidebarProfile();
            }
        };
    }

    // Update stats (mock data for now)
    function updateStats() {
        const downloads = localStorage.getItem('gerama_downloads') || '0';
        const contributions = localStorage.getItem('gerama_contributions') || '0';
        
        const downloadCount = document.getElementById('downloadCount');
        const contributionCount = document.getElementById('contributionCount');
        
        if (downloadCount) downloadCount.textContent = downloads;
        if (contributionCount) contributionCount.textContent = contributions;
    }
    
    updateStats();
})();