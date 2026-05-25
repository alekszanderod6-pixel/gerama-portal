// ═════════════════════════════════════════════════════════════════
// GERAMA Portal – Core: Sidebar, Profile, Auth Check
// ═════════════════════════════════════════════════════════════════

// Global XSS prevention helpers (used everywhere)
window.escHtml = window.escHtml || function(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
};

window.escAttr = window.escAttr || function(s) {
    return (s || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

window.formatTimeAgo = window.formatTimeAgo || function(iso) {
    if (!iso) return 'recently';
    var d = new Date(iso);
    var now = new Date();
    var diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
};

window.showStatus = window.showStatus || function(id, msg, type) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'status-msg status-' + (type || 'info');
    el.style.display = 'block';
};

(function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isAuthPage = currentPage === 'login.html' || currentPage === 'signup.html' || currentPage === 'reset-code.html' || currentPage === 'admin-dashboard.html';
    
    if (!isAuthPage) {
        // Wait for Supabase to be ready (it loads async via CDN)
        function checkAuth(attempts) {
            if (typeof window.geramaSupabase !== 'undefined') {
                window.geramaSupabase.auth.getSession().then(function(result) {
                    var session = result && result.data && result.data.session;
                    if (!session) {
                        sessionStorage.removeItem('gerama_loggedIn');
                        window.location.href = 'login.html';
                        return;
                    }
                    initializeSidebar();
                    updateSidebarUI();
                }).catch(function() {
                    window.location.href = 'login.html';
                });
            } else if (attempts > 0) {
                // Retry up to 20 times (2 seconds total)
                setTimeout(function() { checkAuth(attempts - 1); }, 100);
            } else {
                // Supabase never loaded — redirect to login
                window.location.href = 'login.html';
            }
        }
        checkAuth(20);
    }

    function initializeSidebar() {
        if (document.getElementById("sidebarDrawer")) return;
        const sidebarHTML = `
            <div id="sidebarDrawer" class="sidebar-drawer">
                <div class="drawer-header">
                    <button id="closeSidebarBtn" style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.15);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;">✕</button>
                    <div id="drawerAvatar" class="profile-emoji">👤</div>
                    <h3 id="drawerName">Student</h3>
                    <p id="drawerProgram">Program: Not set</p>
                    <div id="drawerClock" style="margin-top:0.8rem;background:rgba(255,255,255,0.1);border-radius:10px;padding:0.5rem 1rem;display:inline-block;">
                        <div id="drawerTime" style="font-size:1.4rem;font-weight:800;color:#FFC107;letter-spacing:1px;line-height:1.2;"></div>
                        <div id="drawerDate" style="font-size:0.75rem;color:rgba(255,255,255,0.75);margin-top:0.1rem;"></div>
                    </div>
                </div>
                <div class="drawer-nav">
                    <a href="index.html"><i class="fas fa-home"></i> Home</a>
                    <a href="resources.html"><i class="fas fa-book-open"></i> Resources</a>
                    <a href="classroom.html"><i class="fas fa-chalkboard-teacher"></i> Classroom <span id="navBadgeClassroom" style="display:none;background:#dc2626;color:white;border-radius:50%;width:18px;height:18px;font-size:0.65rem;font-weight:800;align-items:center;justify-content:center;margin-left:auto;flex-shrink:0;"></span></a>
                    <a href="about.html"><i class="fas fa-info-circle"></i> About</a>
                    <a href="contact.html"><i class="fas fa-envelope"></i> Contact</a>
                </div>
                <button id="editProfileDrawerBtn" style="background:#FFC107; color:#1B5E20; margin:1rem auto; width:90%; border:none; padding:0.6rem; border-radius:30px; display:block; font-weight:600; cursor:pointer;">✏️ Edit Profile</button>
                <button id="drawerLogoutBtn" class="logout-drawer">Logout</button>
            </div>
            <div id="drawerOverlay" class="overlay"></div>
        `;
        document.body.insertAdjacentHTML("beforeend", sidebarHTML);
        
        const drawer = document.getElementById("sidebarDrawer");
        const overlay = document.getElementById("drawerOverlay");

        function openDrawer() { drawer.classList.add("open"); overlay.classList.add("active"); document.body.style.overflow = "hidden"; }
        function closeDrawer() { drawer.classList.remove("open"); overlay.classList.remove("active"); document.body.style.overflow = ""; }

        const menuToggle = document.getElementById("menuToggle");
        const menuToggle2 = document.getElementById("menuToggle2");
        if(menuToggle)  menuToggle.onclick  = openDrawer;
        if(menuToggle2) menuToggle2.onclick = openDrawer;
        overlay.onclick = closeDrawer;
        document.getElementById("closeSidebarBtn").onclick = closeDrawer;
        
        const modalHTML = `
            <div id="profileModal" class="profile-modal">
                <div class="profile-modal-content">
                    <h3>Edit Profile</h3>
                    <div class="profile-form-group"><label>Profile Picture</label><div id="profilePreview" class="profile-picture-preview"><i class="fas fa-user"></i></div><input type="file" id="profilePictureUpload" accept="image/*"></div>
                    <div class="profile-form-group"><label>Name</label><input type="text" id="profileNameInput" placeholder="Your full name"></div>
                    <div class="profile-form-group"><label>Program</label><select id="profileProgramSelect"><option value="">Select program</option><option>Mechanical Engineering</option><option>Electrical Engineering</option><option>Computer Engineering</option><option>Agricultural Engineering</option><option>Petroleum Engineering</option><option>Renewable Energy Engineering</option><option>Civil Engineering</option><option>Environmental Engineering</option></select></div>
                    <div class="profile-form-group"><label>Academic Level</label><select id="profileLevelSelect"><option>L100</option><option>L200</option><option>L300</option><option>L400</option></select></div>
                    <button id="saveProfileModalBtn" class="profile-btn-save">Save Profile</button>
                    <button id="closeProfileModal" style="margin-top:1rem; background:#ccc; border:none; padding:0.5rem; border-radius:30px;">Cancel</button>
                </div>
            </div>
        `;
        if(!document.getElementById("profileModal")) document.body.insertAdjacentHTML("beforeend", modalHTML);
        
        const modal = document.getElementById("profileModal");
        document.getElementById("editProfileDrawerBtn").onclick = () => { loadProfileToModal(); modal.classList.add("active"); };
        document.getElementById("closeProfileModal").onclick = () => modal.classList.remove("active");
        document.getElementById("saveProfileModalBtn").onclick = saveProfile;
        document.getElementById("profilePictureUpload").addEventListener("change", e => {
            const file = e.target.files[0];
            if(file) {
                const reader = new FileReader();
                reader.onload = ev => { document.getElementById("profilePreview").innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;">`; };
                reader.readAsDataURL(file);
            }
        });
        
        document.getElementById("drawerLogoutBtn").onclick = async () => {
            if(typeof window.geramaSupabase !== 'undefined') await window.geramaSupabase.auth.signOut();
            sessionStorage.clear();
            localStorage.removeItem("gerama_profile");
            window.location.href = "login.html";
        };

        function updateClock() {
            var now = new Date();
            var timeEl = document.getElementById('drawerTime');
            var dateEl = document.getElementById('drawerDate');
            if(!timeEl || !dateEl) return;
            var h = now.getHours();
            var m = now.getMinutes().toString().padStart(2,'0');
            var s = now.getSeconds().toString().padStart(2,'0');
            var ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            timeEl.textContent = h + ':' + m + ':' + s + ' ' + ampm;
            dateEl.textContent = now.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
        }
        updateClock();
        setInterval(updateClock, 1000);
    }
    
    function loadProfileToModal() {
        const profile = JSON.parse(localStorage.getItem("gerama_profile") || '{"name":"","program":"","level":"","img":""}');
        document.getElementById("profileNameInput").value = profile.name || "";
        document.getElementById("profileProgramSelect").value = profile.program || "";
        document.getElementById("profileLevelSelect").value = profile.level || "L100";
        const preview = document.getElementById("profilePreview");
        if(profile.img) preview.innerHTML = `<img src="${profile.img}" style="width:100%;height:100%;object-fit:cover;">`;
        else preview.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    function saveProfile() {
        const name = document.getElementById("profileNameInput").value;
        const program = document.getElementById("profileProgramSelect").value;
        const level = document.getElementById("profileLevelSelect").value;
        let img = null;
        const previewImg = document.getElementById("profilePreview").querySelector("img");
        if(previewImg) img = previewImg.src;
        const profile = { name, program, level, img };
        localStorage.setItem("gerama_profile", JSON.stringify(profile));
        updateSidebarUI();
        document.getElementById("profileModal").classList.remove("active");
        alert("Profile updated!");
    }
    
    function updateSidebarUI() {
        const profile = JSON.parse(localStorage.getItem("gerama_profile") || '{"name":"Student","program":"Not set","img":""}');
        const nameEl = document.getElementById("drawerName");
        const progEl = document.getElementById("drawerProgram");
        const avatarDiv = document.getElementById("drawerAvatar");
        
        if(nameEl) nameEl.textContent = profile.name || "Student";
        if(progEl) progEl.textContent = 'Program: ' + (profile.program || "Not set");
        
        if(avatarDiv) {
            if(profile.img) {
                const img = document.createElement('img');
                img.src = profile.img;
                img.style.cssText = 'width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,193,7,0.5);';
                avatarDiv.innerHTML = '';
                avatarDiv.appendChild(img);
            } else if(profile.name) {
                // Show first letter with engineer emoji
                avatarDiv.innerHTML = '<div style="font-size:2rem;line-height:1;">⚙️</div><div style="font-size:0.75rem;font-weight:700;margin-top:0.2rem;opacity:0.9;">'+profile.name.charAt(0).toUpperCase()+'</div>';
            } else {
                avatarDiv.innerHTML = '<div style="font-size:2.5rem;">⚙️</div>';
            }
        }
    }
    
    setTimeout(() => {
        const current = window.location.pathname.split("/").pop();
        document.querySelectorAll(".drawer-nav a").forEach(link => {
            if(link.getAttribute("href") === current) link.classList.add("active");
        });
    }, 100);
})();

// ── PWA HEADER INSTALL BUTTON ─────────────────────────────────────
(function() {
    var _deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        _deferredPrompt = e;
        var btn = document.getElementById('pwaHeaderBtn');
        if (btn) {
            btn.style.display = 'inline-flex';
            btn.onclick = function() {
                if (!_deferredPrompt) return;
                _deferredPrompt.prompt();
                _deferredPrompt.userChoice.then(function(result) {
                    _deferredPrompt = null;
                    if (result.outcome === 'accepted') btn.style.display = 'none';
                });
            };
        }
    });
    window.addEventListener('appinstalled', function() {
        var btn = document.getElementById('pwaHeaderBtn');
        if (btn) btn.style.display = 'none';
        _deferredPrompt = null;
    });
})();

// ── PAGE VIEW TRACKER ─────────────────────────────────────────────
(function() {
    var page = window.location.pathname.split('/').pop() || 'index.html';
    var skip = ['login.html','signup.html','reset-code.html','admin-dashboard.html'];
    if(skip.indexOf(page) !== -1) return;
    function trackView() {
        if(typeof window.geramaSupabase === 'undefined') { setTimeout(trackView, 500); return; }
        window.geramaSupabase.from('page_views').insert({
            page: page, visited_at: new Date().toISOString(), referrer: document.referrer || null
        }).then(function(){}).catch(function(){});
    }
    setTimeout(trackView, 1000);
})();

// ── GLOBAL NOTIFICATION BADGES ────────────────────────────────────
(function() {
    var skip = ['login.html','signup.html','reset-code.html','admin-dashboard.html'];
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if(skip.indexOf(page) !== -1) return;

    function updateNavBadges() {
        if(typeof window.geramaSupabase === 'undefined') { setTimeout(updateNavBadges, 800); return; }
        var sb = window.geramaSupabase;
        var lastRead = localStorage.getItem('gerama_classroom_last_read');
        if(!lastRead) lastRead = new Date(Date.now() - 24*60*60*1000).toISOString();

        // Count new quizzes + assignments + announcements since last visit
        Promise.all([
            sb.from('quizzes').select('id',{count:'exact',head:true}).eq('status','active').gt('created_at', lastRead),
            sb.from('assignments').select('id',{count:'exact',head:true}).gt('created_at', lastRead),
            sb.from('questions').select('id',{count:'exact',head:true}).gt('created_at', lastRead)
        ]).then(function(results) {
            var total = (results[0].count||0) + (results[1].count||0) + (results[2].count||0);
            var badge = document.getElementById('navBadgeClassroom');
            if(badge) {
                if(total > 0 && page !== 'classroom.html') {
                    badge.textContent = total > 9 ? '9+' : total;
                    badge.style.display = 'inline-flex';
                } else {
                    badge.style.display = 'none';
                }
            }
            // Update bottom nav badge too
            updateBottomNavBadge('classroom.html', total > 0 && page !== 'classroom.html' ? total : 0);
        }).catch(function(){});
    }

    function updateBottomNavBadge(href, count) {
        var nav = document.getElementById('siteBottomNav');
        if(!nav) return;
        var links = nav.querySelectorAll('a');
        links.forEach(function(a) {
            if(a.getAttribute('href') === href) {
                var existing = a.querySelector('.bnav-badge');
                if(count > 0) {
                    if(!existing) {
                        var b = document.createElement('span');
                        b.className = 'bnav-badge';
                        b.style.cssText = 'position:absolute;top:2px;right:2px;background:#dc2626;color:white;border-radius:50%;width:16px;height:16px;font-size:0.6rem;font-weight:800;display:flex;align-items:center;justify-content:center;';
                        a.style.position = 'relative';
                        a.appendChild(b);
                        existing = b;
                    }
                    existing.textContent = count > 9 ? '9+' : count;
                } else if(existing) {
                    existing.remove();
                }
            }
        });
    }

    // Clear classroom badge when visiting classroom
    if(page === 'classroom.html') {
        localStorage.setItem('gerama_classroom_last_read', new Date().toISOString());
    }

    setTimeout(updateNavBadges, 2000);
    setInterval(updateNavBadges, 60000); // refresh every minute
})();

// ── SITE BOTTOM NAV (mobile) ──────────────────────────────────────
(function() {
    var skip = ['login.html','signup.html','reset-code.html','admin-dashboard.html'];
    var page = window.location.pathname.split('/').pop() || 'index.html';
    if(skip.indexOf(page) !== -1) return;

    var nav = document.createElement('nav');
    nav.id = 'siteBottomNav';
    nav.style.cssText = 'display:none;position:fixed;bottom:0;left:0;right:0;background:white;border-top:1px solid #e5e7eb;z-index:400;box-shadow:0 -4px 20px rgba(0,0,0,0.08);';

    var links = [
        { href:'index.html',     icon:'fas fa-home',               label:'Home' },
        { href:'resources.html', icon:'fas fa-book-open',          label:'Resources' },
        { href:'classroom.html', icon:'fas fa-chalkboard-teacher', label:'Classroom' },
        { href:'about.html',     icon:'fas fa-users',              label:'About' },
        { href:'contact.html',   icon:'fas fa-envelope',           label:'Contact' }
    ];

    nav.innerHTML = links.map(function(l) {
        var isActive = page === l.href ? 'color:#1B5E20;' : 'color:#9ca3af;';
        return '<a href="'+l.href+'" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.5rem 0.2rem;text-decoration:none;font-size:0.6rem;font-weight:600;gap:0.2rem;transition:color 0.2s;'+isActive+'">'+
            '<i class="'+l.icon+'" style="font-size:1.1rem;"></i><span>'+l.label+'</span></a>';
    }).join('');

    document.body.appendChild(nav);

    function checkMobile() {
        nav.style.display = window.innerWidth <= 640 ? 'flex' : 'none';
        document.body.style.paddingBottom = window.innerWidth <= 640 ? '60px' : '';
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
})();
