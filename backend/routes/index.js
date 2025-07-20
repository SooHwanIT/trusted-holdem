import { Router } from 'express';
import authRoutes  from './auth.js';
import userRoutes  from './user.js';
import roomsRoutes from './rooms.js';

const router = Router();

router.use('/auth',  authRoutes);   // /api/auth/*
router.use('/user',  userRoutes);   // /api/user/*
router.use('/rooms', roomsRoutes);  // /api/rooms/*

export default router;
