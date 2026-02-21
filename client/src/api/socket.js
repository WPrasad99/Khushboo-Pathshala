import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001';

// Create socket instance
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
});

// Connect socket with authentication
export const connectSocket = (token, userId) => {
    if (socket.connected) return;

    socket.auth = { token };
    socket.connect();

    socket.on('connect', () => {
        console.log('Socket connected');
        // Join user's personal room
        socket.emit('join', userId);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });
};

// Disconnect socket
export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};

export default socket;
