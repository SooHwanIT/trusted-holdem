// backend/sockets/gameHandlers.js

import { nanoid } from 'nanoid';
import PokerGame from '../game/PokerGame.js';

// initializeGameHandlers 함수가 io와 chatIo를 모두 받도록 수정
export default function initializeGameHandlers({ io, chatIo, rooms, User, GameRound }) { // ✨ chatIo 추가

  // 이제 io.of()를 호출할 필요 없이 chatIo를 바로 사용
  const sendGameLogMessage = (roomId, message) => {
    chatIo.to(roomId).emit('chatMessage', { // ✨ chatIo를 사용하여 메시지를 보냄
      id: nanoid(),
      sender: 'system',
      text: message,
      type: 'system',
      timestamp: Date.now(),
    });
  };

  const updateAllPlayersState = (roomId) => {
    const game = rooms.get(roomId);
    if (!game) return;

    game.players.forEach(player => {
      const playerSpecificState = game.getGameStateForPlayer(player.id);
      io.to(player.socketId).emit('state', playerSpecificState);
    });
  };

  io.on('connection', async (socket) => {
    console.log(`[Game Socket.IO] User connected to /game: ${socket.id}`); // 로그 변경

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
      sendGameLogMessage(roomId, `${userDoc.nickname}님이 방에 참가했습니다. 🤝`);

      if (game && game.players.filter(p => p.chips > 0).length >= 2 && game.phase === 'waiting') {
        game.startNewHand();
        sendGameLogMessage(roomId, '새로운 핸드를 시작합니다! 🃏');
      }
      updateAllPlayersState(roomId);
    });

    socket.on('playerAction', async ({ roomId, type, data }) => {
      const game = rooms.get(roomId);
      if (game) {
        game.handlePlayerAction(socket.id, { type, data });
        updateAllPlayersState(roomId);

        if (game.phase === 'showdown') {
          try {
            const roundData = game.endHand();
            const winnerNickname = roundData.players.find(p => p.userId === roundData.winnerId)?.nickname || '알 수 없는 플레이어';
            sendGameLogMessage(roomId, `라운드가 종료되었습니다! 승자는 **${winnerNickname}**님입니다. 🎉`);

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

          setTimeout(() => {
            if (game.players.filter(p => p.chips > 0).length >= 2) {
              game.startNewHand();
              updateAllPlayersState(roomId);
              sendGameLogMessage(roomId, '새로운 핸드를 시작합니다! 🃏');
              console.log(`[Game Socket.IO] Starting new hand in room ${roomId}.`);
            } else {
              game.phase = 'waiting';
              updateAllPlayersState(roomId);
              sendGameLogMessage(roomId, '플레이어 부족으로 다음 핸드를 시작할 수 없습니다. 대기 중... ⏳');
              console.log(`[Game Socket.IO] Not enough players with chips for new hand in room ${roomId}, waiting...`);
            }
          }, 3000);
        }
      }
    });

    socket.on('disconnect', async () => {
      console.log(`[Game Socket.IO] User disconnected from /game: ${socket.id}`); // 로그 변경
      let disconnectedPlayerSocketId = socket.id;

      for (const [roomId, game] of rooms) {
        const initialPlayerCount = game.players.length;
        const playerBeforeFilter = game.players.find(p => p.socketId === disconnectedPlayerSocketId);
        const disconnectedPlayerNickname = playerBeforeFilter ? playerBeforeFilter.nickname : '알 수 없는 플레이어';

        game.players = game.players.filter(p => p.socketId !== disconnectedPlayerSocketId);

        if (game.players.length < initialPlayerCount) {
          sendGameLogMessage(roomId, `${disconnectedPlayerNickname}님이 게임에서 나갔습니다. 👋`);

          if (game.players.length === 0) {
            rooms.delete(roomId);
            console.log(`[Game Socket.IO] Room ${roomId} deleted as all players disconnected.`);
          } else {
            updateAllPlayersState(roomId);
          }
          break;
        }
      }
    });
  });
}
