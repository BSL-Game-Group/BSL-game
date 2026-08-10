export const getBackendUrl = () => {
    if (process.env.VITE_API_URL) {
        return process.env.VITE_API_URL;
    }
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return `${protocol}//backend:3001`;
    }
    return 'http://localhost:3001';
};

export const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const notifyRoomEntry = async (roomKey) => {
    try {
        const sessionId = window.__gameData?.sessionId;
        if (!sessionId) {
            return;
        }

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/rooms/enter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                room_key: roomKey,
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            return;
        }

        await response.json();
    } catch (error) {
        // Silently fail - room entry is not critical to gameplay
    }
};