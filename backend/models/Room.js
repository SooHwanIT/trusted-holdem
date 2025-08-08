// models/Room.js

const mongoose = require('mongoose');

// 플레이어 정보 스키마 (방에 입장한 유저)
const playerSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    nickname: { type: String, required: true },
    chips: { type: Number, required: true },
    hand: [{ type: String }],
    status: { type: String, enum: ['active', 'folded', 'all-in', 'sitting-out'], default: 'active' },
    currentBetInRound: { type: Number, default: 0 },
});

// 확장된 Room 스키마
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    maxPlayers: { type: Number, default: 8 },
    blinds: { type: String, default: '5/10' },
    buyIn: { type: Number, default: 500 },
    createdAt: { type: Date, default: Date.now },

    status: { type: String, enum: ['waiting', 'in-game', 'finished'], default: 'waiting' },
    players: [playerSchema],

    deck: [{ type: String }],
    communityCards: [{ type: String }],
    pot: { type: Number, default: 0 },
    currentBet: { type: Number, default: 0 },
    turn: { type: String },
    dealerPosition: { type: String },
    smallBlindPosition: { type: String },
    bigBlindPosition: { type: String },
    gameId: { type: String },
});

module.exports = mongoose.model('Room', roomSchema);