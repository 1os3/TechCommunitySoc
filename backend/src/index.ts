import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
// import { EmailService } from './services/emailService'; // 暂时注释掉
import logger from './utils/logger';
import errorHandler from './middleware/errorHandler';
import routes from './routes';
import { initializeModels } from './models';
import { trackBehavior } from './middleware/behaviorTracking';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Only apply rate limiting in production environments
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1分钟窗口
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200'), // 每分钟200次请求
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试',
        timestamp: new Date().toISOString()
      }
    },
    standardHeaders: true, // 返回限流信息在headers中
    legacyHeaders: false,
  });
  app.use('/api', limiter);
}

// Add behavior tracking middleware (applied to all routes)
app.use(trackBehavior({
  trackViews: true,
  trackLikes: true,
  trackComments: true,
  debounceTime: 30000 // 30 seconds
}));

// Mount routes
app.use('/', routes);

app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Initialize models with associations
    initializeModels();
    logger.info('Models initialized with associations');
    
    if (process.env.NODE_ENV !== 'test') {
      await sequelize.sync({ force: false });
      logger.info('Database synchronized');
    }

    // Initialize email service - 暂时注释掉
    // try {
    //   await EmailService.initialize();
    //   logger.info('Email service initialized successfully');
    // } catch (error) {
    //   logger.warn('Email service initialization failed:', error);
    //   // Continue startup even if email service fails
    // }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;