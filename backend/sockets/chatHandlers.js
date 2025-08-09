// sockets/chatHandlers.js

import { nanoid } from 'nanoid';

export default function initializeChatHandlers({ io }) {

  io.on('connection', (socket) => {
    console.log(`[Chat Socket.IO] User connected: ${socket.id}`);

    // 클라이언트가 채팅방 조인 요청 시
    socket.on('joinChatRoom', ({ roomId }) => {
      socket.join(roomId);
      console.log(`[Chat Socket.IO] Socket ${socket.id} joined chat room ${roomId}`);
    });

    // 클라이언트로부터 채팅 메시지 수신 시, type 속성을 받아 처리
    socket.on('chatMessage', ({ roomId, sender, text, type = 'user' }) => {
      console.log(`[Chat Socket.IO] Message in room ${roomId} from ${sender}: ${text}`);

      // 해당 룸의 모든 클라이언트에게 메시지 브로드캐스트
      io.to(roomId).emit('chatMessage', {
        id: nanoid(),
        sender,
        text,
        type, // 받은 type을 그대로 다시 브로드캐스트
        timestamp: Date.now()
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Chat Socket.IO] User disconnected from chat: ${socket.id}`);
    });
  });
}
