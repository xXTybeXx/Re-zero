// script.js
let chaptersData = [];
let flatEpisodes = [];
let currentChapterId = null;

const darkModeToggle = document.getElementById('dark-mode-toggle');
const backToToc = document.getElementById('back-to-toc');
const prevBtn = document.getElementById('prev-chapter');
const nextBtn = document.getElementById('next-chapter');
const prevBtnBottom = document.getElementById('prev-chapter-bottom');
const nextBtnBottom = document.getElementById('next-chapter-bottom');
const readerTitle = document.getElementById('reader-title');
const readerContent = document.getElementById('reader-content');
const chaptersContainer = document.getElementById('chapters-container');
const totalSpan = document.getElementById('total-chapters');
const lastReadStatus = document.getElementById('last-read-status');

// ========== 다크모드 ==========
function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) darkModeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (darkModeToggle) darkModeToggle.textContent = '🌙';
    }
}
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    if (darkModeToggle) darkModeToggle.textContent = isDark ? '☀️' : '🌙';
}
if (darkModeToggle) darkModeToggle.addEventListener('click', toggleDarkMode);

// ========== 읽음 표시 ==========
function getReadIds() {
    return JSON.parse(localStorage.getItem('readChapters') || '[]');
}
function markAsRead(id) {
    let read = getReadIds();
    if (!read.includes(id)) {
        read.push(id);
        localStorage.setItem('readChapters', JSON.stringify(read));
        updateReadBadges();
        updateLastReadStatus();
    }
}
function isRead(id) {
    return getReadIds().includes(id);
}
function updateReadBadges() {
    document.querySelectorAll('.chapter-item').forEach(item => {
        const id = item.dataset.id;
        const badge = item.querySelector('.read-badge');
        if (badge) {
            badge.textContent = isRead(id) ? '✅' : '○';
            badge.classList.toggle('read', isRead(id));
        }
    });
}
function updateLastReadStatus() {
    if (!lastReadStatus) return;
    const readIds = getReadIds();
    if (readIds.length === 0) {
        lastReadStatus.textContent = '읽은 화가 없습니다';
        return;
    }
    const lastId = readIds[readIds.length - 1];
    const episode = flatEpisodes.find(ep => ep.id === lastId);
    if (episode) {
        lastReadStatus.textContent = `마지막 읽음: ${episode.title}`;
    } else {
        lastReadStatus.textContent = `마지막 읽음: ${lastId}`;
    }
}

// ========== 글자 크기 ==========
function setFontSize(size) {
    const content = document.getElementById('reader-content');
    if (content) {
        content.style.fontSize = size + 'px';
        localStorage.setItem('fontSize', size);
    }
}
function changeFontSize(delta) {
    let current = parseInt(localStorage.getItem('fontSize') || '18');
    let newSize = current + delta;
    if (newSize >= 12 && newSize <= 40) setFontSize(newSize);
}
if (document.getElementById('font-increase')) {
    document.getElementById('font-increase').addEventListener('click', () => changeFontSize(2));
    document.getElementById('font-decrease').addEventListener('click', () => changeFontSize(-2));
}

// ========== 목차 로드 ==========
async function loadChapters() {
    const res = await fetch('chapters.json');
    const data = await res.json();
    chaptersData = data.chapters;
    
    flatEpisodes = [];
    chaptersData.forEach(ch => {
        flatEpisodes.push(...ch.episodes);
    });
    
    if (totalSpan) totalSpan.textContent = flatEpisodes.length;
    renderToc();
    updateLastReadStatus();
}

function renderToc() {
    if (!chaptersContainer) return;
    chaptersContainer.innerHTML = '';
    
    chaptersData.forEach(ch => {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-group';
        
        const chapterHeader = document.createElement('div');
        chapterHeader.className = 'chapter-header';
        chapterHeader.innerHTML = `<span>📖 ${escapeHtml(ch.chapterTitle)}</span><span class="chapter-count">${ch.episodes.length}화</span>`;
        chapterHeader.addEventListener('click', () => {
            chapterDiv.classList.toggle('collapsed');
        });
        chapterDiv.appendChild(chapterHeader);
        
        const episodeList = document.createElement('div');
        episodeList.className = 'episode-list';
        ch.episodes.forEach(ep => {
            const a = document.createElement('a');
            a.href = `reader.html?id=${ep.id}`;
            a.className = 'chapter-item';
            a.dataset.id = ep.id;
            a.innerHTML = `
                <span class="chapter-title">${escapeHtml(ep.title)}</span>
                <span class="read-badge">${isRead(ep.id) ? '✅' : '○'}</span>
            `;
            episodeList.appendChild(a);
        });
        chapterDiv.appendChild(episodeList);
        chaptersContainer.appendChild(chapterDiv);
    });
    
    updateReadBadges();
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== 읽기 뷰 ==========
async function loadChapter(id) {
    if (!id) return;
    currentChapterId = id;
    const episode = flatEpisodes.find(ep => ep.id === id);
    if (!episode) {
        if (readerContent) readerContent.innerHTML = '<div class="loading">존재하지 않는 화입니다.</div>';
        if (readerTitle) readerTitle.textContent = '오류';
        return;
    }
    if (readerTitle) readerTitle.textContent = episode.title;
    if (readerContent) readerContent.innerHTML = '<div class="loading">로딩 중...</div>';
    try {
        const res = await fetch(`chapters/${episode.file}`);
        const html = await res.text();
        if (readerContent) readerContent.innerHTML = html;
        markAsRead(id);
        updateLastReadStatus();
    } catch (err) {
        if (readerContent) readerContent.innerHTML = '<div class="loading">로드 실패. 파일이 없을 수 있습니다.</div>';
    }
}

function getAdjacentChapter(currentId, direction) {
    const idx = flatEpisodes.findIndex(ep => ep.id === currentId);
    if (idx === -1) return null;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= flatEpisodes.length) return null;
    return flatEpisodes[newIdx];
}
function goPrev() {
    if (!currentChapterId) return;
    const prev = getAdjacentChapter(currentChapterId, -1);
    if (prev) {
        history.pushState(null, '', `?id=${prev.id}`);
        loadChapter(prev.id);
    }
}
function goNext() {
    if (!currentChapterId) return;
    const next = getAdjacentChapter(currentChapterId, 1);
    if (next) {
        history.pushState(null, '', `?id=${next.id}`);
        loadChapter(next.id);
    }
}

// ========== 페이지 구분 ==========
if (window.location.pathname.includes('reader.html')) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    loadChapters().then(() => {
        if (id) loadChapter(id);
        else if (flatEpisodes.length) loadChapter(flatEpisodes[0].id);
        else if (readerContent) readerContent.innerHTML = '<div class="loading">목차가 없습니다.</div>';
    });
    if (backToToc) backToToc.addEventListener('click', () => location.href = 'index.html');
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);
    if (prevBtnBottom) prevBtnBottom.addEventListener('click', goPrev);
    if (nextBtnBottom) nextBtnBottom.addEventListener('click', goNext);
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    else setFontSize(18);
} else {
    loadChapters();
}
initDarkMode();