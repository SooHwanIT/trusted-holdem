/* --------------------------------------------------
 * components/ChatArea.tsx
 * -------------------------------------------------- */
import { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Socket } from 'socket.io-client';

// 메시지 타입 정의
type Message = {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
};

// 컴포넌트 props 타입 정의
interface ChatAreaProps {
    socket: Socket | null; // 👈️ 소켓 객체를 props로 받음
    roomId: string;
    nickname: string;
    messages: Message[]; // 👈️ 메시지 배열을 props로 받음
    onSendMessage: (message: string) => void; // 👈️ 메시지 전송 핸들러를 props로 받음
}

const ChatArea: React.FC<ChatAreaProps> = ({ socket, roomId, nickname, messages, onSendMessage }) => {
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [messageInput, setMessageInput] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim() !== '') {
            // 부모 컴포넌트의 메시지 전송 핸들러 호출
            onSendMessage(messageInput);
            setMessageInput('');
            if (chatInputRef.current) {
                chatInputRef.current.focus();
            }
        }
    };

    return (
        <div className="absolute bottom-4 left-4 w-64 h-96 bg-gray-800 rounded-lg shadow-lg flex flex-col p-3">
            <div className="text-white font-bold mb-2">채팅</div>
            <div className="flex-grow overflow-y-auto mb-2 p-2 bg-gray-900 rounded">
                {messages.map((msg) => (
                    <div key={msg.id} className="text-sm mb-1">
                        <span className="font-semibold text-blue-400">{msg.sender}:</span>
                        <span className="ml-1 text-gray-300">{msg.text}</span>
                    </div>
                ))}
            </div>
            <form onSubmit={handleFormSubmit} className="flex">
                <input
                    ref={chatInputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-grow p-2 rounded-l-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
                    placeholder="메시지 입력..."
                />
                <button
                    type="submit"
                    className="p-2 rounded-r-lg bg-purple-600 text-white font-semibold hover:bg-purple-700"
                >
                    전송
                </button>
            </form>
        </div>
    );
};

export default ChatArea;