// src/components/CreateRoomModal.tsx

import { useState } from 'react';
import { Button } from '../common/Button';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (roomDetails: { name: string; blinds: string; buyIn: number; maxPlayers: number }) => void;
};

export const CreateRoomModal = ({ isOpen, onClose, onSubmit }: Props) => {
    const [name, setName] = useState('My Poker Table');
    const [blinds, setBlinds] = useState('10/20');
    const [buyIn, setBuyIn] = useState(1000);
    const [maxPlayers, setMaxPlayers] = useState(6);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, blinds, buyIn, maxPlayers });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-white">새로운 방 만들기</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="roomName" className="block text-gray-400 mb-2">방 이름</label>
                        <input
                            id="roomName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded-md bg-gray-900 border border-gray-600 text-white focus:outline-none focus:border-purple-600"
                            required
                        />
                    </div>
                    {/* 블라인드, 바이인, 최대 인원 설정 필드 추가 */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <label htmlFor="blinds" className="block text-gray-400 mb-2">블라인드</label>
                            <input id="blinds" type="text" value={blinds} onChange={e => setBlinds(e.target.value)} className="w-full p-3 rounded-md bg-gray-900 border border-gray-600 text-white"/>
                        </div>
                        <div>
                            <label htmlFor="buyIn" className="block text-gray-400 mb-2">바이인</label>
                            <input id="buyIn" type="number" value={buyIn} onChange={e => setBuyIn(Number(e.target.value))} className="w-full p-3 rounded-md bg-gray-900 border border-gray-600 text-white"/>
                        </div>
                        <div>
                            <label htmlFor="maxPlayers" className="block text-gray-400 mb-2">최대 인원</label>
                            <input id="maxPlayers" type="number" value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="w-full p-3 rounded-md bg-gray-900 border border-gray-600 text-white"/>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        {/* '취소' 버튼: 아웃라인 스타일로 변경 */}
                        <Button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-gray-600 bg-transparent px-4 py-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                        >
                            취소
                        </Button>
                        {/* '생성하기' 버튼: 강조색(보라색) 스타일로 변경 */}
                        <Button
                            type="submit"
                            className="rounded-md border border-transparent bg-purple-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-purple-700"
                        >
                            생성하기
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
