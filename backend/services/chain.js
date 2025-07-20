import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

/* PokerTable ABI 중 settleRound 부분만 */
const ABI = [
    'function settleRound(uint256 hand, bytes32 root, address winner) payable',
];

export const table = new ethers.Contract(
    process.env.TABLE_CONTRACT,
    ABI,
    wallet
);

export async function settleRound(handNo, root, winner, payoutWei) {
    const tx = await table.settleRound(handNo, root, winner, {
        value: payoutWei,
        gasLimit: 150000,
    });
    return tx.wait();
}
