import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/focusflow.db';

// 确保数据目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 初始化数据库连接
export const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化数据库表结构
export function initDatabase() {
  console.log('初始化数据库表结构...');

  // 创建tags表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL
    );
  `);

  // 创建name的唯一索引（不区分大小写）
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name 
    ON tags(name COLLATE NOCASE);
  `);

  // 创建tab_groups表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tab_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 创建tasks表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      due_date INTEGER,
      group_id TEXT REFERENCES tab_groups(id) ON DELETE SET NULL
    );
  `);

  // 创建tasks的索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
  `);

  // 创建scenes表
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      emoji TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      archived_at INTEGER
    );
  `);

  // 创建scenes的索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scenes_is_archived ON scenes(is_archived);
    CREATE INDEX IF NOT EXISTS idx_scenes_archived_at ON scenes(archived_at);
  `);

  // 创建task_tags关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY(task_id, tag_id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
  `);

  // 创建scene_tags关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS scene_tags (
      scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY(scene_id, tag_id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scene_tags_tag_id ON scene_tags(tag_id);
  `);

  // 创建focus_sessions表
  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      scene_id TEXT REFERENCES scenes(id) ON DELETE CASCADE,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      note TEXT,
      CHECK(
        (task_id IS NOT NULL AND scene_id IS NULL) OR 
        (task_id IS NULL AND scene_id IS NOT NULL)
      )
    );
  `);

  // 创建focus_sessions的索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_start_time ON focus_sessions(start_time);
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_end_time ON focus_sessions(end_time);
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_scene_id ON focus_sessions(scene_id);
  `);

  // 插入默认的tab_groups（如果不存在）
  const insertDefaultGroup = db.prepare(`
    INSERT OR IGNORE INTO tab_groups (id, name, is_default) 
    VALUES (?, ?, ?)
  `);

  insertDefaultGroup.run('default', '待办事项', 1);
  insertDefaultGroup.run('goal', '目标', 0);

  console.log('数据库初始化完成！');
}

// 如果直接运行此文件，执行数据库初始化
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
  db.close();
}