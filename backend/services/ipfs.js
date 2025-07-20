import { create } from 'ipfs-http-client';
import dotenv from 'dotenv';
dotenv.config();

const auth =
    'Basic ' +
    Buffer.from(
        process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_PROJECT_SECRET
    ).toString('base64');

export const ipfs = create({
    url: 'https://ipfs.infura.io:5001/api/v0',
    headers: { authorization: auth },
});

export async function uploadJSON(obj) {
    const { cid } = await ipfs.add(JSON.stringify(obj));
    return cid.toString();
}
