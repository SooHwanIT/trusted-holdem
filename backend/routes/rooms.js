// routes/rooms.js
import express from 'express';
import { nanoid } from 'nanoid';

const router = express.Router();

/** 메모리 저장소 (실전에서는 DB로 교체) */
const rooms = [];      // { id, name, players, maxPlayers, blinds, buyIn }

router.get('/', (req, res) => {
    res.json({ items: rooms });
});

router.post('/', (req, res) => {
    const { name, blinds = '5 / 10', buyIn = 100, maxPlayers = 8 } = req.body;
    if (!name) return res.status(400).json({ error: 'NAME_REQUIRED' });

    const id = `room-${nanoid(6)}`;        // room-x1y2z3
    const newRoom = { id, name, players: 0, maxPlayers, blinds, buyIn };
    rooms.push(newRoom);
    res.status(201).json(newRoom);
});

router.delete('/:id', (req, res) => {
    const idx = rooms.findIndex((r) => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'ROOM_NOT_FOUND' });
    rooms.splice(idx, 1);
    res.sendStatus(204);
});




export default router;
