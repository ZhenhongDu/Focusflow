
import React, { useState } from 'react';
import { ClipboardListIcon, ChartBarIcon, ExportIcon, ImportIcon } from './icons';
import ImportModal from './ImportModal';
import { importExportApi } from '../utils/client';
import { useIsMobile } from '../utils/deviceDetect';

interface HeaderProps {
  currentView: 'tasks' | 'analysis';
  setCurrentView: (view: 'tasks' | 'analysis') => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onLogout }) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const navButtonClasses = (view: 'tasks' | 'analysis') =>
    `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
      currentView === view
        ? 'bg-slate-900 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  const handleExportData = () => {
    const exportData = {
      tasks: localStorage.getItem('tasks'),
      tags: localStorage.getItem('tags'),
      focusSessions: localStorage.getItem('focusSessions'),
      scenes: localStorage.getItem('scenes'),
      tabGroups: localStorage.getItem('tabGroups')
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `focusflow-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (importedData: any) => {
    try {
      // 遍历导入的数据并写入localStorage
      Object.keys(importedData).forEach(key => {
        const value = importedData[key];
        if (value !== null && value !== undefined) {
          // value 可能是字符串或对象，需要正确处理
          let finalValue;
          if (typeof value === 'string') {
            // 如果已经是字符串格式（如 "[...]"），直接使用
            finalValue = value;
          } else {
            // 如果是对象，转换为字符串
            finalValue = JSON.stringify(value);
          }
          
          localStorage.setItem(key, finalValue);
          console.log(`已成功导入: ${key}`);
        } else {
          console.log(`已跳过: ${key} (值为 null)`);
        }
      });

      console.log('--- 导入完成! ---');
      console.log('请刷新页面 (F5) 来查看导入的数据。');
      
      // 显示成功消息
      alert('数据导入成功！请刷新页面查看导入的数据。');
    } catch (error) {
      console.error('导入失败！', error);
      alert('数据导入失败，请检查数据格式。');
    }
  };

  // 从服务器拉取数据
  const handleSyncFromServer = async () => {
    if (!confirm('确定要从服务器拉取数据吗？这将覆盖本地数据。')) {
      return;
    }

    try {
      setIsSyncing(true);
      
      // 从服务器获取数据
      const data = await importExportApi.export();
      
      // 写入localStorage
      localStorage.setItem('tasks', JSON.stringify(data.tasks));
      localStorage.setItem('tags', JSON.stringify(data.tags));
      localStorage.setItem('focusSessions', JSON.stringify(data.focusSessions));
      localStorage.setItem('scenes', JSON.stringify(data.scenes));
      localStorage.setItem('tabGroups', JSON.stringify(data.tabGroups));
      
      alert('✅ 数据拉取成功！页面将刷新以显示最新数据。');
      
      // 刷新页面以显示新数据
      window.location.reload();
      
    } catch (error: any) {
      console.error('拉取失败:', error);
      alert(`❌ 拉取失败: ${error.message || '请检查服务器连接'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 上传本地数据到服务器
  const handleUploadToServer = async () => {
    if (!confirm('确定要将本地数据上传到服务器吗？这将覆盖服务器上的数据。')) {
      return;
    }

    try {
      setIsUploading(true);
      
      // 从localStorage读取数据
      const tasks = localStorage.getItem('tasks');
      const tags = localStorage.getItem('tags');
      const focusSessions = localStorage.getItem('focusSessions');
      const scenes = localStorage.getItem('scenes');
      const tabGroups = localStorage.getItem('tabGroups');
      
      // 准备上传数据
      const uploadData = {
        tasks: tasks ? JSON.parse(tasks) : [],
        tags: tags ? JSON.parse(tags) : [],
        focusSessions: focusSessions ? JSON.parse(focusSessions) : [],
        scenes: scenes ? JSON.parse(scenes) : [],
        tabGroups: tabGroups ? JSON.parse(tabGroups) : []
      };
      
      // 上传到服务器
      await importExportApi.import(uploadData);
      
      alert('✅ 数据上传成功！本地数据已同步到服务器。');
      
    } catch (error: any) {
      console.error('上传失败:', error);
      alert(`❌ 上传失败: ${error.message || '请检查服务器连接'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* 移动端 Header */}
      {isMobile ? (
        <>
          <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-14">
                {/* 左侧菜单按钮 */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* 中间导航按钮 */}
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView('tasks')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                      currentView === 'tasks'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ClipboardListIcon className="w-4 h-4" />
                    <span>Tasks</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('analysis')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                      currentView === 'analysis'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Analysis</span>
                  </button>
                </nav>
                
                {/* 右侧云端同步按钮 */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleUploadToServer}
                    disabled={isUploading}
                    className="p-2 rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="上传本地数据到服务器"
                  >
                    {isUploading ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleSyncFromServer}
                    disabled={isSyncing}
                    className="p-2 rounded-md text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="从服务器拉取数据"
                  >
                    {isSyncing ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* 移动端底部弹出面板 */}
          {isMobile && isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              {/* 背景遮罩 */}
              <button
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="关闭菜单"
              />
              
              {/* 底部面板容器 */}
              <div className="relative w-full max-h-[85vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-slide-up">
                {/* 顶部拖动条 */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="h-1 w-12 rounded-full bg-slate-300" />
                </div>
                
                {/* 面板头部 */}
                <div className="flex items-center justify-between px-5 pb-4 pt-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">快捷操作</h2>
                    <p className="text-xs text-slate-500 mt-0.5">数据管理与系统设置</p>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                    aria-label="关闭"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* 面板内容 */}
                <div className="max-h-[calc(85vh-120px)] overflow-y-auto px-5 pb-6">
                  {/* 数据操作区域 */}
                  <div className="mb-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">数据操作</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setIsImportModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200">
                            <ImportIcon className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-slate-800">导入数据</div>
                            <div className="text-xs text-slate-500">从 JSON 文件恢复</div>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleExportData();
                          setIsMobileMenuOpen(false);
                        }}
                        className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-200">
                            <ExportIcon className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-slate-800">导出数据</div>
                            <div className="text-xs text-slate-500">备份为 JSON 文件</div>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleUploadToServer();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isUploading}
                        className="group flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 px-4 py-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-200 text-emerald-700 transition-colors group-hover:bg-emerald-300">
                            {isUploading ? (
                              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-emerald-900">{isUploading ? '上传中...' : '上传到服务器'}</div>
                            <div className="text-xs text-emerald-700">覆盖服务器数据</div>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-emerald-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleSyncFromServer();
                          setIsMobileMenuOpen(false);
                        }}
                        disabled={isSyncing}
                        className="group flex w-full items-center justify-between rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50 px-4 py-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-200 text-indigo-700 transition-colors group-hover:bg-indigo-300">
                            {isSyncing ? (
                              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                            )}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-indigo-900">{isSyncing ? '同步中...' : '从服务器拉取'}</div>
                            <div className="text-xs text-indigo-700">覆盖本地数据</div>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-indigo-600 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* 提示信息 */}
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                      <div className="flex gap-2">
                        <svg className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-[11px] leading-relaxed text-amber-800">
                          请在网络稳定时进行同步操作，避免本地与服务器数据冲突。
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 账户操作区域 */}
                  {onLogout && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">账户管理</h3>
                      <button
                        onClick={() => {
                          onLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-colors group-hover:bg-red-200">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-slate-800">退出登录</div>
                            <div className="text-xs text-slate-500">安全退出当前账户</div>
                          </div>
                        </div>
                        <svg className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        // 桌面端 Header
        <>
          <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* 左侧：菜单按钮和标题 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                    className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none transition-colors"
                    title="菜单"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    FocusFlow
                  </h1>
                </div>

                {/* 右侧：云端同步按钮和导航 */}
                <div className="flex items-center gap-4">
                  {/* 云端同步按钮组 */}
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-2 py-1 shadow-sm">
                    <button
                      onClick={handleUploadToServer}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="上传本地数据到服务器"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>上传中...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>上传</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSyncFromServer}
                      disabled={isSyncing}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="从服务器拉取数据"
                    >
                      {isSyncing ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>拉取中...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>拉取</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 导航按钮 */}
                  <nav className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('tasks')} className={navButtonClasses('tasks')}>
                      <ClipboardListIcon className="w-5 h-5" />
                      <span>Tasks</span>
                    </button>
                    <button onClick={() => setCurrentView('analysis')} className={navButtonClasses('analysis')}>
                      <ChartBarIcon className="w-5 h-5" />
                      <span>Analysis</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </header>

          {/* 桌面端左侧下拉菜单 */}
          {isDesktopMenuOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-start">
              {/* 背景遮罩 */}
              <button
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={() => setIsDesktopMenuOpen(false)}
                aria-label="关闭菜单"
              />
              
              {/* 左侧下拉面板 */}
              <div className="relative mt-16 ml-4 w-80 bg-white rounded-2xl shadow-2xl animate-slide-down">
                {/* 面板头部 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">功能菜单</h2>
                    <p className="text-xs text-slate-500 mt-0.5">数据管理与账户设置</p>
                  </div>
                  <button
                    onClick={() => setIsDesktopMenuOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all hover:bg-slate-200"
                    aria-label="关闭"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* 面板内容 */}
                <div className="px-5 py-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                  {/* 数据操作区域 */}
                  <div className="mb-5">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">数据操作</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setIsImportModalOpen(true);
                          setIsDesktopMenuOpen(false);
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-blue-200"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-200">
                          <ImportIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-slate-800">导入数据</div>
                          <div className="text-xs text-slate-500">从 JSON 文件恢复</div>
                        </div>
                        <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => {
                          handleExportData();
                          setIsDesktopMenuOpen(false);
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-purple-200"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-200">
                          <ExportIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-slate-800">导出数据</div>
                          <div className="text-xs text-slate-500">备份为 JSON 文件</div>
                        </div>
                        <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* 账户操作区域 */}
                  {onLogout && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">账户管理</h3>
                      <button
                        onClick={() => {
                          onLogout();
                          setIsDesktopMenuOpen(false);
                        }}
                        className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-red-200"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600 transition-colors group-hover:bg-red-200">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-slate-800">退出登录</div>
                          <div className="text-xs text-slate-500">安全退出当前账户</div>
                        </div>
                        <svg className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportData}
      />
    </>
  );
};

export default Header;
