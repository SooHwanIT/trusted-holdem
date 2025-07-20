/* models/User.ts */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },          // bcrypt hash
    nickname:   { type: String, required: true },
    wallet:     { type: String, required: true },          // EVM account
    avatarUrl:  { type: String },
    chips:      { type: Number, default: 1500 },
    stats: {                        // 예: 핸드 수·승률 등
        handsPlayed: { type: Number, default: 0 },
        handsWon:    { type: Number, default: 0 },
        profit:      { type: Number, default: 0 }
    }
});

/* 해시 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

/* PW 검증 */
userSchema.methods.compare = function (pw: string) {
    return bcrypt.compare(pw, this.password);
};

export default mongoose.model('User', userSchema);
