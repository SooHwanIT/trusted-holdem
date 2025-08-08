// hooks/useChat.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import type { Message } from '../types/game'; // 또는 '../types/socket'

const SOCKET_URL = 'http://localhost:4000'; // 기본 서버 URL

export const useChat = (roomId: string, user: { nickname: string } | null) => {
    const chatSocketRef = useRef<Socket | null>(null); // 이름 변경: chatSocketRef
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (!user || !roomId) return;
        
        // ✅ 채팅 네임스페이스로 연결
        const socket = io(SOCKET_URL + '/chat'); 
        chatSocketRef.current = socket;

        // 채팅 룸 조인 (서버의 joinChatRoom 이벤트와 매칭)
        socket.emit('joinChatRoom', { roomId }); 

        // 'chatMessage' 이벤트 리스너
        socket.on('chatMessage', (message: Message) => {
            console.log(`[Chat Client] Received 'chatMessage' event:`, message);
            setMessages((prev) => [...prev, message]);
        });
        
        


        
        return () => {
            if (chatSocketRef.current) {
                console.log(`[Chat Client] Disconnecting chat socket for room ${roomId}`);
                chatSocketRef.current.disconnect();
            }
        };
    }, [roomId, user]);

    // 채팅 메시지 전송 함수
    const sendChatMessage = (text: string) => {
        if (chatSocketRef.current && user?.nickname) {
            chatSocketRef.current.emit('chatMessage', { 
                roomId,
                sender: user.nickname,
                text: text
            });
        }
    };

    return {
        chatSocket: chatSocketRef.current, // 이름 변경: chatSocket
        messages,
        sendChatMessage,
    };
};