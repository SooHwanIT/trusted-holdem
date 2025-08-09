/* --------------------------------------------------
 * components/ChatArea.tsx
 * -------------------------------------------------- */
import { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { Socket } from 'socket.io-client';

// 'useChat' 훅에서 정의한 Message 인터페이스를 import하여 사용
import type { Message } from '../hooks/useChat';

interface ChatAreaProps {
    socket: Socket | null;
    roomId: string;
    nickname: string;
    messages: Message[];
    onSendMessage: (message: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ socket, roomId, nickname, messages, onSendMessage }) => {
    const chatInputRef = useRef<HTMLInputElement>(null);
    const [messageInput, setMessageInput] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim() !== '') {
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
                    // ✨ sender가 'system'인지 확인하는 조건으로 변경
                    <div
                        key={msg.id}
                        className={`text-sm mb-1 ${msg.sender === 'system' ? 'text-gray-400 italic text-center' : ''}`}
                    >
                        {msg.sender === 'system' ? (
                            <span>{msg.text}</span>
                        ) : (
                            <>
                                <span className="font-semibold text-blue-400">{msg.sender}:</span>
                                <span className="ml-1 text-gray-300">{msg.text}</span>
                            </>
                        )}
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
