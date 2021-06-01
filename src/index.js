const express = require('express');
const path = require('path');
const http = require('http')
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection', (socket) => {
    console.log("Socket Working");

    /*
    // emit creates an event, which can be triggered on the client side.
    socket.emit('message', generateMessage('Welcome!'))
    // broadcast send data to all sockets except the one which triggered it.
    socket.broadcast.emit('message', generateMessage('A new user has joined!'));
    */
   
    socket.on('join', (userInfo, callback) => {
        const { error, user } = addUser({ id: socket.id, ...userInfo });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);
        socket.emit('message', generateMessage('ADMIN', 'Welcome!'))
        // broadcast.to(room).emit(...) just triggers the event for those sockets that are in the room.
        socket.broadcast.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has joined the room!`));
        io.to(user.room).emit('data', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });

        callback();
    })

    // socket.emit -> Emits to only selected socket.
    // io.emit -> Emits to all connected sockets.
    socket.on('sendMessage', (msg, callback) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if (filter.isProfane(msg)) {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg));
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMessage', 
                generateLocationMessage(user.username, `https://google.com/maps?q=${location.lat},${location.long}`));
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            // Emitting the event to only those socket who are in same room.
            io.to(user.room).emit('message', generateMessage('ADMIN', `${user.username} has left the room!`))
            io.to(user.room).emit('data', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log("Listening on port " + port);
})