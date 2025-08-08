// sockets/chatHandlers.js

export default function initializeChatHandlers({ io }) { 
  
  io.on('connection', (socket) => {
    console.log(`[Chat Socket.IO] User connected: ${socket.id}`); // 로그 변경

    // 클라이언트가 채팅방 조인 요청 시
    socket.on('joinChatRoom', ({ roomId }) => { // 룸 조인 이벤트 이름 변경 가능
        socket.join(roomId);
        console.log(`[Chat Socket.IO] Socket ${socket.id} joined chat room ${roomId}`);
    });

    // 클라이언트로부터 채팅 메시지 수신 시
    socket.on('chatMessage', ({ roomId, sender, text }) => {
      console.log(`[Chat Socket.IO] Message in room ${roomId} from ${sender}: ${text}`);
      // 해당 룸의 모든 클라이언트에게 메시지 브로드캐스트
      io.to(roomId).emit('chatMessage', { 
        id: socket.id, // 메시지 ID는 nanoid 등으로 생성하는 것이 좋습니다.
        sender, 
        text, 
        timestamp: Date.now() 
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Chat Socket.IO] User disconnected from chat: ${socket.id}`);
      // 채팅방의 경우 명시적으로 룸에서 나가는 로직이 필요 없을 수도 있습니다.
      // 필요하다면, 소켓이 속한 모든 룸에서 제거하는 로직 추가
    });
  });
}