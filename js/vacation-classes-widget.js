// ══════════════════════════════════════════════════════════════════
// GERAMA VACATION CLASSES WIDGET - Green & White Theme
// Display today's classes on homepage with GERAMA colors
// ══════════════════════════════════════════════════════════════════

(function() {
    'use strict';

    // Widget HTML template with GERAMA green colors
    const widgetHTML = `
        <div id="vacationClassesWidget" style="
            background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
            color: white;
            padding: 2.5rem;
            border-radius: 20px;
            margin: 2.5rem 0;
            box-shadow: 0 15px 50px rgba(27, 94, 32, 0.4);
            border: 3px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        ">
            <div style="position: absolute; top: -30px; right: -30px; font-size: 180px; opacity: 0.08;">🎓</div>
            
            <div style="position: relative; z-index: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="
                            background: #FFC107;
                            color: #1B5E20;
                            padding: 0.6rem 1.5rem;
                            border-radius: 50px;
                            font-weight: 900;
                            font-size: 0.95rem;
                            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        ">
                            📅 TODAY'S CLASSES
                        </div>
                    </div>
                    <a href="vacation-classes.html" style="
                        background: #FFC107;
                        color: #1B5E20;
                        padding: 0.7rem 1.8rem;
                        border-radius: 50px;
                        text-decoration: none;
                        font-size: 1rem;
                        font-weight: 800;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 25px rgba(255, 193, 7, 0.6)'" 
                       onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(255, 193, 7, 0.4)'">
                        <i class="fas fa-calendar-alt"></i> View All Classes →
                    </a>
                </div>
                
                <div id="todayClassesList" style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 1.5rem;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                ">
                    <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.9);">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <div style="font-size: 1.1rem; font-weight: 600;">Loading today's classes...</div>
                    </div>
                </div>
            </div>
        </div>
    `;

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
                    <div style="text-align: center; padding: 2.5rem; color: white;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">📚</div>
                        <div style="font-size: 1.3rem; font-weight: 800; margin-bottom: 0.5rem;">No classes today</div>
                        <div style="font-size: 1rem; opacity: 0.9;">Check back tomorrow or view the full schedule</div>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.map(classItem => {
                const startTime = formatTime(classItem.start_time);
                const endTime = formatTime(classItem.end_time);
                
                return `
                    <div style="
                        background: white;
                        color: #1B5E20;
                        padding: 1.5rem;
                        border-radius: 15px;
                        margin-bottom: 1rem;
                        border: 3px solid #1B5E20;
                        transition: all 0.3s ease;
                        cursor: pointer;
                    " onmouseover="this.style.transform='translateX(8px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.15)'" 
                       onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'"
                       onclick="window.location.href='vacation-classes.html'">
                        
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                            <div style="flex: 1;">
                                <div style="font-weight: 900; font-size: 1.4rem; margin-bottom: 0.5rem; color: #1B5E20;">
                                    ${classItem.course_name}
                                </div>
                                <div style="font-size: 1rem; color: #2E7D32; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-chalkboard-teacher"></i> ${classItem.tutor_names}
                                </div>
                            </div>
                            <div style="
                                background: linear-gradient(135deg, #1B5E20, #2E7D32);
                                color: white;
                                padding: 0.6rem 1.2rem;
                                border-radius: 50px;
                                font-size: 1rem;
                                font-weight: 800;
                                white-space: nowrap;
                                box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
                            ">
                                <i class="fas fa-clock"></i> ${startTime}
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; color: #2E7D32; font-weight: 600;">
                                <i class="fas fa-clock"></i> ${startTime} - ${endTime}
                            </div>
                            ${classItem.meeting_link ? `
                                <div style="
                                    background: #FFC107;
                                    color: #1B5E20;
                                    padding: 0.6rem 1.5rem;
                                    border-radius: 50px;
                                    font-size: 0.95rem;
                                    font-weight: 800;
                                    display: inline-flex;
                                    align-items: center;
                                    gap: 0.5rem;
                                    box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
                                    text-transform: uppercase;
                                    letter-spacing: 0.5px;
                                ">
                                    <i class="fas fa-video"></i> JOIN NOW
                                </div>
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
                    <div style="text-align: center; padding: 2rem; color: white;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                        <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;">Unable to load classes</div>
                        <div style="font-size: 0.95rem; opacity: 0.9;">Please make sure you've run the database setup scripts.</div>
                    </div>
                `;
            }
        }
    }

    function formatTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${minutes} ${ampm}`;
    }

    function initWidget() {
        // Find the announcements section
        const announcementsSection = document.querySelector('.announcements-section, #announcements-section, section.section-wrap.alt');
        
        if (announcementsSection && announcementsSection.parentNode) {
            // Insert after announcements
            announcementsSection.insertAdjacentHTML('afterend', widgetHTML);
            loadTodaysClasses();
        } else {
            // Fallback: try to find main content area
            const mainContent = document.querySelector('main, .main-content, body');
            if (mainContent) {
                // Insert after first section or at beginning
                const firstSection = mainContent.querySelector('section');
                if (firstSection) {
                    firstSection.insertAdjacentHTML('afterend', widgetHTML);
                } else {
                    mainContent.insertAdjacentHTML('afterbegin', widgetHTML);
                }
                loadTodaysClasses();
            }
        }
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
