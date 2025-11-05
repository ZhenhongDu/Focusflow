import { Router } from 'express';
import { db } from '../db.js';
import type { Tag, TagRow } from '../types.js';

const router = Router();

// 获取所有标签
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tags ORDER BY name').all() as TagRow[];
    const tags: Tag[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color
    }));
    res.json(tags);
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({ error: '获取标签失败' });
  }
});

// 创建标签
router.post('/', (req, res) => {
  try {
    const { id, name, color } = req.body as Tag;
    
    if (!id || !name || !color) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    const stmt = db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)');
    stmt.run(id, name, color);
    
    res.status(201).json({ id, name, color });
  } catch (error: any) {
    console.error('创建标签失败:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: '标签已存在' });
    }
    res.status(500).json({ error: '创建标签失败' });
  }
});

// 更新标签
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供更新字段' });
    }
    
    params.push(id);
    const stmt = db.prepare(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '标签不存在' });
    }
    
    res.json({ message: '更新成功' });
  } catch (error: any) {
    console.error('更新标签失败:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: '标签名称已存在' });
    }
    res.status(500).json({ error: '更新标签失败' });
  }
});

// 删除标签
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '标签不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({ error: '删除标签失败' });
  }
});

export default router;