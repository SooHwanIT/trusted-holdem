// Enums for standard card ranks, suits, game rounds, and player actions.
export enum CardSuit {
    Spades = 'spades',
    Clubs = 'clubs',
    Diamonds = 'diamonds',
    Hearts = 'hearts',
}

export enum CardRank {
    Two = '2',
    Three = '3',
    Four = '4',
    Five = '5',
    Six = '6',
    Seven = '7',
    Eight = '8',
    Nine = '9',
    Ten = '10',
    Jack = 'J',
    Queen = 'Q',
    King = 'K',
    Ace = 'A',
}

export enum PlayerActionType {
    Bet = 'bet',
    Call = 'call',
    Fold = 'fold',
    Raise = 'raise',
    Check = 'check',
}

export enum GameRound {
    Preflop = 'preflop',
    Flop = 'flop',
    Turn = 'turn',
    River = 'river',
    Showdown = 'showdown',
}

// Data models for the game.
export type Card = {
    suit: CardSuit;
    rank: CardRank;
};

export type PlayerState = {
    id: string;
    username: string;
    chipStack: number;
    seatNumber: number;
    isDealer: boolean;
    isSmallBlind: boolean;
    isBigBlind: boolean;
    isCurrentPlayer: boolean;
    currentBet: number;
    isFolded: boolean;
    isAllIn: boolean;
    hand: Card[] | null;
};

export type FrontendGameState = {
    roomId: string;
    maxPlayers: number;
    status: 'waiting' | 'playing' | 'finished';
    handId: string;
    round: GameRound;
    communityCards: Card[];
    pot: number;
    players: PlayerState[];
    currentPlayerId: string;
    lastRaiseAmount: number;
};
