/* utils/jwt.ts */
import jwt from 'jsonwebtoken';
const { JWT_SECRET = 'dev_secret' } = process.env;

export const sign = (payload: any) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

export const verify = (tok: string) =>
    jwt.verify(tok, JWT_SECRET);

export const auth = (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'NO_TOKEN' });
    try {
        (req as any).user = verify(token);
        next();
    } catch {
        res.status(401).json({ error: 'INVALID_TOKEN' });
    }
};
