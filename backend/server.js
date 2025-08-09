// server.js

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './db/index.js';
import createRouter from './routes/index.js';
import User from './models/User.js';
import GameRound from './models/GameRound.js';

import initializeGameHandlers from './sockets/gameHandlers.js';
import initializeChatHandlers from './sockets/chatHandlers.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// 단일 Socket.IO 서버 인스턴스
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

connectDB();

const rooms = new Map(); // 전역 게임 룸 상태

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const apiRouter = createRouter({ rooms, io });
app.use('/api', apiRouter);

// ✅ 핵심 변경: 네임스페이스 정의 및 핸들러 연결
const gameIo = io.of('/game'); // 게임 로직을 위한 네임스페이스
const chatIo = io.of('/chat'); // 채팅 로직을 위한 네임스페이스

// 게임 핸들러 초기화 (gameIo와 chatIo 인스턴스 모두 전달)
initializeGameHandlers({ io: gameIo, chatIo: chatIo, rooms, User, GameRound }); // ✨ chatIo 추가
initializeChatHandlers({ io: chatIo });

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});
