import http from 'http';
import express from 'express';
import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import router from './router';
import logger from './utils/logger';
import sessionStore from './sessionStore';
import messageStore from './messageStore';

const PORT = process.env.PORT || 5000;

const app = express();
app.use(router);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

io.use((socket: any, next) => {

    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        const session = sessionStore.findSession(sessionID);
        if (session) {
            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.username = session.username;
            sessionStore.saveSession(sessionID, {
                ...session,
                connected: true
            });
            return next();
        }
    }

    const username = socket.handshake.auth.username;
    if(!username) {
        return next(new Error("invalid username"));
    } else if(sessionStore.findSessionByUsername(username)) {
        return next(new Error("username is already taken"));
    }

    socket.sessionID = uuid();
    socket.userID = uuid();
    socket.username = username;

    sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: socket.username,
        connected: true
    });

    next();
});

io.on("connection", (socket: Socket) => {

    socket.join((socket as any).userID);

    const socketSession = sessionStore.findSession((socket as any).sessionID);

    socket.emit("session", {
        sessionID: (socket as any).sessionID,
        userID: socketSession.userID
    });

    const recentlyConnectedUser = {
        userID: socketSession.userID,
        name: socketSession.username,
        messages: [],
        isOnline: true
    };

    socket.broadcast.emit("user/connected", recentlyConnectedUser);

    const messagesPerContact = new Map();

    messageStore.findAllMessagesRelatedToUser(socketSession.userID).forEach((message) => {
        const { author, to } = message;
        const currentUser = socketSession.userID;

        const otherUser = currentUser === author ? to : author;
        if (messagesPerContact.has(otherUser)) {
            messagesPerContact.get(otherUser).push(message);
        } else {
            messagesPerContact.set(otherUser, [message]);
        }
    });

    const users: any[] = [];

    sessionStore.findAllSessions().forEach((session) => {
        users.push({
            userID: session.userID,
            name: session.username,
            isOnline: session.connected,
            messages: messagesPerContact.get(session.userID) || [],
        });
    });

    socket.emit("users", users);

    socket.on("private message", ({ content, to }) => {
        const message = {
            text: content,
            author: socketSession.userID,
            to: to,
            createdAt: Date.now()
        };

        // broadcast
        socket.to(to).to(socketSession.userID).emit("private message", message);

        messageStore.saveMessage(message);

        logger.info(`sending message: ${JSON.stringify({ message })}`);
    });

    socket.on("disconnect", async () => {
        const matchingSockets = await io.in(socketSession.userID).allSockets();
        const isDisconnected = matchingSockets.size === 0;

        if (isDisconnected) {
            sessionStore.saveSession((socket as any).sessionID, {
                ...socketSession,
                connected: false
            });

            socket.broadcast.emit("user/disconnected", socketSession.userID);
            logger.success(`ID: ${socket.id} - A user has disconnect from the socket.`);
        }
    });
});

server.listen(PORT, () => {
    logger.info(`Server has started on port ${PORT}`);
});