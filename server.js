const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// データ保存先
const DATA_FILE = path.join(__dirname, 'data.json');

// データ読み込み
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

// データ保存
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let storage = loadData();

// トップページ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// コード保存
app.post('/save', (req, res) => {
    const { code, title } = req.body;
    if (!code) return res.status(400).json({ error: 'コードが空です' });

    const id = 'raw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    storage[id] = {
        title: title || 'Untitled',
        code: code,
        created: new Date().toISOString(),
        views: 0
    };
    saveData(storage);

    res.json({ 
        success: true, 
        id: id, 
        url: `https://${req.get('host')}/raw/${id}` 
    });
});

// Raw取得（これが共有リンク！）
app.get('/raw/:id', (req, res) => {
    const data = storage[req.params.id];
    if (data) {
        data.views++;
        saveData(storage);
        res.setHeader('Content-Type', 'text/plain');
        res.send(data.code);
    } else {
        res.status(404).send('-- コードが見つかりませんでした --');
    }
});

// 一覧
app.get('/list', (req, res) => {
    const list = Object.keys(storage).map(id => ({
        id,
        title: storage[id].title,
        created: storage[id].created,
        views: storage[id].views
    }));
    res.json(list);
});

app.listen(3000, () => console.log('🔥 Kento Raw 起動！'));
