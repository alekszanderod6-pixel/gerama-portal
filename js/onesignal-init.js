// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// GERAMA Portal – OneSignal Web Push Notifications
// App ID: 9aa2964d-5435-492c-9dd8-7c873d371976
// Fixed: removed duplicate IIFE that was causing double-init bug
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

(function () {
    'use strict';

    var ONESIGNAL_APP_ID = '9aa2964d-5435-492c-9dd8-7c873d371976';

    var SKIP_BANNER_PAGES = ['login.html', 'signup.html', 'reset-code.html', 'admin-dashboard.html'];
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var showBanner  = SKIP_BANNER_PAGES.indexOf(currentPage) === -1;

    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;

    // –– 1. Initialize OneSignal (ONCE) ––––––––––––––––––––––––––––
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function (OneSignal) {
        try {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                safari_web_id: 'web.onesignal.auto.4924b4f0-134c-425c-876d-dc71d8371c02',
                allowLocalhostAsSecureOrigin: true,
                // Disable the built-in iframe bell – it breaks on iOS PWA.
                // We inject our own native bell button below instead.
                notifyButton: { enable: false },
                promptOptions: {
                    slidedown: { prompts: [{ type: 'push', autoPrompt: false }] }
                }
            });

            console.log('[GERAMA] OneSignal initialized –');

            _tryAutoLink();

            if (showBanner) {
                _injectNativeBell(OneSignal);
                _maybeShowBanner(OneSignal);
            }

        } catch (err) {
            console.warn('[GERAMA] OneSignal init failed:', err);
        }
    });

    // –– 2. Link Supabase UUID + email to OneSignal ––––––––––––––––
    // Called after login, signup, and on every page load for active sessions.
    window.geramaLinkOneSignal = async function () {
        try {
            if (typeof window.geramaSupabase === 'undefined') return;
            var result = await window.geramaSupabase.auth.getSession();
            var session = result && result.data && result.data.session;
            if (!session || !session.user) return;

            var userId    = session.user.id;
            var userEmail = session.user.email;

            if (typeof window.OneSignal !== 'undefined' && window.OneSignal.login) {
                await window.OneSignal.login(userId);
                if (userEmail && window.OneSignal.User && window.OneSignal.User.addEmail) {
                    await window.OneSignal.User.addEmail(userEmail);
                }
                console.log('[GERAMA] OneSignal linked – user:', userId, 'email:', userEmail);
            } else {
                OneSignalDeferred.push(async function (OneSignal) {
                    try {
                        await OneSignal.login(userId);
                        if (userEmail && OneSignal.User && OneSignal.User.addEmail) {
                            await OneSignal.User.addEmail(userEmail);
                        }
                    } catch (e) { /* non-fatal */ }
                });
            }
        } catch (err) {
            console.warn('[GERAMA] OneSignal user link failed:', err);
        }
    };

    // –– 3. Logout cleanup –––––––––––––––––––––––––––––––––––––––––
    window.geramaLogoutOneSignal = async function () {
        try {
            if (typeof window.OneSignal !== 'undefined' && window.OneSignal.logout) {
                await window.OneSignal.logout();
                console.log('[GERAMA] OneSignal logged out');
            }
        } catch (e) {
            console.warn('[GERAMA] OneSignal logout failed:', e);
        }
    };

    // Auto-link on every page load (for already logged-in sessions)
    function _tryAutoLink() {
        function attempt(n) {
            if (typeof window.geramaSupabase !== 'undefined') {
                window.geramaLinkOneSignal();
            } else if (n > 0) {
                setTimeout(function () { attempt(n - 1); }, 300);
            }
        }
        attempt(20);
    }

    // –– 4. Native bell button (works on iOS PWA – no iframe) ––––––
    function _injectNativeBell(OneSignal) {
        if (document.getElementById('geramaNativeBell')) return;

        var bell = document.createElement('button');
        bell.id = 'geramaNativeBell';
        bell.setAttribute('aria-label', 'Manage GERAMA notifications');
        bell.title = 'Tap to get GERAMA alerts';
        bell.style.cssText = [
            'position:fixed', 'bottom:90px', 'right:16px', 'z-index:9500',
            'width:50px', 'height:50px', 'border-radius:50%',
            'background:linear-gradient(135deg,#1B5E20,#2E7D32)',
            'border:2px solid rgba(255,255,255,0.3)', 'cursor:pointer',
            'display:flex', 'align-items:center', 'justify-content:center',
            'font-size:1.3rem', 'box-shadow:0 4px 18px rgba(27,94,32,0.55)',
            'transition:transform 0.2s,box-shadow 0.2s',
            'font-family:inherit'
        ].join(';');
        bell.innerHTML = '🔔';

        bell.addEventListener('mouseover', function () { bell.style.transform = 'scale(1.1)'; });
        bell.addEventListener('mouseout',  function () { bell.style.transform = 'scale(1)'; });

        bell.addEventListener('click', async function () {
            try {
                var optedIn = await OneSignal.User.PushSubscription.optedIn;
                if (optedIn) {
                    if (confirm('You are subscribed to GERAMA notifications.\n\nTap OK to unsubscribe.')) {
                        await OneSignal.User.PushSubscription.optOut();
                        bell.innerHTML = '🔕';
                        bell.style.background = 'linear-gradient(135deg,#6b7280,#9ca3af)';
                        setTimeout(function () {
                            bell.innerHTML = '🔔';
                            bell.style.background = 'linear-gradient(135deg,#1B5E20,#2E7D32)';
                        }, 3000);
                    }
                } else {
                    await OneSignal.Notifications.requestPermission();
                    window.geramaLinkOneSignal && window.geramaLinkOneSignal();
                    bell.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                    bell.title = 'GERAMA notifications ON – tap to manage';
                    var tip = document.createElement('div');
                    tip.textContent = '– Alerts ON';
                    tip.style.cssText = [
                        'position:fixed', 'bottom:134px', 'right:10px', 'z-index:8001',
                        'background:#059669', 'color:white',
                        'padding:0.3rem 0.7rem', 'border-radius:20px',
                        'font-size:0.75rem', 'font-weight:700',
                        'font-family:Inter,sans-serif', 'pointer-events:none'
                    ].join(';');
                    document.body.appendChild(tip);
                    setTimeout(function () { tip.remove(); }, 3000);
                }
            } catch (e) {
                console.warn('[GERAMA] Bell click error:', e);
            }
        });

        // Colour the bell green if already subscribed
        async function _updateBellState() {
            try {
                var optedIn = await OneSignal.User.PushSubscription.optedIn;
                if (optedIn) {
                    bell.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                    bell.title = 'GERAMA notifications ON – tap to manage';
                }
            } catch (e) {}
        }

        document.body.appendChild(bell);
        setTimeout(_updateBellState, 1000);
    }

    // –– 5. Smart subscribe banner –––––––––––––––––––––––––––––––––
    async function _maybeShowBanner(OneSignal) {
        try {
            var dismissed = parseInt(localStorage.getItem('gerama_notif_dismissed') || '0');
            if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return;

            if (typeof window.geramaSupabase === 'undefined') return;
            var result = await window.geramaSupabase.auth.getSession();
            var session = result && result.data && result.data.session;
            if (!session) return;

            var isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
            if (isPushEnabled) return;

            if (!('Notification' in window)) return;
            if (Notification.permission === 'denied') return;

            // iOS not in PWA mode: show the "save to homescreen" guide
            if (isIOS && !isPWA) {
                setTimeout(_injectIOSBanner, 2500);
                return;
            }

            setTimeout(_injectBanner, 2500);
        } catch (e) { /* non-fatal */ }
    }

    function _injectBanner() {
        if (document.getElementById('geramaNotifBanner')) return;
        if (!('Notification' in window) || Notification.permission === 'denied') return;

        var subtext = isPWA
            ? 'Get instant GERAMA alerts on your phone – even when the app is closed.'
            : 'Get alerts on this device. For background notifications, save to homescreen first.';

        var banner = document.createElement('div');
        banner.id = 'geramaNotifBanner';
        banner.setAttribute('role', 'alert');
        banner.style.cssText = [
            'position:fixed', 'bottom:70px', 'left:0', 'right:0',
            'z-index:8500', 'margin:0 auto', 'max-width:520px',
            'background:linear-gradient(135deg,#0a2f1f 0%,#1B5E20 100%)',
            'color:white', 'border-radius:16px 16px 0 0',
            'box-shadow:0 -4px 24px rgba(0,0,0,0.35)',
            'padding:1rem 1.2rem', 'display:flex', 'align-items:center',
            'gap:0.9rem', 'font-family:Inter,sans-serif',
            'transform:translateY(100%)',
            'transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            'border-top:2px solid rgba(255,193,7,0.5)'
        ].join(';');

        banner.innerHTML =
            '<div style="font-size:1.8rem;flex-shrink:0;line-height:1;">🔔</div>' +
            '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:0.88rem;font-weight:800;margin-bottom:0.15rem;">Stay updated with GERAMA</div>' +
                '<div style="font-size:0.75rem;opacity:0.8;line-height:1.4;">' + subtext + '</div>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:0.4rem;flex-shrink:0;">' +
                '<button id="geramaNotifEnable" style="background:#FFC107;color:#0a2f1f;border:none;padding:0.5rem 1.1rem;border-radius:20px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(255,193,7,0.4);">Enable Alerts</button>' +
                '<button id="geramaNotifDismiss" style="background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.2);padding:0.35rem 1.1rem;border-radius:20px;font-size:0.75rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">Not now</button>' +
            '</div>';

        document.body.appendChild(banner);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { banner.style.transform = 'translateY(0)'; });
        });

        document.getElementById('geramaNotifEnable').addEventListener('click', function () {
            _hideBanner();
            OneSignalDeferred.push(async function (OneSignal) {
                try {
                    await OneSignal.Notifications.requestPermission();
                    window.geramaLinkOneSignal && window.geramaLinkOneSignal();
                } catch (e) { console.warn('[GERAMA] Permission request failed:', e); }
            });
        });

        document.getElementById('geramaNotifDismiss').addEventListener('click', function () {
            localStorage.setItem('gerama_notif_dismissed', String(Date.now()));
            _hideBanner();
        });
    }

    // iOS: show a "Save to Homescreen" guide banner
    function _injectIOSBanner() {
        if (document.getElementById('geramaIOSBanner')) return;
        var dismissed = parseInt(localStorage.getItem('gerama_ios_banner_dismissed') || '0');
        if (Date.now() - dismissed < 14 * 24 * 60 * 60 * 1000) return;

        var banner = document.createElement('div');
        banner.id = 'geramaIOSBanner';
        banner.style.cssText = [
            'position:fixed', 'bottom:70px', 'left:0', 'right:0',
            'z-index:8500', 'margin:0 auto', 'max-width:520px',
            'background:linear-gradient(135deg,#1e40af,#2563eb)',
            'color:white', 'border-radius:16px 16px 0 0',
            'box-shadow:0 -4px 24px rgba(0,0,0,0.35)',
            'padding:1rem 1.2rem', 'font-family:Inter,sans-serif',
            'transform:translateY(100%)',
            'transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            'border-top:2px solid rgba(255,255,255,0.3)'
        ].join(';');

        banner.innerHTML =
            '<div style="display:flex;align-items:flex-start;gap:0.9rem;">' +
                '<div style="font-size:1.8rem;flex-shrink:0;line-height:1;">📲</div>' +
                '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:0.88rem;font-weight:800;margin-bottom:0.3rem;">Get GERAMA notifications on iPhone</div>' +
                    '<div style="font-size:0.78rem;opacity:0.9;line-height:1.6;">' +
                        '1. Tap the <strong>Share</strong> button <span style="font-size:1rem;">–️</span> at the bottom of Safari<br>' +
                        '2. Scroll down and tap <strong>"Add to Home Screen"</strong><br>' +
                        '3. Open the GERAMA app from your home screen<br>' +
                        '4. Tap <strong>"Allow"</strong> when prompted for notifications' +
                    '</div>' +
                '</div>' +
                '<button id="geramaIOSDismiss" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:Inter,sans-serif;line-height:1;">–</button>' +
            '</div>';

        document.body.appendChild(banner);
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { banner.style.transform = 'translateY(0)'; });
        });

        document.getElementById('geramaIOSDismiss').addEventListener('click', function () {
            localStorage.setItem('gerama_ios_banner_dismissed', String(Date.now()));
            banner.style.transform = 'translateY(110%)';
            setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 400);
        });
    }

    function _hideBanner() {
        var b = document.getElementById('geramaNotifBanner');
        if (!b) return;
        b.style.transform = 'translateY(110%)';
        setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 400);
    }

    // –– Fallback: inject bell immediately — no dependency on OneSignal SDK loading ––
    if (showBanner) {
        function _ensureBell() {
            if (document.getElementById('geramaNativeBell')) return;
            var bell = document.createElement('button');
            bell.id = 'geramaNativeBell';
            bell.setAttribute('aria-label', 'Enable GERAMA notifications');
            bell.title = 'Tap to enable GERAMA push alerts';
            bell.innerHTML = '🔔';
            // Positioned on LEFT side so it doesn't cover GERALEX (which is bottom-right)
            bell.style.cssText = 'position:fixed;bottom:80px;left:14px;z-index:99999;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1B5E20,#2E7D32);border:2px solid rgba(255,255,255,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 4px 16px rgba(27,94,32,0.5);transition:transform 0.2s;font-family:inherit;visibility:visible;opacity:1;';
            bell.addEventListener('click', async function () {
                // Check if browser supports notifications at all
                if (!('Notification' in window)) {
                    alert('Push notifications are not supported on this browser.\nTry installing the GERAMA app to your home screen and opening it from there.');
                    return;
                }
                if (Notification.permission === 'denied') {
                    // iOS PWA needs Settings app, not browser bar
                    if (isIOS) {
                        alert('To enable notifications on iPhone:\n\n1. Close this app\n2. Open the iOS Settings app\n3. Scroll down and tap "GERAMA" (or Safari)\n4. Tap "Notifications" → turn ON\n5. Re-open GERAMA from your home screen and tap the bell again');
                    } else {
                        alert('Notifications are blocked for this site.\n\nTo fix:\n1. Tap the lock/info icon in your browser address bar\n2. Find "Notifications" and set it to "Allow"\n3. Reload the page and tap the bell again.');
                    }
                    return;
                }
                bell.innerHTML = '⏳';
                bell.disabled = true;
                try {
                    // iOS PWA: if permission is "default" but requestPermission doesn't show a prompt,
                    // it means notifications are OFF in iOS Settings
                    var perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                        // Now hook into OneSignal if available
                        if (typeof window.OneSignal !== 'undefined') {
                            try { await window.OneSignal.Notifications.requestPermission(); } catch(e) {}
                        } else {
                            // Queue for when OneSignal loads
                            window.OneSignalDeferred = window.OneSignalDeferred || [];
                            OneSignalDeferred.push(async function(OS) {
                                try { await OS.Notifications.requestPermission(); } catch(e) {}
                            });
                        }
                        window.geramaLinkOneSignal && window.geramaLinkOneSignal();
                        bell.innerHTML = '🔔';
                        bell.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                        bell.title = 'GERAMA notifications ON ✓';
                        bell.disabled = false;
                        // Show confirmation tip
                        var tip = document.createElement('div');
                        tip.textContent = '✓ Notifications ON!';
                        tip.style.cssText = 'position:fixed;bottom:140px;left:10px;z-index:99999;background:#059669;color:white;padding:0.35rem 0.9rem;border-radius:20px;font-size:0.8rem;font-weight:700;font-family:Inter,sans-serif;pointer-events:none;box-shadow:0 4px 12px rgba(5,150,105,0.4);';
                        document.body.appendChild(tip);
                        setTimeout(function(){ if(tip.parentNode) tip.remove(); }, 3000);
                    } else {
                        bell.innerHTML = '🔔';
                        bell.disabled = false;
                        if (isIOS) {
                            alert('Notifications were not enabled.\n\nOn iPhone you need to:\n1. Close GERAMA\n2. Open iOS Settings → scroll to GERAMA or Safari\n3. Tap Notifications → turn ON\n4. Re-open GERAMA and tap the bell');
                        } else {
                            alert('Notification permission was not granted. You can enable it later by tapping the bell again.');
                        }
                    }
                } catch (e) {
                    bell.innerHTML = '🔔';
                    bell.disabled = false;
                    alert('Could not enable notifications: ' + e.message);
                }
            });
            // Colour bell green if already subscribed (check after 1s)
            setTimeout(async function() {
                try {
                    if (Notification.permission === 'granted') {
                        bell.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                        bell.title = 'GERAMA notifications ON ✓';
                    }
                } catch(e) {}
            }, 1500);
            document.body.appendChild(bell);
        }
        // Inject as soon as possible
        if (document.body) {
            _ensureBell();
        } else {
            document.addEventListener('DOMContentLoaded', _ensureBell);
        }
        // Also retry after 1s in case body wasn't ready
        setTimeout(_ensureBell, 1000);
    }

})();
