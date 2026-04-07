const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Разрешаем запросы с вашего сайта на Netlify

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Позже здесь можно указать адрес вашего сайта на Netlify
        methods: ["GET", "POST"]
    }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Игрок подключился:', socket.id);

    // Создаем нового игрока
    players[socket.id] = { x: 400, y: 300, id: socket.id };

    // Отправляем всем информацию о новом игроке
    io.emit('currentPlayers', players);

    // Обработка движения
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // Рассылаем всем обновленные координаты
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Отключение игрока
    socket.on('disconnect', () => {
        console.log('Игрок отключился:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
