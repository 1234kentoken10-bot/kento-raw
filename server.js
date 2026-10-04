const express = require('express');
const path = require('path');
const app = express();

// 大きなデータに対応（50MBまで）
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// ============================================
// メモリ保存（大きなデータ対応）
// ============================================
const storage = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 保存
app.post('/save', (req, res) => {
    const { code, title } = req.body;
    if (!code) return res.status(400).json({ error: 'コードが空です' });

    // サイズチェック（50MBまで）
    const sizeInMB = Buffer.byteLength(code, 'utf8') / (1024 * 1024);
    if (sizeInMB > 50) {
        return res.status(400).json({ 
            error: `データが大きすぎます（${sizeInMB.toFixed(2)}MB）。50MB以下にしてください。` 
        });
    }

    const id = 'kento_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    storage[id] = {
        code: code,
        title: title || 'Untitled',
        created: new Date().toISOString(),
        size: sizeInMB.toFixed(2) + 'MB',
        views: 0
    };

    const rawUrl = `https://${req.get('host')}/raw/${id}`;
    res.json({ success: true, raw: rawUrl, id: id, size: storage[id].size });
});

// Raw取得
app.get('/raw/:id', (req, res) => {
    const data = storage[req.params.id];
    if (data) {
        data.views++;
        res.setHeader('Content-Type', 'text/plain');
        res.send(data.code);
    } else {
        res.status(404).send('-- コードが見つかりません --');
    }
});

// 一覧
app.get('/list', (req, res) => {
    const list = Object.keys(storage).map(id => ({
        id: id,
        title: storage[id].title,
        created: storage[id].created,
        size: storage[id].size,
        views: storage[id].views
    }));
    res.json(list);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔥 Kento Big Raw 起動: http://localhost:${PORT}`);
    console.log(`📊 最大50MBまで対応！`);
});
