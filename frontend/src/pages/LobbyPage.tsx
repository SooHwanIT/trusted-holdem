import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaPlus, FaUsers, FaCoins, FaTrash } from 'react-icons/fa';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/Auth';
import Header from '../components/common/Header';
type Room = {
    id: string;
    name: string;
    players: number;
    maxPlayers: number;
    blinds: string;
    buyIn: string | number;
};

// 👈️ api 인스턴스를 다시 활성화하고, baseURL을 설정합니다.
const api = axios.create({ baseURL: 'http://localhost:4000/api' });

export const LobbyPage = () => {
    const { token } = useAuth();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 👇️ 이 useEffect를 수정하여 axios 인터셉터를 사용합니다.
    useEffect(() => {
        // 요청 인터셉터 추가
        const interceptor = api.interceptors.request.use(
            (config) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log('Axios 인터셉터: 토큰 설정됨', token); // 디버깅을 위한 로그
                } else {
                    // 토큰이 없으면 Authorization 헤더를 제거합니다.
                    delete config.headers.Authorization;
                    console.log('Axios 인터셉터: 토큰 없음, 헤더 제거됨'); // 디버깅을 위한 로그
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 컴포넌트 언마운트 시 인터셉터 제거 (메모리 누수 방지)
        return () => {
            api.interceptors.request.eject(interceptor);
        };
    }, [token]); // 토큰이 변경될 때마다 인터셉터를 다시 설정합니다.


    /* ---------- REST 호출 ---------- */
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

    const createRoom = async () => {
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const name = prompt('방 이름을 입력하세요', 'My Table');
        if (!name) return;
        try {
            const { data } = await api.post('/rooms', { name });
            // 서버 응답 형태에 따라 newRoom 할당 방식 조정
            // 서버에서 newRoom 객체만 바로 반환한다면 data를 그대로 사용
            // 만약 { items: [newRoom] } 형태로 반환한다면 data.items[0] 사용
            setRooms((prev) => [...prev, data]); // 서버가 새롭게 생성된 방 객체를 직접 반환한다고 가정
        } catch (error) { // 에러 객체를 받아서 콘솔에 출력하면 디버깅에 도움이 됩니다.
            console.error('방 생성 실패:', error);
            alert('방 생성 실패');
        }
    };

    const deleteRoom = async (id: string) => {
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            await api.delete(`/rooms/${id}`);
            setRooms(prevRooms => prevRooms.filter(room => room.id !== id));
        } catch (error) { // 에러 객체를 받아서 콘솔에 출력하면 디버깅에 도움이 됩니다.
            console.error('방 삭제 실패:', error);
            alert('방 삭제 실패');
        }
    };


    /* 최초 로딩 */
    useEffect(() => { 
        fetchRooms(); 
    }, []); // 이 useEffect는 컴포넌트 마운트 시 한 번만 실행되도록 의존성 배열을 비워둡니다.

    /* ---------- UI ---------- */
    return (
        <div className="min-h-screen bg-gradient-to-br mt-12 from-gray-900 to-black text-white p-8">
             <Header/>


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