// ═════════════════════════════════════════════════════════════════
// GERAMA Portal — OneSignal Web Push Notifications
// App ID: 9aa2964d-5435-492c-9dd8-7c873d371976
// ═════════════════════════════════════════════════════════════════
// This file should be loaded on EVERY page, after supabase-config.js
// The OneSignalSDKWorker.js must be in the root of the project folder.
// ═════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    var ONESIGNAL_APP_ID = '9aa2964d-5435-492c-9dd8-7c873d371976';

    // ── 1. Initialize OneSignal once the SDK is ready ──────────────
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(async function (OneSignal) {
        try {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                safari_web_id: 'web.onesignal.auto.4924b4f0-134c-425c-876d-dc71d8371c02',
                // Allows testing on http://localhost without a valid SSL cert
                allowLocalhostAsSecureOrigin: true,
                // Floating bell icon — lets students opt in themselves
                notifyButton: {
                    enable: true,
                    size: 'medium',
                    theme: 'default',
                    position: 'bottom-right',
                    // Offset so it doesn't overlap the mobile bottom nav
                    offset: { bottom: '70px', right: '10px' },
                    showCredit: false,
                    text: {
                        'tip.state.unsubscribed':   'Subscribe to GERAMA alerts',
                        'tip.state.subscribed':     'Subscribed to GERAMA alerts ✓',
                        'tip.state.blocked':        'Notifications are blocked',
                        'message.prenotify':        'New updates from GERAMA!',
                        'message.action.subscribed': 'Thanks for subscribing!',
                        'message.action.resubscribed': 'You are now subscribed to GERAMA updates.',
                        'message.action.unsubscribed': 'You have unsubscribed from GERAMA updates.',
                        'dialog.main.title':        'Manage GERAMA Notifications',
                        'dialog.main.button.subscribe': 'Subscribe',
                        'dialog.main.button.unsubscribe': 'Unsubscribe',
                        'dialog.blocked.title':     'Unblock Notifications',
                        'dialog.blocked.message':   'Follow these steps to allow notifications from GERAMA.'
                    }
                },
                // Prompt the user once on first visit
                promptOptions: {
                    slidedown: {
                        prompts: [{
                            type: 'push',
                            autoPrompt: false, // We prompt explicitly after login (see geramaLinkOneSignal)
                        }]
                    }
                }
            });

            console.log('[GERAMA] OneSignal initialized');

            // ── 2. Auto-link already-authenticated users ───────────────
            // If a student has an active Supabase session when the page loads,
            // link their identity to OneSignal right away.
            _tryAutoLink();

        } catch (err) {
            console.warn('[GERAMA] OneSignal init failed:', err);
        }
    });

    // ── 3. Helper: link Supabase UUID to OneSignal ─────────────────
    // Call this right after a successful login or signup.
    // It passes the Supabase user UUID as OneSignal's External User ID,
    // which lets you target specific students when sending notifications.
    window.geramaLinkOneSignal = async function () {
        try {
            if (typeof window.geramaSupabase === 'undefined') return;

            var result = await window.geramaSupabase.auth.getSession();
            var session = result && result.data && result.data.session;
            if (!session || !session.user) return;

            var userId = session.user.id; // Supabase UUID

            // Wait for OneSignal SDK to be ready before logging in
            if (typeof window.OneSignal !== 'undefined' && window.OneSignal.login) {
                await window.OneSignal.login(userId);
                console.log('[GERAMA] OneSignal linked to user:', userId);
            } else {
                // SDK not fully loaded yet — queue for when it is
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                OneSignalDeferred.push(async function (OneSignal) {
                    try {
                        await OneSignal.login(userId);
                        console.log('[GERAMA] OneSignal linked (deferred) to user:', userId);
                    } catch (e) {
                        console.warn('[GERAMA] OneSignal deferred login failed:', e);
                    }
                });
            }
        } catch (err) {
            // Non-fatal — notifications still work, just without user targeting
            console.warn('[GERAMA] Could not link OneSignal to Supabase user:', err);
        }
    };

    // ── 4. Auto-link on page load (for already-logged-in sessions) ─
    function _tryAutoLink() {
        // Wait for Supabase client to be ready (it loads async)
        function attempt(retries) {
            if (typeof window.geramaSupabase !== 'undefined') {
                window.geramaLinkOneSignal();
            } else if (retries > 0) {
                setTimeout(function () { attempt(retries - 1); }, 300);
            }
        }
        attempt(15); // Try for ~4.5 seconds after page load
    }

})();
