// SUITS: S = Spades, H = Hearts, D = Diamonds, C = Clubs
const SUITS = ['S', 'H', 'D', 'C'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

export default class Deck {
    constructor() {
        this.reset();
    }

    reset() {
        // 카드 객체: { suit:'S', rank:'A' }
        this.cards = [];
        SUITS.forEach((s) =>
            RANKS.forEach((r) => this.cards.push({ suit: s, rank: r }))
        );
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw(n = 1) {
        if (this.cards.length < n) throw new Error('Deck: not enough cards');
        return this.cards.splice(0, n);
    }
}
