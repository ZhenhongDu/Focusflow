import { Router } from 'express';
import { db } from '../db.js';
import type { TabGroup, TabGroupRow } from '../types.js';

const router = Router();

// 获取所有分组
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tab_groups ORDER BY id').all() as TabGroupRow[];
    const groups: TabGroup[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      isDefault: row.is_default === 1
    }));
    res.json(groups);
  } catch (error) {
    console.error('获取分组失败:', error);
    res.status(500).json({ error: '获取分组失败' });
  }
});

// 创建分组
router.post('/', (req, res) => {
  try {
    const { id, name, isDefault } = req.body as TabGroup;
    
    if (!id || !name) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    const stmt = db.prepare(`
      INSERT INTO tab_groups (id, name, is_default) 
      VALUES (?, ?, ?)
    `);
    stmt.run(id, name, isDefault ? 1 : 0);
    
    res.status(201).json({ id, name, isDefault: isDefault || false });
  } catch (error) {
    console.error('创建分组失败:', error);
    res.status(500).json({ error: '创建分组失败' });
  }
});

// 更新分组
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, isDefault } = req.body;
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (isDefault !== undefined) {
      updates.push('is_default = ?');
      params.push(isDefault ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供更新字段' });
    }
    
    params.push(id);
    const stmt = db.prepare(`UPDATE tab_groups SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    res.json({ message: '更新成功' });
  } catch (error) {
    console.error('更新分组失败:', error);
    res.status(500).json({ error: '更新分组失败' });
  }
});

// 删除分组
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM tab_groups WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除分组失败:', error);
    res.status(500).json({ error: '删除分组失败' });
  }
});

export default router;