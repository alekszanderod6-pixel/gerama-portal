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
            menuIcon.innerHTML = 'â°';
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
                    <div id="drawerAvatar" class="profile-emoji">👤</div>
                    <h3 id="drawerName">Student</h3>
                    <p id="drawerProgram">Program: --</p>
                </div>
                
                <!-- Sidebar Tabs -->
                <div class="drawer-tabs">
                    <button class="tab-btn active" data-tab="home">
                        <i class="fas fa-home"></i> Home
                    </button>
                    <button class="tab-btn" data-tab="resources">
                        <i class="fas fa-book"></i> Resources
                    </button>
                    <button class="tab-btn" data-tab="profile">
                        <i class="fas fa-user"></i> Profile
                    </button>
                    <button class="tab-btn" data-tab="about">
                        <i class="fas fa-users"></i> About
                    </button>
                    <button class="tab-btn" data-tab="contact">
                        <i class="fas fa-envelope"></i> Contact
                    </button>
                </div>
                
                <!-- Tab Content -->
                <div class="drawer-content">
                    <!-- Home Tab -->
                    <div class="tab-content active" id="home-tab">
                        <div class="welcome-section">
                            <h4>Welcome to GERAMA Portal</h4>
                            <p>Your gateway to academic excellence at UENR</p>
                        </div>
                        <div class="quick-stats">
                            <div class="quick-stat">
                                <span class="quick-stat-number" id="quickDownloadCount">0</span>
                                <span class="quick-stat-label">Downloads</span>
                            </div>
                            <div class="quick-stat">
                                <span class="quick-stat-number" id="quickContributionCount">0</span>
                                <span class="quick-stat-label">Contributions</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Resources Tab -->
                    <div class="tab-content" id="resources-tab">
                        <div class="resources-section">
                            <h4>Resource Library</h4>
                            <div class="resource-categories">
                                <a href="resources.html" class="resource-link">
                                    <i class="fas fa-book-open"></i>
                                    <span>Browse All Resources</span>
                                </a>
                                <div class="resource-stats">
                                    <div class="resource-stat">
                                        <i class="fas fa-file-pdf"></i>
                                        <span>PDFs Available</span>
                                    </div>
                                    <div class="resource-stat">
                                        <i class="fas fa-video"></i>
                                        <span>Video Lectures</span>
                                    </div>
                                    <div class="resource-stat">
                                        <i class="fas fa-question-circle"></i>
                                        <span>Past Questions</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Profile Tab -->
                    <div class="tab-content" id="profile-tab">
                        <div class="profile-edit-section">
                            <h4>Edit Profile</h4>
                            
                            <!-- Profile Picture Upload -->
                            <div class="profile-picture-section">
                                <div class="profile-picture-container">
                                    <div id="profilePicturePreview" class="profile-picture-preview">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <label for="profilePictureInput" class="profile-picture-upload-btn">
                                        <i class="fas fa-camera"></i> Change Photo
                                    </label>
                                    <input type="file" id="profilePictureInput" accept="image/*" style="display: none;">
                                </div>
                            </div>
                            
                            <div class="profile-field">
                                <label>Name</label>
                                <input type="text" id="profileNameInput" placeholder="Enter your name">
                            </div>
                            <div class="profile-field">
                                <label>Program</label>
                                <select id="profileProgramSelect">
                                    <option value="">Select Program</option>
                                    <option value="Electrical Engineering">Electrical Engineering</option>
                                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                                    <option value="Computer Engineering">Computer Engineering</option>
                                    <option value="Agricultural Engineering">Agricultural Engineering</option>
                                    <option value="Petroleum Engineering">Petroleum Engineering</option>
                                    <option value="Renewable Energy Engineering">Renewable Energy Engineering</option>
                                    <option value="Civil Engineering">Civil Engineering</option>
                                    <option value="Environmental Engineering">Environmental Engineering</option>
                                </select>
                            </div>
                            <button id="saveProfileBtn" class="save-profile-btn">
                                <i class="fas fa-save"></i> Save Profile
                            </button>
                        </div>
                    </div>
                    
                    <!-- About Tab -->
                    <div class="tab-content" id="about-tab">
                        <div class="about-section">
                            <h4>About GERAMA</h4>
                            <p>Team GERAMA is dedicated to promoting academic excellence among students across all fields of study at UENR.</p>
                            <div class="about-info">
                                <div class="about-item">
                                    <i class="fas fa-eye"></i>
                                    <span><strong>Vision:</strong> Academic Excellence</span>
                                </div>
                                <div class="about-item">
                                    <i class="fas fa-bullseye"></i>
                                    <span><strong>Mission:</strong> Empower Students</span>
                                </div>
                                <div class="about-item">
                                    <i class="fas fa-trophy"></i>
                                    <span><strong>Motto:</strong> Promoting Excellence</span>
                                </div>
                            </div>
                            <a href="about.html" class="learn-more-btn">
                                <i class="fas fa-arrow-right"></i> Learn More
                            </a>
                        </div>
                    </div>
                    
                    <!-- Contact Tab -->
                    <div class="tab-content" id="contact-tab">
                        <div class="contact-section">
                            <h4>Contact GERAMA</h4>
                            <div class="contact-info">
                                <div class="contact-item">
                                    <i class="fas fa-envelope"></i>
                                    <span>gerama.uenr@gmail.com</span>
                                </div>
                                <div class="contact-item">
                                    <i class="fas fa-phone"></i>
                                    <span>+233 55 574 9497</span>
                                </div>
                                <div class="contact-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>UENR, Sunyani</span>
                                </div>
                            </div>
                            <a href="contact.html" class="contact-btn">
                                <i class="fas fa-paper-plane"></i> Send Message
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Bottom Tabs -->
                <div class="drawer-bottom-tabs">
                    <button class="bottom-tab-btn" data-bottom-tab="downloads">
                        <i class="fas fa-download"></i> Downloads
                    </button>
                    <button class="bottom-tab-btn" data-bottom-tab="uploads">
                        <i class="fas fa-upload"></i> Uploads
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
        
        // Handle avatar display
        if (avatar) {
            if (profile.img && profile.img.startsWith('data:')) {
                // Custom uploaded image
                avatar.innerHTML = `<img src="${profile.img}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                avatar.style.background = 'transparent';
            } else if (profile.name && profile.name.trim()) {
                // Use first letter with gradient
                avatar.textContent = profile.name.charAt(0).toUpperCase();
                avatar.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32)';
            } else {
                // Default emoji
                avatar.textContent = 'ð';
                avatar.style.background = 'transparent';
            }
        }
        
        if (nameSpan) nameSpan.innerText = profile.name || 'Student';
        if (progSpan) progSpan.innerText = profile.program || 'Not set';
    }

    // Tab switching functionality
    function initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(targetTab + '-tab');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
        
        // Bottom tabs functionality
        const bottomTabButtons = document.querySelectorAll('.bottom-tab-btn');
        bottomTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-bottom-tab');
                
                // Remove active class from all bottom tabs
                bottomTabButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Handle bottom tab actions
                if (targetTab === 'downloads') {
                    alert('📥 Downloads feature coming soon!');
                } else if (targetTab === 'uploads') {
                    alert('📤 Uploads feature coming soon!');
                }
            });
        });
    }

    // Profile editing functionality
    function loadProfileData() {
        const profile = JSON.parse(localStorage.getItem('gerama_profile') || '{"name":"","program":"","img":""}');
        const profileNameInput = document.getElementById('profileNameInput');
        const profileProgramSelect = document.getElementById('profileProgramSelect');
        const profilePicturePreview = document.getElementById('profilePicturePreview');
        
        if (profileNameInput) profileNameInput.value = profile.name || '';
        if (profileProgramSelect) profileProgramSelect.value = profile.program || '';
        
        // Load profile picture
        if (profilePicturePreview) {
            if (profile.img && profile.img.startsWith('data:')) {
                profilePicturePreview.innerHTML = `<img src="${profile.img}" alt="Profile">`;
            } else if (profile.name && profile.name.trim()) {
                profilePicturePreview.innerHTML = profile.name.charAt(0).toUpperCase();
                profilePicturePreview.style.background = 'linear-gradient(135deg, #1B5E20, #2E7D32)';
            } else {
                profilePicturePreview.innerHTML = '<i class="fas fa-user"></i>';
                profilePicturePreview.style.background = 'transparent';
            }
        }
    }
    
    // Enhanced profile save functionality
    function saveProfileData() {
        const profileNameInput = document.getElementById('profileNameInput');
        const profileProgramSelect = document.getElementById('profileProgramSelect');
        const profilePicturePreview = document.getElementById('profilePicturePreview');
        
        // Get current profile data
        let profile = JSON.parse(localStorage.getItem('gerama_profile') || '{"name":"","program":"","img":""}');
        
        // Update profile data
        if (profileNameInput && profileNameInput.value.trim()) {
            profile.name = profileNameInput.value.trim();
        }
        if (profileProgramSelect && profileProgramSelect.value) {
            profile.program = profileProgramSelect.value;
        }
        
        // Save the updated profile
        localStorage.setItem('gerama_profile', JSON.stringify(profile));
        
        // Update sidebar profile display
        updateSidebarProfile();
        
        // Show success message
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            const originalText = saveProfileBtn.innerHTML;
            saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
            saveProfileBtn.style.background = '#4CAF50';
            setTimeout(() => {
                saveProfileBtn.innerHTML = originalText;
                saveProfileBtn.style.background = '';
            }, 2000);
        }
    }

    // Profile picture upload functionality
    function setupProfilePictureUpload() {
        const profilePictureInput = document.getElementById('profilePictureInput');
        const profilePicturePreview = document.getElementById('profilePicturePreview');
        
        if (profilePictureInput && profilePicturePreview) {
            profilePictureInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const imageData = e.target.result;
                        profilePicturePreview.innerHTML = `<img src="${imageData}" alt="Profile">`;
                        
                        // Save to localStorage
                        const profile = JSON.parse(localStorage.getItem('gerama_profile') || '{"name":"","program":"","img":""}');
                        profile.img = imageData;
                        localStorage.setItem('gerama_profile', JSON.stringify(profile));
                        
                        // Update sidebar avatar
                        updateSidebarProfile();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
    
    // Save profile functionality
    function setupProfileSave() {
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const profileNameInput = document.getElementById('profileNameInput');
                const profileProgramSelect = document.getElementById('profileProgramSelect');
                const profile = JSON.parse(localStorage.getItem('gerama_profile') || '{"name":"","program":"","img":""}');
                
                if (profileNameInput && profileNameInput.value.trim()) {
                    profile.name = profileNameInput.value.trim();
                    // Only update img if it's not already a custom image
                    if (!profile.img || !profile.img.startsWith('data:')) {
                        profile.img = 'https://via.placeholder.com/80?text=' + profile.name.charAt(0).toUpperCase();
                    }
                }
                
                if (profileProgramSelect && profileProgramSelect.value) {
                    profile.program = profileProgramSelect.value;
                }
                
                localStorage.setItem('gerama_profile', JSON.stringify(profile));
                updateSidebarProfile();
                loadProfileData(); // Reload to update preview
                
                // Show success message
                const originalText = saveProfileBtn.innerHTML;
                saveProfileBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                saveProfileBtn.style.background = '#4CAF50';
                setTimeout(() => {
                    saveProfileBtn.innerHTML = originalText;
                    saveProfileBtn.style.background = '';
                }, 2000);
            });
        }
    }

    // Update stats
    function updateStats() {
        const downloads = localStorage.getItem('gerama_downloads') || '0';
        const contributions = localStorage.getItem('gerama_contributions') || '0';
        
        // Update both old and new stat displays
        const downloadCount = document.getElementById('downloadCount');
        const contributionCount = document.getElementById('contributionCount');
        const quickDownloadCount = document.getElementById('quickDownloadCount');
        const quickContributionCount = document.getElementById('quickContributionCount');
        
        if (downloadCount) downloadCount.textContent = downloads;
        if (contributionCount) contributionCount.textContent = contributions;
        if (quickDownloadCount) quickDownloadCount.textContent = downloads;
        if (quickContributionCount) quickContributionCount.textContent = contributions;
    }

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

    // Initialize everything when sidebar is ready
    setTimeout(() => {
        updateSidebarProfile();
        initializeTabs();
        loadProfileData();
        setupProfilePictureUpload();
        setupProfileSave();
        updateStats();
    }, 100);
})();
