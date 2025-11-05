import { Router } from 'express';
import { db } from '../db.js';
import type { Task, TaskRow } from '../types.js';

const router = Router();

// 获取所有任务及其关联的标签
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as TaskRow[];
    
    const tasks: Task[] = rows.map(row => {
      // 获取任务关联的标签
      const tagIds = db.prepare('SELECT tag_id FROM task_tags WHERE task_id = ?')
        .all(row.id)
        .map((r: any) => r.tag_id);
      
      return {
        id: row.id,
        title: row.title,
        completed: row.completed === 1,
        tagIds,
        createdAt: row.created_at,
        dueDate: row.due_date || undefined,
        groupId: row.group_id || undefined
      };
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 创建任务
router.post('/', (req, res) => {
  try {
    const { id, title, completed, tagIds, createdAt, dueDate, groupId } = req.body as Task;
    
    if (!id || !title || createdAt === undefined) {
      return res.status(400).json({ error: '缺少必需字段' });
    }

    // 开始事务
    const insertTask = db.transaction(() => {
      // 插入任务
      const stmt = db.prepare(`
        INSERT INTO tasks (id, title, completed, created_at, due_date, group_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        title,
        completed ? 1 : 0,
        createdAt,
        dueDate || null,
        groupId || null
      );
      
      // 插入标签关联
      if (tagIds && tagIds.length > 0) {
        const tagStmt = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)');
        for (const tagId of tagIds) {
          tagStmt.run(id, tagId);
        }
      }
    });
    
    insertTask();
    
    res.status(201).json({ 
      id, 
      title, 
      completed: completed || false, 
      tagIds: tagIds || [], 
      createdAt,
      dueDate,
      groupId
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// 更新任务
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed, tagIds, dueDate, groupId } = req.body;
    
    const updateTask = db.transaction(() => {
      const updates: string[] = [];
      const params: any[] = [];
      
      if (title !== undefined) {
        updates.push('title = ?');
        params.push(title);
      }
      if (completed !== undefined) {
        updates.push('completed = ?');
        params.push(completed ? 1 : 0);
      }
      if (dueDate !== undefined) {
        updates.push('due_date = ?');
        params.push(dueDate || null);
      }
      if (groupId !== undefined) {
        updates.push('group_id = ?');
        params.push(groupId || null);
      }
      
      if (updates.length > 0) {
        params.push(id);
        const stmt = db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`);
        const result = stmt.run(...params);
        
        if (result.changes === 0) {
          throw new Error('任务不存在');
        }
      }
      
      // 更新标签关联
      if (tagIds !== undefined) {
        // 删除旧的标签关联
        db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(id);
        
        // 插入新的标签关联
        if (tagIds.length > 0) {
          const tagStmt = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)');
          for (const tagId of tagIds) {
            tagStmt.run(id, tagId);
          }
        }
      }
    });
    
    updateTask();
    res.json({ message: '更新成功' });
  } catch (error: any) {
    console.error('更新任务失败:', error);
    if (error.message === '任务不存在') {
      return res.status(404).json({ error: '任务不存在' });
    }
    res.status(500).json({ error: '更新任务失败' });
  }
});

// 删除任务
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

export default router;