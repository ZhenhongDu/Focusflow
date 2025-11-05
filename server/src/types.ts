// 数据库行类型定义
export interface TagRow {
  id: string;
  name: string;
  color: string;
}

export interface TaskRow {
  id: string;
  title: string;
  completed: number; // SQLite使用0/1表示布尔值
  created_at: number;
  due_date: number | null;
  group_id: string | null;
}

export interface SceneRow {
  id: string;
  emoji: string;
  name: string;
  created_at: number;
  is_archived: number; // SQLite使用0/1表示布尔值
  archived_at: number | null;
}

export interface FocusSessionRow {
  id: string;
  task_id: string | null;
  scene_id: string | null;
  start_time: number;
  end_time: number | null;
  note: string | null;
}

export interface TabGroupRow {
  id: string;
  name: string;
  is_default: number; // SQLite使用0/1表示布尔值
}

export interface TaskTagRow {
  task_id: string;
  tag_id: string;
}

export interface SceneTagRow {
  scene_id: string;
  tag_id: string;
}

// API响应类型（与前端types.ts对应）
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  tagIds: string[];
  createdAt: number;
  dueDate?: number;
  groupId?: string;
}

export interface Scene {
  id: string;
  emoji: string;
  name: string;
  tagIds: string[];
  createdAt: number;
  isArchived?: boolean;
  archivedAt?: number;
}

export interface FocusSession {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number | null;
  note?: string;
}

export interface TabGroup {
  id: string;
  name: string;
  isDefault?: boolean;
}

// 导入/导出数据结构
export interface ImportData {
  tasks?: string | Task[];
  tags?: string | Tag[];
  focusSessions?: string | FocusSession[];
  scenes?: string | Scene[];
  tabGroups?: string | TabGroup[];
}

export interface ExportData {
  tasks: Task[];
  tags: Tag[];
  focusSessions: FocusSession[];
  scenes: Scene[];
  tabGroups: TabGroup[];
}