import mongoose from 'mongoose';

// 카드 객체 구조를 위한 서브스키마를 정의합니다.
// suit: 클럽(clubs), 다이아몬드(diamonds), 하트(hearts), 스페이드(spades)
// rank: 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A
const cardSchema = new mongoose.Schema({
  suit: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    required: true
  }
}, { _id: false }); // MongoDB가 자동으로 생성하는 _id 필드를 사용하지 않도록 설정

// 족보 정보를 위한 서브스키마를 정의합니다.
const handResultSchema = new mongoose.Schema({
  name: { type: String }, // 예: 'Straight Flush', 'Full House'
  rank: { type: Number }, // 족보의 점수 (우열 비교용)
  kickers: { type: [Number], default: [] }, // 족보를 구성하는 카드들의 순위
  cards: { type: [cardSchema], default: [] } // 최종 5장의 카드 객체
}, { _id: false });

// 라운드 종료 시 각 플레이어의 최종 상태를 기록하는 서브스키마
const playerRoundDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String, required: true },
  chipsBefore: { type: Number, required: true }, // 라운드 시작 전 칩
  chipsAfter: { type: Number, required: true },  // 라운드 종료 후 칩
  status: String, // active, folded, all-in 등 최종 상태
  holeCards: { type: [cardSchema], default: [] }, // 해당 라운드의 홀 카드 (객체 배열로 변경)
  handResult: { type: handResultSchema, default: null } // 족보 정보 추가
}, { _id: false });

const gameRoundSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  handNumber: {
    type: Number,
    required: true,
  },
  players: { type: [playerRoundDataSchema], required: true },
  communityCards: { type: [cardSchema], default: [] }, // 커뮤니티 카드 (객체 배열로 변경)
  pot: {
    type: Number,
    required: true
  },
  winnerId: {
    type: String, // String으로 변경
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const GameRound = mongoose.model('GameRound', gameRoundSchema);
export default GameRound;
