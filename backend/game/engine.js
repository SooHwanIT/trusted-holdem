/* ----------------------------------------------------
 * game/engine.js  —  Texas Hold’em 1-Table 엔진 v0.4-ws-only
 *   ▸ 2025-07-20 — IPFS · 블록체인 정산 부분을 **주석** 처리해
 *                  WebSocket 만으로 동작하도록 축소한 버전
 * -------------------------------------------------- */

import Deck from './deck.js';
import { evaluate } from './hand-eval.js';

/* ────────────────────────────────
 *  ▼ 블록체인 / IPFS 기능 OFF ▼
 *  (주석 해제 → 원본 기능 복원)
 * ──────────────────────────────── */
// import { MerkleTree } from 'merkletreejs';
// import keccak256 from 'keccak256';
// import { uploadJSON } from '../services/ipfs.js';
// import { settleRound } from '../services/chain.js';

export default class GameEngine {
    constructor(io, roomId, cfg = {}) {
        this.io = io;
        this.roomId = roomId;
        this.cfg = {
            sb: cfg.smallBlind || 50,
            bb: cfg.bigBlind || 100,
            turnTime: cfg.turnTime || 30,
            startingChips: cfg.startingChips || 1500,
        };
        this.reset();
    }

    /* ---------- 테이블/핸드 초기화 ---------- */
    reset() {
        this.players = [];
        this.dealerIdx = -1;
        this.actions = [];
        this.phase = 'waiting';
        this.community = [];
        this.turnIdx = 0;
        this.timer = null;
        this.handNo = 0;
        this.deck = new Deck();
    }

    /* ---------- 플레이어 관리 ---------- */
    addPlayer({ id, name }) {
        if (this.players.length >= 10) throw new Error('FULL');
        this.players.push({
            id,
            name,
            chips: this.cfg.startingChips,
            bet: 0,
            status: 'active',
            timer: 0,
            hole: [],
            blind: undefined,
        });
        this.broadcast();
        if (this.players.length >= 2 && this.phase === 'waiting') this.startHand();
        return { id, name, chips: this.cfg.startingChips };
    }

    removePlayer(id) {
        const p = this.players.find((x) => x.id === id);
        if (p) p.status = 'folded';
    }

    /* ---------- 스냅샷 브로드캐스트 ---------- */
    broadcast() {
        this.players.forEach((target) => {
            const snapshot = {
                phase: this.phase,
                community: this.community,
                pot: this.potAmount(),
                dealerPos: this.dealerIdx,
                hand: this.handNo,
                currentId: this.players[this.turnIdx]?.id,
                players: this.players.map((p) => ({
                    id: p.id,
                    name: p.name,
                    chips: p.chips,
                    bet: p.bet,
                    status: p.status,
                    timer: p.timer,
                    blind: p.blind,
                    hole: p.id === target.id ? p.hole : [null, null],
                })),
            };
            this.io.to(target.id).emit('state', snapshot);
        });
    }

    potAmount() {
        return this.players.reduce((s, p) => s + p.bet, 0);
    }

    /* ---------- 새 핸드 ---------- */
    startHand() {
        this.handNo += 1;
        this.phase = 'preflop';
        this.deck.reset();
        this.community = [];
        this.actions = [];

        this.dealerIdx = (this.dealerIdx + 1) % this.players.length;
        const sbIdx = (this.dealerIdx + 1) % this.players.length;
        const bbIdx = (this.dealerIdx + 2) % this.players.length;

        this.players.forEach((p, idx) => {
            p.bet = 0;
            p.status = 'active';
            p.hole = this.deck.draw(2);
            p.blind = idx === sbIdx ? 'SB' : idx === bbIdx ? 'BB' : undefined;
        });

        this.postBlind(sbIdx, this.cfg.sb);
        this.postBlind(bbIdx, this.cfg.bb);

        this.turnIdx = (bbIdx + 1) % this.players.length;
        this.startTimer();
        this.broadcast();
    }

    postBlind(idx, amt) {
        const p = this.players[idx];
        p.bet += amt;
        p.chips -= amt;
        this.actions.push({ pid: p.id, t: Date.now(), type: 'blind', amt });
    }

    /* ---------- 타이머 ---------- */
    startTimer() {
        clearInterval(this.timer);
        this.players[this.turnIdx].timer = this.cfg.turnTime;
        this.timer = setInterval(() => {
            const cur = this.players[this.turnIdx];
            if (--cur.timer <= 0) this.playerAction(cur.id, { type: 'fold' });
            this.broadcast();
        }, 1000);
    }

    /* ---------- 액션 처리 ---------- */
    playerAction(pid, { type, amount = 0 }) {
        const p = this.players[this.turnIdx];
        if (!p || p.id !== pid || p.status !== 'active') return;

        const highestBet = Math.max(...this.players.map((x) => x.bet));
        const callAmt = highestBet - p.bet;

        switch (type) {
            case 'fold':
                p.status = 'folded';
                break;
            case 'check':
                if (callAmt !== 0) return;
                break;
            case 'call':
                this.betChips(p, callAmt);
                break;
            case 'raise':
                if (amount < this.cfg.bb) return;
                this.betChips(p, callAmt + amount);
                break;
            default:
                return;
        }

        this.actions.push({ pid, t: Date.now(), type, amt: amount });
        this.advanceTurn();
    }

    betChips(player, amt) {
        if (amt > player.chips) amt = player.chips;
        player.chips -= amt;
        player.bet += amt;
    }

    /* ---------- 턴 & 라운드 전환 ---------- */
    advanceTurn() {
        clearInterval(this.timer);
        if (this.isHandFinished()) return this.finishHand();

        const n = this.players.length;
        let next = (this.turnIdx + 1) % n;
        while (this.players[next].status !== 'active') {
            next = (next + 1) % n;
            if (next === this.turnIdx) break;
        }
        this.turnIdx = next;

        const active = this.players.filter((p) => p.status === 'active');
        const equalBet = active.every((p) => p.bet === active[0].bet);
        const last = this.actions[this.actions.length - 1]?.type;
        const roundDone =
            equalBet && (last === 'check' || last === 'call' || active.length === 1);

        if (roundDone) {
            this.resetBets();
            this.advancePhase();
        } else {
            this.startTimer();
        }
        this.broadcast();
    }

    resetBets() {
        this.players.forEach((p) => (p.bet = 0));
    }

    advancePhase() {
        switch (this.phase) {
            case 'preflop':
                this.community.push(...this.deck.draw(3));
                this.phase = 'flop';
                break;
            case 'flop':
                this.community.push(...this.deck.draw(1));
                this.phase = 'turn';
                break;
            case 'turn':
                this.community.push(...this.deck.draw(1));
                this.phase = 'river';
                break;
            case 'river':
                this.phase = 'showdown';
                return this.finishHand();
        }
        this.turnIdx = (this.dealerIdx + 1) % this.players.length;
        this.startTimer();
    }

    isHandFinished() {
        const alive = this.players.filter((p) => p.status === 'active');
        return alive.length <= 1 || this.phase === 'showdown';
    }

    /* ---------- 핸드 종료 ---------- */
    async finishHand() {
        clearInterval(this.timer);

        /* 1) active 0명 → 핸드 무효 */
        const active = this.players.filter((p) => p.status === 'active');
        if (active.length === 0) {
            this.phase = 'waiting';
            this.broadcast();
            return;
        }

        /* 2) 우승자 계산 */
        let winners = [];
        if (active.length === 1) {
            winners = active;
        } else {
            const scores = active.map((p) => ({
                pid: p.id,
                eval: evaluate([...p.hole, ...this.community]),
            }));

            const bestScore = scores.reduce(
                (best, cur) =>
                    compareScore(cur.eval.score, best) > 0 ? cur.eval.score : best,
                scores[0].eval.score
            );

            winners = scores
                .filter((s) => compareScore(s.eval.score, bestScore) === 0)
                .map((s) => this.players.find((p) => p.id === s.pid));
        }

        /* 3) 팟 분배 */
        const pot = this.potAmount();
        const share = Math.floor(pot / winners.length);
        winners.forEach((w) => (w.chips += share));

        /* 4) handFinished 이벤트 (IPFS·체인 값 제거) */
        this.io.to(this.roomId).emit('handFinished', {
            hand: this.handNo,
            winners: winners.map((w) => w.id),
            payout: share,
        });

        /* 5) 다음 핸드 */
        this.players.forEach((p) => (p.bet = 0));
        this.startHand();
    }
}

/* ---------- 헬퍼 ---------- */
function compareScore(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}
