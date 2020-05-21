const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom, getRooms } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT ||  3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

let count = 0

io.on('connection', (socket) => {
    console.log('New WebSocket connection!');

    socket.on('join', ({ username, room }, callback ) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.boardcast.to.emit
    })

    socket.on('sendMessage', (text, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(text)) {
            return callback('Profanity is not allowed!');
        }
        
        io.to(user.room).emit('message', generateMessage(user.username, text));
        callback('delivered!');
    });

    socket.on('sendLocation',(coords, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    });

    socket.on('sendRoomList', (callback) => {
        const rooms = getRooms();
        io.emit('roomList', rooms);
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage(user.username, `${user.username} disconnected!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    });

});

app.get('', (req, res) => {
    res.render('index', {});
})

server.listen(port, () => {
    console.log('Server started on port ' + port);
})
