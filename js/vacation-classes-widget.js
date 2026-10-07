// ══════════════════════════════════════════════════════════════════
// GERAMA VACATION CLASSES WIDGET
// Display today's classes on homepage/dashboard
// ══════════════════════════════════════════════════════════════════

(function() {
    'use strict';

    // Widget HTML template
    const widgetHTML = `
        <div id="vacationClassesWidget" style="
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1.5rem 0;
            box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; font-size: 1.3rem; display: flex; align-items: center; gap: 0.5rem;">
                    📅 Today's Classes
                </h3>
                <a href="vacation-classes.html" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    padding: 0.4rem 1rem;
                    border-radius: 20px;
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" 
                   onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    View All →
                </a>
            </div>
            
            <div id="todayClassesList" style="
                background: rgba(255,255,255,0.15);
                border-radius: 8px;
                padding: 1rem;
            ">
                <div style="text-align: center; padding: 1rem; color: rgba(255,255,255,0.9);">
                    Loading today's classes...
                </div>
            </div>
        </div>
    `;

    // Wait for Supabase to be available
    function waitForSupabase() {
        return new Promise((resolve) => {
            if (window.supabase && window.ENV_CONFIG) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.supabase && window.ENV_CONFIG) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    // Load and display today's classes
    async function loadTodaysClasses() {
        try {
            await waitForSupabase();

            const supabase = window.supabase.createClient(
                window.ENV_CONFIG.SUPABASE_URL,
                window.ENV_CONFIG.SUPABASE_ANON_KEY
            );

            const today = new Date().toISOString().split('T')[0];
            
            const { data, error } = await supabase
                .from('vacation_classes')
                .select('*')
                .eq('class_date', today)
                .eq('is_active', true)
                .order('start_time');

            if (error) throw error;

            const container = document.getElementById('todayClassesList');
            
            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 1.5rem; color: rgba(255,255,255,0.9);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
                        <div style="font-size: 1rem;">No classes scheduled for today</div>
                        <div style="font-size: 0.9rem; opacity: 0.8; margin-top: 0.3rem;">Check back tomorrow!</div>
                    </div>
                `;
                return;
            }

            // Display classes
            container.innerHTML = data.map(classItem => {
                const startTime = formatTime(classItem.start_time);
                const endTime = formatTime(classItem.end_time);
                const colorCode = classItem.color_code || '#6366f1';
                
                return `
                    <div style="
                        background: white;
                        color: #1e293b;
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 0.8rem;
                        border-left: 4px solid ${colorCode};
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='translateX(5px)'" 
                       onmouseout="this.style.transform='translateX(0)'">
                        
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <div style="font-weight: 700; font-size: 1.1rem; flex: 1;">
                                ${classItem.course_name}
                            </div>
                            <div style="
                                background: #e0e7ff;
                                color: #4f46e5;
                                padding: 0.2rem 0.6rem;
                                border-radius: 12px;
                                font-size: 0.8rem;
                                font-weight: 600;
                            ">
                                ${startTime}
                            </div>
                        </div>
                        
                        <div style="font-size: 0.9rem; color: #64748b; margin-bottom: 0.5rem;">
                            👨‍🏫 ${classItem.tutor_names}
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 0.85rem; color: #64748b;">
                                ⏰ ${startTime} - ${endTime}
                            </div>
                            ${classItem.meeting_link ? `
                                <a href="${classItem.meeting_link}" target="_blank" style="
                                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                                    color: white;
                                    padding: 0.4rem 1rem;
                                    border-radius: 6px;
                                    text-decoration: none;
                                    font-size: 0.85rem;
                                    font-weight: 600;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 0.3rem;
                                    transition: transform 0.2s ease;
                                " onmouseover="this.style.transform='scale(1.05)'" 
                                   onmouseout="this.style.transform='scale(1)'">
                                    🎥 Join
                                </a>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            console.error('[GERAMA Vacation Widget] Error loading classes:', error);
            const container = document.getElementById('todayClassesList');
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 1rem; color: rgba(255,255,255,0.9); font-size: 0.9rem;">
                        Unable to load classes. Please refresh the page.
                    </div>
                `;
            }
        }
    }

    // Format time helper
    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${minutes} ${ampm}`;
    }

    // Initialize widget
    function initWidget() {
        // Find insertion point (after announcements section or at start of main content)
        const announcementsSection = document.querySelector('.announcements-section');
        const mainContent = document.querySelector('main');
        
        if (announcementsSection && announcementsSection.parentNode) {
            // Insert after announcements
            announcementsSection.insertAdjacentHTML('afterend', widgetHTML);
        } else if (mainContent) {
            // Insert at start of main content
            mainContent.insertAdjacentHTML('afterbegin', widgetHTML);
        } else {
            console.warn('[GERAMA Vacation Widget] Could not find insertion point');
            return;
        }

        // Load data
        loadTodaysClasses();
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

    // Expose refresh function globally
    window.refreshVacationWidget = loadTodaysClasses;

})();
