import { Router } from 'express';
import { db } from '../db.js';
import type { Scene, SceneRow } from '../types.js';

const router = Router();

// 获取所有场景及其关联的标签
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM scenes ORDER BY created_at DESC').all() as SceneRow[];
    
    const scenes: Scene[] = rows.map(row => {
      // 获取场景关联的标签
      const tagIds = db.prepare('SELECT tag_id FROM scene_tags WHERE scene_id = ?')
        .all(row.id)
        .map((r: any) => r.tag_id);
      
      return {
        id: row.id,
        emoji: row.emoji,
        name: row.name,
        tagIds,
        createdAt: row.created_at,
        isArchived: row.is_archived === 1,
        archivedAt: row.archived_at || undefined
      };
    });
    
    res.json(scenes);
  } catch (error) {
    console.error('获取场景失败:', error);
    res.status(500).json({ error: '获取场景失败' });
  }
});

// 创建场景
router.post('/', (req, res) => {
  try {
    const { id, emoji, name, tagIds, createdAt } = req.body as Scene;
    
    if (!id || !emoji || !name || createdAt === undefined) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    // 开始事务
    const insertScene = db.transaction(() => {
      // 插入场景
      const stmt = db.prepare(`
        INSERT INTO scenes (id, emoji, name, created_at) 
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(id, emoji, name, createdAt);
      
      // 插入标签关联
      if (tagIds && tagIds.length > 0) {
        const tagStmt = db.prepare('INSERT INTO scene_tags (scene_id, tag_id) VALUES (?, ?)');
        for (const tagId of tagIds) {
          tagStmt.run(id, tagId);
        }
      }
    });
    
    insertScene();
    
    res.status(201).json({ 
      id, 
      emoji, 
      name, 
      tagIds: tagIds || [], 
      createdAt
    });
  } catch (error) {
    console.error('创建场景失败:', error);
    res.status(500).json({ error: '创建场景失败' });
  }
});

// 更新场景
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { emoji, name, tagIds, isArchived } = req.body;
    
    const updateScene = db.transaction(() => {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (emoji !== undefined) {
        updates.push('emoji = ?');
        params.push(emoji);
      }
      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (isArchived !== undefined) {
        updates.push('is_archived = ?');
        params.push(isArchived ? 1 : 0);
        if (isArchived) {
          updates.push('archived_at = ?');
          params.push(Date.now());
        } else {
          updates.push('archived_at = NULL');
        }
      }
      
      if (updates.length > 0) {
        params.push(id);
        const stmt = db.prepare(`UPDATE scenes SET ${updates.join(', ')} WHERE id = ?`);
        const result = stmt.run(...params);
        
        if (result.changes === 0) {
          throw new Error('场景不存在');
        }
      }
      
      // 更新标签关联
      if (tagIds !== undefined) {
        // 删除旧的标签关联
        db.prepare('DELETE FROM scene_tags WHERE scene_id = ?').run(id);
        
        // 插入新的标签关联
        if (tagIds.length > 0) {
          const tagStmt = db.prepare('INSERT INTO scene_tags (scene_id, tag_id) VALUES (?, ?)');
          for (const tagId of tagIds) {
            tagStmt.run(id, tagId);
          }
        }
      }
    });
    
    updateScene();
    res.json({ message: '更新成功' });
  } catch (error: any) {
    console.error('更新场景失败:', error);
    if (error.message === '场景不存在') {
      return res.status(404).json({ error: '场景不存在' });
    }
    res.status(500).json({ error: '更新场景失败' });
  }
});

// 归档场景
router.post('/:id/archive', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      UPDATE scenes
      SET is_archived = 1, archived_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(Date.now(), id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '场景不存在' });
    }
    
    res.json({ message: '场景已归档' });
  } catch (error) {
    console.error('归档场景失败:', error);
    res.status(500).json({ error: '归档场景失败' });
  }
});

// 取消归档场景
router.post('/:id/unarchive', (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      UPDATE scenes
      SET is_archived = 0, archived_at = NULL
      WHERE id = ?
    `);
    
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '场景不存在' });
    }
    
    res.json({ message: '场景已取消归档' });
  } catch (error) {
    console.error('取消归档场景失败:', error);
    res.status(500).json({ error: '取消归档场景失败' });
  }
});

// 删除场景
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM scenes WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '场景不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除场景失败:', error);
    res.status(500).json({ error: '删除场景失败' });
  }
});

export default router;