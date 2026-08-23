// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// GERAMA Portal – OneSignal Web Push Notifications
// App ID: 9aa2964d-5435-492c-9dd8-7c873d371976
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

(function () {
    'use strict';

    var ONESIGNAL_APP_ID = '9aa2964d-5435-492c-9dd8-7c873d371976';

    var SKIP_PAGES = ['login.html', 'signup.html', 'reset-code.html', 'admin-dashboard.html'];
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var showBell = SKIP_PAGES.indexOf(currentPage) === -1;

    var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;

    // ── 1. Init OneSignal SDK ──────────────────────────────────────
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function (OneSignal) {
        try {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                safari_web_id: 'web.onesignal.auto.4924b4f0-134c-425c-876d-dc71d8371c02',
                allowLocalhostAsSecureOrigin: true,
                notifyButton: { enable: false },
                promptOptions: {
                    slidedown: { prompts: [{ type: 'push', autoPrompt: false }] }
                }
            });
            console.log('[GERAMA] OneSignal initialized');
            _tryAutoLink();
            // Update bell colour once SDK is ready
            _updateBellColour(OneSignal);
        } catch (err) {
            console.warn('[GERAMA] OneSignal init failed:', err);
        }
    });

    // ── 2. Link Supabase user to OneSignal subscription ───────────
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
                console.log('[GERAMA] OneSignal linked – user:', userId);
            } else {
                OneSignalDeferred.push(async function (OS) {
                    try {
                        await OS.login(userId);
                        if (userEmail && OS.User && OS.User.addEmail) await OS.User.addEmail(userEmail);
                    } catch (e) {}
                });
            }
        } catch (err) {
            console.warn('[GERAMA] OneSignal link failed:', err);
        }
    };

    // ── 3. Logout ─────────────────────────────────────────────────
    window.geramaLogoutOneSignal = async function () {
        try {
            if (typeof window.OneSignal !== 'undefined' && window.OneSignal.logout) {
                await window.OneSignal.logout();
            }
        } catch (e) {}
    };

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

    // ── 4. Update bell colour based on subscription state ─────────
    function _updateBellColour(OneSignal) {
        setTimeout(async function () {
            try {
                var bell = document.getElementById('geramaNativeBell');
                if (!bell) return;
                var optedIn = await OneSignal.User.PushSubscription.optedIn;
                if (optedIn) {
                    bell.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                    bell.title = 'GERAMA notifications ON – tap to manage';
                }
            } catch (e) {}
        }, 1500);
    }

    // ── 5. Bell button ─────────────────────────────────────────────
    // Injected immediately — no wait for OneSignal SDK
    function _injectBell() {
        if (!showBell) return;
        if (document.getElementById('geramaNativeBell')) return;

        var bell = document.createElement('button');
        bell.id = 'geramaNativeBell';
        bell.setAttribute('aria-label', 'GERAMA push notifications');
        bell.title = 'Tap to get GERAMA alerts';
        bell.innerHTML = '🔔';
        // Left side — does not overlap GERALEX (which is bottom-right)
        bell.style.cssText = 'position:fixed;bottom:80px;left:14px;z-index:99999;width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#1B5E20,#2E7D32);border:2px solid rgba(255,255,255,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.2rem;box-shadow:0 4px 16px rgba(27,94,32,0.5);transition:transform 0.2s;font-family:inherit;';

        bell.addEventListener('click', async function () {
            // No notification support at all
            if (!('Notification' in window)) {
                alert('Push notifications are not supported on this browser.\nTry installing the GERAMA app to your home screen.');
                return;
            }

            // iOS Settings-level block
            if (Notification.permission === 'denied') {
                if (isIOS) {
                    alert('To enable notifications on iPhone:\n\n1. Close GERAMA\n2. Open iOS Settings → scroll down → tap Safari (or GERAMA)\n3. Tap Notifications → turn ON\n4. Re-open GERAMA from your home screen and tap the bell');
                } else {
                    alert('Notifications are blocked.\n\n1. Click the lock icon in your browser address bar\n2. Set Notifications to Allow\n3. Reload and tap the bell again');
                }
                return;
            }

            bell.innerHTML = '⏳';
            bell.disabled = true;

            // Helper: run subscribe logic once we have the OneSignal instance
            async function _doSubscribe(OS) {
                var alreadyIn = false;
                try { alreadyIn = await OS.User.PushSubscription.optedIn; } catch(e) {}

                if (alreadyIn) {
                    bell.innerHTML = '🔔';
                    bell.disabled = false;
                    bell.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                    _showTip('✓ Already subscribed!');
                    return;
                }

                // Requests browser permission AND registers the device with OneSignal
                await OS.Notifications.requestPermission();
                await window.geramaLinkOneSignal();

                var nowIn = false;
                try { nowIn = await OS.User.PushSubscription.optedIn; } catch(e) {}

                bell.innerHTML = '🔔';
                bell.disabled = false;

                if (nowIn) {
                    bell.style.background = 'linear-gradient(135deg,#059669,#10b981)';
                    bell.title = 'GERAMA notifications ON – tap to manage';
                    _showTip('✓ Notifications ON!');
                } else {
                    if (isIOS && !isPWA) {
                        alert('To get notifications on iPhone, you need to:\n\n1. Tap the Share button in Safari\n2. Tap "Add to Home Screen"\n3. Open GERAMA from your home screen\n4. Tap the bell again');
                    } else if (isIOS) {
                        alert('Could not subscribe.\n\nCheck iOS Settings → Safari or GERAMA → Notifications are ON, then try again.');
                    } else {
                        alert('Permission not granted. Please allow notifications when prompted.');
                    }
                }
            }

            try {
                if (typeof window.OneSignal !== 'undefined') {
                    // SDK already ready — subscribe immediately
                    await _doSubscribe(window.OneSignal);
                } else {
                    // SDK not ready yet — wait for it via the deferred queue.
                    // OneSignalDeferred.push() executes the callback immediately if the
                    // SDK has already initialised, so this path is safe in all cases.
                    var subscribeError = null;
                    await new Promise(function (resolve) {
                        OneSignalDeferred.push(async function (OS) {
                            try { await _doSubscribe(OS); }
                            catch (e) { subscribeError = e; }
                            resolve();
                        });
                        // Safety timeout: if SDK never loads in 10 s, unblock the UI
                        setTimeout(function () {
                            bell.innerHTML = '🔔';
                            bell.disabled = false;
                            _showTip('Could not load notifications SDK. Try again.');
                            resolve();
                        }, 10000);
                    });
                    if (subscribeError) throw subscribeError;
                }
            } catch (e) {
                bell.innerHTML = '🔔';
                bell.disabled = false;
                console.warn('[GERAMA] Bell error:', e);
                alert('Error: ' + e.message);
            }
        });

        document.body.appendChild(bell);
    }

    function _showTip(text) {
        var tip = document.createElement('div');
        tip.textContent = text;
        tip.style.cssText = 'position:fixed;bottom:140px;left:10px;z-index:99999;background:#059669;color:white;padding:0.35rem 0.9rem;border-radius:20px;font-size:0.8rem;font-weight:700;font-family:Inter,sans-serif;pointer-events:none;box-shadow:0 4px 12px rgba(5,150,105,0.4);';
        document.body.appendChild(tip);
        setTimeout(function () { if (tip.parentNode) tip.remove(); }, 3000);
    }

    // Inject bell as soon as body is available
    if (document.body) {
        _injectBell();
    } else {
        document.addEventListener('DOMContentLoaded', _injectBell);
    }
    setTimeout(_injectBell, 500); // retry in case body wasn't ready

    // ── 6. Auto-prompt banner for signed-in users not yet subscribed ──
    OneSignalDeferred.push(async function (OneSignal) {
        if (!showBell) return;
        try {
            var dismissed = parseInt(localStorage.getItem('gerama_notif_dismissed') || '0');
            if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return;
            if (typeof window.geramaSupabase === 'undefined') return;
            var result = await window.geramaSupabase.auth.getSession();
            if (!result || !result.data || !result.data.session) return;
            var optedIn = await OneSignal.User.PushSubscription.optedIn;
            if (optedIn) return;
            if (!('Notification' in window) || Notification.permission === 'denied') return;
            if (isIOS && !isPWA) { setTimeout(_injectIOSBanner, 3000); return; }
            setTimeout(function () { _injectPromptBanner(OneSignal); }, 3000);
        } catch (e) {}
    });

    function _injectPromptBanner(OneSignal) {
        if (document.getElementById('geramaNotifBanner')) return;
        var banner = document.createElement('div');
        banner.id = 'geramaNotifBanner';
        banner.style.cssText = 'position:fixed;bottom:70px;left:0;right:0;z-index:8500;margin:0 auto;max-width:520px;background:linear-gradient(135deg,#0a2f1f,#1B5E20);color:white;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,0.35);padding:1rem 1.2rem;display:flex;align-items:center;gap:0.9rem;font-family:Inter,sans-serif;transform:translateY(100%);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);border-top:2px solid rgba(255,193,7,0.5);';
        var subtext = isPWA ? 'Get instant GERAMA alerts on your phone – even when the app is closed.' : 'Get alerts on this device. For background notifications, save to home screen first.';
        banner.innerHTML = '<div style="font-size:1.8rem;flex-shrink:0;">🔔</div><div style="flex:1;min-width:0;"><div style="font-size:0.88rem;font-weight:800;margin-bottom:0.1rem;">Stay updated with GERAMA</div><div style="font-size:0.75rem;opacity:0.8;line-height:1.4;">' + subtext + '</div></div><div style="display:flex;flex-direction:column;gap:0.4rem;flex-shrink:0;"><button id="geramaNotifEnable" style="background:#FFC107;color:#0a2f1f;border:none;padding:0.5rem 1.1rem;border-radius:20px;font-size:0.82rem;font-weight:800;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">Enable Alerts</button><button id="geramaNotifDismiss" style="background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.8);border:1px solid rgba(255,255,255,0.2);padding:0.35rem 1.1rem;border-radius:20px;font-size:0.75rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;">Not now</button></div>';
        document.body.appendChild(banner);
        requestAnimationFrame(function () { requestAnimationFrame(function () { banner.style.transform = 'translateY(0)'; }); });
        document.getElementById('geramaNotifEnable').addEventListener('click', async function () {
            _hideBanner();
            try {
                await OneSignal.Notifications.requestPermission();
                await window.geramaLinkOneSignal();
                var b = document.getElementById('geramaNativeBell');
                if (b) b.style.background = 'linear-gradient(135deg,#059669,#10b981)';
            } catch (e) {}
        });
        document.getElementById('geramaNotifDismiss').addEventListener('click', function () {
            localStorage.setItem('gerama_notif_dismissed', String(Date.now()));
            _hideBanner();
        });
    }

    function _injectIOSBanner() {
        if (document.getElementById('geramaIOSBanner')) return;
        var dismissed = parseInt(localStorage.getItem('gerama_ios_banner_dismissed') || '0');
        if (Date.now() - dismissed < 14 * 24 * 60 * 60 * 1000) return;
        var banner = document.createElement('div');
        banner.id = 'geramaIOSBanner';
        banner.style.cssText = 'position:fixed;bottom:70px;left:0;right:0;z-index:8500;margin:0 auto;max-width:520px;background:linear-gradient(135deg,#1e40af,#2563eb);color:white;border-radius:16px 16px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,0.35);padding:1rem 1.2rem;font-family:Inter,sans-serif;transform:translateY(100%);transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);border-top:2px solid rgba(255,255,255,0.3);';
        banner.innerHTML = '<div style="display:flex;align-items:flex-start;gap:0.9rem;"><div style="font-size:1.8rem;flex-shrink:0;">📲</div><div style="flex:1;min-width:0;"><div style="font-size:0.88rem;font-weight:800;margin-bottom:0.3rem;">Get GERAMA notifications on iPhone</div><div style="font-size:0.78rem;opacity:0.9;line-height:1.6;">1. Tap the <strong>Share</strong> button at the bottom of Safari<br>2. Tap <strong>"Add to Home Screen"</strong><br>3. Open GERAMA from your home screen<br>4. Tap <strong>Allow</strong> when prompted</div></div><button id="geramaIOSDismiss" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:white;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;">×</button></div>';
        document.body.appendChild(banner);
        requestAnimationFrame(function () { requestAnimationFrame(function () { banner.style.transform = 'translateY(0)'; }); });
        document.getElementById('geramaIOSDismiss').addEventListener('click', function () {
            localStorage.setItem('gerama_ios_banner_dismissed', String(Date.now()));
            banner.style.transform = 'translateY(110%)';
            setTimeout(function () { if (banner.parentNode) banner.remove(); }, 400);
        });
    }

    function _hideBanner() {
        var b = document.getElementById('geramaNotifBanner');
        if (!b) return;
        b.style.transform = 'translateY(110%)';
        setTimeout(function () { if (b.parentNode) b.remove(); }, 400);
    }

})();
