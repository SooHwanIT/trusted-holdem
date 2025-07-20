import { io, Socket } from 'socket.io-client';

class WebSocketService {
    private socket: Socket | null = null;
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    public connect(token: string) {
        if (this.socket && this.socket.connected) return;

        this.socket = io(this.url, {
            auth: { token: token },
            transports: ['websocket'],
        });

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server.');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from WebSocket server:', reason);
            // 재연결 로직은 socket.io가 자동으로 처리합니다.
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
        });
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public getSocket(): Socket | null {
        return this.socket;
    }
}

// 백엔드 웹소켓 서버 URL
const BACKEND_URL = 'http://localhost:3000'; // TODO: 실제 백엔드 주소로 변경
export const webSocketService = new WebSocketService(BACKEND_URL);
