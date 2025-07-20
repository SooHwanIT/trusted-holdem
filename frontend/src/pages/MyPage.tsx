import { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/Auth';

export const MyPage = () => {
    const { user, logout } = useAuth();
    const [nick, setNick] = useState(user?.nickname || '');
    const [msg, setMsg] = useState('');

    if (!user) return <p className="text-white p-10">로그인이 필요합니다.</p>;

    const save = async () => {
        await axios.patch('/api/user/me', { nickname: nick });
        setMsg('저장되었습니다!');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-20 space-y-6">
            <h2 className="text-3xl font-bold">내 프로필</h2>

            <div className="bg-gray-800 p-6 rounded w-full max-w-md space-y-4">
                <p><b>Email:</b> {user.email}</p>
                <p><b>지갑 주소:</b> {user.wallet}</p>

                <label className="block text-sm mb-1">닉네임</label>
                <input
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    className="w-full p-3 rounded-md bg-gray-900 border border-gray-700"
                />

                <Button onClick={save} className="w-full bg-purple-600 hover:bg-purple-700">저장</Button>
                {msg && <p className="text-green-400 text-sm">{msg}</p>}
            </div>

            <button onClick={logout} className="text-red-400 underline">로그아웃</button>
        </div>
    );
};
