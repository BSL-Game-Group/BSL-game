export const notifyRoomEntry = async (roomKey) => {
    try {
        const sessionId = window.__gameData?.sessionId;
        if (!sessionId) {
            return;
        }

        const response = await fetch('/api/rooms/enter', {
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