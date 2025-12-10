// ======== AWS S3 library.json fetch =========
const LIBRARY_URL = 'https://originaldatum.com/musicPlayer/albums/library.json';

let allSongs = [];
let currentSongs = [];
let currentAlbum = 'all';
let currentSongIdx = 0;
let isShuffling = false;
let albumNames = [];
const audioPlayer = document.getElementById('audioPlayer');
const songList = document.getElementById('song-list');
const albumRow = document.getElementById('album-row');
const shuffleBtn = document.getElementById('shuffleBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const refreshBtn = document.getElementById('refreshBtn');

function showLoading(text = 'Loading music library...') {
  songList.innerHTML = `<div style='padding:2em;text-align:center;color:#aaa;'>${text}</div>`;
}

function showError(text) {
  songList.innerHTML = `<div style='padding:2em;text-align:center;color:#E55;'>${text}</div>`;
}

function setupLibraryFromAlbums(albums) {
  allSongs = [];
  for (const album of albums) {
    for (const track of album.tracks) {
      allSongs.push({
        name: track.title,
        album: album.name,
        url: track.url
      });
    }
  }
}

function renderAlbumOptions(songs) {
  albumNames = Array.from(new Set(songs.map(s => s.album)));
  renderAlbumRow(albumNames);
}

function renderAlbumRow(albums) {
  albumRow.innerHTML = '';
  // All Albums chip
  const allChip = document.createElement('button');
  allChip.className = 'album-chip' + (currentAlbum === 'all' ? ' selected' : '');
  allChip.textContent = 'All Albums';
  allChip.addEventListener('click', () => { updateAlbumSelection('all'); });
  albumRow.appendChild(allChip);
  // Album chips
  albums.forEach(name => {
    const chip = document.createElement('button');
    chip.className = 'album-chip' + (currentAlbum === name ? ' selected' : '');
    chip.textContent = name;
    chip.addEventListener('click', () => { updateAlbumSelection(name); });
    albumRow.appendChild(chip);
  });
}

function updateAlbumRowSelection() {
  // Update highlighting for chips
  const chips = albumRow.querySelectorAll('.album-chip');
  chips.forEach(c => {
    if ((c.textContent === 'All Albums' && currentAlbum === 'all') || (c.textContent === currentAlbum)) {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });
}

function renderSongList(songs, selectedIdx = 0) {
  songList.innerHTML = '';
  songs.forEach((song, idx) => {
    const div = document.createElement('div');
    div.className = 'song-item' + (idx === selectedIdx ? ' selected' : '');
    div.innerHTML = `<span class="song-number">${idx + 1}.</span> <span class="song-title">${song.name}</span>` ;
    div.addEventListener('click', () => selectSong(idx));
    songList.appendChild(div);
  });
  if (songs.length === 0) {
    songList.innerHTML = `<div style='padding:2em;text-align:center;color:#aaa;'>No songs found in this album.</div>`;
  }
}

function updateDisplayedSongs() {
  currentSongs = (currentAlbum === 'all')
    ? [...allSongs]
    : allSongs.filter(song => song.album === currentAlbum);
  if (isShuffling) shuffle(currentSongs);
  renderSongList(currentSongs, 0);
  currentSongIdx = 0;
  // Always set player src for iOS
  if (currentSongs[0] && currentSongs[0].url) {
    audioPlayer.src = currentSongs[0].url;
  }
  setPlayerSrcToCurrentSong();
  updateAlbumRowSelection();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function selectSong(idx) {
  currentSongIdx = idx;
  setPlayerSrcToCurrentSong();
  renderSongList(currentSongs, currentSongIdx);
  audioPlayer.play();
}

function setPlayerSrcToCurrentSong() {
  if (!currentSongs[currentSongIdx]) return;
  audioPlayer.src = currentSongs[currentSongIdx].url;
  renderSongList(currentSongs, currentSongIdx);
}

function updateAlbumSelection(albumName) {
  currentAlbum = albumName;
  updateDisplayedSongs();
}

function fetchAndLoadLibrary() {
  showLoading();
  fetch(LIBRARY_URL + '?_ts=' + Date.now())
    .then(resp => {
      if (!resp.ok) throw new Error('Could not fetch library.json');
      return resp.json();
    })
    .then(albumsData => {
      if (!albumsData || !Array.isArray(albumsData) || albumsData.length === 0) {
        showError('No music albums found in the library.');
        return;
      }
      setupLibraryFromAlbums(albumsData);
      renderAlbumOptions(allSongs);
      updateDisplayedSongs();
      // Set first song src so audio controls show on iOS
      if (allSongs[0] && allSongs[0].url) {
        audioPlayer.src = allSongs[0].url;
      }
      if (isShuffling) shuffleBtn.classList.add('active');
      else shuffleBtn.classList.remove('active');
    })
    .catch(err => {
      showError('Error loading music library: ' + err.message);
    });
}

// ========== Event Handlers ===========
shuffleBtn.addEventListener('click', () => {
  isShuffling = !isShuffling;
  if (isShuffling) {
    shuffleBtn.classList.add('active');
  } else {
    shuffleBtn.classList.remove('active');
  }
  updateDisplayedSongs();
  if (currentSongs.length > 0) {
    audioPlayer.play();
  }
});

prevBtn.addEventListener('click', () => {
  if (currentSongs.length === 0) return;
  currentSongIdx = (currentSongIdx === 0) ? currentSongs.length - 1 : currentSongIdx - 1;
  setPlayerSrcToCurrentSong();
  audioPlayer.play();
});

nextBtn.addEventListener('click', () => {
  if (currentSongs.length === 0) return;
  currentSongIdx = (currentSongIdx + 1) % currentSongs.length;
  setPlayerSrcToCurrentSong();
  audioPlayer.play();
});

audioPlayer.addEventListener('ended', () => {
  if (currentSongs.length === 0) return;
  if (currentSongIdx < currentSongs.length - 1) {
    selectSong(currentSongIdx + 1);
  } else {
    selectSong(0);
  }
});

refreshBtn.addEventListener('click', fetchAndLoadLibrary);

// ========== Initialize =============
fetchAndLoadLibrary();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
