// backend/game/PokerGame.js

// 'handEvaluator.js' 모듈에서 카드 족보를 평가하는 함수를 가져옵니다.
// 이 함수는 플레이어의 패와 커뮤니티 카드를 조합하여 최종 족보를 계산하는 데 사용됩니다.
import { evaluateHand } from '../utils/handEvaluator.js';

// --- 헬퍼 함수 정의 ---
// PokerGame 클래스 내부에서 사용되지만, 재사용성과 가독성을 위해 별도로 분리했습니다.

/**
 * 표준 52장 카드 덱을 생성합니다.
 * 각 카드는 '무늬-랭크' (예: 'spades-A', 'hearts-10') 형식의 문자열로 표현됩니다.
 * @returns {string[]} 52장의 카드가 담긴 정렬된 덱 배열
 */
const createDeck = () => {
    const deck = []; // 빈 덱 배열을 초기화합니다.
    const suits = ['spades', 'clubs', 'diamonds', 'hearts']; // 4가지 카드 무늬를 정의합니다.
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']; // 13가지 카드 랭크를 정의합니다.

    // 모든 무늬와 랭크의 조합으로 카드를 생성하여 덱에 추가합니다.
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(`${suit}-${rank}`); // 예: 'spades-2', 'spades-3', ..., 'hearts-A'
        }
    }
    return deck; // 완성된 덱을 반환합니다.
};

/**
 * Fisher-Yates 셔플 알고리즘을 사용하여 카드 덱을 무작위로 섞습니다.
 * @param {string[]} deck - 섞을 카드 덱 배열
 * @returns {string[]} 무작위로 섞인 덱 배열
 */
const shuffleDeck = (deck) => {
    // 덱의 마지막 카드부터 첫 번째 카드까지 역순으로 반복합니다.
    for (let i = deck.length - 1; i > 0; i--) {
        // 현재 인덱스(i)부터 0까지의 범위 내에서 무작위 인덱스(j)를 선택합니다.
        const j = Math.floor(Math.random() * (i + 1));
        // 현재 카드(deck[i])와 무작위로 선택된 카드(deck[j])의 위치를 교환합니다.
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck; // 섞인 덱을 반환합니다.
};

// --- PokerGame 클래스 정의 ---
// 이 클래스는 포커 게임의 현재 상태를 관리하고, 게임 진행 로직을 처리합니다.
class PokerGame {
    /**
     * 새로운 포커 게임 인스턴스를 생성합니다.
     * @param {string} roomId - 게임이 진행될 방의 고유 ID
     * @param {number} smallBlind - 스몰 블라인드 금액
     * @param {number} bigBlind - 빅 블라인드 금액 (일반적으로 스몰 블라인드의 두 배)
     */
    constructor(roomId, smallBlind, bigBlind) {
        this.id = roomId; // 현재 게임 방의 ID
        this.players = []; // 게임에 참여한 플레이어 객체들의 배열
        this.deck = []; // 현재 사용될 카드 덱
        this.community = []; // 테이블에 공개된 커뮤니티 카드 (플롭, 턴, 리버)
        this.pot = 0; // 현재 라운드에 모인 총 칩 (팟)
        this.dealer = 0; // 딜러 버튼을 가진 플레이어의 인덱스 (players 배열 내)
        this.currentTurn = 0; // 현재 차례인 플레이어의 인덱스
        this.smallBlind = smallBlind; // 스몰 블라인드 금액
        this.bigBlind = bigBlind; // 빅 블라인드 금액
        this.handNumber = 0; // 현재 진행 중인 핸드(게임)의 번호
        // 게임의 현재 진행 단계 (예: 'waiting', 'preflop', 'flop', 'turn', 'river', 'showdown')
        // 이전에 사용하던 Enum 대신 직접 문자열 리터럴을 사용합니다.
        this.phase = 'waiting';
        this.currentTurnPlayerId = null; // 현재 턴 플레이어의 ID
        this.lastRaiserId = null; // 마지막으로 레이즈한 플레이어의 ID (베팅 라운드 종료 조건에 사용)
        this.roundBets = {}; // 각 플레이어의 이번 라운드 베팅 금액을 저장 (현재는 사용되지 않으나, 향후 확장성을 위해 유지)
    }

    /**
     * 게임에 플레이어를 추가하거나 기존 플레이어의 소켓 ID를 업데이트합니다.
     * @param {object} playerInfo - 플레이어 정보 객체
     * @param {string} playerInfo.userId - 플레이어의 고유 사용자 ID
     * @param {string} playerInfo.socketId - 플레이어의 현재 소켓 ID
     * @param {string} playerInfo.nickname - 플레이어의 닉네임
     * @param {number} playerInfo.initialChips - 플레이어의 초기 칩 금액
     * @returns {object} 업데이트되거나 새로 생성된 플레이어 객체
     */
    upsertPlayer({ userId, socketId, nickname, initialChips }) {
        // 이미 해당 userId를 가진 플레이어가 있는지 찾습니다.
        let player = this.players.find(p => p.id === userId);

        if (player) {
            // 플레이어가 이미 존재하면 소켓 ID와 닉네임을 업데이트합니다 (재접속 상황).
            player.socketId = socketId;
            player.name = nickname; // 닉네임도 업데이트될 수 있도록 합니다.
            console.log(`[PokerGame] Player ${nickname} (${userId}) reconnected. Socket ID updated to ${socketId}.`);
        } else {
            // 플레이어가 없으면 새로운 플레이어 객체를 생성하여 배열에 추가합니다.
            player = {
                id: userId,          // 플레이어의 고유 ID
                socketId: socketId,  // 플레이어의 현재 소켓 ID
                name: nickname,      // 플레이어의 닉네임
                chips: initialChips, // 플레이어가 보유한 칩 금액
                bet: 0,              // 현재 핸드에서 총 베팅한 금액
                currentRoundBet: 0,  // 현재 베팅 라운드에서 베팅한 금액
                status: 'active',    // 플레이어의 현재 상태 (예: 'active', 'folded', 'all-in', 'busted')
                hole: [null, null],  // 플레이어의 비공개 핸드 카드 (홀 카드)
                blind: null,         // 현재 핸드에서 맡은 블라인드 역할 ('SB', 'BB' 또는 null)
                timer: 0,            // 플레이어의 턴 타이머 (현재 사용되지 않으나 확장성 고려)
                actedThisRound: false, // 현재 베팅 라운드에서 액션을 취했는지 여부
            };
            this.players.push(player); // 새로운 플레이어를 게임 플레이어 목록에 추가합니다.
            console.log(`[PokerGame] New player ${nickname} (${userId}) added.`);
        }
        return player; // 업데이트되거나 새로 추가된 플레이어 객체를 반환합니다.
    }

    /**
     * 새로운 핸드(게임 라운드)를 시작합니다.
     * 이전 핸드의 정리, 새 덱 생성 및 셔플, 카드 분배, 블라인드 베팅 등을 처리합니다.
     */
    startNewHand() {
        // 칩이 0보다 많은 플레이어만 다음 핸드에 참여할 수 있도록 필터링합니다.
        this.players = this.players.filter(p => p.chips > 0);

        // 남은 플레이어가 2명 미만이면 새 핸드를 시작할 수 없습니다.
        if (this.players.length < 2) {
            console.log('[PokerGame] Not enough players with chips to start a new hand.');
            this.phase = 'waiting'; // 게임을 'waiting' 상태로 변경합니다.
            return;
        }

        this.handNumber++; // 핸드 번호를 증가시킵니다.
        this.phase = 'preflop'; // 게임 단계를 'preflop'으로 설정합니다.
        this.pot = 0; // 팟을 0으로 초기화합니다.
        this.community = []; // 커뮤니티 카드를 초기화합니다.
        this.deck = shuffleDeck(createDeck()); // 새 덱을 생성하고 섞습니다.
        this.lastRaiserId = null; // 마지막 레이저 ID를 초기화합니다.

        // 딜러 버튼을 다음 플레이어로 이동합니다 (순환 방식).
        this.dealer = (this.dealer + 1) % this.players.length;

        // 각 플레이어의 상태를 초기화하고 홀 카드를 분배합니다.
        this.players.forEach(p => {
            p.bet = 0; // 현재 핸드의 총 베팅 금액 초기화
            p.currentRoundBet = 0; // 현재 라운드의 베팅 금액 초기화
            p.status = 'active'; // 모든 플레이어를 'active' 상태로 설정
            p.hole = [this.deck.pop(), this.deck.pop()]; // 덱에서 두 장의 홀 카드 분배
            p.blind = null; // 블라인드 역할 초기화
            p.actedThisRound = false; // 이번 라운드에 액션을 취했는지 여부 초기화
        });

        /**
         * 주어진 시작 인덱스에서부터 특정 오프셋만큼 이동하여 다음 'active' 상태 플레이어의 인덱스를 찾습니다.
         * 무한 루프를 방지하기 위해 최대 검색 횟수를 제한합니다.
         * @param {number} startIndex - 검색을 시작할 플레이어의 인덱스
         * @param {number} offset - 시작 인덱스에서 이동할 오프셋
         * @returns {number} 다음 'active' 플레이어의 인덱스, 찾지 못하면 -1
         */
        const getNextActivePlayerIndex = (startIndex, offset) => {
            let index = (startIndex + offset) % this.players.length; // 시작 인덱스에서 오프셋만큼 이동한 인덱스
            let count = 0; // 루프 카운터 (무한 루프 방지)
            // 'active' 상태가 아닌 플레이어를 건너뛰고, 플레이어 배열을 두 번 순회할 때까지 반복합니다.
            while (this.players[index].status !== 'active' && count < this.players.length * 2) {
                index = (index + 1) % this.players.length; // 다음 플레이어로 이동
                count++;
            }
            if (count >= this.players.length * 2) return -1; // 모든 플레이어를 확인했으나 'active' 플레이어를 찾지 못함
            return index; // 'active' 플레이어의 인덱스를 반환
        };

        // 스몰 블라인드(SB) 및 빅 블라인드(BB) 플레이어의 인덱스를 결정합니다.
        // 딜러의 왼쪽에 있는 첫 번째 'active' 플레이어가 SB, 그 다음이 BB입니다.
        const sbPlayerIdx = getNextActivePlayerIndex(this.dealer, 1);
        const bbPlayerIdx = getNextActivePlayerIndex(this.dealer, 2);

        // SB 또는 BB 플레이어를 찾을 수 없거나 SB/BB가 동일한 경우 오류 처리
        if (sbPlayerIdx === -1 || bbPlayerIdx === -1 || sbPlayerIdx === bbPlayerIdx) {
            console.error("[PokerGame] Could not find valid SB/BB players or not enough active players for blinds.");
            this.phase = 'waiting'; // 게임을 'waiting' 상태로 되돌립니다.
            return;
        }

        const sbPlayer = this.players[sbPlayerIdx]; // 스몰 블라인드 플레이어 객체
        const bbPlayer = this.players[bbPlayerIdx]; // 빅 블라인드 플레이어 객체

        // 각 플레이어에게 블라인드 역할을 할당합니다.
        sbPlayer.blind = 'SB';
        bbPlayer.blind = 'BB';

        // 스몰 블라인드 베팅 처리: 플레이어의 칩이 블라인드 금액보다 적으면 올인 처리
        const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
        sbPlayer.chips -= sbAmount;          // 칩에서 블라인드 금액 차감
        sbPlayer.bet += sbAmount;            // 현재 핸드 총 베팅에 추가
        sbPlayer.currentRoundBet += sbAmount; // 현재 라운드 베팅에 추가
        this.pot += sbAmount;                // 팟에 추가
        if (sbAmount < this.smallBlind) sbPlayer.status = 'all-in'; // 칩이 부족하면 'all-in' 상태로 전환
        sbPlayer.actedThisRound = true; // 블라인드 베팅은 액션으로 간주

        // 빅 블라인드 베팅 처리: 스몰 블라인드와 동일한 로직 적용
        const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
        bbPlayer.chips -= bbAmount;
        bbPlayer.bet += bbAmount;
        bbPlayer.currentRoundBet += bbAmount;
        this.pot += bbAmount;
        if (bbAmount < this.bigBlind) bbPlayer.status = 'all-in';
        bbPlayer.actedThisRound = true;

        // 프리플롭 라운드에서 첫 번째 액션을 취할 플레이어를 결정합니다.
        // 일반적으로 빅 블라인드의 왼쪽에 있는 첫 번째 'active' 플레이어입니다.
        let firstToActIdx = getNextActivePlayerIndex(bbPlayerIdx, 1);
        if (firstToActIdx === -1) {
            console.log("[PokerGame] No active player after BB, immediately advancing to showdown.");
            // 첫 번째 액션을 취할 플레이어가 없으면 즉시 쇼다운으로 진행합니다.
            this.advancePhase();
            return;
        }
        this.currentTurn = firstToActIdx; // 현재 턴 플레이어 인덱스 설정
        this.currentTurnPlayerId = this.players[this.currentTurn].id; // 현재 턴 플레이어 ID 설정

        // 새 핸드 시작 정보 로깅
        console.log(`[PokerGame] Hand ${this.handNumber} started. Dealer: ${this.players[this.dealer].name}, SB: ${sbPlayer.name} (${sbAmount}), BB: ${bbPlayer.name} (${bbAmount}). First turn: ${this.players[this.currentTurn].name}`);
    }

    /**
     * 플레이어의 액션을 처리합니다 (폴드, 체크, 콜, 레이즈).
     * @param {string} socketId - 액션을 취한 플레이어의 소켓 ID
     * @param {object} action - 플레이어 액션 객체
     * @param {string} action.type - 액션 타입 ('fold', 'check', 'call', 'raise')
     * @param {number} [action.data] - 'raise' 액션 시 레이즈 금액
     */
    handlePlayerAction(socketId, action) {
        // 액션을 취한 플레이어를 소켓 ID로 찾습니다.
        const player = this.players.find(p => p.socketId === socketId);
        if (!player) {
            console.warn(`[PokerGame] Action from unknown socket: ${socketId}`);
            return; // 알 수 없는 소켓이면 처리하지 않습니다.
        }
        // 플레이어 상태가 'active' 또는 'all-in'이 아니면 액션을 허용하지 않습니다.
        if (player.status !== 'active' && player.status !== 'all-in') {
            console.warn(`[PokerGame] Player ${player.name} is not active for action. Status: ${player.status}`);
            return;
        }
        // 현재 턴 플레이어와 액션을 취한 플레이어가 다르면 액션을 허용하지 않습니다.
        // `this.players[this.currentTurn]?`는 옵셔널 체이닝으로, 턴 플레이어가 없을 경우를 대비합니다.
        if (this.players[this.currentTurn]?.socketId !== socketId) {
             console.warn(`[PokerGame] It's not ${player.name}'s turn. Current turn: ${this.players[this.currentTurn]?.name}`);
             return;
        }

        // 현재 라운드에서 가장 높은 베팅 금액을 찾습니다.
        const highestBetInRound = this.players.reduce((max, p) => Math.max(max, p.currentRoundBet), 0);
        let actionTaken = false; // 액션이 성공적으로 처리되었는지 여부

        // 액션 타입에 따라 다르게 처리합니다.
        switch (action.type) {
            case 'fold': // 폴드 액션
                player.status = 'folded'; // 플레이어 상태를 'folded'로 변경
                actionTaken = true; // 액션 처리 완료
                console.log(`[PokerGame] ${player.name} folded.`);
                break;
            case 'check': // 체크 액션
                // 현재 플레이어의 라운드 베팅이 가장 높은 베팅보다 낮으면 체크할 수 없습니다 (콜 또는 레이즈 해야 함).
                if (player.currentRoundBet < highestBetInRound) {
                    console.warn(`[PokerGame] ${player.name} cannot check. Must call or raise.`);
                    return;
                }
                actionTaken = true; // 액션 처리 완료
                console.log(`[PokerGame] ${player.name} checked.`);
                break;
            case 'call': // 콜 액션
                // 콜에 필요한 금액을 계산합니다 (가장 높은 베팅 - 현재 플레이어의 라운드 베팅).
                const callAmount = highestBetInRound - player.currentRoundBet;
                // 플레이어의 칩이 콜 금액보다 적으면 올인 처리
                if (player.chips < callAmount) {
                    player.bet += player.chips;            // 남은 칩 모두 베팅
                    player.currentRoundBet += player.chips;
                    this.pot += player.chips;
                    player.chips = 0;                      // 칩 0으로 설정
                    player.status = 'all-in';              // 상태를 'all-in'으로 변경
                    console.log(`[PokerGame] ${player.name} went All-in with call.`);
                } else {
                    player.chips -= callAmount;            // 칩에서 콜 금액 차감
                    player.bet += callAmount;
                    player.currentRoundBet += callAmount;
                    this.pot += callAmount;
                    console.log(`[PokerGame] ${player.name} called ${callAmount}.`);
                }
                actionTaken = true; // 액션 처리 완료
                this.lastRaiserId = player.id; // 콜은 레이즈가 아니므로, 마지막 레이저는 변경되지 않지만,
                                               // 베팅 라운드 종료 조건 검사를 위해 여기서는 액션한 플레이어를 마지막 레이저로 설정하여 턴이 한 바퀴 돌았음을 표시
                break;
            case 'raise': // 레이즈 액션
                const raiseAmount = action.data; // 요청된 레이즈 금액
                // 최소 레이즈 금액을 계산합니다. (빅 블라인드가 0이면 현재 가장 높은 베팅, 아니면 빅 블라인드 금액)
                // 이 로직은 실제 포커 규칙에서 '최소 레이즈는 이전 레이즈 크기 이상'이라는 규칙을 구현한 것입니다.
                const minimumRaise = (this.bigBlind === 0 ? highestBetInRound : this.bigBlind);

                // 유효하지 않은 레이즈 금액 (최소 레이즈보다 적고, 칩 올인도 아닌 경우)
                if (raiseAmount < minimumRaise && highestBetInRound > 0 && action.data !== player.chips) {
                     console.warn(`[PokerGame] ${player.name} invalid raise amount: ${raiseAmount}. Must be at least ${minimumRaise}.`);
                     return;
                }

                // 현재 베팅과 최고 베팅의 차이 (콜에 필요한 금액)
                const amountToReachHighestBet = highestBetInRound - player.currentRoundBet;
                // 팟에 넣을 총 금액 (콜 금액 + 추가 레이즈 금액)
                const totalAmountToPutInPot = amountToReachHighestBet + raiseAmount;

                // 플레이어 칩이 베팅하려는 총 금액보다 적으면 올인 처리
                if (player.chips < totalAmountToPutInPot) {
                    player.bet += player.chips;
                    player.currentRoundBet += player.chips;
                    this.pot += player.chips;
                    player.chips = 0;
                    player.status = 'all-in';
                    console.log(`[PokerGame] ${player.name} went All-in with raise attempt.`);
                } else {
                    player.chips -= totalAmountToPutInPot;
                    player.bet += totalAmountToPutInPot;
                    this.pot += totalAmountToPutInPot;
                    player.currentRoundBet += totalAmountToPutInPot; // 플레이어의 현재 라운드 베팅 업데이트
                    console.log(`[PokerGame] ${player.name} raised to ${player.currentRoundBet}.`);
                }
                actionTaken = true; // 액션 처리 완료
                this.lastRaiserId = player.id; // 마지막 레이저 ID를 현재 플레이어로 설정
                break;
            default: // 알 수 없는 액션 타입
                console.warn(`[PokerGame] Unknown action type: ${action.type}`);
                return;
        }

        // 액션이 성공적으로 처리된 경우 다음 턴 및 라운드 종료를 확인합니다.
        if (actionTaken) {
            player.actedThisRound = true; // 플레이어가 이번 라운드에 액션을 취했음을 표시

            let nextTurnFound = false;
            let loopCount = 0;
            const maxLoop = this.players.length * 2; // 무한 루프 방지용 최대 반복 횟수

            // 다음 턴 플레이어를 찾습니다.
            while(!nextTurnFound && loopCount < maxLoop) {
                this.currentTurn = (this.currentTurn + 1) % this.players.length; // 다음 플레이어로 턴 이동 (순환)
                const nextPlayer = this.players[this.currentTurn];

                // 다음 플레이어가 'active' 상태이면 턴을 그 플레이어에게 넘깁니다.
                if (nextPlayer.status === 'active') {
                    nextTurnFound = true;
                }
                // 다음 플레이어가 'all-in' 상태이고, 아직 현재 라운드의 최고 베팅에 미치지 못했다면
                // 그 플레이어는 이미 할 일을 다 했으므로 건너뛰고 다음 'active' 플레이어를 찾습니다.
                // (이 부분은 올인한 플레이어가 턴을 가질 필요가 없다는 전제)
                else if (nextPlayer.status === 'all-in' && nextPlayer.currentRoundBet < highestBetInRound) {
                     // All-in players are considered to have acted
                }
                loopCount++;
            }

            if (nextTurnFound) {
                 this.currentTurnPlayerId = this.players[this.currentTurn].id; // 다음 턴 플레이어 ID 설정
                 this.checkRoundEnd(); // 라운드 종료 조건을 확인합니다.
            } else {
                 console.log("[PokerGame] No active player found for next turn, advancing phase or ending hand.");
                 // 모든 'active' 플레이어가 액션을 마치고 더 이상 턴을 가질 플레이어가 없으면 다음 단계로 진행합니다.
                 this.advancePhase();
            }
        }
    }

    /**
     * 현재 베팅 라운드의 종료 조건을 확인하고, 조건 충족 시 다음 단계로 진행합니다.
     */
    checkRoundEnd() {
        // 'active' 또는 'all-in' 상태인 플레이어만 고려합니다. (폴드한 플레이어는 제외)
        const activePlayers = this.players.filter(p => p.status === 'active' || p.status === 'all-in');

        // 활동 중인 플레이어가 1명 이하이면, 라운드가 종료된 것으로 보고 다음 단계로 진행합니다 (예: 바로 쇼다운).
        if (activePlayers.length <= 1) {
            this.advancePhase();
            return;
        }

        // 현재 라운드에서 가장 높은 베팅 금액을 다시 계산합니다.
        const highestBetInRound = activePlayers.reduce((max, p) => Math.max(max, p.currentRoundBet), 0);

        let allBetsEqual = true; // 모든 활동 플레이어의 베팅 금액이 동일한지 여부
        let allPlayersActedThisRound = true; // 모든 활동 플레이어가 이번 라운드에 액션을 취했는지 여부

        // 모든 활동 플레이어를 순회하며 베팅 금액 일치 여부와 액션 여부를 확인합니다.
        for (const player of activePlayers) {
            // 'active' 상태 플레이어 중 가장 높은 베팅과 일치하지 않는 플레이어가 있으면 allBetsEqual을 false로 설정합니다.
            if (player.status === 'active' && player.currentRoundBet !== highestBetInRound) {
                allBetsEqual = false;
                // 추가 확인이 필요 없으므로 반복을 중단합니다.
                break;
            }
            // 'active' 상태 플레이어 중 아직 액션을 취하지 않은 플레이어가 있으면 allPlayersActedThisRound를 false로 설정합니다.
            if (player.status === 'active' && !player.actedThisRound) {
                allPlayersActedThisRound = false;
                // 추가 확인이 필요 없으므로 반복을 중단합니다.
                break;
            }
        }

        // 라운드 종료 조건:
        // 1. 마지막 레이즈를 한 플레이어에게 턴이 돌아왔거나 (즉, 모든 콜/폴드가 완료됨)
        // 2. 프리플롭 단계이고, 아무도 레이즈하지 않았으며, 빅 블라인드 플레이어에게 턴이 돌아온 경우
        //    (빅 블라인드가 체크 또는 콜로 라운드를 마감할 수 있음)
        const isRoundCompletedByCurrentTurn =
            (this.lastRaiserId !== null && this.players[this.currentTurn]?.id === this.lastRaiserId) ||
            (this.lastRaiserId === null && this.phase === 'preflop' && this.players[this.currentTurn]?.id === this.players[(this.dealer + 2) % this.players.length]?.id);

        // 모든 활동 플레이어가 베팅 금액을 맞추고 이번 라운드에 액션을 취했는지 여부
        const allActivePlayersHaveActedAndBetEqually = allBetsEqual && allPlayersActedThisRound;

        // 최종 라운드 종료 조건:
        // - 활동 플레이어가 1명 이하이거나 (위에서 이미 처리됨)
        // - 모든 활동 플레이어가 액션을 취했고 베팅 금액이 동일하며, 턴이 한 바퀴 돌았거나
        // - 모든 활동 플레이어가 액션을 취했고 최고 베팅이 0이며, 활동 플레이어가 1명 초과이고, 턴이 한 바퀴 돌았을 때 (모두 체크한 상황)
        if (activePlayers.length <= 1 || (allActivePlayersHaveActedAndBetEqually && isRoundCompletedByCurrentTurn) || (highestBetInRound === 0 && allPlayersActedThisRound && activePlayers.length > 1 && isRoundCompletedByCurrentTurn)) {
            this.advancePhase(); // 다음 게임 단계로 진행합니다.
        }
    }

    /**
     * 현재 게임 단계를 다음 단계로 진행시킵니다 (예: 프리플롭 -> 플롭 -> 턴 -> 리버 -> 쇼다운).
     * 각 플레이어의 베팅 상태를 초기화하고, 필요한 경우 커뮤니티 카드를 추가합니다.
     */
    advancePhase() {
        this.lastRaiserId = null; // 다음 라운드를 위해 마지막 레이저 ID를 초기화합니다.
        this.players.forEach(p => {
            p.currentRoundBet = 0; // 현재 라운드 베팅 금액 초기화
            p.actedThisRound = false; // 이번 라운드 액션 여부 초기화
            // 폴드하지 않았고 칩이 0보다 많은 플레이어는 'active' 상태로 유지됩니다.
            // 이미 'busted'(칩 없음) 상태인 플레이어는 'active'로 바뀌지 않습니다.
            // NOTE: 이 부분의 `p.status !== 'folded'` 조건은 중요합니다. 폴드한 플레이어는 다음 라운드에도 폴드 상태여야 합니다.
            if (p.chips > 0 && p.status !== 'folded') {
                p.status = 'active';
            }
        });

        // 현재 게임 단계에 따라 커뮤니티 카드를 추가하고 다음 단계로 전환합니다.
        switch (this.phase) {
            case 'preflop': // 프리플롭 단계 -> 플롭으로
                this.community.push(this.deck.pop(), this.deck.pop(), this.deck.pop()); // 3장의 플롭 카드 분배
                this.phase = 'flop';
                console.log('[PokerGame] Advancing to Flop.');
                break;
            case 'flop': // 플롭 단계 -> 턴으로
                this.community.push(this.deck.pop()); // 1장의 턴 카드 분배
                this.phase = 'turn';
                console.log('[PokerGame] Advancing to Turn.');
                break;
            case 'turn': // 턴 단계 -> 리버로
                this.community.push(this.deck.pop()); // 1장의 리버 카드 분배
                this.phase = 'river';
                console.log('[PokerGame] Advancing to River.');
                break;
            case 'river': // 리버 단계 -> 쇼다운으로
                this.phase = 'showdown';
                console.log('[PokerGame] Advancing to Showdown.');
                break;
            case 'showdown': // 이미 쇼다운이거나 대기 상태이면 핸드를 종료합니다.
            case 'waiting':
                console.log('[PokerGame] Already in showdown or waiting, ending hand.');
                this.endHand();
                return; // 함수 실행을 종료합니다.
        }

        // 다음 라운드에서 첫 번째로 액션을 취할 플레이어를 결정합니다.
        // 일반적으로 딜러의 왼쪽에 있는 첫 번째 'active' 플레이어입니다.
        let firstToActIdx = (this.dealer + 1) % this.players.length;
        let loopCount = 0;
        const maxLoop = this.players.length * 2;
        // 'active' 상태가 아닌 플레이어를 건너뛰고 'active' 플레이어를 찾습니다.
        while(this.players[firstToActIdx].status !== 'active' && loopCount < maxLoop) {
            firstToActIdx = (firstToActIdx + 1) % this.players.length;
            loopCount++;
        }
        // 만약 'active' 플레이어를 찾지 못하면 (예: 모두 폴드 또는 올인) 즉시 쇼다운으로 진행합니다.
        if (this.players[firstToActIdx]?.status !== 'active') {
            console.warn("[PokerGame] No active players found to start next phase, forcing showdown.");
            this.phase = 'showdown';
            this.endHand();
            return;
        }

        this.currentTurn = firstToActIdx; // 다음 턴 플레이어 인덱스 설정
        this.currentTurnPlayerId = this.players[this.currentTurn]?.id || null; // 다음 턴 플레이어 ID 설정
        console.log(`[PokerGame] Next phase starting. First turn: ${this.players[this.currentTurn]?.name}`);

        // TODO: 스플릿 팟 처리 로직 추가 필요 (올인 플레이어가 여러 명이고 사이드 팟이 발생할 경우)

        // 활동 중인 플레이어가 1명 이하이고, 올인한 플레이어가 있는 경우
        // (즉, 한 명만 남고 나머지는 모두 올인이거나 폴드한 경우)
        // 남은 커뮤니티 카드를 모두 빠르게 오픈하고 쇼다운으로 넘어갑니다.
        const currentActivePlayers = this.players.filter(p => p.status === 'active' && p.chips > 0);
        const allInPlayers = this.players.filter(p => p.status === 'all-in');

        if (currentActivePlayers.length <= 1 && allInPlayers.length > 0) {
            console.log("[PokerGame] Only one active player or all others are all-in, advancing phases to showdown.");
            // 현재 단계가 쇼다운이 아니고 커뮤니티 카드가 5장 미만이면 계속 카드를 오픈합니다.
            while (this.phase !== 'showdown' && this.community.length < 5) {
                if (this.phase === 'flop') {
                    this.community.push(this.deck.pop()); // 턴 카드 오픈
                    this.phase = 'turn';
                }
                else if (this.phase === 'turn') {
                    this.community.push(this.deck.pop()); // 리버 카드 오픈
                    this.phase = 'river';
                }
                else if (this.phase === 'preflop' && this.community.length === 0) {
                    // 프리플롭 상태에서 바로 쇼다운으로 가는 경우, 플롭/턴/리버 카드 모두 오픈
                    this.community.push(this.deck.pop(), this.deck.pop(), this.deck.pop()); // 플롭
                    this.community.push(this.deck.pop()); // 턴
                    this.community.push(this.deck.pop()); // 리버
                    this.phase = 'flop'; // 일시적으로 플롭으로 설정 후 다음 루프에서 턴/리버 진행
                }
            }
            this.phase = 'showdown'; // 모든 카드를 오픈했으므로 쇼다운으로 전환
            this.endHand(); // 핸드를 종료하고 승자를 결정합니다.
        }
    }

    /**
     * 현재 핸드를 종료하고 승자를 결정하며, 칩을 분배하고 다음 핸드를 위한 상태를 정리합니다.
     * @returns {object} 현재 라운드의 결과 데이터
     */
    endHand() {
        this.phase = 'showdown'; // 최종 단계를 'showdown'으로 확정합니다.

        // 폴드하지 않았고 칩이 0보다 많은 플레이어만 승자 결정 대상에 포함합니다.
        const activeOrAllInPlayers = this.players.filter(p => p.status !== 'folded' && p.chips > 0);

        let winner = null; // 승자 플레이어 객체
        let winningHand = null; // 승자의 최종 족보

        // 승자 결정 로직
        if (activeOrAllInPlayers.length > 0) {
            let bestPlayerHand = null; // 현재까지의 최고 족보
            let bestPlayer = null;     // 최고 족보를 가진 플레이어

            // 활동 중인 모든 플레이어를 순회하며 족보를 평가하고 최고 족보를 찾습니다.
            for (const player of activeOrAllInPlayers) {
                // 유효한 홀 카드(null이 아닌)와 커뮤니티 카드를 조합하여 족보를 평가합니다.
                const validHoleCards = player.hole.filter(card => card !== null);
                const playerHand = evaluateHand([...validHoleCards, ...this.community]);
                console.log(`[PokerGame] Player ${player.name} Hand:`, playerHand);

                // 현재 플레이어의 족보가 이전 최고 족보보다 좋거나
                // 족보 등급이 같으면 키커(Kickers)를 비교하여 더 좋은 패를 찾습니다.
                if (!bestPlayerHand ||
                    playerHand.rank > bestPlayerHand.rank ||
                    (playerHand.rank === bestPlayerHand.rank &&
                     this.compareKickers(playerHand.kickers, bestPlayerHand.kickers) > 0)
                ) {
                    bestPlayerHand = playerHand; // 최고 족보 업데이트
                    bestPlayer = player;         // 최고 족보를 가진 플레이어 업데이트
                }
            }
            winner = bestPlayer;     // 최종 승자 설정
            winningHand = bestPlayerHand; // 최종 승자의 족보 설정

            if (winner) {
                winner.chips += this.pot; // 승자에게 팟의 모든 칩을 분배합니다.
                console.log(`[PokerGame] Winner of hand ${this.handNumber}: ${winner.name} (won ${this.pot} chips) with ${winningHand?.name}.`);
            } else {
                // 승자를 결정할 수 없거나 팟이 분할될 경우 (TODO: 스플릿 팟 로직 구현)
                console.log(`[PokerGame] No clear winner or pot split for hand ${this.handNumber}.`);
            }

        } else {
            // 활동 중인 플레이어가 아무도 없는 경우 (모두 폴드했거나 칩이 없는 경우)
            console.log(`[PokerGame] No active players to determine a winner for hand ${this.handNumber}.`);
        }

        // 현재 라운드에 대한 요약 데이터를 생성합니다. 이 데이터는 게임 기록 저장 등에 사용될 수 있습니다.
        const roundData = {
            roomId: this.id, // 방 ID
            handNumber: this.handNumber, // 핸드 번호
            players: this.players.map(p => ({ // 각 플레이어의 최종 상태 요약
                userId: p.id,
                nickname: p.name,
                // 칩 변동 계산: (현재 칩 - 승리 팟) + 현재 핸드에 베팅한 총 금액
                chipsBefore: p.chips - (winner && p.id === winner.id ? this.pot : 0) + p.bet,
                chipsAfter: p.chips, // 핸드 종료 후 최종 칩
                status: p.status, // 최종 상태
                holeCards: p.hole, // 홀 카드
                // 플레이어의 최종 족보 (승자일 경우 winningHand, 아니면 자신의 패 평가)
                handResult: (p.id === winner?.id && winningHand) ? winningHand : evaluateHand([...p.hole.filter(card => card !== null), ...this.community])
            })),
            communityCards: this.community, // 최종 커뮤니티 카드
            pot: this.pot, // 최종 팟 (승자에게 분배된 후 0이 될 예정)
            winnerId: winner ? winner.id : null, // 승자 ID
        };

        this.pot = 0; // 팟을 0으로 초기화합니다.

        // 다음 핸드를 위해 플레이어 상태를 정리합니다.
        this.players.forEach(p => {
            p.bet = 0;             // 베팅 금액 초기화
            p.currentRoundBet = 0; // 라운드 베팅 금액 초기화
            p.actedThisRound = false; // 액션 여부 초기화
            p.hole = [null, null]; // 홀 카드 초기화
            p.blind = null;        // 블라인드 역할 초기화
            if (p.chips > 0) {
                p.status = 'active'; // 칩이 남아있으면 'active' 상태로
            } else {
                p.status = 'busted'; // 칩이 없으면 'busted'(파산) 상태로
            }
        });

        return roundData; // 라운드 결과 데이터를 반환합니다.
    }

    /**
     * 두 패의 키커(Kickers)를 비교하여 더 높은 키커를 가진 패를 결정합니다.
     * 주로 족보 등급이 같을 때 사용됩니다.
     * @param {number[]} kickersA - 첫 번째 패의 키커 배열 (숫자 값)
     * @param {number[]} kickersB - 두 번째 패의 키커 배열 (숫자 값)
     * @returns {number} kickersA가 좋으면 1, kickersB가 좋으면 -1, 같으면 0
     */
    compareKickers(kickersA, kickersB) {
        // 두 키커 배열 중 더 짧은 길이를 기준으로 반복합니다.
        for (let i = 0; i < Math.min(kickersA.length, kickersB.length); i++) {
            // 현재 키커 값을 비교합니다.
            if (kickersA[i] > kickersB[i]) return 1;  // A가 B보다 크면 A가 좋음
            if (kickersA[i] < kickersB[i]) return -1; // A가 B보다 작으면 B가 좋음
        }
        return 0; // 모든 키커가 동일하면 무승부 (스플릿 팟)
    }

    /**
     * 현재 게임의 상태를 반환합니다. 이 데이터는 클라이언트에게 전송되어 UI를 업데이트하는 데 사용됩니다.
     * 민감한 정보(예: 다른 플레이어의 홀 카드)는 제외됩니다.
     * @returns {object} 현재 게임 상태를 나타내는 객체
     */
    getGameState() {
        return {
            phase: this.phase, // 현재 게임 단계
            community: this.community, // 현재까지 공개된 커뮤니티 카드
            pot: this.pot, // 현재 팟 금액
            dealerPos: this.dealer, // 딜러 버튼 위치 (플레이어 인덱스)
            handNumber: this.handNumber, // 현재 핸드 번호
            currentId: this.currentTurnPlayerId, // 현재 턴 플레이어의 ID
            players: this.players.map(p => ({ // 각 플레이어의 공개 가능한 정보
                id: p.id,
                name: p.name,
                chips: p.chips,
                bet: p.bet,
                currentRoundBet: p.currentRoundBet,
                status: p.status,
                timer: p.timer || 0, // 타이머 값 (없으면 0)
                blind: p.blind || undefined, // 블라인드 역할 (없으면 undefined)
                // 홀 카드는 'showdown' 단계에서만 공개하고, 그 외에는 `[null, null]`로 가립니다.
                hole: this.phase === 'showdown' ? p.hole : [null, null],
            }))
        };
    }
}

// PokerGame 클래스를 기본 내보내기(default export)로 설정하여,
// 다른 파일에서 `import PokerGame from './PokerGame.js';` 형태로 가져올 수 있게 합니다.
export default PokerGame;