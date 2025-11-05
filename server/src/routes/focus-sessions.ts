import { Router } from 'express';
import { db } from '../db.js';
import type { FocusSession, FocusSessionRow } from '../types.js';

const router = Router();

// 获取专注会话（支持时间范围筛选）
router.get('/', (req, res) => {
  try {
    const { from, to } = req.query;
    
    let query = 'SELECT * FROM focus_sessions';
    const params: any[] = [];
    
    if (from || to) {
      const conditions: string[] = [];
      if (from) {
        conditions.push('start_time >= ?');
        params.push(Number(from));
      }
      if (to) {
        conditions.push('start_time <= ?');
        params.push(Number(to));
      }
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY start_time DESC';
    
    const rows = db.prepare(query).all(...params) as FocusSessionRow[];
    
    const sessions: FocusSession[] = rows.map(row => ({
      id: row.id,
      taskId: row.task_id || row.scene_id || '', // 兼容场景ID存储在taskId字段
      startTime: row.start_time,
      endTime: row.end_time,
      note: row.note || undefined
    }));
    
    res.json(sessions);
  } catch (error) {
    console.error('获取专注会话失败:', error);
    res.status(500).json({ error: '获取专注会话失败' });
  }
});

// 创建专注会话
router.post('/', (req, res) => {
  try {
    const { id, taskId, startTime, endTime, note } = req.body as FocusSession;
    
    if (!id || !taskId || startTime === undefined) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    // 检查taskId是任务还是场景
    const isTask = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
    const isScene = db.prepare('SELECT id FROM scenes WHERE id = ?').get(taskId);
    
    let actualTaskId = null;
    let actualSceneId = null;
    
    if (isTask) {
      actualTaskId = taskId;
    } else if (isScene) {
      actualSceneId = taskId;
    } else {
      return res.status(400).json({ error: '关联的任务或场景不存在' });
    }

    const stmt = db.prepare(`
      INSERT INTO focus_sessions (id, task_id, scene_id, start_time, end_time, note) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      actualTaskId,
      actualSceneId,
      startTime,
      endTime || null,
      note || null
    );
    
    res.status(201).json({ 
      id, 
      taskId, 
      startTime, 
      endTime: endTime || null,
      note
    });
  } catch (error) {
    console.error('创建专注会话失败:', error);
    res.status(500).json({ error: '创建专注会话失败' });
  }
});

// 更新专注会话
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { endTime, note } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (endTime !== undefined) {
      updates.push('end_time = ?');
      params.push(endTime || null);
    }
    if (note !== undefined) {
      updates.push('note = ?');
      params.push(note || null);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供更新字段' });
    }
    
    params.push(id);
    const stmt = db.prepare(`UPDATE focus_sessions SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '专注会话不存在' });
    }
    
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新专注会话失败:', error);
    res.status(500).json({ error: '更新专注会话失败' });
  }
});

// 删除专注会话
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM focus_sessions WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '专注会话不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除专注会话失败:', error);
    res.status(500).json({ error: '删除专注会话失败' });
  }
});

export default router;