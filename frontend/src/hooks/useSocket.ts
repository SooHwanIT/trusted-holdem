import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

export function useSocket(roomId: string, onState: (s: any) => void) {
    const socketRef = useRef<Socket>();

    useEffect(() => {
        const socket = io('http://localhost:4000');
        socketRef.current = socket;

        socket.emit('join', { roomId, name: 'Me' });
        socket.on('state', onState);
        socket.on('handFinished', (data) => console.log('Hand finished', data));

        return () => socket.disconnect();
    }, [roomId]);

    const sendAction = (payload: any) => socketRef.current?.emit('action', { roomId, ...payload });
    return { sendAction };
}
