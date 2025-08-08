// backend/sockets/gameHandlers.js

import { nanoid } from 'nanoid';
import PokerGame from '../game/PokerGame.js';

// initializeGameHandlers 함수
export default function initializeGameHandlers({ io, rooms, User, GameRound }) {
  
  // 게임 로그 메시지를 채팅방으로 전송하는 헬퍼 함수
  // 'system'이라는 특별한 발신자를 사용해 일반 채팅과 구분합니다.
  const sendGameLogMessage = (roomId, message) => {
    io.to(roomId).emit('chatMessage', {
      id: nanoid(), // 각 메시지에 고유 ID 부여
      sender: 'system', // 게임 로그임을 나타내는 발신자
      text: message,
      timestamp: Date.now(),
    });
  };

  io.on('connection', async (socket) => {
    console.log(`[Game Socket.IO] User connected: ${socket.id}`);

    // 플레이어 참가
    socket.on('joinRoom', async ({ roomId, userId, nickname }) => {
      socket.join(roomId);
      console.log(`[Game Socket.IO] User ${nickname}(${userId}, ${socket.id}) joined room ${roomId}`);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new PokerGame(roomId, 10, 20));
      }
      const game = rooms.get(roomId);

      const userDoc = await User.findById(userId);
      if (!userDoc) {
        console.error(`[Game Socket.IO] User not found: ${userId}`);
        socket.emit('roomError', { message: 'User not found' });
        return;
      }
      game?.upsertPlayer({ userId, socketId: socket.id, nickname: userDoc.nickname, initialChips: userDoc.chips });

      // ⭐ 게임 로그: 플레이어 참가 메시지 전송
      sendGameLogMessage(roomId, `${userDoc.nickname}님이 방에 참가했습니다.`);

      // 방에 2명 이상이고 게임 대기 중이면 새 핸드 시작
      if (game && game.players.filter(p => p.chips > 0).length >= 2 && game.phase === 'waiting') {
        game.startNewHand();
        // ⭐ 게임 로그: 새로운 핸드 시작 메시지 전송
        sendGameLogMessage(roomId, '새로운 핸드를 시작합니다!');
      }
      io.to(roomId).emit('state', game?.getGameState());
    });

    // 플레이어 액션
    socket.on('playerAction', async ({ roomId, type, data }) => {
      const game = rooms.get(roomId);
      if (game) {
        game.handlePlayerAction(socket.id, { type, data });
        io.to(roomId).emit('state', game.getGameState());

        // 쇼다운 페이즈에 도달했는지 확인
        if (game.phase === 'showdown') {
          try {
            const roundData = game.endHand();

            // ⭐ 게임 로그: 라운드 종료 메시지 전송
            const winnerNickname = roundData.players.find(p => p.userId === roundData.winnerId)?.nickname || '알 수 없는 플레이어';
            sendGameLogMessage(roomId, `라운드가 종료되었습니다! 승자는 ${winnerNickname}님입니다.`);
            
            const newGameRound = new GameRound({
              roomId: roundData.roomId,
              handNumber: roundData.handNumber,
              players: roundData.players,
              communityCards: roundData.communityCards,
              pot: roundData.pot,
              winnerId: roundData.winnerId,
            });
            await newGameRound.save();
            console.log(`[Game Socket.IO] Game round ${roundData.handNumber} saved to DB.`);

            // 플레이어 칩 업데이트 (DB에 반영)
            for (const p of roundData.players) {
              const updatedUser = await User.findByIdAndUpdate(p.userId, { chips: p.chipsAfter }, { new: true });
              if (updatedUser) {
                console.log(`[Game Socket.IO] User ${updatedUser.nickname}'s chips updated to ${updatedUser.chips}.`);
              } else {
                console.warn(`[Game Socket.IO] User ${p.userId} not found for chip update.`);
              }
            }

          } catch (dbError) {
            console.error('[Game Socket.IO] Error saving game round or updating user chips:', dbError);
          }

          // 쇼다운 후 잠시 대기 후 새 핸드 시작 또는 대기 상태로 전환
          setTimeout(() => {
            if (game.players.filter(p => p.chips > 0).length >= 2) {
              game.startNewHand();
              io.to(roomId).emit('state', game.getGameState());
              // ⭐ 게임 로그: 새 핸드 시작 메시지 전송
              sendGameLogMessage(roomId, '새로운 핸드를 시작합니다!');
              console.log(`[Game Socket.IO] Starting new hand in room ${roomId}.`);
            } else {
              game.phase = 'waiting';
              io.to(roomId).emit('state', game.getGameState());
              // ⭐ 게임 로그: 플레이어 부족으로 대기 메시지 전송
              sendGameLogMessage(roomId, '플레이어 부족으로 다음 핸드를 시작할 수 없습니다. 대기 중...');
              console.log(`[Game Socket.IO] Not enough players with chips for new hand in room ${roomId}, waiting...`);
            }
          }, 3000); // 3초 대기
        }
      }
    });

    // 연결 해제
    socket.on('disconnect', async () => {
      console.log(`[Game Socket.IO] User disconnected: ${socket.id}`);
      let disconnectedPlayerSocketId = socket.id;

      for (const [roomId, game] of rooms) {
        const initialPlayerCount = game.players.length;
        const playerBeforeFilter = game.players.find(p => p.socketId === disconnectedPlayerSocketId);
        const disconnectedPlayerNickname = playerBeforeFilter ? playerBeforeFilter.nickname : '알 수 없는 플레이어';

        game.players = game.players.filter(p => p.socketId !== disconnectedPlayerSocketId);

        if (game.players.length < initialPlayerCount) {
          // ⭐ 게임 로그: 플레이어 연결 해제 메시지 전송
          sendGameLogMessage(roomId, `${disconnectedPlayerNickname}님이 게임에서 나갔습니다.`);
          
          if (game.players.length === 0) {
            rooms.delete(roomId);
            console.log(`[Game Socket.IO] Room ${roomId} deleted as all players disconnected.`);
          } else {
            // ... (기존 코드: 턴 진행, 게임 상태 업데이트)
            io.to(roomId).emit('state', game.getGameState());
          }
          break;
        }
      }
    });
  });
}