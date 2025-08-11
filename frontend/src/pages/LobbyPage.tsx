import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client'; // 실시간 통신
import { motion, AnimatePresence } from 'framer-motion'; // 애니메이션
import { FaPlus, FaUsers, FaCoins, FaTrash } from 'react-icons/fa';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/Auth';
import Header from '../components/common/Header';
import { CreateRoomModal } from '../components/lobby/CreateRoomModal'; // 새로 만든 모달

// --- 타입 정의 ---
type Room = {
    id: string;
    name: string;
    players: number;
    maxPlayers: number;
    blinds: string;
    buyIn: string | number;
};

// --- API 및 소켓 설정 ---
const api = axios.create({ baseURL: 'http://localhost:4000/api' });
// 실제 프로덕션에서는 환경변수 사용
const socket: Socket = io('http://localhost:4000'); // 서버의 소켓 주소

export const LobbyPage = () => {
    const { token } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- UI 상태 ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Axios 인터셉터 (기존 코드 유지) ---
    useEffect(() => {
        const interceptor = api.interceptors.request.use(
            (config) => {
                if (token) config.headers.Authorization = `Bearer ${token}`;
                else delete config.headers.Authorization;
                return config;
            },
            (error) => Promise.reject(error)
        );
        return () => api.interceptors.request.eject(interceptor);
    }, [token]);

    // --- 데이터 패칭 및 실시간 업데이트 ---
    useEffect(() => {
        // 1. 초기 데이터 로드
        const fetchRooms = async () => {
            try {
                const { data } = await api.get('/rooms');
                setRooms(data.items || []);
            } catch (err) {
                setError('방 목록을 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();

        // 2. WebSocket 이벤트 리스너 설정
        socket.on('connect', () => console.log('Socket connected!'));
        socket.on('newRoom', (newRoom: Room) => {
            setRooms((prev) => [...prev, newRoom]);
        });
        socket.on('roomUpdated', (updatedRoom: Room) => {
            setRooms((prev) => prev.map(room => room.id === updatedRoom.id ? updatedRoom : room));
        });
        socket.on('roomDeleted', (roomId: string) => {
            setRooms((prev) => prev.filter(room => room.id !== roomId));
        });

        // 3. 컴포넌트 언마운트 시 소켓 연결 해제
        return () => {
            socket.off('connect');
            socket.off('newRoom');
            socket.off('roomUpdated');
            socket.off('roomDeleted');
        };
    }, []);

    // --- CRUD 함수 (API 호출) ---
    const handleCreateRoom = async (roomDetails: { name: string; blinds: string; buyIn: number; maxPlayers: number }) => {
        if (!token) return alert('로그인이 필요합니다.'); // 혹은 토스트 알림
        try {
            // 서버에 방 생성 요청, 성공 시 서버가 socket.io를 통해 모든 클라이언트에 'newRoom' 이벤트를 보낼 것임
            await api.post('/rooms', roomDetails);
            // setRooms 로직은 socket.io가 처리하므로 여기선 필요 없음
        } catch (error) {
            console.error('방 생성 실패:', error);
            alert('방 생성 실패'); // 혹은 토스트 알림
        }
    };

    const deleteRoom = async (id: string) => {
        if (!token) return alert('로그인이 필요합니다.');
        try {
            // 서버에 방 삭제 요청, 성공 시 서버가 socket.io를 통해 모든 클라이언트에 'roomDeleted' 이벤트를 보낼 것임
            await api.delete(`/rooms/${id}`);
        } catch (error) {
            console.error('방 삭제 실패:', error);
            alert('방 삭제 실패');
        }
    };

    // --- 검색 기능: useMemo로 최적화 ---
    const filteredRooms = useMemo(() => {
        return rooms.filter(room =>
            room.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [rooms, searchTerm]);


    // --- UI 렌더링 ---
    return (
        <>
            <CreateRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateRoom}
            />
            <div
                className="min-h-screen bg-cover bg-center bg-fixed text-white p-8 mt-4"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541149221148-31b36934c56e?q=80&w=2671&auto=format&fit=crop')" }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>
                <div className="relative z-10">
                    <Header />
                    <main className="max-w-7xl mx-auto mt-12">
                        <header className="flex flex-col sm:flex-row items-center justify-between mb-12">
                            <h1 className="text-5xl font-bold mb-4 sm:mb-0" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                Game Lobby
                            </h1>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="text"
                                    placeholder="방 검색..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="p-3 rounded-md bg-gray-800 bg-opacity-80 border border-gray-700 text-white focus:outline-none focus:border-purple-600 transition-colors"
                                />
                                <Button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 rounded-md border border-purple-500 bg-transparent px-4 py-3 text-purple-400 transition-all duration-300 ease-in-out hover:border-transparent hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                                >
                                    <FaPlus /> 방 만들기
                                </Button>
                            </div>
                        </header>

                        {loading && <p className="text-center text-gray-300">방 목록을 불러오는 중...</p>}
                        {error && <p className="text-center text-red-500">{error}</p>}

                        <AnimatePresence>
                            <motion.div
                                layout
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredRooms.map((room) => (
                                    <motion.div
                                        layout
                                        key={room.id}
                                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="relative p-6 bg-gray-900 bg-opacity-70 rounded-xl shadow-lg border border-gray-700 backdrop-blur-sm transition-transform transform hover:scale-[1.03] hover:border-purple-500"
                                    >
                                        <button onClick={() => deleteRoom(room.id)} className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition-colors" title="삭제">
                                            <FaTrash />
                                        </button>
                                        <h3 className="text-2xl font-bold mb-3 truncate">{room.name}</h3>
                                        <div className="space-y-2 text-gray-300 mb-5">
                                            <p className="flex items-center"><FaUsers className="mr-3 text-blue-400" /> <span className="font-semibold">{room.players}</span> / {room.maxPlayers} 명</p>
                                            <p className="flex items-center"><FaCoins className="mr-3 text-yellow-400" /> 블라인드 ${room.blinds} | 바이인 ${room.buyIn}</p>
                                        </div>
                                        <Link to={`/game/${room.id}`} className="block">
                                            <Button
                                                className={`w-full rounded-lg py-3 font-semibold text-white shadow-md transition-all duration-300 ease-in-out
        ${
                                                    room.players >= room.maxPlayers
                                                        ? 'cursor-not-allowed bg-gray-700 text-gray-400'
                                                        : 'transform bg-gradient-to-r from-purple-600 to-indigo-600 hover:-translate-y-0.5 hover:shadow-lg'
                                                }
    `}
                                                disabled={room.players >= room.maxPlayers}
                                            >
                                                {room.players >= room.maxPlayers ? '입장 불가' : '테이블 참가'}
                                            </Button>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </>
    );
};
