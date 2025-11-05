import { Router } from 'express';
import { db } from '../db.js';
import type { ImportData, ExportData, Task, Tag, FocusSession, Scene, TabGroup } from '../types.js';

const router = Router();

// 导入数据
router.post('/import', (req, res) => {
  try {
    const data = req.body as ImportData;
    
    // 解析可能是字符串的数据
    const parsedData: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        try {
          parsedData[key] = JSON.parse(value);
        } catch {
          parsedData[key] = [];
        }
      } else {
        parsedData[key] = value || [];
      }
    }

    const importTransaction = db.transaction(() => {
      // 1. 导入标签
      if (parsedData.tags && Array.isArray(parsedData.tags)) {
        const tagStmt = db.prepare(`
          INSERT OR REPLACE INTO tags (id, name, color) 
          VALUES (?, ?, ?)
        `);
        for (const tag of parsedData.tags as Tag[]) {
          tagStmt.run(tag.id, tag.name, tag.color);
        }
      }

      // 2. 导入分组
      if (parsedData.tabGroups && Array.isArray(parsedData.tabGroups)) {
        const groupStmt = db.prepare(`
          INSERT OR REPLACE INTO tab_groups (id, name, is_default) 
          VALUES (?, ?, ?)
        `);
        for (const group of parsedData.tabGroups as TabGroup[]) {
          groupStmt.run(group.id, group.name, group.isDefault ? 1 : 0);
        }
      }

      // 3. 导入任务
      if (parsedData.tasks && Array.isArray(parsedData.tasks)) {
        const taskStmt = db.prepare(`
          INSERT OR REPLACE INTO tasks (id, title, completed, created_at, due_date, group_id) 
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const taskTagStmt = db.prepare(`
          INSERT OR IGNORE INTO task_tags (task_id, tag_id) 
          VALUES (?, ?)
        `);
        
        for (const task of parsedData.tasks as Task[]) {
          taskStmt.run(
            task.id,
            task.title,
            task.completed ? 1 : 0,
            task.createdAt,
            task.dueDate || null,
            task.groupId || null
          );
          
          // 删除旧的标签关联，重新插入
          db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(task.id);
          if (task.tagIds && task.tagIds.length > 0) {
            for (const tagId of task.tagIds) {
              taskTagStmt.run(task.id, tagId);
            }
          }
        }
      }

      // 4. 导入场景
      if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
        const sceneStmt = db.prepare(`
          INSERT OR REPLACE INTO scenes (id, emoji, name, created_at) 
          VALUES (?, ?, ?, ?)
        `);
        const sceneTagStmt = db.prepare(`
          INSERT OR IGNORE INTO scene_tags (scene_id, tag_id) 
          VALUES (?, ?)
        `);
        
        for (const scene of parsedData.scenes as Scene[]) {
          sceneStmt.run(
            scene.id,
            scene.emoji,
            scene.name,
            scene.createdAt
          );
          
          // 删除旧的标签关联，重新插入
          db.prepare('DELETE FROM scene_tags WHERE scene_id = ?').run(scene.id);
          if (scene.tagIds && scene.tagIds.length > 0) {
            for (const tagId of scene.tagIds) {
              sceneTagStmt.run(scene.id, tagId);
            }
          }
        }
      }

      // 5. 导入专注会话
      if (parsedData.focusSessions && Array.isArray(parsedData.focusSessions)) {
        const sessionStmt = db.prepare(`
          INSERT OR REPLACE INTO focus_sessions (id, task_id, scene_id, start_time, end_time, note) 
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        for (const session of parsedData.focusSessions as FocusSession[]) {
          // 判断taskId是任务还是场景
          const isTask = db.prepare('SELECT id FROM tasks WHERE id = ?').get(session.taskId);
          const isScene = db.prepare('SELECT id FROM scenes WHERE id = ?').get(session.taskId);
          
          sessionStmt.run(
            session.id,
            isTask ? session.taskId : null,
            isScene ? session.taskId : null,
            session.startTime,
            session.endTime || null,
            session.note || null
          );
        }
      }

      // 确保默认分组存在
      const defaultGroups = [
        { id: 'default', name: '待办事项', is_default: 1 },
        { id: 'goal', name: '目标', is_default: 0 }
      ];
      
      const ensureGroupStmt = db.prepare(`
        INSERT OR IGNORE INTO tab_groups (id, name, is_default) 
        VALUES (?, ?, ?)
      `);
      
      for (const group of defaultGroups) {
        ensureGroupStmt.run(group.id, group.name, group.is_default);
      }
    });

    importTransaction();
    
    res.json({ message: '数据导入成功', success: true });
  } catch (error) {
    console.error('导入数据失败:', error);
    res.status(500).json({ error: '导入数据失败', details: String(error) });
  }
});

// 导出数据
router.get('/export', (req, res) => {
  try {
    const exportData: ExportData = {
      tags: [],
      tasks: [],
      scenes: [],
      focusSessions: [],
      tabGroups: []
    };

    // 导出标签
    const tagRows = db.prepare('SELECT * FROM tags').all();
    exportData.tags = tagRows.map((row: any) => ({
      id: row.id,
      name: row.name,
      color: row.color
    }));

    // 导出分组
    const groupRows = db.prepare('SELECT * FROM tab_groups').all();
    exportData.tabGroups = groupRows.map((row: any) => ({
      id: row.id,
      name: row.name,
      isDefault: row.is_default === 1
    }));

    // 导出任务
    const taskRows = db.prepare('SELECT * FROM tasks').all();
    exportData.tasks = taskRows.map((row: any) => {
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

    // 导出场景
    const sceneRows = db.prepare('SELECT * FROM scenes').all();
    exportData.scenes = sceneRows.map((row: any) => {
      const tagIds = db.prepare('SELECT tag_id FROM scene_tags WHERE scene_id = ?')
        .all(row.id)
        .map((r: any) => r.tag_id);
      
      return {
        id: row.id,
        emoji: row.emoji,
        name: row.name,
        tagIds,
        createdAt: row.created_at
      };
    });

    // 导出专注会话
    const sessionRows = db.prepare('SELECT * FROM focus_sessions').all();
    exportData.focusSessions = sessionRows.map((row: any) => ({
      id: row.id,
      taskId: row.task_id || row.scene_id || '',
      startTime: row.start_time,
      endTime: row.end_time,
      note: row.note || undefined
    }));

    res.json(exportData);
  } catch (error) {
    console.error('导出数据失败:', error);
    res.status(500).json({ error: '导出数据失败' });
  }
});

export default router;