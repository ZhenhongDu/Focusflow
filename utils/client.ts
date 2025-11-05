// API客户端 - 用于与后端服务器通信

const API_BASE_URL = '/api';

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// 健康检查
export async function checkHealth() {
  return apiRequest<{ status: string; timestamp: number }>('/health');
}

// 标签相关API
export const tagsApi = {
  getAll: () => apiRequest<any[]>('/tags'),
  create: (tag: any) => apiRequest('/tags', {
    method: 'POST',
    body: JSON.stringify(tag),
  }),
  update: (id: string, updates: any) => apiRequest(`/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  delete: (id: string) => apiRequest(`/tags/${id}`, {
    method: 'DELETE',
  }),
};

// 任务相关API
export const tasksApi = {
  getAll: () => apiRequest<any[]>('/tasks'),
  create: (task: any) => apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  update: (id: string, updates: any) => apiRequest(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  delete: (id: string) => apiRequest(`/tasks/${id}`, {
    method: 'DELETE',
  }),
};

// 场景相关API
export const scenesApi = {
  getAll: () => apiRequest<any[]>('/scenes'),
  create: (scene: any) => apiRequest('/scenes', {
    method: 'POST',
    body: JSON.stringify(scene),
  }),
  update: (id: string, updates: any) => apiRequest(`/scenes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  delete: (id: string) => apiRequest(`/scenes/${id}`, {
    method: 'DELETE',
  }),
};

// 专注会话相关API
export const focusSessionsApi = {
  getAll: (params?: { from?: number; to?: number }) => {
    const queryString = params 
      ? `?${new URLSearchParams(params as any).toString()}`
      : '';
    return apiRequest<any[]>(`/focus-sessions${queryString}`);
  },
  create: (session: any) => apiRequest('/focus-sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  }),
  update: (id: string, updates: any) => apiRequest(`/focus-sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  delete: (id: string) => apiRequest(`/focus-sessions/${id}`, {
    method: 'DELETE',
  }),
};

// 分组相关API
export const tabGroupsApi = {
  getAll: () => apiRequest<any[]>('/tab-groups'),
  create: (group: any) => apiRequest('/tab-groups', {
    method: 'POST',
    body: JSON.stringify(group),
  }),
  update: (id: string, updates: any) => apiRequest(`/tab-groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }),
  delete: (id: string) => apiRequest(`/tab-groups/${id}`, {
    method: 'DELETE',
  }),
};

// 导入导出API
export const importExportApi = {
  // 导入数据到服务器
  import: (data: {
    tasks?: string | any[];
    tags?: string | any[];
    focusSessions?: string | any[];
    scenes?: string | any[];
    tabGroups?: string | any[];
  }) => apiRequest('/import', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // 从服务器导出数据
  export: () => apiRequest<{
    tasks: any[];
    tags: any[];
    focusSessions: any[];
    scenes: any[];
    tabGroups: any[];
  }>('/export'),
};