import { generateSessionId, notifyRoomEntry } from '../src/game/services/tracking';

describe('Tracking Service', () => {
  
  describe('notifyRoomEntry', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch = jest.fn();
      delete window.__gameData;
    });

    test('sends room entry notification when sessionId is present', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) };
      global.fetch.mockResolvedValue(mockResponse);
      window.__gameData = { sessionId: 'test-session-123' };

      await notifyRoomEntry('bsl-2');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rooms/enter'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_key: 'bsl-2',
            session_id: 'test-session-123',
          }),
        })
      );
      expect(mockResponse.json).toHaveBeenCalled();
    });

    test('does nothing when sessionId is not present', async () => {
      await notifyRoomEntry('bsl-2');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('does nothing when fetch response is not ok', async () => {
      const mockResponse = { ok: false, json: jest.fn() };
      global.fetch.mockResolvedValue(mockResponse);
      window.__gameData = { sessionId: 'test-session-123' };

      await notifyRoomEntry('bsl-2');

      expect(global.fetch).toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    test('silently fails on fetch error', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      window.__gameData = { sessionId: 'test-session-123' };

      // Should not throw
      await expect(notifyRoomEntry('bsl-2')).resolves.not.toThrow();
    });
  });

  describe('generateSessionId', () => {
    test('generates unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(id1).not.toEqual(id2);
    });
  });

});