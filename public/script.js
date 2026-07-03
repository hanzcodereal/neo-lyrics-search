const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const resultsList = document.getElementById('resultsList');
const welcomeState = document.getElementById('welcomeState');
const loadingState = document.getElementById('loadingState');
const lyricsOverlay = document.getElementById('lyricsOverlay');

const landingPage = document.getElementById('landingPage');
const mainApp = document.getElementById('mainApp');
const enterBtn = document.getElementById('enterBtn');
const sidebarOverlay = document.getElementById('sidebarOverlay');

const searchView = document.getElementById('searchView');
const playlistView = document.getElementById('playlistView');
const playlistContainer = document.getElementById('playlistContainer');

const navSearch = document.getElementById('navSearch');
const navPlaylist = document.getElementById('navPlaylist');

const toggleFavBtn = document.getElementById('toggleFavBtn');

let currentSongData = null;

enterBtn.addEventListener('click', () => {
    landingPage.style.transition = 'transform 0.5s ease-in';
    landingPage.style.transform = 'translateY(-100%)';
    mainApp.classList.remove('hidden');
    setTimeout(() => {
        landingPage.classList.add('hidden');
    }, 500);
});

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') performSearch();
});

function toggleSidebar() {
    if (sidebarOverlay.classList.contains('hidden')) {
        sidebarOverlay.classList.remove('hidden');
    } else {
        sidebarOverlay.classList.add('hidden');
    }
}

sidebarOverlay.addEventListener('click', (e) => {
    if (e.target === sidebarOverlay) {
        toggleSidebar();
    }
});

function switchTab(tab) {
    if (tab === 'search') {
        searchView.classList.remove('hidden');
        playlistView.classList.add('hidden');
        navSearch.classList.add('active');
        navPlaylist.classList.remove('active');
    } else if (tab === 'playlist') {
        searchView.classList.add('hidden');
        playlistView.classList.remove('hidden');
        navSearch.classList.remove('active');
        navPlaylist.classList.add('active');
        renderPlaylist();
    }
}

async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    welcomeState.classList.add('hidden');
    resultsList.classList.add('hidden');
    loadingState.classList.remove('hidden');

    try {
        const res = await fetch(`/api/lyrics?title=${encodeURIComponent(query)}`);
        const data = await res.json();
        renderResults(data);
    } catch (error) {
        alert("Error fetching lyrics: " + error.message);
    } finally {
        loadingState.classList.add('hidden');
        resultsList.classList.remove('hidden');
    }
}

function renderResults(data) {
    resultsList.innerHTML = '';

    if (!data || (Array.isArray(data) && data.length === 0)) {
        resultsList.innerHTML = '<p style="text-align:center; font-family: Space Mono; font-size: 16px;">No lyrics found :(</p>';
        return;
    }

    const items = Array.isArray(data) ? data : [data];

    items.forEach(song => {
        const art = song.albumArt || 'https://placehold.co/150x150/FFD700/000000?text=lyrics';

        const el = document.createElement('div');
        el.className = 'result-item';
        
        el.innerHTML = `
            <div class="song-icon">
                <img src="${art}" alt="art" onerror="this.onerror=null; this.src='https://placehold.co/150x150/FFD700/000000?text=No+Img'">
            </div>
            <div class="song-details">
                <div class="song-title">${song.trackName || song.name || 'Unknown Title'}</div>
                <div class="song-artist">${song.artistName || 'Unknown Artist'}</div>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
        `;
        
        el.addEventListener('click', () => showLyrics(song));
        resultsList.appendChild(el);
    });
}

function showLyrics(song) {
    currentSongData = song; 

    const title = song.trackName || song.name || 'Unknown';
    const artist = song.artistName || 'Unknown';
    const lyrics = song.plainLyrics || "No plain lyrics available.";

    document.getElementById('songTitle').innerText = title;
    document.getElementById('artistName').innerText = artist;
    
    document.getElementById('lyricsContent').innerText = lyrics;
    
    updateFavoriteIconStatus();

    lyricsOverlay.classList.remove('hidden');
}

function closeLyrics() {
    lyricsOverlay.classList.add('hidden');
    currentSongData = null;
}

function generateSongId(song) {
    const title = song.trackName || song.name || '';
    const artist = song.artistName || '';
    return (title + artist).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function getPlaylist() {
    const stored = localStorage.getItem('neoLyricsPlaylist');
    return stored ? JSON.parse(stored) : [];
}

function saveToPlaylist(song) {
    const playlist = getPlaylist();
    const songId = generateSongId(song);
    
    if (!playlist.some(item => item.id === songId)) {
        const songToSave = {
            id: songId,
            trackName: song.trackName || song.name,
            artistName: song.artistName,
            albumArt: song.albumArt,
            plainLyrics: song.plainLyrics
        };
        playlist.push(songToSave);
        localStorage.setItem('neoLyricsPlaylist', JSON.stringify(playlist));
    }
}

function removeFromPlaylist(song) {
    let playlist = getPlaylist();
    const songId = generateSongId(song);
    
    playlist = playlist.filter(item => item.id !== songId);
    localStorage.setItem('neoLyricsPlaylist', JSON.stringify(playlist));
    
    if (!playlistView.classList.contains('hidden')) {
        renderPlaylist();
    }
}

function isFavorited(song) {
    if (!song) return false;
    const playlist = getPlaylist();
    const songId = generateSongId(song);
    return playlist.some(item => item.id === songId);
}

function toggleFavoriteCurrent() {
    if (!currentSongData) return;

    if (isFavorited(currentSongData)) {
        removeFromPlaylist(currentSongData);
    } else {
        saveToPlaylist(currentSongData);
    }
    updateFavoriteIconStatus();
}

function updateFavoriteIconStatus() {
    if (isFavorited(currentSongData)) {
        toggleFavBtn.classList.add('active');
        toggleFavBtn.innerHTML = '<i class="fa-solid fa-heart"></i>'; 
    } else {
        toggleFavBtn.classList.remove('active');
        toggleFavBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'; 
    }
}

function renderPlaylist() {
    const playlist = getPlaylist();
    playlistContainer.innerHTML = '';

    if (playlist.length === 0) {
        playlistContainer.innerHTML = `
            <div style="text-align:center; padding: 40px; opacity: 0.6;">
                <i class="fa-solid fa-folder-open" style="font-size: 40px; margin-bottom: 10px;"></i>
                <p style="font-family: Space Mono;">Playlist is empty.</p>
            </div>`;
        return;
    }

    playlist.forEach(song => {
        const art = song.albumArt || 'https://placehold.co/150x150/FFD700/000000?text=lyrics';

        const el = document.createElement('div');
        el.className = 'result-item';
        
        el.innerHTML = `
            <div class="song-icon" onclick="showSavedLyrics('${song.id}')">
                <img src="${art}" alt="art" onerror="this.onerror=null; this.src='https://placehold.co/150x150/FFD700/000000?text=No+Img'">
            </div>
            <div class="song-details" onclick="showSavedLyrics('${song.id}')">
                <div class="song-title">${song.trackName}</div>
                <div class="song-artist">${song.artistName}</div>
            </div>
            <div class="delete-btn" onclick="removeFromPlaylistById('${song.id}')">
                <i class="fa-solid fa-trash"></i>
            </div>
        `;
        
        playlistContainer.appendChild(el);
    });
}

window.showSavedLyrics = function(id) {
    const playlist = getPlaylist();
    const song = playlist.find(item => item.id === id);
    if (song) {
        showLyrics(song);
    }
};

window.removeFromPlaylistById = function(id) {
    let playlist = getPlaylist();
    playlist = playlist.filter(item => item.id !== id);
    localStorage.setItem('neoLyricsPlaylist', JSON.stringify(playlist));
    renderPlaylist();
};
