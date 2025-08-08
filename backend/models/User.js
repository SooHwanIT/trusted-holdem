import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
  },
  nickname: { // 'username' 필드를 'nickname'으로 변경
    type: String,
    required: [true, 'Nickname is required.'],
    unique: true,
    trim: true,
  },
  wallet: { // 'wallet' 필드 추가
    type: String,
    required: [true, 'Wallet address is required.'],
    unique: true,
    trim: true,
  },
  chips: {
    type: Number,
    default: 10000, // 회원가입 시 기본 칩
  },
}, { timestamps: true });

// 문서를 저장하기 전에 비밀번호를 해싱(암호화)하는 미들웨어
userSchema.pre('save', async function (next) {
  // 비밀번호가 변경되었을 때만 해싱을 실행
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 입력된 비밀번호와 DB의 해시된 비밀번호를 비교하는 메소드
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model('User', userSchema);
export default User;
