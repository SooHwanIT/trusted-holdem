// hooks/useChat.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Message 인터페이스를 확장하여 'type' 속성을 추가합니다.
// type 속성은 'system' 또는 'user' 값을 가지며, 필수는 아닙니다.
export interface Message {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
    type?: 'system' | 'user'; // ✨ 수정된 부분
}

const SOCKET_URL = 'http://localhost:4000'; // 기본 서버 URL

export const useChat = (roomId: string, user: { nickname: string } | null) => {
    const chatSocketRef = useRef<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (!user || !roomId) return;

        const socket = io(SOCKET_URL + '/chat');
        chatSocketRef.current = socket;

        socket.emit('joinChatRoom', { roomId });

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

    const sendChatMessage = (text: string) => {
        if (chatSocketRef.current && user?.nickname) {
            chatSocketRef.current.emit('chatMessage', {
                roomId,
                sender: user.nickname,
                text: text,
                type: 'user' // ✨ 클라이언트에서 보낼 때는 'user'로 명시
            });
        }
    };

    return {
        chatSocket: chatSocketRef.current,
        messages,
        sendChatMessage,
    };
};
