import { useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';

const Game = () => {
  const gameRef = useRef();

  useLayoutEffect(() => {
    if (gameRef.current) return;
    gameRef.current = StartGame('game-container');

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = undefined;
    };
  }, []);

  return <div id="game-container" />;
};

export default Game;
