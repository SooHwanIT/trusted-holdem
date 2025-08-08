// utils/handEvaluator.js

// ✅ 더 이상 어떤 Enum이나 상수 객체도 임포트하거나 직접 정의하지 않습니다.

// 카드 순위를 숫자로 매핑 (이제 CardRank 상수 객체 없이 직접 정의)
const rankMap = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12, // 'Queen'에 해당하는 'Q'
    'K': 13,
    'A': 14,
};

// 족보 점수
const handRankScores = {
    'High Card': 1,
    'One Pair': 2,
    'Two Pair': 3,
    'Three of a Kind': 4,
    'Straight': 5,
    'Flush': 6,
    'Full House': 7,
    'Four of a Kind': 8,
    'Straight Flush': 9
};

export const evaluateHand = (cards) => {
    // null이 아닌 카드만 필터링하고 파싱
    const parsedCards = cards
        .filter(card => card !== null)
        .map(card => {
        const [suit, rank] = card.split('-');
        return {
            suit: suit,
            rank: rank,
            value: rankMap[rank]
        };
    }).sort((a, b) => b.value - a.value);

    const ranks = parsedCards.map(c => c.value);
    const suits = parsedCards.map(c => c.suit);

    const rankCounts = {};
    for (const card of parsedCards) {
        rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
    }

    const sortedRankCounts = Object.entries(rankCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([rank, count]) => ({ rank: parseInt(rank), count }));

    const suitCounts = {};
    for (const card of parsedCards) {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }

    // --- 족보 평가 로직 ---

    const findStraight = (cardValues) => {
        const uniqueRanks = [...new Set(cardValues)].sort((a, b) => b - a);
        if (uniqueRanks.length < 5) return null;

        for (let i = 0; i <= uniqueRanks.length - 5; i++) {
            // A, 2, 3, 4, 5 스트레이트 (휠 스트레이트) 처리
            // rankMap['A']는 14, rankMap['5']는 5 등을 직접 사용
            if (uniqueRanks[i] === rankMap['A'] &&
                uniqueRanks[i+1] === rankMap['5'] &&
                uniqueRanks[i+2] === rankMap['4'] &&
                uniqueRanks[i+3] === rankMap['3'] &&
                uniqueRanks[i+4] === rankMap['2']) {
                return [rankMap['A'], rankMap['5'], rankMap['4'], rankMap['3'], rankMap['2']];
            }
            // 일반 스트레이트
            if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
                return uniqueRanks.slice(i, i + 5);
            }
        }
        return null;
    };

    const findFlush = (cardsArr) => {
        for (const suit in suitCounts) {
            if (suitCounts[suit] >= 5) {
                return cardsArr.filter(card => card.suit === suit)
                                .slice(0, 5);
            }
        }
        return null;
    };

    // 1. 스트레이트 플러시
    const flushCards = findFlush(parsedCards);
    if (flushCards) {
        const flushRanks = flushCards.map(c => c.value);
        const straightRanks = findStraight(flushRanks);
        if (straightRanks) {
            const straightFlushCards = parsedCards.filter(c => straightRanks.includes(c.value) && c.suit === flushCards[0].suit);
            return {
                name: 'Straight Flush',
                rank: handRankScores['Straight Flush'],
                kickers: straightRanks,
                cards: straightFlushCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
            };
        }
    }

    // 2. 포 오브 어 카인드
    const fourOfAKind = sortedRankCounts.find(rc => rc.count === 4);
    if (fourOfAKind) {
        const remainingRanks = ranks.filter(r => r !== fourOfAKind.rank);
        const kicker = remainingRanks.length > 0 ? remainingRanks[0] : null;
        const handCards = parsedCards.filter(c => c.value === fourOfAKind.rank);
        if (kicker) handCards.push(parsedCards.find(c => c.value === kicker));

        return {
            name: 'Four of a Kind',
            rank: handRankScores['Four of a Kind'],
            kickers: [fourOfAKind.rank, kicker].filter(Boolean),
            cards: handCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
        };
    }

    // 3. 풀 하우스
    const threeOfAKind = sortedRankCounts.find(rc => rc.count === 3);
    if (threeOfAKind) {
        const pairs = sortedRankCounts.filter(rc => rc.count >= 2 && rc.rank !== threeOfAKind.rank);
        if (pairs.length > 0) {
            const bestPair = pairs[0];
            const handCards = parsedCards.filter(c => c.value === threeOfAKind.rank || c.value === bestPair.rank);
            return {
                name: 'Full House',
                rank: handRankScores['Full House'],
                kickers: [threeOfAKind.rank, bestPair.rank],
                cards: handCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
            };
        }
    }

    // 4. 플러시
    if (flushCards) {
        const flushRanks = flushCards.map(c => c.value);
        return {
            name: 'Flush',
            rank: handRankScores['Flush'],
            kickers: flushRanks.slice(0, 5),
            cards: flushCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
        };
    }

    // 5. 스트레이트
    const straightRanks = findStraight(ranks);
    if (straightRanks) {
        const straightCards = [];
        for (const r of straightRanks) {
             const card = parsedCards.find(c => c.value === r && !straightCards.includes(c));
             if (card) straightCards.push(card);
        }
        return {
            name: 'Straight',
            rank: handRankScores['Straight'],
            kickers: straightRanks,
            cards: straightCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
        };
    }

    // 6. 트리플
    if (threeOfAKind) {
        const remainingRanks = ranks.filter(r => r !== threeOfAKind.rank);
        const kickers = remainingRanks.slice(0, 2);
        const handCards = parsedCards.filter(c => c.value === threeOfAKind.rank);
        kickers.forEach(k => handCards.push(parsedCards.find(c => c.value === k)));
        return {
            name: 'Three of a Kind',
            rank: handRankScores['Three of a Kind'],
            kickers: [threeOfAKind.rank, ...kickers],
            cards: handCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
        };
    }

    // 7. 투 페어
    const pairs = sortedRankCounts.filter(rc => rc.count === 2);
    if (pairs.length >= 2) {
        const firstPair = pairs[0];
        const secondPair = pairs[1];
        const remainingRanks = ranks.filter(r => r !== firstPair.rank && r !== secondPair.rank);
        const kicker = remainingRanks.length > 0 ? remainingRanks[0] : null;

        const handCards = parsedCards.filter(c => c.value === firstPair.rank || c.value === secondPair.rank);
        if (kicker) handCards.push(parsedCards.find(c => c.value === kicker));

        return {
            name: 'Two Pair',
            rank: handRankScores['Two Pair'],
            kickers: [firstPair.rank, secondPair.rank, kicker].filter(Boolean),
            cards: handCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
        };
    }

    // 8. 원 페어
    const onePair = sortedRankCounts.find(rc => rc.count === 2);
    if (onePair) {
        const remainingRanks = ranks.filter(r => r !== onePair.rank);
        const kickers = remainingRanks.slice(0, 3);
        const handCards = parsedCards.filter(c => c.value === onePair.rank);
        kickers.forEach(k => handCards.push(parsedCards.find(c => c.value === k)));
        return {
            name: 'One Pair',
            rank: handRankScores['One Pair'],
            kickers: [onePair.rank, ...kickers],
            cards: handCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
        };
    }

    // 9. 하이 카드
    return {
        name: 'High Card',
        rank: handRankScores['High Card'],
        kickers: ranks.slice(0, 5),
        cards: parsedCards.map(c => `${c.suit}-${c.rank}`).slice(0, 5)
    };
};