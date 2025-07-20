import { create } from 'zustand';
import { FrontendGameState } from '../types';

interface GameState {
    gameState: FrontendGameState | null;
    setGameState: (state: FrontendGameState) => void;
    // TODO: 여기에 다른 게임 관련 상태 및 액션을 추가할 수 있습니다.
}

export const useGameStore = create<GameState>((set) => ({
    gameState: null,
    setGameState: (state) => set({ gameState: state }),
}));
