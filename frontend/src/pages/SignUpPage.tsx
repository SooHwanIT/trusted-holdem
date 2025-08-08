import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/Auth';

export const SignUpPage = () => {
    const nav = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '', nickname: '', wallet: '' });
    const [err, setErr] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/auth/register', form);
            console.log('Frontend sending data:', form); 
            login(data.token);
            nav('/');
        } catch (ex: any) {
            setErr(ex.response?.data?.error || '회원가입 실패');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-4">
            <div className="p-8 bg-gray-800 bg-opacity-40 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-6">회원가입</h2>

                {err && <p className="text-red-400 text-sm mb-3">{err}</p>}

                <form className="space-y-5" onSubmit={submit}>
                    {['email', 'password', 'nickname', 'wallet'].map((k) => (
                        <div key={k}>
                            <label className="block text-sm mb-1">{k}</label>
                            <input
                                type={k === 'password' ? 'password' : 'text'}
                                value={(form as any)[k]}
                                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                                className="w-full p-3 rounded-md bg-gray-900 border border-gray-700"
                            />
                        </div>
                    ))}
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                        회원가입
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm">
                    이미 계정이 있으신가요?{' '}
                    <Link to="/login" className="text-purple-400 hover:underline">로그인</Link>
                </p>
            </div>
        </div>
    );
};
