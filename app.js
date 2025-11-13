// ======== AWS S3 library.json fetch =========
const LIBRARY_URL = 'http://caprice.carstensen.s3-website-us-west-2.amazonaws.com/musicPlayer/albums/library.json';

let allSongs = [];
let currentSongs = [];
let currentAlbum = 'all';
let currentSongIdx = 0;
let isShuffling = false;
const audioPlayer = document.getElementById('audioPlayer');
const songList = document.getElementById('song-list');
const albumSelector = document.getElementById('albumSelector');
const shuffleBtn = document.getElementById('shuffleBtn');

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
  const albums = Array.from(new Set(songs.map(s => s.album)));
  albumSelector.innerHTML = `<option value="all">All Albums</option>` +
    albums.map(alb => `<option value="${alb}">${alb}</option>`).join('');
}

function renderSongList(songs, selectedIdx = 0) {
  songList.innerHTML = '';
  songs.forEach((song, idx) => {
    const div = document.createElement('div');
    div.className = 'song-item' + (idx === selectedIdx ? ' selected' : '');
    div.innerHTML = `<span class="song-title">${song.name}</span>` +
        `<span class="song-album">${song.album || 'Unknown'}</span>`;
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
  setPlayerSrcToCurrentSong();
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

// ========== Event Handlers ===========
albumSelector.addEventListener('change', e => {
  currentAlbum = albumSelector.value;
  updateDisplayedSongs();
});

shuffleBtn.addEventListener('click', () => {
  isShuffling = !isShuffling;
  shuffleBtn.textContent = isShuffling ? 'Shuffle: On' : 'Shuffle';
  updateDisplayedSongs();
});

audioPlayer.addEventListener('ended', () => {
  if (currentSongIdx < currentSongs.length - 1) {
    selectSong(currentSongIdx + 1);
  }
});

// ========== Initialize =============
showLoading();
fetch(LIBRARY_URL)
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
    shuffleBtn.textContent = 'Shuffle';
  })
  .catch(err => {
    showError('Error loading music library: ' + err.message);
  });
