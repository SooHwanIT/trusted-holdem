import _ from 'lodash';

/* 내부 유틸 ----------------------------------------------------------- */
const RANK_ORDER = '23456789TJQKA';
const rankVal = (r) => RANK_ORDER.indexOf(r);          // 0~12
const sortDesc = (a, b) => rankVal(b.rank) - rankVal(a.rank);

/* 5장 핸드의 카테고리와 점수 계산 ----------------------------------- */
function scoreFive(cards) {
    cards = [...cards].sort(sortDesc); // 내림차순
    const counts = _.countBy(cards, 'rank');
    const byCnt = _.toPairs(counts).sort((a, b) => b[1] - a[1] || rankVal(b[0]) - rankVal(a[0]));
    const ranksDesc = cards.map((c) => rankVal(c.rank));

    const isFlush = _.uniqBy(cards, 'suit').length === 1;
    const isStraight = (() => {
        const vals = ranksDesc.slice();
        // Wheel (A-2-3-4-5)
        if (_.isEqual(vals, [12, 3, 2, 1, 0])) return true;
        return _.chunk(vals, 1).every((v, i, arr) => i === 0 || v[0] === arr[i - 1][0] - 1);
    })();

    /* 등급 번호(high → low): 8~0  */
    if (isStraight && isFlush) return [8, ranksDesc[0]];
    if (byCnt[0][1] === 4)        return [7, rankVal(byCnt[0][0]), rankVal(byCnt[1][0])];
    if (byCnt[0][1] === 3 && byCnt[1][1] === 2)
        return [6, rankVal(byCnt[0][0]), rankVal(byCnt[1][0])];
    if (isFlush)                  return [5, ...ranksDesc];
    if (isStraight)               return [4, ranksDesc[0]];
    if (byCnt[0][1] === 3)        return [3, rankVal(byCnt[0][0]), ...ranksDesc];
    if (byCnt[0][1] === 2 && byCnt[1][1] === 2)
        return [2, rankVal(byCnt[0][0]), rankVal(byCnt[1][0]), rankVal(byCnt[2][0])];
    if (byCnt[0][1] === 2)        return [1, rankVal(byCnt[0][0]), ...ranksDesc];
    return [0, ...ranksDesc]; // High card
}

/* 7장 → 21가지 5장 조합 중 최고 선택 -------------------------------- */
export function bestOfSeven(seven) {
    if (seven.length !== 7) throw new Error('Need exactly 7 cards');
    let best = { score: [-1], cards: [] };

    const idx = _.range(7);
    for (let i = 0; i < idx.length - 4; i++)
        for (let j = i + 1; j < idx.length - 3; j++)
            for (let k = j + 1; k < idx.length - 2; k++)
                for (let l = k + 1; l < idx.length - 1; l++)
                    for (let m = l + 1; m < idx.length; m++) {
                        const combo = [seven[i], seven[j], seven[k], seven[l], seven[m]];
                        const s = scoreFive(combo);
                        if (compareScore(s, best.score) > 0) best = { score: s, cards: combo };
                    }
    return best;
}

/* 점수 배열 비교 (큰 쪽이 1, 같으면 0, 작으면 -1) */
function compareScore(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const diff = (a[i] || 0) - (b[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

/* 랭크 이름 변환용 */
const RANK_NAME = ['High Card','One Pair','Two Pair','Trips','Straight',
    'Flush','Full House','Quads','Straight Flush'];

/* 외부 노출 API ------------------------------------------------------ */
export function evaluate(sevenCards) {
    const { score, cards } = bestOfSeven(sevenCards);
    return {
        rankName: RANK_NAME[score[0]],
        score,          // 배열 형태 (비교/정렬용)
        bestCards: cards,
    };
}
