import express from 'express';
import createAuthRoutes from './auth.js';
import createUserRoutes from './user.js';
import createRoomRoutes from './rooms.js';

// server.js에서 전달받은 전역 객체(rooms, engines, io)를 각 라우터에 전달
export default function createRouter(globalContext) {
  const router = express.Router();

  router.use('/auth', createAuthRoutes(globalContext));
  router.use('/user', createUserRoutes(globalContext));
  router.use('/rooms', createRoomRoutes(globalContext));

  return router;
}
