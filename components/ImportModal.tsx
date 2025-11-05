import React, { useState, useRef } from 'react';
import { XIcon, ImportIcon } from './icons';
import { importExportApi } from '../utils/client';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
        setError('');
      } catch (err) {
        setError('文件读取失败');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!jsonInput.trim()) {
      setError('请输入JSON数据或选择文件');
      return;
    }

    try {
      // 预处理输入文本，移除可能的多余空白字符和BOM
      let processedInput = jsonInput.trim();
      
      // 移除可能的BOM字符（字节顺序标记）
      if (processedInput.charCodeAt(0) === 0xFEFF) {
        processedInput = processedInput.slice(1);
      }
      
      // 尝试解析JSON
      const parsedData = JSON.parse(processedInput);
      
      // 验证数据结构
      const expectedKeys = ['tasks', 'tags', 'focusSessions', 'scenes', 'tabGroups'];
      const hasValidKeys = expectedKeys.some(key => key in parsedData);
      
      if (!hasValidKeys) {
        setError('无效的数据格式：缺少必要的字段 (tasks, tags, focusSessions, scenes, tabGroups)');
        return;
      }

      onImport(parsedData);
      setJsonInput('');
      setError('');
      onClose();
    } catch (err: any) {
      // 提供更具体的错误信息
      if (err instanceof SyntaxError) {
        setError(`JSON格式错误: ${err.message}`);
      } else {
        setError(`导入失败: ${err.message || '请检查数据格式'}`);
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    // 阻止默认粘贴行为
    event.preventDefault();
    
    // 从剪贴板获取文本
    const pastedText = event.clipboardData.getData('text/plain');
    
    // 设置到输入框
    setJsonInput(pastedText);
    setError('');
  };

  // 上传数据到服务器
  const handleUploadToServer = async () => {
    if (!jsonInput.trim()) {
      setError('请输入JSON数据或选择文件');
      return;
    }

    try {
      setIsUploading(true);
      setError('');
      setSuccessMessage('');

      // 预处理输入文本
      let processedInput = jsonInput.trim();
      if (processedInput.charCodeAt(0) === 0xFEFF) {
        processedInput = processedInput.slice(1);
      }
      
      // 解析JSON
      const parsedData = JSON.parse(processedInput);
      
      // 验证数据结构
      const expectedKeys = ['tasks', 'tags', 'focusSessions', 'scenes', 'tabGroups'];
      const hasValidKeys = expectedKeys.some(key => key in parsedData);
      
      if (!hasValidKeys) {
        setError('无效的数据格式：缺少必要的字段');
        setIsUploading(false);
        return;
      }

      // 上传到服务器
      await importExportApi.import(parsedData);
      
      setSuccessMessage('✅ 数据已成功上传到服务器！');
      setJsonInput('');
      
      // 3秒后关闭弹窗
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 2000);
      
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError(`JSON格式错误: ${err.message}`);
      } else {
        setError(`上传失败: ${err.message || '请检查服务器连接'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800">导入数据</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              选择JSON文件
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary/90"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              或粘贴JSON数据
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="粘贴您的JSON数据或选择文件..."
              className="w-full h-48 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-md">
              {successMessage}
            </div>
          )}

          <div className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
            <p>支持的数据格式：包含 tasks, tags, focusSessions, scenes, tabGroups 字段的JSON对象</p>
            <p className="mt-1"><strong>导入到本地：</strong>更新浏览器localStorage，刷新页面查看</p>
            <p className="mt-1"><strong>上传到服务器：</strong>永久保存到数据库（推荐）</p>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            取消
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              <ImportIcon className="w-4 h-4" />
              导入到本地
            </button>
            <button
              onClick={handleUploadToServer}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  上传中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  上传到服务器
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
