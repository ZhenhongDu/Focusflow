import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDatabase } from './db.js';
import { apiKeyAuth } from './middleware/auth.js';

// 导入路由
import tagsRouter from './routes/tags.js';
import tasksRouter from './routes/tasks.js';
import scenesRouter from './routes/scenes.js';
import focusSessionsRouter from './routes/focus-sessions.js';
import tabGroupsRouter from './routes/tab-groups.js';
import importExportRouter from './routes/import-export.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 初始化数据库
initDatabase();

// 中间件
app.use(helmet()); // 安全头
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false // 生产环境由Nginx处理CORS
    : 'http://localhost:3000', // 开发环境允许前端访问
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // 解析JSON请求体，增加限制以支持大数据导入

// 健康检查（不需要认证）
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API认证中间件（应用于所有/api路由，除了health）
app.use('/api', apiKeyAuth);

// 注册路由
app.use('/api/tags', tagsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/scenes', scenesRouter);
app.use('/api/focus-sessions', focusSessionsRouter);
app.use('/api/tab-groups', tabGroupsRouter);
app.use('/api', importExportRouter); // /api/import 和 /api/export

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '未找到请求的资源' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`FocusFlow API Server 已启动`);
  console.log(`端口: ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`数据库: ${process.env.DB_PATH || './data/focusflow.db'}`);
  console.log(`========================================`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});