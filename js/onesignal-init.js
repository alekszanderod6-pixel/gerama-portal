// ═════════════════════════════════════════════════════════════════
// GERAMA Portal — OneSignal Web Push Notifications
// App ID: 9aa2964d-5435-492c-9dd8-7c873d371976
// ═════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    var ONESIGNAL_APP_ID = '9aa2964d-5435-492c-9dd8-7c873d371976';

    // Pages where we should NOT show the subscribe banner
    var SKIP_BANNER_PAGES = ['login.html', 'signup.html', 'reset-code.html', 'admin-dashboard.html'];
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var showBanner  = SKIP_BANNER_PAGES.indexOf(currentPage) === -1;

    // ── 1. Initialize OneSignal ────────────────────────────────────
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function (OneSignal) {
        try {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                safari_web_id: 'web.onesignal.auto.4924b4f0-134c-425c-876d-dc71d8371c02',
                allowLocalhostAsSecureOrigin: true,
                // Floating bell — always visible so students can manage their subscription
                notifyButton: {
                    enable: true,
                    size: 'medium',
                    theme: 'default',
                    position: 'bottom-right',
                    offset: { bottom: '70px', right: '10px' },
                    showCredit: false,
                    text: {
                        'tip.state.unsubscribed':      'Get GERAMA alerts',
                        'tip.state.subscribed':        'GERAMA alerts ON ✓',
                        'tip.state.blocked':           'Notifications blocked',
                        'message.prenotify':           'New update from GERAMA!',
                        'message.action.subscribed':   '🎉 You\'re subscribed to GERAMA!',
                        'message.action.resubscribed': 'Welcome back! GERAMA alerts are on.',
                        'message.action.unsubscribed': 'You\'ve unsubscribed from GERAMA alerts.',
                        'dialog.main.title':           'GERAMA Notifications',
                        'dialog.main.button.subscribe': 'Subscribe',
                        'dialog.main.button.unsubscribe': 'Unsubscribe',
                        'dialog.blocked.title':        'Unblock Notifications',
                        'dialog.blocked.message':      'Follow these steps to allow notifications from GERAMA.'
                    }
                },
                // We handle our own prompt UI — disable the built-in slidedown
                promptOptions: {
                    slidedown: { prompts: [{ type: 'push', autoPrompt: false }] }
                }
            });

            console.log('[GERAMA] OneSignal initialized');

            // ── 2. Auto-link already-authenticated Supabase users ──────
            _tryAutoLink();

            // ── 3. Show subscribe banner for logged-in, unsubscribed users
            if (showBanner) {
                _maybeShowBanner(OneSignal);
            }

        } catch (err) {
            console.warn('[GERAMA] OneSignal init failed:', err);
        }
    });

    // ── Link Supabase UUID to OneSignal ────────────────────────────
    // Called after login, signup, and on every page load for active sessions.
    window.geramaLinkOneSignal = async function () {
        try {
            if (typeof window.geramaSupabase === 'undefined') return;
            var result = await window.geramaSupabase.auth.getSession();
            var session = result && result.data && result.data.session;
            if (!session || !session.user) return;
            var userId = session.user.id;

            if (typeof window.OneSignal !== 'undefined' && window.OneSignal.login) {
                await window.OneSignal.login(userId);
                console.log('[GERAMA] OneSignal linked to user:', userId);
            } else {
                OneSignalDeferred.push(async function (OneSignal) {
                    try { await OneSignal.login(userId); } catch (e) { /* non-fatal */ }
                });
            }
        } catch (err) {
            console.warn('[GERAMA] OneSignal user link failed:', err);
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

    // ── Smart subscribe banner ─────────────────────────────────────
    // Shows once to logged-in users who haven't subscribed yet.
    // Dismissed state is stored in localStorage so it doesn't re-appear.
    async function _maybeShowBanner(OneSignal) {
        try {
            // Don't show if already dismissed within the last 7 days
            var dismissed = parseInt(localStorage.getItem('gerama_notif_dismissed') || '0');
            if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return;

            // Don't show to guests (no active Supabase session)
            if (typeof window.geramaSupabase === 'undefined') return;
            var result = await window.geramaSupabase.auth.getSession();
            var session = result && result.data && result.data.session;
            if (!session) return;

            // Check if already subscribed
            var isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
            if (isPushEnabled) return;

            // Check if browser supports notifications at all
            if (!('Notification' in window)) return;
            if (Notification.permission === 'denied') return;

            // Small delay so the page finishes loading before the banner pops
            setTimeout(_injectBanner, 2500);

        } catch (e) {
            // Non-fatal — banner is a nice-to-have
        }
    }

    function _injectBanner() {
        if (document.getElementById('geramaNotifBanner')) return;

        // Detect if PWA (saved to homescreen)
        var isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    window.navigator.standalone === true;

        var subtext = isPWA
            ? 'Get instant alerts on your phone — even when the app is closed.'
            : 'Get alerts on this device. Save to homescreen to receive them even when your browser is closed.';

        var banner = document.createElement('div');
        banner.id = 'geramaNotifBanner';
        banner.setAttribute('role', 'alert');
        banner.style.cssText = [
            'position:fixed',
            'bottom:70px',          // above mobile bottom nav
            'left:0', 'right:0',
            'z-index:8500',
            'margin:0 auto',
            'max-width:520px',
            'background:linear-gradient(135deg,#0a2f1f 0%,#1B5E20 100%)',
            'color:white',
            'border-radius:16px 16px 0 0',
            'box-shadow:0 -4px 24px rgba(0,0,0,0.35)',
            'padding:1rem 1.2rem',
            'display:flex',
            'align-items:center',
            'gap:0.9rem',
            'font-family:Inter,sans-serif',
            'transform:translateY(100%)',
            'transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            'border-top:2px solid rgba(255,193,7,0.5)'
        ].join(';');

        banner.innerHTML = [
            '<div style="font-size:1.8rem;flex-shrink:0;line-height:1;">🔔</div>',
            '<div style="flex:1;min-width:0;">',
                '<div style="font-size:0.88rem;font-weight:800;margin-bottom:0.15rem;">',
                    'Stay updated with GERAMA',
                '</div>',
                '<div style="font-size:0.75rem;opacity:0.8;line-height:1.4;">' + subtext + '</div>',
            '</div>',
            '<div style="display:flex;flex-direction:column;gap:0.4rem;flex-shrink:0;">',
                '<button id="geramaNotifEnable" style="',
                    'background:#FFC107;color:#0a2f1f;border:none;',
                    'padding:0.5rem 1.1rem;border-radius:20px;',
                    'font-size:0.82rem;font-weight:800;cursor:pointer;',
                    'font-family:Inter,sans-serif;white-space:nowrap;',
                    'box-shadow:0 2px 8px rgba(255,193,7,0.4);',
                '">Enable Alerts</button>',
                '<button id="geramaNotifDismiss" style="',
                    'background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);',
                    'border:1px solid rgba(255,255,255,0.2);',
                    'padding:0.35rem 1.1rem;border-radius:20px;',
                    'font-size:0.75rem;font-weight:600;cursor:pointer;',
                    'font-family:Inter,sans-serif;white-space:nowrap;',
                '">Not now</button>',
            '</div>'
        ].join('');

        document.body.appendChild(banner);

        // Slide in after a brief moment
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                banner.style.transform = 'translateY(0)';
            });
        });

        // "Enable Alerts" — trigger the native browser permission prompt
        document.getElementById('geramaNotifEnable').addEventListener('click', async function () {
            _hideBanner();
            try {
                // Request native browser permission via OneSignal
                OneSignalDeferred.push(async function (OneSignal) {
                    await OneSignal.Notifications.requestPermission();
                    // Link user after they subscribe
                    window.geramaLinkOneSignal && window.geramaLinkOneSignal();
                });
            } catch (e) {
                console.warn('[GERAMA] Notification permission request failed:', e);
            }
        });

        // "Not now" — dismiss for 7 days
        document.getElementById('geramaNotifDismiss').addEventListener('click', function () {
            localStorage.setItem('gerama_notif_dismissed', String(Date.now()));
            _hideBanner();
        });
    }

    function _hideBanner() {
        var b = document.getElementById('geramaNotifBanner');
        if (!b) return;
        b.style.transform = 'translateY(110%)';
        setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 400);
    }

})();
