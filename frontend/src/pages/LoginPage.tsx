import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FaSignInAlt } from 'react-icons/fa';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/Auth';

export const LoginPage = () => {
    const nav = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/auth/login', { email, password: pw });
            login(data.token);
            nav('/mypage');
        } catch {
            setErr('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
            <div className="p-8 bg-gray-800 bg-opacity-40 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-6">로그인</h2>

                {err && <p className="text-red-400 text-sm mb-3">{err}</p>}

                <form className="space-y-6" onSubmit={submit}>
                    <div>
                        <label className="block text-sm mb-1">이메일</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)}
                               className="w-full p-3 rounded-md bg-gray-900 border border-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">비밀번호</label>
                        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                               className="w-full p-3 rounded-md bg-gray-900 border border-gray-700" />
                    </div>
                    <Button type="submit" className="w-full flex justify-center gap-2 bg-purple-600">
                        <FaSignInAlt /> 로그인
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                    계정이 없으신가요?{' '}
                    <Link to="/signup" className="text-purple-400 hover:underline">회원가입</Link>
                </div>
            </div>
        </div>
    );
};
