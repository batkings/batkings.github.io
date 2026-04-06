// Подключаем библиотеки
const express = require('express'); 
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Это позволяет вашему сайту на Netlify "общаться" с этим сервером

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Разрешаем вход всем
});

// Здесь хранятся все игроки в оперативной памяти сервера
const players = {};

io.on('connection', (socket) => {
    // 1. Когда кто-то зашел в игру
    console.log(`Игрок вошел: ${socket.id}`);

    // Создаем объект игрока с начальными данными
    players[socket.id] = {
        x: 100,
        y: 100,
        id: socket.id,
        hp: 100,
        name: "Игрок " + socket.id.substr(0, 3)
    };

    // Отправляем НОВОМУ игроку данные обо ВСЕХ, кто уже в игре
    socket.emit('currentPlayers', players);

    // Отправляем ВСЕМ ОСТАЛЬНЫМ данные о том, что зашел новый игрок
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // 2. Когда игрок двигается (этот запрос будет приходить 60 раз в секунду)
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            // Рассылаем обновленную позицию всем, кроме самого отправителя
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // 3. Когда игрок стреляет
    socket.on('shoot', (bulletData) => {
        // Сервер просто пересылает сообщение о выстреле другим
        socket.broadcast.emit('playerShot', {
            id: socket.id,
            x: bulletData.x,
            y: bulletData.y,
            angle: bulletData.angle
        });
    });

    // 4. Когда игрок выходит
    socket.on('disconnect', () => {
        console.log(`Игрок вышел: ${socket.id}`);
        delete players[socket.id]; // Удаляем из памяти
        io.emit('playerDisconnected', socket.id); // Говорим остальным убрать его с экрана
    });
});

// Запуск сервера
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Сервер на порту ${PORT}`));