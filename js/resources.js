// GERAMA resources logic

// ============================================================
// GERAMA Resources Page – resources.js
// Author: Alexander O. Dwumaah
// ============================================================
// This file powers the entire Resources page:
//   1. MATERIALS DATABASE  – all files mapped by level & course
//   2. EXPLORE LOGIC       – level buttons, type tabs, rendering
//   3. SEARCH              – live filter across courses & files
//   4. DOWNLOAD / VIEW     – open GitHub raw URLs in new tab
//   5. UPLOAD FORM         – drag-drop, validation, submission
//   6. EXPLORE/UPLOAD TABS – main section switcher
// ============================================================

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 1. CONFIGURATION
// Base URL for all raw files on GitHub.
// Every file path in materialsDB is relative to this base.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const GITHUB_BASE =
  "https://raw.githubusercontent.com/alekszanderod6-pixel/gerama-portal/main/materials/";

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── SMART URL RESOLVER ────────────────────────────────────────────────────
// Transforms any Google Drive share/view URL into a direct download URL.
// Telegram and YouTube links pass through unchanged.
// Returns { downloadUrl, viewUrl, sourceType }
function resolveSmartUrl(rawUrl) {
  if(!rawUrl) return { downloadUrl:'', viewUrl:'', sourceType:'file' };

  var url = rawUrl.trim();

  // ── Google Drive ──────────────────────────────────────────────────────────
  // Handles all Drive URL formats:
  //   https://drive.google.com/file/d/{ID}/view
  //   https://drive.google.com/file/d/{ID}/edit
  //   https://drive.google.com/open?id={ID}
  //   https://docs.google.com/document/d/{ID}/...
  //   https://docs.google.com/presentation/d/{ID}/...
  //   https://docs.google.com/spreadsheets/d/{ID}/...
  //   https://drive.google.com/uc?id={ID}
  var gdriveMatch =
    url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/) ||
    url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/) ||
    url.match(/docs\.google\.com\/(?:document|presentation|spreadsheets|forms)\/d\/([a-zA-Z0-9_-]+)/);

  if(gdriveMatch) {
    var fileId = gdriveMatch[1];
    // Direct download: bypasses Drive UI entirely
    var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
    // Inline view via Google Docs Viewer (shows PDF/PPT/DOC inline)
    var viewUrl     = 'https://drive.google.com/file/d/' + fileId + '/preview';
    return { downloadUrl: downloadUrl, viewUrl: viewUrl, sourceType: 'gdrive', fileId: fileId };
  }

  // ── Telegram ──────────────────────────────────────────────────────────────
  if(url.indexOf('t.me') !== -1 || url.indexOf('telegram.me') !== -1 || url.indexOf('telegram.org') !== -1) {
    return { downloadUrl: url, viewUrl: url, sourceType: 'telegram' };
  }

  // ── YouTube ───────────────────────────────────────────────────────────────
  if(url.indexOf('youtube.com') !== -1 || url.indexOf('youtu.be') !== -1) {
    return { downloadUrl: url, viewUrl: url, sourceType: 'youtube' };
  }

  // ── Supabase / direct file URL ────────────────────────────────────────────
  var ext = url.split('?')[0].split('.').pop().toLowerCase();
  var isImage = ['jpg','jpeg','png','gif','webp'].indexOf(ext) !== -1;
  var isVideo = ext === 'mp4';
  var viewUrl2 = (isImage || isVideo) ? url : 'https://docs.google.com/viewer?url=' + encodeURIComponent(url);
  return { downloadUrl: url, viewUrl: viewUrl2, sourceType: 'file', ext: ext };
}

// Detect if a URL came from Google Drive (for rendering decisions)
function isGdriveUrl(url) {
  return url && (url.indexOf('drive.google') !== -1 || url.indexOf('docs.google') !== -1);
}

// ─────────────────────────────────────────────────────────────────────────────

// Helper: pick the right icon emoji for a file extension
function fileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (ext === "pdf")  return "📄";
  if (ext === "pptx" || ext === "ppt") return "📊";
  if (ext === "mp4")  return "🎬";
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return "🖼️";
  return "📁";
}

// ––– BOOKMARKS –––––––––––––––––––––––––––––––––––––––––––––––––––
function toggleBookmark(url, name, btn) {
  var bookmarks = JSON.parse(localStorage.getItem('gerama_bookmarks')||'[]');
  var idx = bookmarks.findIndex(function(b){ return b.url === url; });
  if(idx >= 0) {
    bookmarks.splice(idx, 1);
    if(btn){ btn.style.color='#9ca3af'; btn.style.background='none'; btn.title='Bookmark'; }
  } else {
    bookmarks.unshift({url:url, name:name, savedAt:new Date().toISOString()});
    if(btn){ btn.style.color='#1B5E20'; btn.style.background='#e8f5e9'; btn.title='Remove bookmark'; }
    // Show toast
    var toast = document.createElement('div');
    toast.textContent = '🔖 Bookmarked: '+name.substring(0,40);
    toast.style.cssText='position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:#1B5E20;color:white;padding:0.6rem 1.2rem;border-radius:30px;font-size:0.85rem;font-weight:600;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.2);white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis;';
    document.body.appendChild(toast);
    setTimeout(function(){ toast.remove(); }, 2500);
  }
  localStorage.setItem('gerama_bookmarks', JSON.stringify(bookmarks));
}

// Apply saved bookmark states after render
function applyBookmarkStates() {
  var bookmarks = JSON.parse(localStorage.getItem('gerama_bookmarks')||'[]');
  bookmarks.forEach(function(b){
    var id = 'bm-'+btoa(b.url).replace(/[^a-zA-Z0-9]/g,'').substring(0,12);
    var btn = document.getElementById(id);
    if(btn){ btn.style.color='#1B5E20'; btn.style.background='#e8f5e9'; btn.title='Remove bookmark'; }
  });
}

// ––– DOWNLOAD FILE HELPER –––––––––––––––––––––––––––––––––––––––––
// Fetches the file as a blob and triggers a real Save dialog.
// This ensures clicking Download never just opens the file –
// it always prompts the user to save it locally.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function downloadFile(url, filename) {
  // Show a brief loading indicator on the button if possible
  fetch(url)
    .then(function(response) {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(function(blob) {
      // Create a temporary anchor and trigger click to download
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || url.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    })
    .catch(function() {
      // Fallback: open in new tab if fetch fails (e.g. CORS on some files)
      window.open(url, '_blank');
    });
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 2. MATERIALS DATABASE
// Structure: materialsDB[LEVEL][COURSE] = { sem, slides, books, pastq, videos }
// sem: "1" = Semester 1, "2" = Semester 2
// Paths are relative to GITHUB_BASE and match the new folder layout:
//   materials/l100/semester-1/<course>/...
//   materials/l100/semester-2/<course>/...
//   materials/l200/semester-1/<course>/...
//   materials/l200/semester-2/<course>/...
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
const materialsDB = {

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // L100 – FIRST YEAR  (new semester-based folder layout)
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // Courses: Engineering Maths 1, Engineering Maths 2,
  //          Applied Electricity (Basic Electronics),
  //          Basic Mechanics, Intro to Computer Programming,
  //          French, African Studies
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  L100: {

    // –– Engineering Mathematics 1 ––––––––––––––––––––––––––
    // Semester 1
    "Engineering Mathematics 1": {
      sem: "1",
      slides: [],
      books:  [],
      pastq: [
        { name: "Engineering Maths 2018 Exams",            file: "l100/semester-1/engin-maths-1/passco/engin-maths-2018-exams.pdf" },
        { name: "Maths 1 Mid-Sem 2016/17/19/20/21",        file: "l100/semester-1/engin-maths-1/passco/engin-maths-midsem-2016_17-19-20-21.pdf" },
        { name: "Maths 1 Compilation (All Years)",         file: "l100/semester-1/engin-maths-1/passco/maths1-compilation.pdf" }
      ],
      videos: []
    },

    // –– Engineering Mathematics 2 ––––––––––––––––––––––––––
    // Semester 2
    "Engineering Mathematics 2": {
      sem: "2",
      slides: [],
      books:  [],
      pastq: [
        { name: "Maths 2 Mid-Semester Questions",          file: "l100/semester-2/engin-maths-2/past-questions/maths2-midsem1.pdf" }
      ],
      videos: []
    },

    // –– Applied Electricity ––––––––––––––––––––––––––––––––
    // Semester 1
    "Applied Electricity": {
      sem: "1",
      slides: [
        { name: "Applied Electricity Handout",             file: "l100/semester-1/applied-electricity/slides/applied-electricity-handout.pdf" }
      ],
      books: [
        { name: "Fundamentals of Electric Circuits",       file: "l100/semester-1/applied-electricity/books/fundamentals-of-electric-circuits.pdf" }
      ],
      pastq: [],
      videos: [
        { name: "Superposition Theorem – Example 1 (Aleks)", file: "l100/semester-1/applied-electricity/videos/superposition-theorem-applied-electricity-example1-by-aleks.mp4" },
        { name: "Superposition Theorem – Example 2 (Aleks)", file: "l100/semester-1/applied-electricity/videos/superposition-theorem-applied-electricity-example2-by-aleks.mp4" }
      ]
    },

    // –– Basic Electronics ––––––––––––––––––––––––––––––––––
    // Semester 2
    "Basic Electronics": {
      sem: "2",
      slides: [
        { name: "Diode Applications – Part 2 (Slides)",   file: "l100/semester-2/basic-electronics/slides/basic-electronics-diode-applications-part2.pptx" }
      ],
      books: [
        { name: "Basic Electronics Textbook 1",            file: "l100/semester-2/basic-electronics/books/basic-electronics1.pdf" }
      ],
      pastq: [
        { name: "Basic Electronics Exams 2020",            file: "l100/semester-2/basic-electronics/past-questions/basic-electronics-exams2020.pdf" },
        { name: "Basic Electronics Quiz 1",                file: "l100/semester-2/basic-electronics/past-questions/basic-electronics-quiz1.pdf" },
        { name: "Transistor Assignment (Aleks)",           file: "l100/semester-2/basic-electronics/past-questions/transistor_assignment@aleks_jowusu.pdf" }
      ],
      videos: []
    },

    // –– Basic Mechanics ––––––––––––––––––––––––––––––––––––
    // Semester 1
    "Basic Mechanics": {
      sem: "2",
      slides: [
        { name: "Basic Mechanics Slides (Aleks)",          file: "l100/semester-2/basic_mechanics/slides/basic_mechanics_aleks_slides.pptx" },
        { name: "Engineering Mechanics Lecture L4–L6",     file: "l100/semester-2/basic_mechanics/slides/engineering_mechanics_lecture_presentation_l4_l5_l6.pptx" }
      ],
      books: [
        { name: "Solution Manual A (Hibbeler)",            file: "l100/semester-2/basic_mechanics/books/solution_manual_A.pdf" }
      ],
      pastq: [
        { name: "Hibbeler ISM – Chapter 1",                file: "l100/semester-2/basic_mechanics/questions/95628-hibbeler_ism_01.pdf" },
        { name: "Hibbeler ISM – Chapter 4",                file: "l100/semester-2/basic_mechanics/questions/95631-hibbeler_ism_04.pdf" },
        { name: "Hibbeler ISM – Chapter 10",               file: "l100/semester-2/basic_mechanics/questions/95637-hibbeler_ism_10.pdf" },
        { name: "Hibbeler ISM – Chapter 5",                file: "l100/semester-2/basic_mechanics/questions/9789810682460_s-hibbeler_ism_05.pdf" },
        { name: "Assignment 3",                            file: "l100/semester-2/basic_mechanics/questions/assignment-3.pdf" },
        { name: "Assignment 3 & 4 Combined",               file: "l100/semester-2/basic_mechanics/questions/assignment-3and-4.pdf" },
        { name: "Assignment 4",                            file: "l100/semester-2/basic_mechanics/questions/assignment-4.pdf" },
        { name: "Trial Assignment 2",                      file: "l100/semester-2/basic_mechanics/questions/trial-assignment2.pdf" }
      ],
      videos: []
    },

    // –– Introduction to Computer Programming –––––––––––––––
    // Semester 2
    "Introduction to Computer Programming": {
      sem: "2",
      slides: [],
      books:  [],
      pastq: [
        { name: "Mid-Sem Passco 2021",                     file: "l100/semester-2/computer-programming/passco/midsem-passqo-2021.pdf" },
        { name: "Passco 2021",                             file: "l100/semester-2/computer-programming/passco/passco-2021.pdf" },
        { name: "Trial 1",                                 file: "l100/semester-2/computer-programming/passco/trial_1.pdf" },
        { name: "Past Question – Page 1",                  file: "l100/semester-2/computer-programming/passco/programming1.jpeg" },
        { name: "Past Question – Page 2",                  file: "l100/semester-2/computer-programming/passco/programming2.jpeg" },
        { name: "Past Question – Page 3",                  file: "l100/semester-2/computer-programming/passco/programming3.jpeg" },
        { name: "Past Question – Page 4",                  file: "l100/semester-2/computer-programming/passco/programming4.jpeg" },
        { name: "Past Question – Page 5",                  file: "l100/semester-2/computer-programming/passco/programming5.jpeg" },
        { name: "Past Question – Page 6",                  file: "l100/semester-2/computer-programming/passco/programming6.jpeg" },
        { name: "Past Question – Page 7",                  file: "l100/semester-2/computer-programming/passco/programming7.jpeg" },
        { name: "Past Question – Page 8",                  file: "l100/semester-2/computer-programming/passco/programming8.jpeg" },
        { name: "Past Question – Page 9",                  file: "l100/semester-2/computer-programming/passco/programming9.jpeg" },
        { name: "Past Question – Page 10",                 file: "l100/semester-2/computer-programming/passco/programming10.jpeg" },
        { name: "Past Question – Page 11",                 file: "l100/semester-2/computer-programming/passco/programming11.jpeg" },
        { name: "Past Question – Page 13",                 file: "l100/semester-2/computer-programming/passco/programming13.jpeg" },
        { name: "Past Question – Page 14",                 file: "l100/semester-2/computer-programming/passco/programming14.jpeg" },
        { name: "Past Question – Page 15",                 file: "l100/semester-2/computer-programming/passco/programming15.jpeg" },
        { name: "Past Question – Page 16",                 file: "l100/semester-2/computer-programming/passco/programming16.jpeg" },
        { name: "Past Question – Page 17",                 file: "l100/semester-2/computer-programming/passco/programming17.jpeg" },
        { name: "Past Question – Page 18",                 file: "l100/semester-2/computer-programming/passco/programming18.jpeg" },
        { name: "Past Question – Page 19",                 file: "l100/semester-2/computer-programming/passco/programming19.jpeg" },
        { name: "Past Question – Page 20",                 file: "l100/semester-2/computer-programming/passco/programming20.jpeg" },
        { name: "Past Question – Page 21",                 file: "l100/semester-2/computer-programming/passco/programming21.jpeg" },
        { name: "Past Question – Page 22",                 file: "l100/semester-2/computer-programming/passco/programming22.jpg" },
        { name: "Past Question – Page 23",                 file: "l100/semester-2/computer-programming/passco/programming23.jpg" },
        { name: "Past Question – Page 24",                 file: "l100/semester-2/computer-programming/passco/programming24.jpg" },
        { name: "Past Question – Page 25",                 file: "l100/semester-2/computer-programming/passco/programming25.jpg" },
        { name: "Past Question – Page 26",                 file: "l100/semester-2/computer-programming/passco/programming26.jpg" },
        { name: "Past Question – Page 27",                 file: "l100/semester-2/computer-programming/passco/programming27.jpg" },
        { name: "Past Question – Page 28",                 file: "l100/semester-2/computer-programming/passco/programming28.jpg" },
        { name: "Past Question – Page 29",                 file: "l100/semester-2/computer-programming/passco/programming29.jpg" },
        { name: "Past Question – Page 30",                 file: "l100/semester-2/computer-programming/passco/programming30.jpg" },
        { name: "Past Question – Page 31",                 file: "l100/semester-2/computer-programming/passco/programming31.jpg" }
      ],
      videos: []
    },

    // –– French (L100) ––––––––––––––––––––––––––––––––––––––
    "French": {
      sem: "1",
      slides: [],
      books: [
        { name: "Basic French Notes",                      file: "l100/semester-1/french/book/basic-french-notes.pdf" },
        { name: "Les Pays et Nationalités",                file: "l100/semester-1/french/book/les-pays-nationalité.pdf" },
        { name: "Passé Composé (PPT)",                     file: "l100/semester-1/french/book/passe-compose.ppt" }
      ],
      pastq:  [],
      videos: []
    },

    // –– African Studies ––––––––––––––––––––––––––––––––––––
    "African Studies": {
      sem: "2",
      slides: [
        { name: "African Studies Lecture Slides",          file: "l100/semester-2/african-studies/slides/african-studies.pdf" }
      ],
      books:  [],
      pastq:  [],
      videos: []
    }
  }, // end L100

  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // L200 – SECOND YEAR COURSES
  // Courses: Differential Equations & Applications,
  //          Digital Logic Design, Electrical Machines & Transformers,
  //          French, Linear Algebra for Engineers,
  //          Solid State Electronics
  // ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  L200: {

    // –– Differential Equations & Applications ––––––––––––––
    // Semester 1
    "Differential Equations & Applications": {
      sem: "2",
      slides: [],
      books: [
        { name: "A-Level Core Pure Maths",                 file: "l200/semester-2/differentials-equations/books-notes/a-level-core-pure-maths.pdf" },
        { name: "Engineering Mathematics – K.A. Stroud",   file: "l200/semester-2/differentials-equations/books-notes/engineering-mathematics-by-k-a-stroud.pdf" },
        { name: "Engineering Mathematics (General)",       file: "l200/semester-2/differentials-equations/books-notes/engineering-mathematics.pdf" },
        { name: "Higher Engineering Mathematics",          file: "l200/semester-2/differentials-equations/books-notes/higher-engineering-mathematics.pdf" }
      ],
      pastq: [
        { name: "Assignment 1",                            file: "l200/semester-2/differentials-equations/past-questions-or-passco/assignment1.pdf" },
        { name: "DE Question Bank (Aleks)",                file: "l200/semester-2/differentials-equations/past-questions-or-passco/de-questions-bank-by-aleks.pdf" },
        { name: "Past Question – Scan 1",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_125805.jpg" },
        { name: "Past Question – Scan 2",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130357.jpg" },
        { name: "Past Question – Scan 3",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130406.jpg" },
        { name: "Past Question – Scan 4",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130414.jpg" },
        { name: "Past Question – Scan 5",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130422.jpg" },
        { name: "Past Question – Scan 6",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130428.jpg" },
        { name: "Past Question – Scan 7",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130442.jpg" },
        { name: "Past Question – Scan 8",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130448.jpg" },
        { name: "Past Question – Scan 9",                  file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130458.jpg" },
        { name: "Past Question – Scan 10",                 file: "l200/semester-2/differentials-equations/past-questions-or-passco/img20190123_130504.jpg" },
        { name: "Past Question – Scan 11",                 file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130516.jpg" },
        { name: "Past Question – Scan 12",                 file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130523.jpg" },
        { name: "Past Question – Scan 13",                 file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130532.jpg" },
        { name: "Past Question – Scan 14",                 file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130537.jpg" },
        { name: "Past Question – Scan 15",                 file: "l200/semester-2/differentials-equations/past-questions-or-passco/img_20190123_130554.jpg" }
      ],
      videos: []
    },

    // –– Digital Logic Design –––––––––––––––––––––––––––––––
    // Semester 1
    "Digital Logic Design": {
      sem: "2",
      slides: [],
      books:  [],
      pastq:  [],
      videos: []
    },

    // –– Electrical Machines & Transformers –––––––––––––––––
    // Semester 2
    "Electrical Machines & Transformers": {
      sem: "1",
      slides: [
        { name: "DC Machines – Lecture 1",                 file: "l200/semester-1/electrical-machines-transformers/slides/lecture 1_dc-machines.pdf" },
        { name: "Transformers (Lecture Notes)",            file: "l200/semester-1/electrical-machines-transformers/slides/transformers_.pdf" },
        { name: "Transformer Tap-Changing & Auto",         file: "l200/semester-1/electrical-machines-transformers/slides/transformer_tap-changing _auto.pptx" }
      ],
      books: [
        { name: "Transformers – EEE Technology",           file: "l200/semester-1/electrical-machines-transformers/books-notes/transformers-eee-technology-electrical-and-electronic-principles.pdf" },
        { name: "32 Transformers Reference",               file: "l200/semester-1/electrical-machines-transformers/books-notes/32-transformers.pdf" }
      ],
      pastq: [
        { name: "Transformers 2020 Exams",                 file: "l200/semester-1/electrical-machines-transformers/questions/transformers-2020-exams.pdf" },
        { name: "Transformers Question Bank",              file: "l200/semester-1/electrical-machines-transformers/questions/transformers-questions-bank.pdf" },
        { name: "Exam Scan – Sheet 1",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag1619.jpg" },
        { name: "Exam Scan – Sheet 2",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag1620.jpg" },
        { name: "Exam Scan – Sheet 3",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag1622.jpg" },
        { name: "Exam Scan – Sheet 4",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag1631.jpg" },
        { name: "Exam Scan – Sheet 5",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag1632.jpg" },
        { name: "Exam Scan – Sheet 6",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag1633.jpg" },
        { name: "Exam Scan – Sheet 7",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag_20180920_122255.jpg" },
        { name: "Exam Scan – Sheet 8",                     file: "l200/semester-1/electrical-machines-transformers/questions/imag-20180912-WA0021.jpg" }
      ],
      videos: []
    },

    // –– French (L200) ––––––––––––––––––––––––––––––––––––––
    "French": {
      sem: "1",
      slides: [],
      books: [
        { name: "Passé Composé (PPT)",                     file: "l200/semester-1/french/passe-compose.ppt" }
      ],
      pastq:  [],
      videos: []
    },

    // –– Linear Algebra for Engineers –––––––––––––––––––––––
    "Linear Algebra for Engineers": {
      sem: "2",
      slides: [],
      books:  [],
      // Large collection of scanned past question pages
      pastq: [
        { name: "Algebra Assignment 1",                    file: "l200/semester-2/linear-algebra/questions/algebra-assignment1.pdf" },
        { name: "Past Question – Page 1",                  file: "l200/semester-2/linear-algebra/questions/im1.jpg" },
        { name: "Past Question – Page 2",                  file: "l200/semester-2/linear-algebra/questions/im2.jpg" },
        { name: "Past Question – Page 3",                  file: "l200/semester-2/linear-algebra/questions/im3.jpg" },
        { name: "Past Question – Page 4",                  file: "l200/semester-2/linear-algebra/questions/im4.jpg" },
        { name: "Past Question – Page 5",                  file: "l200/semester-2/linear-algebra/questions/im5.jpg" },
        { name: "Past Question – Page 6",                  file: "l200/semester-2/linear-algebra/questions/im6.jpg" },
        { name: "Past Question – Page 7",                  file: "l200/semester-2/linear-algebra/questions/im7.jpg" },
        { name: "Past Question – Page 8",                  file: "l200/semester-2/linear-algebra/questions/im8.jpg" },
        { name: "Past Question – Page 9",                  file: "l200/semester-2/linear-algebra/questions/im9.jpg" },
        { name: "Past Question – Page 10",                 file: "l200/semester-2/linear-algebra/questions/im10.jpg" },
        { name: "Past Question – Page 11",                 file: "l200/semester-2/linear-algebra/questions/im11.jpg" },
        { name: "Past Question – Page 12",                 file: "l200/semester-2/linear-algebra/questions/im12.jpg" },
        { name: "Past Question – Page 13",                 file: "l200/semester-2/linear-algebra/questions/im13.jpg" },
        { name: "Past Question – Page 14",                 file: "l200/semester-2/linear-algebra/questions/im14.jpg" },
        { name: "Past Question – Page 15",                 file: "l200/semester-2/linear-algebra/questions/im15.jpg" },
        { name: "Past Question – Page 16",                 file: "l200/semester-2/linear-algebra/questions/im16.jpg" },
        { name: "Past Question – Page 17",                 file: "l200/semester-2/linear-algebra/questions/im17.jpg" },
        { name: "Past Question – Page 18",                 file: "l200/semester-2/linear-algebra/questions/im18.jpg" },
        { name: "Past Question – Page 19",                 file: "l200/semester-2/linear-algebra/questions/im19.jpg" },
        { name: "Past Question – Page 20",                 file: "l200/semester-2/linear-algebra/questions/im20.jpg" },
        { name: "Past Question – Page 21",                 file: "l200/semester-2/linear-algebra/questions/im21.jpg" },
        { name: "Past Question – Page 22",                 file: "l200/semester-2/linear-algebra/questions/im22.jpg" },
        { name: "Past Question – Page 23",                 file: "l200/semester-2/linear-algebra/questions/im23.jpg" },
        { name: "Past Question – Page 24",                 file: "l200/semester-2/linear-algebra/questions/im24.jpg" },
        { name: "Past Question – Page 25",                 file: "l200/semester-2/linear-algebra/questions/im25.jpg" },
        { name: "Past Question – Page 26",                 file: "l200/semester-2/linear-algebra/questions/im26.jpg" },
        { name: "Past Question – Page 27",                 file: "l200/semester-2/linear-algebra/questions/im27.jpg" },
        { name: "Past Question – Page 28",                 file: "l200/semester-2/linear-algebra/questions/im28.jpg" },
        { name: "Past Question – Page 29",                 file: "l200/semester-2/linear-algebra/questions/im29.jpg" },
        { name: "Past Question – Page 30",                 file: "l200/semester-2/linear-algebra/questions/im30.jpg" },
        { name: "Past Question – Page 31",                 file: "l200/semester-2/linear-algebra/questions/im31.jpg" },
        { name: "Past Question – Page 32",                 file: "l200/semester-2/linear-algebra/questions/im32.jpg" },
        { name: "Past Question – Page 33",                 file: "l200/semester-2/linear-algebra/questions/im33.jpg" },
        { name: "Past Question – Page 34",                 file: "l200/semester-2/linear-algebra/questions/im34.jpg" },
        { name: "Past Question – Page 35",                 file: "l200/semester-2/linear-algebra/questions/im35.jpg" },
        { name: "Past Question – Page 36",                 file: "l200/semester-2/linear-algebra/questions/im36.jpg" },
        { name: "Past Question – Page 37",                 file: "l200/semester-2/linear-algebra/questions/im37.jpg" },
        { name: "Past Question – Page 38",                 file: "l200/semester-2/linear-algebra/questions/im38.jpg" },
        { name: "Past Question – Page 39",                 file: "l200/semester-2/linear-algebra/questions/im39.jpg" },
        { name: "Past Question – Page 40",                 file: "l200/semester-2/linear-algebra/questions/im40.jpg" },
        { name: "Past Question – Page 41",                 file: "l200/semester-2/linear-algebra/questions/im41.jpg" },
        { name: "Past Question – Page 42",                 file: "l200/semester-2/linear-algebra/questions/im42.jpg" },
        { name: "Past Question – Page 43",                 file: "l200/semester-2/linear-algebra/questions/im43.jpg" },
        { name: "Past Question – Page 44",                 file: "l200/semester-2/linear-algebra/questions/im44.jpg" },
        { name: "Past Question – Page 45",                 file: "l200/semester-2/linear-algebra/questions/im45.jpg" },
        { name: "Past Question – Page 46",                 file: "l200/semester-2/linear-algebra/questions/im46.jpg" },
        { name: "Past Question – Page 47",                 file: "l200/semester-2/linear-algebra/questions/im47.jpg" }
      ],
      videos: []
    },

    // –– Solid State Electronics ––––––––––––––––––––––––––––
    "Solid State Electronics": {
      sem: "1",
      slides: [
        { name: "Introduction to Solid State Electronics",       file: "l200/semester-1/solid-state-electronics/slides/introduction-01.pptx" },
        { name: "Lect 1 – Fundamentals of Semiconductors",       file: "l200/semester-1/solid-state-electronics/slides/lect1-fundamentals-of-semiconductors.pptx" },
        { name: "Lect 2 – Fundamentals of Semiconductors",       file: "l200/semester-1/solid-state-electronics/slides/lect2-fundamentals of semiconductors.pptx" },
        { name: "Lect 3 – Carrier Flow",                         file: "l200/semester-1/solid-state-electronics/slides/lect3-carrier-flow.pptx" },
        { name: "Lect 4 – PN Junction",                          file: "l200/semester-1/solid-state-electronics/slides/lect4-pnjunction.pptx" },
        { name: "Lect 5 – PN Junction (cont.)",                  file: "l200/semester-1/solid-state-electronics/slides/lect5-pn-junction.pptx" },
        { name: "Lect 6 – Metal-Semiconductor Junction",         file: "l200/semester-1/solid-state-electronics/slides/lect6-metal-semiconductor-junction.pptx" }
      ],
      books: [
        { name: "Solid State Electronic Devices – 6th Ed.",      file: "l200/semester-1/solid-state-electronics/books/solid-state-electronic-devices-6th-edition.pdf" }
      ],
      pastq: [
        { name: "Solid State Exams 2021",                        file: "l200/semester-1/solid-state-electronics/passco/solid-state-exams-2021.pdf" },
        { name: "Solid State Mid-Sem 2021",                      file: "l200/semester-1/solid-state-electronics/passco/solid-state-misdsem-2021.pdf" },
        { name: "Solid State Questions Bank",                    file: "l200/semester-1/solid-state-electronics/passco/solid-state-questions.pdf" },
        { name: "Exam Scan – Sheet 1",                           file: "l200/semester-1/solid-state-electronics/passco/img_20180920_121523.jpg" },
        { name: "Exam Scan – Sheet 2",                           file: "l200/semester-1/solid-state-electronics/passco/img_20180920_121639.jpg" },
        { name: "Exam Scan – Sheet 3",                           file: "l200/semester-1/solid-state-electronics/passco/img_20180920_122101.jpg" },
        { name: "Exam Scan – Sheet 4",                           file: "l200/semester-1/solid-state-electronics/passco/img_20180920_122201.jpg" },
        { name: "Exam Scan – Sheet 5",                           file: "l200/semester-1/solid-state-electronics/passco/img_20180920_122224.jpg" },
        { name: "Exam Scan – Sheet 6",                           file: "l200/semester-1/solid-state-electronics/passco/img-20151103-WA0002.jpg" },
        { name: "Exam Scan – Sheet 7",                           file: "l200/semester-1/solid-state-electronics/passco/img-20180912-WA0015.jpg" },
        { name: "Exam Scan – Sheet 8",                           file: "l200/semester-1/solid-state-electronics/passco/img-20180912-WA0016.jpg" },
        { name: "Exam Scan – Sheet 9",                           file: "l200/semester-1/solid-state-electronics/passco/img-20180912-WA0017.jpg" },
        { name: "Exam Scan – Sheet 10",                          file: "l200/semester-1/solid-state-electronics/passco/img-20180912-WA0018.jpg" }
      ],
      videos: []
    }
  }, // end L200

  // L300 and L400 – placeholder, materials to be added
  L300: {},
  L400: {}

}; // end materialsDB

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 3. STATE VARIABLES
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
let currentLevel   = null;
let currentType    = "slides";
let currentSem     = "all";   // "all" | "1" | "2"
let currentCourses = {};

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 4. RENDER COURSES
// Builds course cards for the selected level + type.
// Each card shows the course name and lists all materials
// under it with Download and View buttons on the right.
// Courses with zero items for the current type are hidden.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function renderCourses(filterText) {
  const container = document.getElementById("coursesContainer");
  if (!container) return;

  const query = (filterText || "").toLowerCase().trim();
  const courseNames = Object.keys(currentCourses);

  let visibleCount = 0;
  let html = "";

  courseNames.forEach(function(courseName) {
    const courseData = currentCourses[courseName];

    // –– SEMESTER FILTER ––
    // Each course has a `sem` property: "1", "2", or undefined (both).
    // If the user picked Sem 1 or Sem 2, skip courses that don't match.
    if (currentSem !== "all") {
      const courseSem = courseData && courseData.sem;
      // If the course has a semester assigned and it doesn't match, skip it
      if (courseSem && courseSem !== currentSem) return;
    }

    const materials  = (courseData && courseData[currentType]) || [];

    // Filter by search query – match course name OR any material name
    const courseMatch = courseName.toLowerCase().includes(query);
    const filteredMaterials = query
      ? materials.filter(function(m) {
          return m.name.toLowerCase().includes(query) || courseMatch;
        })
      : materials;

    // Skip courses with no materials for this type after filtering
    if (filteredMaterials.length === 0) return;
    visibleCount++;

    // Build the rows for each material in this course
    const rowsHtml = filteredMaterials.map(function(m) {
      // Supabase-uploaded materials have a direct URL; static ones use GITHUB_BASE + file path
      const rawUrl = m.supabase
        ? m.url
        : GITHUB_BASE + encodeURIComponent(m.file).replace(/%2F/g, '/');

      const icon     = m.supabase ? fileIcon(m.name) : fileIcon(m.file);
      var safeName   = escapeHtml(m.name);
      var safeDesc   = m.description ? escapeHtml(m.description) : '';

      // ── Resolve smart URLs ──────────────────────────────────────────────
      var resolved   = resolveSmartUrl(rawUrl);
      var dlUrl      = resolved.downloadUrl;
      var viewUrl    = resolved.viewUrl;
      var srcType    = resolved.sourceType;
      var isExternal = (srcType === 'gdrive' || srcType === 'telegram' || srcType === 'youtube');

      // ── Build action buttons ────────────────────────────────────────────
      var actionHtml = '';

      if(srcType === 'youtube'){
        actionHtml =
          '<a class="btn-dl download video-watch" href="' + escapeHtml(dlUrl) + '" target="_blank" rel="noopener noreferrer" ' +
            'style="background:linear-gradient(135deg,#dc2626,#ef4444);text-decoration:none;">' +
            '<i class="fab fa-youtube"></i> Watch</a>';

      } else if(srcType === 'telegram'){
        // Telegram: one "Open" button – fetches directly, no Drive redirect
        actionHtml =
          '<a class="btn-dl download" href="' + escapeHtml(dlUrl) + '" target="_blank" rel="noopener noreferrer" ' +
            'style="background:linear-gradient(135deg,#0088cc,#2196F3);text-decoration:none;" ' +
            'title="Open file">' +
            '<i class="fas fa-file-arrow-down"></i> Download</a>' +
          '<a class="btn-dl view" href="' + escapeHtml(dlUrl) + '" target="_blank" rel="noopener noreferrer" ' +
            'style="text-decoration:none;" title="View file">' +
            '<i class="fas fa-eye"></i> View</a>';

      } else if(srcType === 'gdrive'){
        // Google Drive: Download goes to direct uc?export=download, View shows inline preview
        actionHtml =
          '<a class="btn-dl download" href="' + escapeHtml(dlUrl) + '" target="_blank" rel="noopener noreferrer" ' +
            'style="background:linear-gradient(135deg,#1B5E20,#2E7D32);text-decoration:none;" ' +
            'title="Download file directly">' +
            '<i class="fas fa-file-arrow-down"></i> Download</a>' +
          '<a class="btn-dl view" href="' + escapeHtml(viewUrl) + '" target="_blank" rel="noopener noreferrer" ' +
            'style="text-decoration:none;" title="Preview file">' +
            '<i class="fas fa-eye"></i> View</a>';

      } else {
        // Regular file (Supabase storage or GitHub) – local blob download + Docs Viewer
        var isVideo = srcType === 'file' && (resolved.ext === 'mp4' || (currentType === 'videos' && m.supabase));
        if(isVideo){
          actionHtml =
            '<a class="btn-dl download video-watch" href="' + escapeHtml(dlUrl) + '" target="_blank" rel="noopener noreferrer" ' +
              'style="background:linear-gradient(135deg,#7c3aed,#2563eb);text-decoration:none;">' +
              '<i class="fas fa-play-circle"></i> Play</a>';
        } else {
          actionHtml =
            '<button class="btn-dl download" onclick="downloadFile(\'' + dlUrl.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\',\'' + m.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\')">' +
              '<i class="fas fa-file-arrow-down"></i> Download</button>' +
            '<a class="btn-dl view" href="' + escapeHtml(viewUrl) + '" target="_blank" rel="noopener noreferrer">' +
              '<i class="fas fa-eye"></i> View</a>';
        }
      }

      // Bookmark id — use a safe hash of the URL
      var bmId = 'bm-' + btoa(unescape(encodeURIComponent(rawUrl))).replace(/[^a-zA-Z0-9]/g,'').substring(0,12);

      // Source badge — only shown as a tiny subtle tag, NOT the raw URL
      var srcBadge = '';
      if(srcType === 'gdrive')   srcBadge = '<span class="mat-src-badge gdrive"><i class="fab fa-google-drive"></i></span>';
      if(srcType === 'telegram') srcBadge = '<span class="mat-src-badge tg"><i class="fab fa-telegram"></i></span>';

      return (
        '<div class="material-row' + (currentType === 'videos' ? ' video-material-row' : '') + '">' +
          '<div class="material-info">' +
            '<span class="material-icon">' + icon + '</span>' +
            '<span class="material-copy">' +
              '<span class="material-name">' + safeName + srcBadge + '</span>' +
              (safeDesc ? '<span class="material-desc">' + safeDesc + '</span>' : '') +
            '</span>' +
          '</div>' +
          '<div class="material-actions">' +
            actionHtml +
            '<button class="btn-dl" id="' + bmId + '" onclick="toggleBookmark(\'' + rawUrl.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\',\'' + m.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + '\',this)" style="background:none;border:1px solid #e5e7eb;color:#9ca3af;padding:0.4rem 0.6rem;" title="Bookmark">' +
              '<i class="fas fa-bookmark"></i>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    // Build the collapsible course card
    const safeId = "course-" + courseName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
    html +=
      '<div class="course-card" id="' + safeId + '">' +
        '<div class="course-header" onclick="toggleCourse(this)">' +
          '<span class="course-title">' +
            '<i class="fas fa-book-open"></i> ' + courseName +
          '</span>' +
          '<span style="display:flex;align-items:center;gap:0.6rem;">' +
            '<span class="badge">' + filteredMaterials.length + ' file' + (filteredMaterials.length !== 1 ? 's' : '') + '</span>' +
            '<i class="fas fa-chevron-down chevron"></i>' +
          '</span>' +
        '</div>' +
        // Materials list – open by default so user sees content immediately
        '<div class="course-materials show">' +
          rowsHtml +
        '</div>' +
      '</div>';
  });

  // Show empty state if nothing matched
  if (visibleCount === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<i class="fas fa-folder-open"></i>' +
        '<p>' + (query ? 'No results for "' + filterText + '".' : 'No materials available for this category yet.') + '</p>' +
      '</div>';
    return;
  }

  container.innerHTML = html;
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 5. TOGGLE COURSE CARD (accordion)
// Called when the user clicks a course header.
// Rotates the chevron and shows/hides the materials list.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function toggleCourse(headerEl) {
  const body = headerEl.nextElementSibling; // .course-materials
  const isOpen = body.classList.contains("show");
  body.classList.toggle("show", !isOpen);
  headerEl.classList.toggle("open", !isOpen);
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 6. LOAD LEVEL
// Called when the user clicks a level button.
// Loads static DB courses, then merges in any admin-uploaded
// materials from Supabase (if connected) so they appear live.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function loadLevel(level) {
  currentLevel   = level;
  currentCourses = JSON.parse(JSON.stringify(materialsDB[level] || {})); // deep copy

  // Show the materials area, hide the "pick a level" prompt
  document.getElementById("materialsArea").style.display = "block";
  document.getElementById("noLevelMsg").style.display    = "none";

  // Clear search input when switching levels
  const searchInput = document.getElementById("courseSearchInput");
  if (searchInput) searchInput.value = "";

  // Render static materials immediately
  renderCourses("");

  // Then fetch admin-uploaded materials from Supabase and merge them in
  fetchSupabaseMaterials(level);
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// FETCH SUPABASE MATERIALS
// Queries the "materials" table for approved entries at this level.
// Merges them into currentCourses so they appear alongside the
// static GitHub materials – no page reload needed.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function fetchSupabaseMaterials(level) {
  var sb = window.geramaSupabase;
  if (!sb) return; // Supabase not loaded – static DB only

  sb.from('materials')
    .select('*')
    .eq('level', level)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .then(function(result) {
      if (result.error || !result.data || !result.data.length) return;

      result.data.forEach(function(row) {
        var course = row.course;
        var type   = row.type;   // slides | books | pastq | videos
        var sem    = String(row.semester || '');

        // Create course entry if it doesn't exist yet
        if (!currentCourses[course]) {
          currentCourses[course] = { sem: sem, slides: [], books: [], pastq: [], videos: [] };
        }
        if (!currentCourses[course][type]) {
          currentCourses[course][type] = [];
        }

        // Add the material – use file_url or telegram_url directly
        // Mark it so renderCourses knows to use the URL as-is (not prepend GITHUB_BASE)
        var matUrl = row.file_url || row.telegram_url || row.gdrive_url || '';
        // If this is a telegram-type entry, prefer telegram_url
        if (row.source_type === 'telegram' || row.type_source === 'telegram') {
          matUrl = row.telegram_url || row.file_url || '';
        } else if (row.source_type === 'gdrive') {
          matUrl = row.file_url || row.gdrive_url || '';
        }
        currentCourses[course][type].push({
          name:    row.name,
          description: row.description || '',
          file:    null,
          url:     matUrl,
          supabase: true
        });
      });

      // Re-render with the merged data
      var q = document.getElementById("courseSearchInput");
      renderCourses(q ? q.value : "");
    })
    .catch(function() { /* silent fail – static DB still works */ });
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 7. EVENT LISTENERS – set up after DOM is ready
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
document.addEventListener("DOMContentLoaded", function () {

  // –– Level buttons ––––––––––––––––––––––––––––––––––––––
  document.querySelectorAll(".level-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      // Remove active from all, add to clicked
      document.querySelectorAll(".level-btn").forEach(function(b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      loadLevel(btn.dataset.level);
    });
  });

  // –– Type tabs (Slides / Books / Past Q / Videos) –––––––
  document.querySelectorAll(".type-tab").forEach(function(tab) {
    tab.addEventListener("click", function() {
      document.querySelectorAll(".type-tab").forEach(function(t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      currentType = tab.dataset.type;
      // Re-render with current search text
      const q = document.getElementById("courseSearchInput");
      renderCourses(q ? q.value : "");
    });
  });

  // –– Semester tabs (All / Sem 1 / Sem 2) –––––––––––––––
  document.querySelectorAll(".sem-tab").forEach(function(tab) {
    tab.addEventListener("click", function() {
      document.querySelectorAll(".sem-tab").forEach(function(t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      currentSem = tab.dataset.sem; // "all", "1", or "2"
      const q = document.getElementById("courseSearchInput");
      renderCourses(q ? q.value : "");
    });
  });

  // –– Live search input ––––––––––––––––––––––––––––––––––
  // Filters course cards and material rows in real time
  const searchInput = document.getElementById("courseSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      if (currentLevel) renderCourses(this.value);
    });
  }

  // –– Main section switcher: Explore – Videos – Software – Upload ––
  const exploreBtn     = document.getElementById("exploreMainBtn");
  const videosBtn      = document.getElementById("videosMainBtn");
  const softwareBtn    = document.getElementById("softwareMainBtn");
  const uploadBtn      = document.getElementById("uploadMainBtn");
  const exploreSection  = document.getElementById("exploreSection");
  const videosSection   = document.getElementById("videosSection");
  const softwareSection = document.getElementById("softwareSection");
  const uploadSection   = document.getElementById("uploadSection");

  function showSection(active) {
    // hide all
    [exploreSection, videosSection, softwareSection, uploadSection].forEach(function(s){ if(s) s.style.display = "none"; });
    [exploreBtn, videosBtn, softwareBtn, uploadBtn].forEach(function(b){ if(b) b.classList.remove("active"); });
    // show chosen
    if (active === "explore")  { if(exploreSection)  exploreSection.style.display  = "block"; if(exploreBtn)  exploreBtn.classList.add("active"); }
    if (active === "videos")   { if(videosSection)   videosSection.style.display   = "block"; if(videosBtn)   videosBtn.classList.add("active"); loadVideosByLevel('all'); }
    if (active === "software") { if(softwareSection) softwareSection.style.display = "block"; if(softwareBtn) softwareBtn.classList.add("active"); loadAdminSoftware(); }
    if (active === "upload")   { if(uploadSection)   uploadSection.style.display   = "block"; if(uploadBtn)   uploadBtn.classList.add("active"); }
  }

  if(exploreBtn)  exploreBtn.addEventListener("click",  function() { showSection("explore"); });
  if(videosBtn)   videosBtn.addEventListener("click",   function() { showSection("videos"); });
  if(softwareBtn) softwareBtn.addEventListener("click", function() { showSection("software"); });
  if(uploadBtn)   uploadBtn.addEventListener("click",   function() { showSection("upload"); });

  // –– File drop zone –––––––––––––––––––––––––––––––––––––
  // Clicking the zone opens the hidden file input
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("upFile");
  const fileNameDisplay = document.getElementById("fileNameDisplay");

  if (dropZone && fileInput) {
    // Click to browse
    dropZone.addEventListener("click", function() { fileInput.click(); });

    // Show selected file name
    fileInput.addEventListener("change", function() {
      if (this.files[0]) {
        fileNameDisplay.textContent = "– " + this.files[0].name;
        dropZone.classList.add("drag-over");
      }
    });

    // Drag-and-drop support
    dropZone.addEventListener("dragover", function(e) {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", function() {
      if (!fileInput.files[0]) dropZone.classList.remove("drag-over");
    });
    dropZone.addEventListener("drop", function(e) {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        // Transfer dropped file to the hidden input via DataTransfer
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileNameDisplay.textContent = "– " + file.name;
        dropZone.classList.add("drag-over");
      }
    });
  }

  // –– Upload form submission –––––––––––––––––––––––––––––
  const uploadForm = document.getElementById("uploadForm");
  if (uploadForm) {
    uploadForm.addEventListener("submit", function(e) {
      e.preventDefault();

      // Basic validation
      const name   = document.getElementById("upName").value.trim();
      const email  = document.getElementById("upEmail").value.trim();
      const level  = document.getElementById("upLevel").value;
      const course = document.getElementById("upCourse").value.trim();
      const type   = document.getElementById("upType").value;
      const file   = document.getElementById("upFile").files[0];

      if (!name || !email || !level || !course || !type || !file) {
        alert("Please fill in all required fields and select a file.");
        return;
      }

      // File size check – 50 MB limit
      if (file.size > 50 * 1024 * 1024) {
        alert("File is too large. Maximum allowed size is 50 MB.");
        return;
      }

      // Store submission locally (can be extended to send to Supabase/email)
      const submissions = JSON.parse(localStorage.getItem("gerama_uploads") || "[]");
      submissions.push({
        name, email, level, course, type,
        fileName: file.name,
        submittedAt: new Date().toISOString()
      });
      localStorage.setItem("gerama_uploads", JSON.stringify(submissions));

      // Show success state
      uploadForm.style.display = "none";
      document.getElementById("uploadSuccess").style.display = "block";
    });
  }

}); // end DOMContentLoaded

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 8. RESET UPLOAD FORM
// Called by the "Submit Another" button in the success state.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
function resetUploadForm() {
  const uploadForm = document.getElementById("uploadForm");
  const successBox = document.getElementById("uploadSuccess");
  const dropZone   = document.getElementById("dropZone");
  const fileNameDisplay = document.getElementById("fileNameDisplay");

  uploadForm.reset();
  uploadForm.style.display = "block";
  successBox.style.display = "none";
  if (dropZone) dropZone.classList.remove("drag-over");
  if (fileNameDisplay) fileNameDisplay.textContent = "";
}

// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
// 9. LOAD ADMIN-UPLOADED SOFTWARE
// Fetches software entries from Supabase "software" table
// (type = "file" for direct uploads, type = "telegram" for links)
// and renders them in the #adminSoftwareGrid container.
// –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
var _adminSoftwareLoaded = false;

function loadAdminSoftware() {
  if (_adminSoftwareLoaded) return; // only fetch once per session
  var grid = document.getElementById("adminSoftwareGrid");
  if (!grid) return;

  var sb = window.geramaSupabase;
  if (!sb) return;

  sb.from('software')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .then(function(result) {
      if (result.error || !result.data || !result.data.length) return;
      _adminSoftwareLoaded = true;

      // Heading for admin-uploaded section
      var html = '<div style="margin-bottom:1.2rem;margin-top:2.5rem;">' +
        '<h3 style="font-size:1.05rem;font-weight:800;color:#1e2a3e;margin-bottom:0.3rem;">' +
        '<i class="fas fa-cloud-download-alt" style="color:#1B5E20;margin-right:0.5rem;"></i>Admin-Uploaded Software</h3>' +
        '<p style="font-size:0.82rem;color:#6b7280;margin:0;">Additional software uploaded directly by GERAMA admin.</p></div>';

      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;">';

      result.data.forEach(function(sw) {
        var isTelegram = sw.type === 'telegram';
        var btnHref    = sw.file_url || sw.telegram_url || '#';
        var btnLabel   = isTelegram ? '<i class="fab fa-telegram"></i> Get on Telegram' : '<i class="fas fa-download"></i> Download';
        var btnStyle   = isTelegram
          ? 'background:linear-gradient(135deg,#0088cc,#006aaa);'
          : 'background:linear-gradient(135deg,#1B5E20,#2E7D32);';
        var isZip = sw.is_zipped ? '<span style="background:#fef3c7;color:#92400e;font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:10px;margin-left:0.4rem;"><i class="fas fa-file-archive"></i> ZIP</span>' : '';

        html +=
          '<div class="sw-card">' +
            '<div class="sw-card-header">' +
              '<div class="sw-icon" style="background:linear-gradient(135deg,#1B5E20,#2E7D32);">' +
                '<i class="fas fa-laptop-code"></i>' +
              '</div>' +
              '<div>' +
                '<h3 class="sw-name">' + (sw.name || 'Software') + isZip + '</h3>' +
                '<span class="sw-badge">' + (sw.category || 'Engineering Tool') + '</span>' +
              '</div>' +
            '</div>' +
            (sw.description ? '<p class="sw-desc">' + sw.description + '</p>' : '') +
            (sw.why ? '<div class="sw-why"><i class="fas fa-lightbulb"></i><span>' + sw.why + '</span></div>' : '') +
            '<div class="sw-actions">' +
              '<a href="' + btnHref + '" target="_blank" rel="noopener" class="sw-btn-dl" style="' + btnStyle + 'color:white;">' + btnLabel + '</a>' +
              (sw.file_size ? '<span class="sw-size"><i class="fas fa-file"></i> ' + sw.file_size + '</span>' : '') +
            '</div>' +
          '</div>';
      });

      html += '</div>';
      grid.innerHTML = html;
    })
    .catch(function() { /* silent – no admin software yet */ });
}

function loadVideosByLevel(level) {
  var container = document.getElementById('videosContainer');
  if (!container) return;

  document.querySelectorAll('.level-btn').forEach(function(btn) {
    btn.classList.remove('active');
    if (btn.dataset.level === level) btn.classList.add('active');
  });

  container.innerHTML = '<div style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#6b7280;"></i><p style="color:#6b7280;margin-top:1rem;">Loading videos...</p></div>';

  var sb = window.geramaSupabase;
  var allVideos = [];

  var staticVideos = [
    { course: 'Applied Electricity', name: 'Kirchhoff\'s Laws Explained', url: 'https://www.youtube.com/watch?v=example1', level: 'L200', description: 'Understanding KVL and KCL' },
    { course: 'Digital Logic', name: 'Logic Gates Tutorial', url: 'https://www.youtube.com/watch?v=example2', level: 'L200', description: 'AND, OR, NOT gates basics' },
    { course: 'Circuit Analysis', name: 'Thevenin\'s Theorem', url: 'https://www.youtube.com/watch?v=example3', level: 'L300', description: 'Simplify complex circuits' }
  ];

  if (sb) {
    var query = sb.from('materials').select('*').eq('source_type', 'video');
    if (level !== 'all') {
      query = query.eq('level', level);
    }
    query.then(function(result) {
      if (!result.error && result.data) {
        result.data.forEach(function(mat) {
          allVideos.push({
            course: mat.course,
            name: mat.name,
            url: mat.file_url,
            description: mat.description || '',
            source: 'supabase',
            source_type: mat.source_type
          });
        });
      }
      renderVideos(allVideos.length > 0 ? allVideos : staticVideos.filter(function(v) { return level === 'all' || v.level === level; }), container);
    })
    .catch(function() {
      renderVideos(staticVideos.filter(function(v) { return level === 'all' || v.level === level; }), container);
    });
  } else {
    renderVideos(staticVideos.filter(function(v) { return level === 'all' || v.level === level; }), container);
  }
}

function renderVideos(videos, container) {
  if (!videos || videos.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-video"></i><p>No video tutorials found for this level.</p></div>';
    return;
  }

  var grouped = {};
  videos.forEach(function(vid) {
    if (!grouped[vid.course]) {
      grouped[vid.course] = [];
    }
    grouped[vid.course].push(vid);
  });

  var html = '';
  Object.keys(grouped).forEach(function(course) {
    var courseVideos = grouped[course];
    html += '<div class="course-card">' +
      '<div class="course-header" onclick="this.parentElement.querySelector(\'.course-materials\').classList.toggle(\'show\'); this.classList.toggle(\'open\');">' +
        '<span style="font-weight:700;">' + escapeHtml(course) + '</span>' +
        '<span style="background:#fee2e2;color:#dc2626;font-size:0.72rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:20px;">' + courseVideos.length + ' videos</span>' +
        '<i class="fas fa-chevron-down chevron"></i>' +
      '</div>' +
      '<div class="course-materials">';

    courseVideos.forEach(function(vid) {
      var safeName = escapeHtml(vid.name);
      var safeDesc = vid.description ? escapeHtml(vid.description) : '';
      var videoUrl = vid.url || (vid.file ? GITHUB_BASE + vid.file : '#');
      var isYoutube = videoUrl.indexOf('youtube.com') !== -1 || videoUrl.indexOf('youtu.be') !== -1;

      html += '<div class="material-row video-material-row">' +
        '<div class="material-info">' +
          '<span class="material-icon"><i class="fas fa-play-circle"></i></span>' +
          '<span class="material-copy">' +
            '<span class="material-name">' + safeName + '</span>' +
            (safeDesc ? '<span class="material-desc">' + safeDesc + '</span>' : '') +
          '</span>' +
        '</div>' +
        '<div class="material-actions">' +
          (isYoutube
            ? '<a class="btn-dl download video-watch" href="' + videoUrl + '" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#dc2626,#ef4444);text-decoration:none;"><i class="fab fa-youtube"></i> Watch</a>'
            : '<a class="btn-dl download video-watch" href="' + videoUrl + '" target="_blank" rel="noopener" style="background:linear-gradient(135deg,#7c3aed,#2563eb);text-decoration:none;"><i class="fas fa-play-circle"></i> Open Tutorial</a>'
          ) +
        '</div>' +
      '</div>';
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}
