// models/GameRound.js
import mongoose from 'mongoose';

const gameRoundSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true // 룸 ID로 검색할 일이 많으므로 인덱스 추가
  },
  handNumber: {
    type: Number,
    required: true,
  },
  players: [ // 라운드 종료 시 각 플레이어의 최종 상태 기록
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      nickname: { type: String, required: true },
      chipsBefore: { type: Number, required: true }, // 라운드 시작 전 칩
      chipsAfter: { type: Number, required: true },  // 라운드 종료 후 칩
      holeCards: [String], // 해당 라운드의 홀 카드 (히스토리용)
      status: String, // active, folded, all-in 등 최종 상태
    }
  ],
  communityCards: [String], // 해당 라운드의 커뮤니티 카드
  pot: {
    type: Number,
    required: true
  },
  winnerId: { // 승자가 있다면 승자 ID
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // winnerChipsChange: Number, // 승자가 얻은 칩량 (옵션)
  // loserChipsChange: Number, // 패자가 잃은 칩량 (옵션)
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const GameRound = mongoose.model('GameRound', gameRoundSchema);
export default GameRound;