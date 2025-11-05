
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
  dueDate?: number; // 可选的截止日期时间戳
  completedAt?: number; // 可选的完成时间时间戳
  groupId?: string; // 可选的分组ID，默认为'default'
}

export interface FocusSession {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number | null;
  note?: string; // 可选的专注备注
}

export interface Scene {
  id: string;
  emoji: string;
  name: string;
  tagIds: string[];
  createdAt: number;
  isArchived?: boolean; // 标记场景是否已归档
  archivedAt?: number; // 归档时间戳
}

export interface TabGroup {
  id: string;
  name: string;
  isDefault?: boolean; // 标记是否为默认分组
  order: number; // 排序顺序
}
