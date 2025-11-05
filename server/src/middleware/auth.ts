import { Request, Response, NextFunction } from 'express';

// API密钥认证中间件
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    console.error('错误：未设置API_KEY环境变量');
    return res.status(500).json({ error: '服务器配置错误' });
  }

  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ error: '未授权：无效的API密钥' });
  }

  next();
}