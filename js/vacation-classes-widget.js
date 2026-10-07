// ══════════════════════════════════════════════════════════════════
// GERAMA VACATION CLASSES WIDGET
// Shows today's vacation classes on the home page (index.html)
// Uses window.geramaSupabase (shared client set by supabase-config.js)
// Falls back to static schedule if DB is unavailable
// ══════════════════════════════════════════════════════════════════
(function() {
    'use strict';

    // ── Static fallback schedule (same as vacation-classes.html) ──
    var STATIC_SCHEDULE = [
        { course_name:'Solid State',                            class_date:'2026-10-06', start_time:'19:30', end_time:'21:00', tutor_names:'zANDEROD & Perry',   meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'DC Machines & Transformers',             class_date:'2026-10-07', start_time:'19:30', end_time:'20:30', tutor_names:'Jerome & Ray',       meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Electrical Circuits Analysis & Design',  class_date:'2026-10-08', start_time:'19:30', end_time:'21:00', tutor_names:'Azakora & Priscy',   meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'MATLAB',                                 class_date:'2026-10-09', start_time:'19:30', end_time:'20:30', tutor_names:'Edem & Prophet',     meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'DC Machines & Transformers',             class_date:'2026-10-10', start_time:'19:00', end_time:'20:00', tutor_names:'Jonathan & Prophet', meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Solid State',                            class_date:'2026-10-10', start_time:'20:05', end_time:'21:00', tutor_names:'Hebert & zANDEROD',  meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Linear Algebra',                         class_date:'2026-10-11', start_time:'19:30', end_time:'21:00', tutor_names:'Joseph & John',      meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Solid State',                            class_date:'2026-10-13', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'DC Machines & Transformers',             class_date:'2026-10-14', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Electrical Circuits Analysis & Design',  class_date:'2026-10-15', start_time:'19:30', end_time:'20:30', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Electrical Measurement & Instrumentation',class_date:'2026-10-16',start_time:'19:30', end_time:'20:30', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Solid State Live Quiz',                  class_date:'2026-10-16', start_time:'21:00', end_time:'22:30', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'MATLAB',                                 class_date:'2026-10-17', start_time:'19:30', end_time:'20:30', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Linear Algebra',                         class_date:'2026-10-18', start_time:'19:00', end_time:'20:30', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Electric Circuit Design',                class_date:'2026-10-18', start_time:'20:30', end_time:'21:30', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Electrical Measurement & Instrumentation',class_date:'2026-10-19',start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'DC Machines & Transformers',             class_date:'2026-10-20', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Electrical Circuits Analysis & Design',  class_date:'2026-10-21', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'MATLAB',                                 class_date:'2026-10-22', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'Solid State Live Quiz',                  class_date:'2026-10-23', start_time:'19:30', end_time:'21:30', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'General Recap & Quizzes',                class_date:'2026-10-24', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'General Recap & Quizzes',                class_date:'2026-10-25', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
        { course_name:'General Recap & Quizzes',                class_date:'2026-10-26', start_time:'19:30', end_time:'21:00', tutor_names:'TBA',                meeting_link:'https://gerama-portal.vercel.app/classroom.html' },
    ];

    var COURSE_COLORS = {
        'Solid State':'#ef4444','Solid State Live Quiz':'#ef4444',
        'DC Machines & Transformers':'#f59e0b',
        'Electrical Circuits Analysis & Design':'#10b981','Electric Circuit Design':'#10b981',
        'MATLAB':'#3b82f6','Linear Algebra':'#8b5cf6',
        'Electrical Measurement & Instrumentation':'#f97316',
        'General Recap & Quizzes':'#6366f1'
    };
    function courseColor(name) { return COURSE_COLORS[name] || '#1B5E20'; }

    function ft(t) {
        if (!t) return '';
        var parts = t.split(':'), hr = parseInt(parts[0]);
        return (hr > 12 ? hr-12 : (hr===0?12:hr)) + ':' + parts[1] + ' ' + (hr>=12?'PM':'AM');
    }

    // Widget HTML shell injected into the page
    var widgetHTML = '<div id="vacationClassesWidget" style="background:linear-gradient(135deg,#0a2f1f 0%,#1B5E20 100%);color:white;padding:2rem;border-radius:20px;margin:2.5rem 0;box-shadow:0 15px 50px rgba(27,94,32,0.35);border:2px solid rgba(255,255,255,0.1);position:relative;overflow:hidden;">'
        + '<div style="position:absolute;top:-30px;right:-30px;font-size:160px;opacity:0.06;pointer-events:none;">🎓</div>'
        + '<div style="position:relative;z-index:1;">'
        +   '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem;flex-wrap:wrap;gap:0.8rem;">'
        +     '<div style="display:flex;align-items:center;gap:0.7rem;">'
        +       '<div style="background:#FFC107;color:#1B5E20;padding:0.35rem 0.9rem;border-radius:30px;font-weight:900;font-size:0.78rem;letter-spacing:0.5px;text-transform:uppercase;">📅 Today\'s Classes</div>'
        +     '</div>'
        +     '<a href="vacation-classes.html" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:white;padding:0.4rem 1rem;border-radius:30px;text-decoration:none;font-size:0.8rem;font-weight:700;display:inline-flex;align-items:center;gap:0.4rem;">View All <i class="fas fa-arrow-right"></i></a>'
        +   '</div>'
        +   '<div id="todayClassesList"></div>'
        + '</div>'
        + '</div>';

    function renderClasses(data) {
        var container = document.getElementById('todayClassesList');
        if (!container) return;
        if (!data || !data.length) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;opacity:0.85;">'
                + '<div style="font-size:2.5rem;margin-bottom:0.5rem;">📚</div>'
                + '<div style="font-weight:700;">No classes today</div>'
                + '<div style="font-size:0.85rem;opacity:0.8;margin-top:0.3rem;">Check the full schedule for upcoming sessions</div>'
                + '</div>';
            return;
        }
        var grid = data.length === 1
            ? 'grid-template-columns:1fr;'
            : data.length === 2
                ? 'grid-template-columns:repeat(2,1fr);'
                : 'grid-template-columns:repeat(auto-fill,minmax(240px,1fr));';

        container.innerHTML = '<div style="display:grid;' + grid + 'gap:0.9rem;">'
            + data.map(function(c) {
                var col = courseColor(c.course_name);
                return '<div style="background:white;color:#0f1f0f;border-radius:14px;padding:1rem 1.1rem;border-left:5px solid ' + col + ';cursor:pointer;transition:transform 0.2s;" '
                    + 'onmouseover="this.style.transform=\'translateY(-3px)\'" onmouseout="this.style.transform=\'translateY(0)\'" '
                    + 'onclick="window.location.href=\'vacation-classes.html\'">'
                    + '<div style="font-weight:900;font-size:0.95rem;margin-bottom:0.35rem;line-height:1.25;">' + c.course_name + '</div>'
                    + '<div style="font-size:0.76rem;color:#52735a;font-weight:600;display:flex;align-items:center;gap:0.3rem;margin-bottom:0.25rem;"><i class="fas fa-clock" style="color:' + col + ';font-size:0.68rem;"></i>' + ft(c.start_time) + ' – ' + ft(c.end_time) + '</div>'
                    + '<div style="font-size:0.76rem;color:#52735a;font-weight:600;display:flex;align-items:center;gap:0.3rem;margin-bottom:0.7rem;"><i class="fas fa-chalkboard-teacher" style="color:' + col + ';font-size:0.68rem;"></i>' + c.tutor_names + '</div>'
                    + (c.meeting_link ? '<button onclick="event.stopPropagation();window.open(\'' + c.meeting_link + '\',\'_blank\')" style="background:' + col + ';color:white;border:none;padding:0.35rem 0.9rem;border-radius:20px;font-weight:800;font-size:0.74rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.3rem;"><i class="fas fa-video"></i> Join</button>' : '')
                    + '</div>';
            }).join('')
            + '</div>';
    }

    // ── Show static data immediately, then overlay with DB ──
    function paintStaticToday() {
        var today = new Date().toISOString().split('T')[0];
        var todayItems = STATIC_SCHEDULE.filter(function(c) { return c.class_date === today; });
        renderClasses(todayItems);
    }

    function tryLoadFromDB() {
        var attempt = 0;
        function poll() {
            if (typeof window.geramaSupabase !== 'undefined') {
                window.geramaSupabase
                    .from('vacation_classes')
                    .select('*')
                    .eq('class_date', new Date().toISOString().split('T')[0])
                    .eq('is_active', true)
                    .order('start_time')
                    .then(function(res) {
                        if (!res.error && res.data) renderClasses(res.data);
                    })
                    .catch(function() { /* static already showing */ });
            } else if (attempt < 30) {
                attempt++;
                setTimeout(poll, 400);
            }
            // after 12s give up — static data is already visible
        }
        poll();
    }

    function initWidget() {
        var anchor = document.querySelector('.announcements-section, #announcements-section, section.section-wrap.alt, section.section-wrap');
        if (anchor && anchor.parentNode) {
            anchor.insertAdjacentHTML('afterend', widgetHTML);
        } else {
            var main = document.querySelector('main, .main-content, body');
            if (main) {
                var first = main.querySelector('section');
                if (first) first.insertAdjacentHTML('afterend', widgetHTML);
                else main.insertAdjacentHTML('afterbegin', widgetHTML);
            }
        }
        paintStaticToday();  // instant — no DB wait
        tryLoadFromDB();     // silent overlay with fresh DB data
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }

    window.refreshVacationWidget = tryLoadFromDB;
})();
