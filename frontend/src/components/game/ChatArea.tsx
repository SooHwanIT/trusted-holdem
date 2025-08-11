import React, { useState, useEffect, useRef, FC } from 'react';

export interface ChatAreaProps {
    messages: { id: string, sender: string, text: string }[];
    nickname: string;
    onSendMessage: (message: string) => void;
}

const ChatArea: FC<ChatAreaProps> = ({ messages, nickname, onSendMessage }) => {
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (messageInput.trim() !== '') {
            onSendMessage(messageInput);
            setMessageInput('');
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex-grow overflow-y-auto pr-2">
                {messages.map((msg) => (
                    <div key={msg.id} className={`text-sm mb-2 break-words ${msg.sender === 'system' ? 'text-center italic text-white/60' : ''}`}>
                        {msg.sender === 'system' ? msg.text : <><span className="font-semibold text-purple-300">{msg.sender}:</span> <span className="text-white/90 ml-1">{msg.text}</span></>}
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleFormSubmit} className="flex pt-2">
                <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} className="flex-grow rounded-l-md border-none bg-black/30 p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="메시지 입력..." />
                <button type="submit" className="rounded-r-md bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-700">전송</button>
            </form>
        </div>
    );
};

export default ChatArea;
