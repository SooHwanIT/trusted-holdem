import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6.x 이상에서는 아래 옵션들이 기본값이라 명시할 필요가 없습니다.
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully.');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    // 연결 실패 시 프로세스 종료
    process.exit(1);
  }
};

export default connectDB;
