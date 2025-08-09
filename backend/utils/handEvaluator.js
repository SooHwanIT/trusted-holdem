// utils/handEvaluator.js

// 카드 순위를 숫자로 매핑합니다.
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
    'Q': 12,
    'K': 13,
    'A': 14,
};

// 족보 점수 (우열을 가리기 위함)
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

/**
 * 카드들의 족보를 평가합니다.
 * @param {Array<Object>} cards - { suit: string, rank: string } 형태의 카드 객체 배열
 * @returns {Object} 족보 이름, 점수, 키커, 최종 5장 카드를 포함하는 객체
 */
export const evaluateHand = (cards) => {
    // null이 아닌 카드만 필터링하고, 카드 객체에 value를 추가합니다.
    const validCards = cards
        .filter(card => card !== null)
        .map(card => ({
            ...card,
            value: rankMap[card.rank]
        }))
        .sort((a, b) => b.value - a.value);

    // 카드 수가 5장 미만이면 유효한 족보를 만들 수 없음
    if (validCards.length < 5) {
        return {
            name: 'High Card',
            rank: handRankScores['High Card'],
            kickers: validCards.map(c => c.value),
            cards: validCards,
        };
    }

    const ranks = validCards.map(c => c.value);

    // 랭크별 카드 개수 계산
    const rankCounts = {};
    for (const card of validCards) {
        rankCounts[card.value] = (rankCounts[card.value] || 0) + 1;
    }

    // 개수와 랭크 순서로 정렬 (ex: [ { rank: 13, count: 2 }, { rank: 14, count: 1 } ... ] )
    const sortedRankCounts = Object.entries(rankCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([rank, count]) => ({ rank: parseInt(rank), count }));

    // 무늬별 카드 개수 계산
    const suitCounts = {};
    for (const card of validCards) {
        suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
    }

    // --- 족보 평가 로직 (함수 재사용) ---

    const findStraight = (cardValues) => {
        const uniqueRanks = [...new Set(cardValues)].sort((a, b) => b - a);
        if (uniqueRanks.length < 5) return null;

        // A, 2, 3, 4, 5 (휠 스트레이트) 처리
        if (uniqueRanks.includes(rankMap['A']) &&
            uniqueRanks.includes(rankMap['5']) &&
            uniqueRanks.includes(rankMap['4']) &&
            uniqueRanks.includes(rankMap['3']) &&
            uniqueRanks.includes(rankMap['2'])) {
            return [rankMap['5'], rankMap['4'], rankMap['3'], rankMap['2'], rankMap['A']]; // 휠 스트레이트는 5가 하이카드
        }

        for (let i = 0; i <= uniqueRanks.length - 5; i++) {
            if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
                return uniqueRanks.slice(i, i + 5);
            }
        }
        return null;
    };

    const findFlush = (cardsArr) => {
        for (const suit in suitCounts) {
            if (suitCounts[suit] >= 5) {
                return cardsArr.filter(card => card.suit === suit);
            }
        }
        return null;
    };

    // 1. 스트레이트 플러시
    const flushCards = findFlush(validCards);
    if (flushCards) {
        const flushRanks = flushCards.map(c => c.value);
        const straightRanks = findStraight(flushRanks);
        if (straightRanks) {
            const highCardValue = straightRanks[0] === rankMap['A'] && straightRanks[1] === rankMap['5'] ? rankMap['5'] : straightRanks[0];
            const straightFlushCards = validCards.filter(c => straightRanks.includes(c.value) && c.suit === flushCards[0].suit).slice(0,5);

            return {
                name: 'Straight Flush',
                rank: handRankScores['Straight Flush'],
                kickers: straightRanks,
                cards: straightFlushCards
            };
        }
    }

    // 2. 포 오브 어 카인드
    const fourOfAKind = sortedRankCounts.find(rc => rc.count === 4);
    if (fourOfAKind) {
        const remainingCards = validCards.filter(c => c.value !== fourOfAKind.rank);
        const kicker = remainingCards.length > 0 ? remainingCards[0] : null;
        const handCards = validCards.filter(c => c.value === fourOfAKind.rank);
        if (kicker) handCards.push(kicker);

        return {
            name: 'Four of a Kind',
            rank: handRankScores['Four of a Kind'],
            kickers: [fourOfAKind.rank, kicker?.value].filter(Boolean),
            cards: handCards.slice(0, 5)
        };
    }

    // 3. 풀 하우스
    const threeOfAKind = sortedRankCounts.find(rc => rc.count === 3);
    if (threeOfAKind) {
        const pairs = sortedRankCounts.filter(rc => rc.count >= 2 && rc.rank !== threeOfAKind.rank);
        if (pairs.length > 0) {
            const bestPair = pairs[0];
            const handCards = validCards.filter(c => c.value === threeOfAKind.rank || c.value === bestPair.rank);
            return {
                name: 'Full House',
                rank: handRankScores['Full House'],
                kickers: [threeOfAKind.rank, bestPair.rank],
                cards: handCards.slice(0, 5)
            };
        }
    }

    // 4. 플러시
    if (flushCards) {
        return {
            name: 'Flush',
            rank: handRankScores['Flush'],
            kickers: flushCards.map(c => c.value).slice(0, 5),
            cards: flushCards.slice(0, 5)
        };
    }

    // 5. 스트레이트
    const straightRanks = findStraight(ranks);
    if (straightRanks) {
        const straightCards = validCards.filter(c => straightRanks.includes(c.value));
        return {
            name: 'Straight',
            rank: handRankScores['Straight'],
            kickers: straightRanks,
            cards: straightCards.slice(0, 5)
        };
    }

    // 6. 트리플
    if (threeOfAKind) {
        const remainingCards = validCards.filter(c => c.value !== threeOfAKind.rank);
        const kickers = remainingCards.slice(0, 2);
        const handCards = validCards.filter(c => c.value === threeOfAKind.rank);
        kickers.forEach(c => handCards.push(c));
        return {
            name: 'Three of a Kind',
            rank: handRankScores['Three of a Kind'],
            kickers: [threeOfAKind.rank, ...kickers.map(k => k.value)],
            cards: handCards.slice(0, 5)
        };
    }

    // 7. 투 페어
    const pairs = sortedRankCounts.filter(rc => rc.count === 2);
    if (pairs.length >= 2) {
        const firstPair = pairs[0];
        const secondPair = pairs[1];
        const remainingCards = validCards.filter(c => c.value !== firstPair.rank && c.value !== secondPair.rank);
        const kicker = remainingCards.length > 0 ? remainingCards[0] : null;

        const handCards = validCards.filter(c => c.value === firstPair.rank || c.value === secondPair.rank);
        if (kicker) handCards.push(kicker);

        return {
            name: 'Two Pair',
            rank: handRankScores['Two Pair'],
            kickers: [firstPair.rank, secondPair.rank, kicker?.value].filter(Boolean),
            cards: handCards.slice(0, 5)
        };
    }

    // 8. 원 페어
    const onePair = sortedRankCounts.find(rc => rc.count === 2);
    if (onePair) {
        const remainingCards = validCards.filter(c => c.value !== onePair.rank);
        const kickers = remainingCards.slice(0, 3);
        const handCards = validCards.filter(c => c.value === onePair.rank);
        kickers.forEach(c => handCards.push(c));
        return {
            name: 'One Pair',
            rank: handRankScores['One Pair'],
            kickers: [onePair.rank, ...kickers.map(k => k.value)],
            cards: handCards.slice(0, 5)
        };
    }

    // 9. 하이 카드
    return {
        name: 'High Card',
        rank: handRankScores['High Card'],
        kickers: ranks.slice(0, 5),
        cards: validCards.slice(0, 5)
    };
};
