import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaUsers, FaCoins, FaTrash } from 'react-icons/fa';
import { Button } from '../components/common/Button';

type Room = {
    id: string;
    name: string;
    players: number;
    maxPlayers: number;
    blinds: string;
    buyIn: string | number;
};

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

export const LobbyPage = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* ---------- REST 호출 ---------- */
    const fetchRooms = async () => {
        try {
            const { data } = await api.get('/rooms');
            setRooms(data.items);
        } catch (err) {
            setError('방 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const createRoom = async () => {
        const name = prompt('방 이름을 입력하세요', 'My Table');
        if (!name) return;
        try {
            const { data } = await api.post('/rooms', { name });
            setRooms((prev) => [...prev, data]);
        } catch {
            alert('방 생성 실패');
        }
    };

    const deleteRoom = async (id: string) => {
        if (!window.confirm('정말 삭제할까요?')) return;
        try {
            await api.delete(`/rooms/${id}`);
            setRooms((prev) => prev.filter((r) => r.id !== id));
        } catch {
            alert('삭제 실패');
        }
    };

    /* 최초 로딩 */
    useEffect(() => { fetchRooms(); }, []);

    /* ---------- UI ---------- */
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-8">
            <header className="flex flex-col sm:flex-row items-center justify-between mb-12 max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold mb-4 sm:mb-0">Game Lobby</h1>

                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="방 검색..."
                        className="p-3 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-purple-600"
                        disabled
                    />
                    <Button onClick={createRoom} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                        <FaPlus /> 방 만들기
                    </Button>
                </div>
            </header>

            {loading && <p className="text-center text-gray-400">Loading…</p>}
            {error && <p className="text-center text-red-500">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {rooms.map((room) => (
                    <div
                        key={room.id}
                        className="relative p-6 bg-gray-800 bg-opacity-60 rounded-xl shadow-lg border border-gray-700 transition-transform transform hover:scale-[1.02]"
                    >
                        {/* 삭제 버튼 (예시로 모든 방에 노출) */}
                        <button
                            onClick={() => deleteRoom(room.id)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                            title="삭제"
                        >
                            <FaTrash />
                        </button>

                        <h3 className="text-2xl font-bold mb-2">{room.name}</h3>
                        <div className="text-gray-400 mb-4 text-sm">
                            <p>
                                <FaUsers className="inline mr-2 text-blue-400" />
                                <span className="font-semibold">{room.players}</span> / {room.maxPlayers} 명
                            </p>
                            <p>
                                <FaCoins className="inline mr-2 text-yellow-400" />
                                블라인드 ${room.blinds} | 최소 바이인 ${room.buyIn}
                            </p>
                        </div>

                        <Link to={`/game/${room.id}`} className="block">
                            <Button
                                className={`w-full ${room.players === room.maxPlayers
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                                disabled={room.players === room.maxPlayers}
                            >
                                {room.players === room.maxPlayers ? '입장 불가 (꽉 참)' : '입장하기'}
                            </Button>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};
