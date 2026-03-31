import { io, Socket } from 'socket.io-client';
import { CONFIG } from '../config';
import { getToken } from '../storage/tokenStorage';

let socket: Socket | null = null;

export const getSocket = async (): Promise<Socket> => {
    if (!socket) {
        const token = await getToken();
        
        socket = io(CONFIG.BASE_URL, {
            transports: ['websocket'],
            autoConnect: false,
            extraHeaders: {
                Authorization: token ? `Bearer ${token}` : '',
            },
            // Add other options if needed, like query params
            // query: { token }
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.io server');
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from Socket.io server:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
    }

    return socket;
};

export const connectSocket = async () => {
    const s = await getSocket();
    if (!s.connected) {
        s.connect();
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinStreamRoom = (streamId: string | number) => {
    if (socket) {
        socket.emit('join_stream', streamId);
    }
};

export const leaveStreamRoom = (streamId: string | number) => {
    if (socket) {
        socket.emit('leave_stream', streamId);
    }
};

export const sendLiveComment = (streamId: string | number, comment: { username: string; message: string; profile_image: string }) => {
    if (socket) {
        socket.emit('send_comment', { stream_id: streamId, ...comment });
    }
};
