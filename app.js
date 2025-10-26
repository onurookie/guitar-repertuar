// Gitar Repertuar Uygulaması
const chords = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const categories = ['80-90\'s', 'Arabesk', 'Oyun Havası', 'Hareketli Pop', 'Orta Hareketli', 'Potpori', 'Rock', 'Slow', 'Pop', 'Türkü', 'Özgün'];

let songs = [];
let selectedCategory = 'Tümü';
let searchTerm = '';
let currentView = 'list';
let selectedSong = null;
let transpose = 0;
let editMode = false;
let newSong = { title: '', artist: '', category: '80-90\'s', lyrics: '' };

// LocalStorage ile veri yönetimi
function loadData() {
    const stored = localStorage.getItem('guitar_songs');
    if (stored) songs = JSON.parse(stored);
    render();
}

function saveData() {
    localStorage.setItem('guitar_songs', JSON.stringify(songs));
}

function detectOriginalKey(lyrics) {
    const chordRegex = /\b([A-G][#b]?)(m|maj7|m7|sus4|sus2|dim|aug|add9|7|6|9)?\b/g;
    const foundChords = [];
    let match;
    
    while ((match = chordRegex.exec(lyrics)) !== null) {
        let root = match[1];
        if (root.includes('b')) {
            const noteMap = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'};
            root = noteMap[root] || root;
        }
        if (chords.includes(root)) foundChords.push(root);
    }
    
    if (foundChords.length === 0) return 0;
    
    const chordCount = {};
    foundChords.forEach(chord => {
        chordCount[chord] = (chordCount[chord] || 0) + 1;
    });
    
    const mostCommon = Object.keys(chordCount).reduce((a, b) => 
        chordCount[a] > chordCount[b] ? a : b
    );
    
    return chords.indexOf(mostCommon);
}

function transposeChord(chord, semitones) {
    const match = chord.match(/^([A-G][#b]?)(.*)/);
    if (!match) return chord;
    
    let [, root, suffix] = match;
    if (root.includes('b')) {
        const noteMap = {'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'};
        root = noteMap[root] || root;
    }
    
    const idx = chords.indexOf(root);
    if (idx === -1) return chord;
    
    const newIdx = (idx + semitones + 12) % 12;
    return chords[newIdx] + suffix;
}

function highlightText(text, transposeAmount = 0) {
    const lines = text.split('\n');
    let html = '';
    
    lines.forEach(line => {
        const words = line.split(/(\s+)/);
        words.forEach(word => {
            const clean = word.trim();
            
            if (/^nakarat$/i.test(clean)) {
                html += `<span class="nakarat">${word}</span>`;
            } else if (/^solo$/i.test(clean)) {
                html += `<span class="solo">${word}</span>`;
            } else if (/^(baştan\s+başla|başa\s+dön)$/i.test(clean)) {
                html += `<span class="bastan">${word}</span>`;
            } else if (/^x\d+$/i.test(clean)) {
                html += `<span class="tekrar">${word}</span>`;
            } else if (/^([A-G][#b]?)(m|maj7|m7|sus4|sus2|dim|aug|add9|7|6|9)?$/.test(clean)) {
                const transposed = transposeAmount !== 0 ? transposeChord(clean, transposeAmount) : clean;
                html += `<span class="chord">${transposed}</span>${word.slice(clean.length)}`;
            } else {
                html += word;
            }
        });
        html += '<br>';
    });
    
    return html;
}

function addSong() {
    if (!newSong.title.trim()) {
        alert('Lütfen şarkı adını girin!');
        return;
    }
    
    const song = {
        id: Date.now(),
        title: newSong.title,
        artist: newSong.artist,
        category: newSong.category,
        lyrics: newSong.lyrics,
        originalKey: detectOriginalKey(newSong.lyrics)
    };
    
    songs.push(song);
    songs.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
    saveData();
    
    newSong = { title: '', artist: '', category: '80-90\'s', lyrics: '' };
    currentView = 'list';
    selectedCategory = 'Tümü';
    render();
}

function updateSong() {
    if (!newSong.title.trim()) {
        alert('Lütfen şarkı adını girin!');
        return;
    }
    
    const idx = songs.findIndex(s => s.id === selectedSong.id);
    if (idx !== -1) {
        songs[idx] = {
            id: selectedSong.id,
            title: newSong.title,
            artist: newSong.artist,
            category: newSong.category,
            lyrics: newSong.lyrics,
            originalKey: detectOriginalKey(newSong.lyrics)
        };
        songs.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        saveData();
        selectedSong = songs[idx];
    }
    
    editMode = false;
    currentView = 'detail';
    transpose = 0;
    render();
}

function deleteSong(id) {
    if (!confirm('Bu şarkıyı silmek istediğinize emin misiniz?')) return;
    
    songs = songs.filter(s => s.id !== id);
    saveData();
    
    if (selectedSong?.id === id) {
        selectedSong = null;
        currentView = 'list';
    }
    render();
}

function getFilteredSongs() {
    return songs.filter(song => {
        const matchCat = selectedCategory === 'Tümü' || song.category === selectedCategory;
        const matchSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          song.artist.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });
}

function render() {
    const app = document.getElementById('app');
    
    if (editMode) {
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
                <div class="max-w-4xl mx-auto">
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-2xl font-bold text-gray-800">${selectedSong ? 'Şarkıyı Düzenle' : 'Yeni Şarkı Ekle'}</h2>
                            <button onclick="editMode=false; currentView='${selectedSong ? 'detail' : 'list'}'; render();" class="text-gray-600 hover:text-gray-800 text-2xl">×</button>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Şarkı Adı *</label>
                                <input type="text" id="songTitle" value="${newSong.title}" class="w-full p-3 border border-gray-300 rounded-lg" placeholder="Örn: Sarı Gelin">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Sanatçı</label>
                                <input type="text" id="songArtist" value="${newSong.artist}" class="w-full p-3 border border-gray-300 rounded-lg" placeholder="Örn: Anonim">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                                <select id="songCategory" class="w-full p-3 border border-gray-300 rounded-lg">
                                    ${categories.map(cat => `<option value="${cat}" ${newSong.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Sözler ve Akorlar *</label>
                                <textarea id="songLyrics" class="w-full h-96 p-3 border border-gray-300 rounded-lg font-mono" placeholder="Akorları büyük harfle yazın">${newSong.lyrics}</textarea>
                                <div class="mt-2 text-sm text-gray-600">
                                    <strong>Renk Kodları:</strong> <span class="chord">Akorlar</span>, <span class="nakarat">Nakarat</span>, <span class="solo">Solo</span>, <span class="bastan">Baştan/Başa dön</span>, <span class="tekrar">x2, x4</span>
                                </div>
                            </div>
                            <div class="flex gap-3 pt-4">
                                <button onclick="saveForm(); ${selectedSong ? 'updateSong()' : 'addSong()'};" class="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium">${selectedSong ? 'Güncelle' : 'Kaydet'}</button>
                                <button onclick="editMode=false; currentView='${selectedSong ? 'detail' : 'list'}'; render();" class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">İptal</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    if (currentView === 'detail' && selectedSong) {
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
                <div class="max-w-4xl mx-auto">
                    <div class="bg-white rounded-lg shadow-lg p-4 mb-4">
                        <div class="flex items-center justify-between mb-4">
                            <button onclick="currentView='list'; selectedSong=null; transpose=0; render();" class="text-purple-600 hover:text-purple-800 flex items-center gap-2">
                                ← Geri
                            </button>
                            <div class="flex gap-2">
                                <button onclick="startEdit();" class="text-blue-600 hover:text-blue-800 text-xl">✏️</button>
                                <button onclick="deleteSong(${selectedSong.id});" class="text-red-600 hover:text-red-800 text-xl">🗑️</button>
                            </div>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-800 mb-1">${selectedSong.title}</h1>
                        <p class="text-gray-600 mb-4">${selectedSong.artist}</p>
                        <div class="bg-purple-100 rounded-lg p-4">
                            <div class="text-sm text-gray-600 mb-2 text-center font-medium">
                                Transpoze - Tonu Değiştir
                                <div class="text-xs mt-1">Orijinal Ton: <span class="font-bold text-purple-800">${chords[selectedSong.originalKey || 0]}</span></div>
                            </div>
                            <div class="grid grid-cols-6 gap-2">
                                ${chords.map((chord, idx) => {
                                    const transposeVal = idx - (selectedSong.originalKey || 0);
                                    const isActive = transpose === transposeVal;
                                    const isOriginal = idx === (selectedSong.originalKey || 0);
                                    return `<button onclick="transpose=${transposeVal}; render();" class="py-2 px-3 rounded-lg font-bold ${isActive ? 'bg-purple-600 text-white' : isOriginal ? 'bg-green-200 text-green-800' : 'bg-white text-purple-800'}">${chord}</button>`;
                                }).join('')}
                            </div>
                            ${transpose !== 0 ? '<button onclick="transpose=0; render();" class="w-full mt-3 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-medium">Orijinal Tona Dön</button>' : ''}
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow-lg p-6">
                        <div class="mb-4 text-sm text-gray-600 flex flex-wrap gap-4">
                            <span class="chord">● Akorlar</span>
                            <span class="nakarat">● Nakarat</span>
                            <span class="solo">● Solo</span>
                            <span class="bastan">● Baştan/Başa Dön</span>
                            <span class="tekrar">● Tekrar</span>
                        </div>
                        <div class="whitespace-pre-wrap font-mono text-base leading-relaxed">
                            ${highlightText(selectedSong.lyrics, transpose)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    const filtered = getFilteredSongs();
    app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <div class="max-w-6xl mx-auto">
                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">🎸</span>
                            <h1 class="text-3xl font-bold text-gray-800">Repertuarım</h1>
                        </div>
                        <button onclick="currentView='add'; editMode=true; newSong={title:'',artist:'',category:'80-90\\'s',lyrics:''}; render();" class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-medium">+ Yeni Şarkı</button>
                    </div>
                    <div class="relative mb-4">
                        <input type="text" id="searchInput" value="${searchTerm}" placeholder="Şarkı veya sanatçı ara..." class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg" onkeyup="searchTerm=this.value; render();">
                        <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                    </div>
                    <div class="flex gap-2 overflow-x-auto pb-2">
                        <button onclick="selectedCategory='Tümü'; render();" class="px-4 py-2 rounded-lg font-medium whitespace-nowrap ${selectedCategory === 'Tümü' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}">Tümü (${songs.length})</button>
                        ${categories.map(cat => {
                            const count = songs.filter(s => s.category === cat).length;
                            return `<button onclick="selectedCategory='${cat}'; render();" class="px-4 py-2 rounded-lg font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}">${cat} (${count})</button>`;
                        }).join('')}
                    </div>
                </div>
                ${filtered.length === 0 ? `
                    <div class="bg-white rounded-lg shadow-lg p-12 text-center">
                        <div class="text-6xl mb-4">🎸</div>
                        <h3 class="text-xl font-medium text-gray-600 mb-2">${searchTerm ? 'Şarkı bulunamadı' : 'Henüz şarkı eklemediniz'}</h3>
                        <p class="text-gray-500">${searchTerm ? 'Farklı bir arama terimi deneyin' : 'Başlamak için "Yeni Şarkı" butonuna tıklayın'}</p>
                    </div>
                ` : `
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        ${filtered.map(song => `
                            <div onclick="selectedSong=songs.find(s=>s.id===${song.id}); currentView='detail'; transpose=0; render();" class="bg-white rounded-lg shadow-lg p-5 hover:shadow-xl transition-shadow cursor-pointer">
                                <div class="flex items-start justify-between mb-2">
                                    <div class="flex-1">
                                        <h3 class="font-bold text-lg text-gray-800 mb-1">${song.title}</h3>
                                        <p class="text-gray-600 text-sm">${song.artist}</p>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="event.stopPropagation(); selectedSong=songs.find(s=>s.id===${song.id}); startEdit();" class="text-gray-400 hover:text-blue-600 p-1">✏️</button>
                                        <button onclick="event.stopPropagation(); deleteSong(${song.id});" class="text-gray-400 hover:text-red-600 p-1">🗑️</button>
                                    </div>
                                </div>
                                <span class="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">${song.category}</span>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        </div>
    `;
}

function saveForm() {
    newSong.title = document.getElementById('songTitle').value;
    newSong.artist = document.getElementById('songArtist').value;
    newSong.category = document.getElementById('songCategory').value;
    newSong.lyrics = document.getElementById('songLyrics').value;
}

function startEdit() {
    newSong = {
        title: selectedSong.title,
        artist: selectedSong.artist,
        category: selectedSong.category,
        lyrics: selectedSong.lyrics
    };
    editMode = true;
    render();
}

// Başlat
loadData();
