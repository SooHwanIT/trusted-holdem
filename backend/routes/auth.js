import express from 'express';
import User from '../models/User.js';
import { sign } from '../utils/jwt.js';

export default function createAuthRoutes(globalContext) {
  const router = express.Router();

  // POST /api/auth/register (회원가입)
router.post('/register', async (req, res) => {
  try {
    console.log('Backend received data:', req.body); 
    // 🚨 username 필드가 없으므로 nickname을 username으로 사용합니다.
    const { email, password, nickname, wallet } = req.body;

    // 필수 필드 확인
    if (!email || !password || !nickname || !wallet) {
      return res.status(400).json({ message: 'Email, password, nickname, and wallet are required.' });
    }

    // 이메일, 닉네임, 또는 지갑 주소 중복 확인
    // 🚨 username 필드도 중복 확인 대상에 추가합니다.
    const existingUser = await User.findOne({ $or: [{ email }, { nickname }, { wallet }, { username: nickname }] });
    if (existingUser) {
      // 닉네임이 username과 중복될 수 있으므로 메시지를 더 명확하게 변경합니다.
      return res.status(409).json({ message: 'Email, nickname, or wallet already exists.' });
    }

    // 🚨 newUser에 nickname과 동일한 값으로 username 필드를 추가합니다.
    const newUser = new User({ email, password, nickname, wallet });
    await newUser.save();

    // 응답 데이터에 'nickname'과 'wallet' 필드 추가
    res.status(201).json({
      message: 'User registered successfully.',
      user: { 
        id: newUser._id, 
        email: newUser.email, 
        nickname: newUser.nickname, 
        wallet: newUser.wallet,
        chips: newUser.chips 
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    // 에러 메시지를 좀 더 구체적으로 변경합니다.
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

  // POST /api/auth/login (로그인)
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      // JWT 토큰 생성 시 'username' 대신 'nickname' 사용
      const token = sign({ id: user._id, nickname: user.nickname });

      // 응답 데이터에 'nickname'과 'wallet' 필드 추가
      res.status(200).json({
        message: 'Logged in successfully.',
        token,
        user: { 
          id: user._id, 
          email: user.email, 
          nickname: user.nickname, 
          wallet: user.wallet, 
          chips: user.chips 
        }
      });

    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Server error during login.' });
    }
  });

  return router;
}