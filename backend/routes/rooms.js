// routes/roomRoutes.js

import express from 'express';
import { nanoid } from 'nanoid';
import { auth } from '../utils/jwt.js';

// rooms와 io 객체를 인자로 받아 라우터를 생성하는 함수를 내보냅니다.
export default function createRoomRoutes({ rooms, io }) {
  const router = express.Router();

  // 방 목록 조회 (인증 불필요)
  router.get('/', (req, res) => {
    const lobbyRooms = Object.values(rooms).map(room => ({
        id: room.id,
        name: room.name,
        players: room.players.length,
        maxPlayers: room.maxPlayers,
        blinds: room.blinds,
        buyIn: room.buyIn,
    }));
    res.json({ items: lobbyRooms });
  });

  // 새 방 생성 (인증 필요)
  router.post('/', auth, (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: '방 이름이 필요합니다.' });

    const roomId = nanoid();
    const newRoom = {
      id: roomId,
      name,
      players: [],
      maxPlayers: 8,
      blinds: '5/10',
      buyIn: 500,
    };

    rooms[roomId] = newRoom;

    // 웹소켓을 통해 모든 클라이언트에 알림
    io.emit('room:created', {
      id: newRoom.id,
      name: newRoom.name,
      players: newRoom.players.length,
      maxPlayers: newRoom.maxPlayers,
      blinds: newRoom.blinds,
      buyIn: newRoom.buyIn,
    });
    
    res.status(201).json(newRoom);
  });

  // 방 삭제 (인증 필요)
  router.delete('/:id', auth, (req, res) => {
    const { id } = req.params;
    if (!rooms[id]) {
      return res.status(404).json({ error: '방을 찾을 수 없습니다.' });
    }

    delete rooms[id];

    // 웹소켓을 통해 모든 클라이언트에 알림
    io.emit('room:deleted', id);
    
    res.status(204).send();
  });

  return router;
}