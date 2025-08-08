import express from 'express';
import { authMiddleware } from '../utils/jwt.js';

export default function createUserRoutes(globalContext) {
  const router = express.Router();

  // GET /api/user/me (내 정보 조회)
  // authMiddleware를 통과해야만 이 라우트 핸들러가 실행됩니다.
  router.get('/me', authMiddleware, (req, res) => {
    // authMiddleware에서 req.user에 저장한 사용자 정보를 반환합니다.
    res.status(200).json({ user: req.user });
  });

  return router;
}
