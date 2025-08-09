import { evaluateHand } from '../utils/handEvaluator.js';

/**
 * 표준 52장 카드 덱을 생성합니다.
 * @returns {{ suit: string, rank: string }[]} 52장의 카드가 담긴 정렬된 덱 배열
 */
const createDeck = () => {
    const deck = [];
    const suits = ['spades', 'clubs', 'diamonds', 'hearts'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    return deck;
};

/**
 * Fisher-Yates 셔플 알고리즘을 사용하여 카드 덱을 무작위로 섞습니다.
 * @param {{ suit: string, rank: string }[]} deck - 섞을 카드 덱 배열
 * @returns {{ suit: string, rank: string }[]} 무작위로 섞인 덱 배열
 */
const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

class PokerGame {
    constructor(roomId, smallBlind, bigBlind) {
        this.id = roomId;
        this.players = [];
        this.deck = [];
        this.community = [];
        this.pot = 0;
        this.dealer = 0;
        this.currentTurn = 0;
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.handNumber = 0;
        this.phase = 'waiting';
        this.currentTurnPlayerId = null;
        this.lastRaiserId = null;
    }

    getGameStateForPlayer(viewerId) {
        // ... 기존 로직은 그대로 유지
        return {
            phase: this.phase,
            community: this.community,
            pot: this.pot,
            dealerPos: this.dealer,
            handNumber: this.handNumber,
            currentId: this.currentTurnPlayerId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                chips: p.chips,
                bet: p.bet,
                currentRoundBet: p.currentRoundBet,
                status: p.status,
                timer: p.timer || 0,
                blind: p.blind || undefined,
                hole: (p.id === viewerId || this.phase === 'showdown') ? p.hole : [null, null],
            }))
        };
    }

    upsertPlayer({ userId, socketId, nickname, initialChips }) {
        // ... 기존 로직은 그대로 유지
        let player = this.players.find(p => p.id === userId);

        if (player) {
            player.socketId = socketId;
            player.name = nickname;
            console.log(`[PokerGame] Player ${nickname} (${userId}) reconnected. Socket ID updated to ${socketId}.`);
        } else {
            player = {
                id: userId,
                socketId: socketId,
                name: nickname,
                chips: initialChips,
                bet: 0,
                currentRoundBet: 0,
                status: 'active',
                hole: [null, null],
                blind: null,
                actedThisRound: false,
            };
            this.players.push(player);
            console.log(`[PokerGame] New player ${nickname} (${userId}) added.`);
        }
        return player;
    }

    startNewHand() {
        this.players = this.players.filter(p => p.chips > 0);
        if (this.players.length < 2) {
            console.log('[PokerGame] Not enough players with chips to start a new hand.');
            this.phase = 'waiting';
            return;
        }

        this.handNumber++;
        this.phase = 'preflop';
        this.pot = 0;
        this.community = [];
        this.deck = shuffleDeck(createDeck());
        this.lastRaiserId = null;

        // 딜러, SB, BB 위치 결정
        this.dealer = (this.dealer + 1) % this.players.length;

        const getNextActivePlayerIndex = (startIndex) => {
            let index = startIndex;
            let count = 0;
            while (this.players[index].chips === 0 && count < this.players.length) {
                index = (index + 1) % this.players.length;
                count++;
            }
            return count < this.players.length ? index : -1;
        };

        const sbPlayerIdx = getNextActivePlayerIndex((this.dealer + 1) % this.players.length);
        const bbPlayerIdx = getNextActivePlayerIndex((this.dealer + 2) % this.players.length);

        if (sbPlayerIdx === -1 || bbPlayerIdx === -1 || sbPlayerIdx === bbPlayerIdx) {
            console.error("[PokerGame] Not enough players to set blinds.");
            this.phase = 'waiting';
            return;
        }

        // 플레이어 상태 초기화
        this.players.forEach(p => {
            p.bet = 0;
            p.currentRoundBet = 0;
            p.status = p.chips > 0 ? 'active' : 'busted';
            p.hole = [this.deck.pop(), this.deck.pop()];
            p.blind = null;
            p.actedThisRound = false;
        });

        const sbPlayer = this.players[sbPlayerIdx];
        const bbPlayer = this.players[bbPlayerIdx];

        // 블라인드 처리 및 베팅
        sbPlayer.blind = 'SB';
        const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
        sbPlayer.chips -= sbAmount;
        sbPlayer.bet = sbAmount;
        sbPlayer.currentRoundBet = sbAmount;
        this.pot += sbAmount;
        if (sbPlayer.chips === 0) sbPlayer.status = 'all-in';
        sbPlayer.actedThisRound = true;

        bbPlayer.blind = 'BB';
        const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
        bbPlayer.chips -= bbAmount;
        bbPlayer.bet = bbAmount;
        bbPlayer.currentRoundBet = bbAmount;
        this.pot += bbAmount;
        if (bbPlayer.chips === 0) bbPlayer.status = 'all-in';
        bbPlayer.actedThisRound = true;

        this.lastRaiserId = bbPlayer.id; // 첫 레이즈는 빅 블라인드

        let firstToActIdx = getNextActivePlayerIndex((bbPlayerIdx + 1) % this.players.length);
        if (firstToActIdx === -1) {
            this.advancePhase();
            return;
        }

        this.currentTurn = firstToActIdx;
        this.currentTurnPlayerId = this.players[this.currentTurn].id;

        console.log(`[PokerGame] Hand ${this.handNumber} started. Dealer: ${this.players[this.dealer].name}, SB: ${sbPlayer.name} (${sbAmount}), BB: ${bbPlayer.name} (${bbAmount}). First turn: ${this.players[this.currentTurn].name}`);
    }

    handlePlayerAction(socketId, action) {
        const player = this.players.find(p => p.socketId === socketId);
        if (!player || this.players[this.currentTurn]?.socketId !== socketId) {
            console.warn(`[PokerGame] Invalid action from ${player?.name || 'unknown player'}.`);
            return;
        }

        const highestBetInRound = this.players.reduce((max, p) => Math.max(max, p.currentRoundBet), 0);
        let actionTaken = false;

        switch (action.type) {
            case 'fold':
                player.status = 'folded';
                actionTaken = true;
                break;
            case 'check':
                if (player.currentRoundBet < highestBetInRound) {
                    console.warn(`[PokerGame] ${player.name} cannot check. Must call or raise.`);
                    return;
                }
                actionTaken = true;
                break;
            case 'call':
                const callAmount = highestBetInRound - player.currentRoundBet;
                if (player.chips <= callAmount) {
                    this.pot += player.chips;
                    player.bet += player.chips;
                    player.currentRoundBet += player.chips;
                    player.chips = 0;
                    player.status = 'all-in';
                } else {
                    player.chips -= callAmount;
                    player.bet += callAmount;
                    player.currentRoundBet += callAmount;
                    this.pot += callAmount;
                }
                actionTaken = true;
                break;
            case 'raise':
                const raiseAmount = action.data;
                const minRaise = highestBetInRound > 0 ? highestBetInRound + (highestBetInRound - player.currentRoundBet) : this.bigBlind;
                const totalBetAfterRaise = player.currentRoundBet + raiseAmount;

                if (raiseAmount < this.bigBlind && this.lastRaiserId === null) {
                    console.warn(`[PokerGame] Invalid raise. First raise must be at least the big blind.`);
                    return;
                }
                if (totalBetAfterRaise < minRaise && player.chips > totalBetAfterRaise) {
                    console.warn(`[PokerGame] Invalid raise. Must be at least ${minRaise}.`);
                    return;
                }
                if (player.chips < raiseAmount) {
                    console.warn(`[PokerGame] Not enough chips for this raise.`);
                    return;
                }

                player.chips -= raiseAmount;
                player.bet += raiseAmount;
                player.currentRoundBet += raiseAmount;
                this.pot += raiseAmount;
                if (player.chips === 0) player.status = 'all-in';

                this.lastRaiserId = player.id;
                actionTaken = true;
                break;
            default:
                console.warn(`[PokerGame] Unknown action type: ${action.type}`);
                return;
        }

        if (actionTaken) {
            player.actedThisRound = true;
            this.moveToNextTurn();
        }
    }

    moveToNextTurn() {
        const activePlayers = this.players.filter(p => p.status === 'active' || p.status === 'all-in');
        if (activePlayers.length <= 1) {
            this.advancePhase();
            return;
        }

        let nextPlayerFound = false;
        let loopCount = 0;
        const maxLoop = this.players.length * 2;

        while (!nextPlayerFound && loopCount < maxLoop) {
            this.currentTurn = (this.currentTurn + 1) % this.players.length;
            const nextPlayer = this.players[this.currentTurn];

            if (nextPlayer.status === 'active') {
                nextPlayerFound = true;
            }
            loopCount++;
        }
        this.currentTurnPlayerId = this.players[this.currentTurn].id;

        // 라운드 종료 조건 체크
        this.checkRoundEnd();
    }

    checkRoundEnd() {
        const activePlayers = this.players.filter(p => p.status === 'active' || p.status === 'all-in');

        // 남은 플레이어가 1명 이하일 경우 즉시 다음 페이즈로
        if (activePlayers.length <= 1) {
            this.advancePhase();
            return;
        }

        // 올인하지 않은 플레이어 중 가장 많이 베팅한 금액
        const highestBetInRound = this.players.filter(p => p.status !== 'folded').reduce((max, p) => Math.max(max, p.currentRoundBet), 0);

        // 모든 액티브 플레이어가 최고 베팅액과 동일하게 베팅했는지 확인
        const allCalled = this.players
            .filter(p => p.status === 'active' && p.chips > 0)
            .every(p => p.currentRoundBet === highestBetInRound);

        // 현재 턴 플레이어가 마지막으로 레이즈한 사람인 경우
        const hasCircleCompleted = this.lastRaiserId === this.players[this.currentTurn].id;

        // 프리플랍 라운드에서 빅 블라인드 플레이어가 레이즈가 없는 경우 (체크 또는 콜)
        const isPreflopAndBBsTurn = this.phase === 'preflop' && this.players[this.currentTurn].blind === 'BB';

        // 베팅 라운드가 완료되었는지 확인
        if (allCalled && (hasCircleCompleted || isPreflopAndBBsTurn)) {
            this.advancePhase();
        }
    }

    advancePhase() {
        this.lastRaiserId = null;
        this.players.forEach(p => {
            p.currentRoundBet = 0;
            p.actedThisRound = false;
            if (p.chips > 0 && p.status !== 'folded' && p.status !== 'all-in') {
                p.status = 'active';
            }
        });

        switch (this.phase) {
            case 'preflop':
                this.community.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
                this.phase = 'flop';
                console.log('[PokerGame] Advancing to Flop.');
                break;
            case 'flop':
                this.community.push(this.deck.pop());
                this.phase = 'turn';
                console.log('[PokerGame] Advancing to Turn.');
                break;
            case 'turn':
                this.community.push(this.deck.pop());
                this.phase = 'river';
                console.log('[PokerGame] Advancing to River.');
                break;
            case 'river':
                this.phase = 'showdown';
                console.log('[PokerGame] Advancing to Showdown.');
                this.endHand();
                return;
            default:
                console.log('[PokerGame] Already in showdown or waiting, ending hand.');
                this.endHand();
                return;
        }

        // 다음 라운드 시작
        let firstToActIdx = (this.dealer + 1) % this.players.length;
        let loopCount = 0;
        const maxLoop = this.players.length * 2;
        while(this.players[firstToActIdx].status !== 'active' && loopCount < maxLoop) {
            firstToActIdx = (firstToActIdx + 1) % this.players.length;
            loopCount++;
        }
        if (this.players[firstToActIdx]?.status !== 'active') {
            // 더 이상 베팅할 플레이어가 없으면 즉시 쇼다운으로
            console.warn("[PokerGame] No active players found, forcing showdown.");
            while (this.community.length < 5) {
                this.community.push(this.deck.pop());
            }
            this.endHand();
            return;
        }
        this.currentTurn = firstToActIdx;
        this.currentTurnPlayerId = this.players[this.currentTurn]?.id || null;
        console.log(`[PokerGame] Next phase starting. First turn: ${this.players[this.currentTurn]?.name}`);
    }

    endHand() {
        this.phase = 'showdown';

        const activeOrAllInPlayers = this.players.filter(p => p.status !== 'folded' && (p.chips > 0 || p.bet > 0));
        let winner = null;
        let winningHand = null;

        if (activeOrAllInPlayers.length === 1) {
            winner = activeOrAllInPlayers[0];
        } else if (activeOrAllInPlayers.length > 1) {
            let bestPlayerHand = null;
            let potentialWinners = [];

            for (const player of activeOrAllInPlayers) {
                const playerHand = evaluateHand([...player.hole, ...this.community]);

                if (!bestPlayerHand || playerHand.rank > bestPlayerHand.rank) {
                    bestPlayerHand = playerHand;
                    potentialWinners = [player];
                } else if (playerHand.rank === bestPlayerHand.rank) {
                    const kickerComparison = this.compareKickers(playerHand.kickers, bestPlayerHand.kickers);
                    if (kickerComparison > 0) {
                        bestPlayerHand = playerHand;
                        potentialWinners = [player];
                    } else if (kickerComparison === 0) {
                        potentialWinners.push(player);
                    }
                }
            }
            winningHand = bestPlayerHand;
            winner = potentialWinners.length === 1 ? potentialWinners[0] : null;
        }

        // 팟 분배 로직
        if (winner) {
            winner.chips += this.pot;
            console.log(`[PokerGame] Winner of hand ${this.handNumber}: ${winner.name} (won ${this.pot} chips) with ${winningHand?.name}.`);
        } else if (potentialWinners.length > 1) {
            const splitAmount = Math.floor(this.pot / potentialWinners.length);
            const remainder = this.pot % potentialWinners.length;
            potentialWinners.forEach((p, index) => {
                let amount = splitAmount;
                if (index === 0) amount += remainder;
                p.chips += amount;
            });
            console.log(`[PokerGame] Pot of ${this.pot} was split among ${potentialWinners.length} players.`);
        } else {
            console.log(`[PokerGame] No clear winner for hand ${this.handNumber}. Hand cancelled.`);
        }

        const roundData = {
            roomId: this.id,
            handNumber: this.handNumber,
            players: this.players.map(p => ({
                userId: p.id,
                nickname: p.name,
                chipsBefore: p.chips - (p.bet) + (winner && p.id === winner.id ? this.pot : 0),
                chipsAfter: p.chips,
                status: p.status,
                holeCards: p.hole,
                handResult: evaluateHand([...p.hole, ...this.community])
            })),
            communityCards: this.community,
            pot: this.pot,
            winnerId: winner ? winner.id : null,
        };

        this.pot = 0;
        this.players.forEach(p => {
            p.bet = 0;
            p.currentRoundBet = 0;
            p.actedThisRound = false;
            p.hole = [null, null];
            p.blind = null;
            if (p.chips > 0) p.status = 'active';
            else p.status = 'busted';
        });

        return roundData;
    }

    compareKickers(kickersA, kickersB) {
        for (let i = 0; i < Math.min(kickersA.length, kickersB.length); i++) {
            if (kickersA[i] > kickersB[i]) return 1;
            if (kickersA[i] < kickersB[i]) return -1;
        }
        return 0;
    }

    getGameState() {
        return {
            phase: this.phase,
            community: this.community,
            pot: this.pot,
            dealerPos: this.dealer,
            handNumber: this.handNumber,
            currentId: this.currentTurnPlayerId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                chips: p.chips,
                bet: p.bet,
                currentRoundBet: p.currentRoundBet,
                status: p.status,
                timer: p.timer || 0,
                blind: p.blind || undefined,
                hole: this.phase === 'showdown' ? p.hole : [null, null],
            }))
        };
    }
}

export default PokerGame;
