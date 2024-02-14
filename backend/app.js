import express from 'express'
import http from 'http'
import messageRoutes from './routes/message.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import roomRoutes from './routes/room.js'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import { Server } from 'socket.io'
import MySQLStoreFactory from 'express-mysql-session'
import db from './db.js'
import { verifySession } from './verifySession.js'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const server = http.createServer(app)
const ioServer = new Server(server, {
    cors: {
        origin: ['http://localhost:8000'],
        methods: ["GET", "POST"],
        transports: ['websocket'],
        credentials: true,
    }, allowEIO3: true
})

ioServer.on('connection', socket => {
    socket.on('joinRoom', (room) => {
        socket.join(room);
    });
    socket.on('leaveRoom', (room) => {
        socket.leave(room)
    })
    socket.on('sendMessage', () => {
        socket.broadcast.emit('receivedMessage')
    })
    socket.on('deleteMessage', () => {
        socket.broadcast.emit('deletedMessage')
    })
    socket.on('typing', (room) => {
        socket.broadcast.to(room).emit('typing')
    })
    socket.on('stopTyping', (room) => {
        socket.broadcast.to(room).emit('stopTyping')
    })
    socket.on('userStatusChange', () => {
        ioServer.emit('userStatusChange')
    })
    socket.on('messageStatusChange', (room) => {
        socket.to(room).emit('messageStatusChange')
        console.log('emitting')
    })
    socket.on('addToGroup', () => {
        socket.broadcast.emit('addedToGroup')
    })
})

app.use(express.static(path.join(__dirname, '/dist')))
app.use(express.json())
app.use(cookieParser())

// session config
const MySQLStore = MySQLStoreFactory(session)

const store = new MySQLStore({
    expiration: 3600000,
    createDatabaseTable: true
}, db)

app.use(session({
    store: store,
    name: 'userId',
    key: process.env.KEY,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: false, sameSite: false, maxAge: 3600000 }
}));

// routes
app.use('/api/message', verifySession, messageRoutes)
app.use('/api/user', verifySession, userRoutes)
app.use('/api/room', verifySession, roomRoutes)
app.use('/api/auth', authRoutes)
app.get('*', (_, res) => {
    res.sendFile(path.join(__dirname, '/dist', 'index.html'));
});

server.listen(8000, () => {
    console.log('Server listening on port 8000');
});
