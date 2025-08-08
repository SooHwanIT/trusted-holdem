import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * JWT 토큰 생성
 * @param {object} payload - 토큰에 담을 정보 (e.g., { id: user._id })
 * @returns {string} - 생성된 JWT 토큰
 */
export const sign = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '1d', // 토큰 유효 기간: 1일
  });
};

/**
 * JWT 토큰 검증
 * @param {string} token - 검증할 JWT 토큰
 * @returns {object|null} - 디코딩된 페이로드 또는 null
 */
export const verify = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
};

/**
 * Express 라우트 인증 미들웨어
 * 헤더의 토큰을 검증하고, 유효하면 req.user에 사용자 정보를 추가합니다.
 */
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verify(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }

  try {
    // 토큰의 id를 사용하여 사용자 정보를 DB에서 조회 (비밀번호 제외)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    req.user = user; // 요청 객체에 사용자 정보 주입
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error during authentication.' });
  }
};


export function auth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: '인증 헤더가 없습니다.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: '인증 토큰이 누락되었습니다.' });
    }

    try {
        // 👇️ 토큰의 서명을 검증하고, 페이로드를 추출합니다.
        const decoded = jwt.verify(token, JWT_SECRET); 
        
        // 유효성이 검증된 유저 정보를 req.user에 할당합니다.
        // decoded 객체에는 로그인 시 토큰에 담았던 정보가 들어있습니다.
        req.user = decoded; 
        
        next(); // 다음 미들웨어 또는 라우터로 진행
    } catch (err) {
        // 서명 위조, 만료 등 유효성 검증에 실패한 경우
        console.error('JWT 검증 실패:', err);
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
}