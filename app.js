// =========== Variables ==========
let allSongs = [];
let currentSongs = [];
let currentAlbum = 'all';
let currentSongIdx = 0;
let isShuffling = false;
const audioPlayer = document.getElementById('audioPlayer');
const songList = document.getElementById('song-list');
const dropArea = document.getElementById('drop-area');
const fileElem = document.getElementById('fileElem');
const albumSelector = document.getElementById('albumSelector');
const shuffleBtn = document.getElementById('shuffleBtn');

// ========== Utils =============
function getAlbumFromPath(path) {
  if (!path) return 'Unknown';
  const parts = path.split(/[\\/]/g);
  if (parts.length > 1) return parts[parts.length - 2];
  return 'Unknown';
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
  audioPlayer.src = URL.createObjectURL(currentSongs[currentSongIdx].file);
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

dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.style.background = '#3b3b3b';
});
dropArea.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropArea.style.background = '';
});
dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.style.background = '';
  handleFilesEvent(e.dataTransfer.items || e.dataTransfer.files);
});
dropArea.addEventListener('click', () => fileElem.click());
fileElem.addEventListener('change', (e) => {
  handleFilesEvent(e.target.files);
});

audioPlayer.addEventListener('ended', () => {
  if (currentSongIdx < currentSongs.length - 1) {
    selectSong(currentSongIdx + 1);
  }
});

// ========== Core File Handling =========
async function handleFilesEvent(items) {
  let files = [];
  // For drag-and-drop with folders (webkitdirectory or DataTransferItemList)
  if (items && items[0] && typeof items[0].webkitGetAsEntry === 'function') {
    // Handle directory upload via drag-and-drop
    const entries = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) entries.push(entry);
    }
    files = await getFilesFromEntries(entries);
  } else if (items && items.length && items[0].kind !== undefined && items[0].kind === 'file') {
    // DataTransferItemList with files: drag-n-drop single or multi-file
    for (let i = 0; i < items.length; i++) {
      const file = items[i].getAsFile();
      if (file && file.type.startsWith('audio/')) files.push(file);
    }
  } else {
    // FileList from input[type=file]
    for (let i = 0; i < items.length; i++) {
      const file = items[i];
      if (file && file.type.startsWith('audio/')) files.push(file);
    }
  }
  addSongs(files);
}

function addSongs(files) {
  const newSongs = Array.from(files).filter(f => f.type.startsWith('audio/')).map(f => {
    // Try to get album name from fullPath if available, otherwise folder as album
    const album = f.webkitRelativePath ? getAlbumFromPath(f.webkitRelativePath) : 'Unknown';
    return {
      name: f.name,
      album,
      file: f
    };
  });
  allSongs = allSongs.concat(newSongs);
  renderAlbumOptions(allSongs);
  updateDisplayedSongs();
}

// Directory upload: recursively read all files from directories dropped via webkitGetAsEntry
async function getFilesFromEntries(entries) {
  let files = [];
  for (const entry of entries) {
    if (!entry) continue;
    if (entry.isDirectory) {
      files = files.concat(await readDirectory(entry));
    } else if (entry.isFile) {
      files.push(await getFile(entry));
    }
  }
  return files.filter(f => f && f.type && f.type.startsWith('audio/'));
}
function readDirectory(directoryEntry) {
  return new Promise((resolve) => {
    const dirReader = directoryEntry.createReader();
    let results = [];
    function readEntries() {
      dirReader.readEntries(async (entries) => {
        if (!entries.length) {
          resolve(results);
        } else {
          for (let entry of entries) {
            if (entry.isDirectory) {
              results = results.concat(await readDirectory(entry));
            } else if (entry.isFile) {
              results.push(await getFile(entry));
            }
          }
          readEntries();
        }
      });
    }
    readEntries();
  });
}
function getFile(fileEntry) {
  return new Promise((resolve) => {
    fileEntry.file(file => {
      // set album as the parent folder name via fullPath for later
      file.webkitRelativePath = fileEntry.fullPath;
      resolve(file);
    });
  });
}
// ========== Initial UI Setup ===========
shuffleBtn.textContent = 'Shuffle';
