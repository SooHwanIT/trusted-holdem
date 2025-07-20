/* ------------------------------------------------------------------
 * server.js — Trusted-Holdem 백엔드 (Express + Socket.IO)
 *   · 방 CRUD  (REST)
 *   · 멀티룸 GameEngine  (WebSocket)
 *   · 간단한 예외 처리 / CORS / 헬스체크
 * ---------------------------------------------------------------- */
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import dotenv from 'dotenv';
import GameEngine from './game/engine.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

/* ─────────────── 1) 기본 셋업 ─────────────── */
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

/* ─────────────── 2) 룸 / 엔진 저장소 ─────────────── */
const rooms = [];                    // [{id,name,players,maxPlayers,blinds,buyIn}]
const engines = new Map();           // roomId → GameEngine

function createEngine(roomId, cfg = {}) {
    const engine = new GameEngine(io, roomId, cfg);
    engines.set(roomId, engine);
    return engine;
}

/* ─────────────── 3) REST API ─────────────── */
/* 전체 목록 */
app.get('/api/rooms', (_, res) => res.json({ items: rooms }));

/* 생성 */
app.post('/api/rooms', (req, res) => {
    const { name = 'New Table', maxPlayers = 8, blinds = '5 / 10', buyIn = 100 } = req.body;
    const id = `room-${nanoid(6)}`;

    const room = { id, name, players: 0, maxPlayers, blinds, buyIn };
    rooms.push(room);
    createEngine(id);

    res.status(201).json(room);
});

/* 삭제 */
app.delete('/api/rooms/:id', (req, res) => {
    const idx = rooms.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });

    rooms.splice(idx, 1);
    engines.delete(req.params.id);
    io.to(req.params.id).emit('roomClosed');
    res.sendStatus(204);
});

/* 상세 */
app.get('/api/rooms/:id', (req, res) => {
    const room = rooms.find(r => r.id === req.params.id);
    if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });
    res.json(room);
});

/* 헬스 체크 */
app.get('/ping', (_, res) => res.send('pong'));

/* ─────────────── 4) WebSocket ─────────────── */
io.on('connection', socket => {
    /* join { roomId,name } */
    socket.on('join', ({ roomId, name }) => {
        let engine = engines.get(roomId);

        /* 존재하지 않는 방이면 즉석 생성 (직접 URL 접근 대비) */
        if (!engine) {
            engine = createEngine(roomId);
            rooms.push({
                id: roomId,
                name: roomId,
                players: 0,
                maxPlayers: 8,
                blinds: '5 / 10',
                buyIn: 100,
            });
        }

        /* 등록 */
        socket.join(roomId);
        const player = engine.addPlayer({ id: socket.id, name });

        /* 방 메타 players 수 갱신 */
        const meta = rooms.find(r => r.id === roomId);
        if (meta)
            meta.players = engine.players.filter(pl => pl.status !== 'folded').length;

        socket.emit('joined', player);
    });

    /* action { roomId, type, amount? } */
    socket.on('action', ({ roomId, ...payload }) => {
        const engine = engines.get(roomId);
        if (engine) engine.playerAction(socket.id, payload);
    });

    /* disconnect → 모든 엔진에 fold 전달 */
    socket.on('disconnect', () => {
        engines.forEach((engine, rid) => {
            engine.playerAction(socket.id, { type: 'fold' });

            /* 룸에 아무 소켓도 없으면 정리 */
            if (!io.sockets.adapter.rooms.get(rid)?.size) {
                engines.delete(rid);
                const idx = rooms.findIndex(r => r.id === rid);
                if (idx !== -1) rooms.splice(idx, 1);
            }
        });
    });
});

/* ─────────────── 5) 에러 핸들러 ─────────────── */
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
});

/* ─────────────── 6) 서버 시작 ─────────────── */
httpServer.listen(PORT, () =>
    console.log(`♠ Poker backend running : http://localhost:${PORT}`)
);
