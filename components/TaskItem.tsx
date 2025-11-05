import React, { useState, useEffect } from 'react';
import { Task, Tag, FocusSession } from '../types';
import { PlayIcon, StopIcon, PlusIcon, XIcon, PencilIcon, TrashIcon, CheckIcon, CalendarIcon } from './icons';
import TaskDetailModal from './TaskDetailModal';
import ImmersiveFocusModal from './ImmersiveFocusModal';
import { useIsMobile } from '../utils/deviceDetect';

// 预设的标签emoji选项
const TAG_PRESET_EMOJIS = [
  '📚', '💻', '🔬', '💼', '📝', '🎯', '🧠', '📖', '✍️', '🎨', '🏃', '🎵',
];

interface TaskItemProps {
  task: Task;
  tags: Tag[];
  allTags: Tag[];
  focusSessions: FocusSession[];
  onToggleComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (sessionId: string) => void;
  activeSession: FocusSession | null;
  elapsedTime: number;
  onAddTagToTask: (taskId: string, tagId: string) => void;
  onRemoveTagFromTask: (taskId: string, tagId: string) => void;
  onUpdateTaskTitle: (taskId: string, newTitle: string) => void;
  onUpdateTaskDueDate: (taskId: string, dueDate: number | undefined) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteFocusSession: (sessionId: string) => void;
  onResumeTimer?: () => void;
  onPauseTimer?: () => void; // 添加暂停功能
  onUpdateFocusNote?: (sessionId: string, note: string) => void;
  isFocusModalMinimized?: boolean;
  onSetFocusModalMinimized?: (minimized: boolean) => void;
  onCreateTag?: (name: string) => void;
  tabGroups?: { id: string; name: string }[]; // 添加分组信息
  onMoveTaskToGroup?: (taskId: string, groupId: string) => void; // 添加移动任务到分组的功能
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const TaskItem: React.FC<TaskItemProps> = (props) => {
  const {
    task,
    tags: taskTags,
    allTags,
    focusSessions,
    onToggleComplete,
    onStartTimer,
    onStopTimer,
    activeSession,
    elapsedTime,
    onAddTagToTask,
    onRemoveTagFromTask,
    onUpdateTaskTitle,
    onUpdateTaskDueDate,
    onDeleteTask,
    onDeleteFocusSession,
    onResumeTimer,
    onPauseTimer, // 添加暂停功能
    onUpdateFocusNote,
    isFocusModalMinimized,
    onSetFocusModalMinimized,
    onCreateTag,
    tabGroups,
    onMoveTaskToGroup
  } = props;
  
  const isMobile = useIsMobile();
  
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [selectedTagEmoji, setSelectedTagEmoji] = useState('');
  const [showTagEmojiPicker, setShowTagEmojiPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [showDetail, setShowDetail] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState<string>('');
  const [showImmersiveFocus, setShowImmersiveFocus] = useState(false);
  const [focusNote, setFocusNote] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  const isThisTaskActive = activeSession?.taskId === task.id;
  
  const availableTagsToAdd = allTags.filter(globalTag => !task.tagIds.includes(globalTag.id));
  
  const normalizedTagQuery = tagQuery.trim().toLowerCase();
  const filteredTagOptions = normalizedTagQuery
    ? availableTagsToAdd.filter(tag => tag.name.toLowerCase().includes(normalizedTagQuery))
    : availableTagsToAdd;
  
  const handleAddTag = (tagId: string) => {
    onAddTagToTask(task.id, tagId);
    setTagQuery('');
    resetAutoCloseTimer(); // 重置自动关闭定时器，方便连续添加多个标签
  }

  // 重置5秒自动关闭定时器
  const resetAutoCloseTimer = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
    }
    const timer = setTimeout(() => {
      handleCloseTagPanel();
    }, 5000);
    setAutoCloseTimer(timer);
  };

  // 5秒自动关闭面板的useEffect
  useEffect(() => {
    if (isAddingTag) {
      resetAutoCloseTimer();
    } else {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    }

    return () => {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
      }
    };
  }, [isAddingTag]);

  const handleCloseTagPanel = () => {
    setIsAddingTag(false);
    setTagQuery('');
    setSelectedTagEmoji('');
    setShowTagEmojiPicker(false);
  }

  const handleSelectTagEmoji = (emoji: string) => {
    setSelectedTagEmoji(emoji);
    setShowTagEmojiPicker(false);
    resetAutoCloseTimer(); // 重置自动关闭定时器
  };

  // 检查字符串是否以emoji开头
  const startsWithEmoji = (str: string) => {
    // 使用正则匹配emoji（基本emoji范围）
    const emojiRegex = /^[\p{Emoji}\p{Emoji_Component}]/u;
    return emojiRegex.test(str);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTagOptions.length > 0) {
        // 如果有匹配项，选中第一个
        handleAddTag(filteredTagOptions[0].id);
      } else if (tagQuery.trim() && onCreateTag) {
        // 如果没有匹配项但有输入内容，尝试创建新标签
        const trimmedQuery = tagQuery.trim();
        const newTagName = selectedTagEmoji ? `${selectedTagEmoji} ${trimmedQuery}` : trimmedQuery;
        
        if (startsWithEmoji(newTagName)) {
          // 检查标签名是否以emoji开头
          onCreateTag(newTagName);
          // 等待一小段时间让标签创建完成后再添加
          setTimeout(() => {
            const newTag = allTags.find(t => t.name === newTagName);
            if (newTag) {
              handleAddTag(newTag.id);
            }
          }, 100);
          setTagQuery('');
          setSelectedTagEmoji('');
          setShowTagEmojiPicker(false);
        } else {
          alert('标签名必须以 emoji 开头。请先选择emoji或直接输入emoji开头的标签名');
        }
      }
    }
    if (e.key === 'Escape') {
      handleCloseTagPanel();
    }
  };

  const handleUpdate = () => {
    if (editedTitle.trim() && editedTitle.trim() !== task.title) {
        onUpdateTaskTitle(task.id, editedTitle.trim());
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
      setEditedTitle(task.title);
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleUpdate();
      if (e.key === 'Escape') handleCancelEdit();
  };
  
  const handleEditClick = () => {
      if (isEditing) {
          handleUpdate();
      } else {
          setEditedTitle(task.title);
          setIsEditing(true);
      }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDateString = () => {
    const today = new Date();
    return formatDate(today.getTime());
  };

  const handleStartEditingDate = () => {
    if (isEditing) return;
    // 如果任务已有日期，使用任务日期；否则使用今天
    setTempDate(task.dueDate ? formatDate(task.dueDate) : getTodayDateString());
    setIsEditingDate(true);
  };

  const handleConfirmDate = () => {
    if (tempDate) {
      const timestamp = new Date(tempDate).getTime();
      onUpdateTaskDueDate(task.id, timestamp);
    }
    setIsEditingDate(false);
    setTempDate('');
  };

  const handleCancelDate = () => {
    setIsEditingDate(false);
    setTempDate('');
  };

  const handleStartFocus = () => {
    if (!activeSession || !isThisTaskActive) {
      onStartTimer(task.id);
      setShowImmersiveFocus(true);
    }
  };

  const handleStopFocus = () => {
    if (activeSession) {
      onStopTimer(activeSession.id);
      setShowImmersiveFocus(false);
    }
  };

  const handleCloseImmersiveFocus = () => {
    setShowImmersiveFocus(false);
    setFocusNote('');
  };

  const handleResumeFocus = () => {
    if (onResumeTimer) {
      onResumeTimer();
    }
  };

  const handlePauseFocus = () => {
    if (onPauseTimer) {
      onPauseTimer();
    }
  };

  const handleUpdateNote = (note: string) => {
    setFocusNote(note);
    if (activeSession && onUpdateFocusNote) {
      onUpdateFocusNote(activeSession.id, note);
    }
  };

  const isOverdue = task.dueDate && !task.completed && task.dueDate < Date.now();
  const isDueSoon = task.dueDate && !task.completed && task.dueDate > Date.now() && task.dueDate < Date.now() + 24 * 60 * 60 * 1000;

  // 长按手势处理（仅移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || isEditing) return;
    
    const timer = setTimeout(() => {
      setShowActionMenu(true);
    }, 500); // 长按500ms
    
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 移动任务到其他分组
  const handleMoveTaskToGroup = (groupId: string) => {
    if (onMoveTaskToGroup) {
      onMoveTaskToGroup(task.id, groupId);
    }
    closeContextMenu();
  };

  // 处理点击事件以关闭右键菜单
  React.useEffect(() => {
    const handleClick = () => {
      if (contextMenu?.visible) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu]);

  return (
    <>
      <div
        className={`bg-white rounded-lg shadow-sm transition-all hover:shadow-md ${isMobile ? 'p-2 gap-2 relative' : 'p-4 gap-4 flex items-center justify-between'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={handleContextMenu}
      >
        
        <div className={`flex items-center flex-grow min-w-0 ${isMobile ? 'gap-2 pr-10' : 'gap-4'}`}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleComplete(task.id)}
            className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-secondary self-start mt-1"
          />
          <div className="flex-grow min-w-0">
            {isEditing ? (
               <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleUpdate}
                  className="font-medium text-slate-800 bg-slate-50 px-1 -my-1 border-b-2 border-brand-primary w-full focus:outline-none"
                  autoFocus
               />
            ) : (
              <button
                onClick={() => setShowDetail(true)}
                className={`font-medium text-left hover:underline cursor-pointer transition-colors ${task.completed ? 'line-through text-slate-500' : 'text-slate-800 hover:text-brand-primary'}`}
              >
                {task.title}
              </button>
            )}
          <div className="flex gap-2 mt-1 items-start flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {taskTags.map(tag => (
                <span key={tag.id} className={`group relative text-xs font-semibold pl-2 pr-1 py-0.5 rounded-full ${tag.color} flex items-center`}>
                  {tag.name}
                  <button onClick={() => onRemoveTagFromTask(task.id, tag.id)} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" disabled={isEditing}>
                      <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {!isEditing && (
                <div className="relative">
                  <button
                    onClick={() => setIsAddingTag(!isAddingTag)}
                    className="w-5 h-5 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-colors"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </button>
                  
                  {isAddingTag && (
                    <>
                      {/* 遮罩层，点击关闭 */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={handleCloseTagPanel}
                      />

                      {/* 标签选择面板 */}
                      <div className="absolute left-0 top-6 z-20 bg-white rounded-lg shadow-lg border border-slate-200 p-3 w-64">
                        {availableTagsToAdd.length > 0 ? (
                          <div className="space-y-2">
                            {/* 搜索框 */}
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowTagEmojiPicker(!showTagEmojiPicker);
                                    resetAutoCloseTimer(); // 重置自动关闭定时器
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors text-sm"
                                  title="选择emoji"
                                >
                                  {selectedTagEmoji || '😀'}
                                </button>
                                
                                {showTagEmojiPicker && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => {
                                      setShowTagEmojiPicker(false);
                                      resetAutoCloseTimer(); // 重置自动关闭定时器
                                    }} />
                                    <div className="absolute left-0 top-8 z-40 bg-white rounded-lg shadow-lg border border-slate-200 p-2 w-44">
                                      <div className="grid grid-cols-6 gap-1">
                                        {TAG_PRESET_EMOJIS.map((emoji, index) => (
                                          <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelectTagEmoji(emoji)}
                                            className={`text-base w-6 h-6 flex items-center justify-center rounded hover:bg-blue-100 transition-colors ${selectedTagEmoji === emoji ? 'bg-blue-200 ring-1 ring-blue-400' : ''}`}
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                      {selectedTagEmoji && (
                                        <button type="button" onClick={() => {
                                          setSelectedTagEmoji('');
                                          resetAutoCloseTimer(); // 重置自动关闭定时器
                                        }} className="w-full mt-1.5 pt-1.5 border-t text-xs text-slate-500 hover:text-slate-700">
                                          清除
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div className="relative flex-grow">
                                <input
                                  type="text"
                                  value={tagQuery}
                                  onChange={(e) => {
                                    setTagQuery(e.target.value);
                                    resetAutoCloseTimer(); // 重置自动关闭定时器
                                  }}
                                  onKeyDown={handleTagInputKeyDown}
                                  placeholder={selectedTagEmoji ? "输入名称回车创建" : "筛选或创建标签"}
                                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary pr-6"
                                  autoFocus
                                />
                                {tagQuery && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTagQuery('');
                                      resetAutoCloseTimer(); // 重置自动关闭定时器
                                    }}
                                    className="absolute inset-y-0 right-1 flex items-center text-slate-400 hover:text-slate-600"
                                    title="清空搜索"
                                  >
                                    <XIcon className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* 标签按钮列表 */}
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                              {filteredTagOptions.length > 0 ? (
                                filteredTagOptions.map(tag => (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => handleAddTag(tag.id)}
                                    className="px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                  >
                                    {tag.name}
                                  </button>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">
                                  {tagQuery.trim()
                                    ? '无匹配标签，按回车创建新标签（需以emoji开头）'
                                    : '无匹配标签'}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 block text-center py-2">暂无可添加的标签</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* 日期显示区域 */}
          <div className={`flex items-center gap-2 ${isMobile ? 'mt-1' : 'mt-2'}`}>
            {isEditingDate ? (
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  autoFocus
                />
                <button
                  onClick={handleConfirmDate}
                  className="p-1 text-green-600 hover:text-green-700 transition-colors"
                  title="确认"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelDate}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  title="取消"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleStartEditingDate}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                    task.dueDate
                      ? isOverdue
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : isDueSoon
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                  disabled={isEditing}
                  title={task.dueDate ? '点击修改日期' : '点击添加日期'}
                >
                  <CalendarIcon className="w-3 h-3" />
                  <span>
                    {task.dueDate 
                      ? new Date(task.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
                      : '添加日期'
                    }
                  </span>
                </button>
                {task.dueDate && !isEditing && (
                  <button
                    onClick={() => onUpdateTaskDueDate(task.id, undefined)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title="清除日期"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 按钮区域 */}
      {isMobile ? (
        <>
          {/* 移动端：计时器和播放/停止按钮在右侧水平排列 */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
            {isThisTaskActive ? (
              <>
                <div className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 rounded-md px-1.5 py-0.5 min-w-[56px] text-center shadow-sm">
                  {formatTime(elapsedTime)}
                </div>
                <button onClick={handleStopFocus} className="text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center p-2 shadow-md">
                  <StopIcon className="w-5 h-5"/>
                </button>
              </>
            ) : (
              <button onClick={handleStartFocus} className="text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed p-2 shadow-md" disabled={!!activeSession && !isThisTaskActive || isEditing}>
                <PlayIcon className="w-5 h-5"/>
              </button>
            )}
          </div>
          
          {/* 移动端：长按操作菜单 */}
          {showActionMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowActionMenu(false)}
              />
              <div className="absolute top-1/2 right-12 -translate-y-1/2 z-40 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden min-w-[120px]">
                <button
                  onClick={() => {
                    handleEditClick();
                    setShowActionMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:text-slate-300 disabled:cursor-not-allowed"
                  disabled={task.completed || (!!activeSession && !isThisTaskActive)}
                >
                  <PencilIcon className="w-4 h-4" />
                  编辑
                </button>
                <div className="h-px bg-slate-100" />
                <button
                  onClick={() => {
                    onDeleteTask(task.id);
                    setShowActionMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:text-slate-300 disabled:cursor-not-allowed"
                  disabled={isEditing}
                >
                  <TrashIcon className="w-4 h-4" />
                  删除
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        /* 电脑端：保持原有横向布局 */
        <div className="flex items-center flex-shrink-0 gap-2">
          {isThisTaskActive && (
            <div className="text-sm font-mono text-slate-700 bg-slate-100 rounded-md px-3 py-1 w-24 text-center">
              {formatTime(elapsedTime)}
            </div>
          )}
          {isThisTaskActive ? (
            <button onClick={handleStopFocus} className="text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center p-2">
              <StopIcon className="w-5 h-5"/>
            </button>
          ) : (
            <button onClick={handleStartFocus} className="text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed p-2" disabled={!!activeSession && !isThisTaskActive || isEditing}>
              <PlayIcon className="w-5 h-5"/>
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          
          <button onClick={handleEditClick} className="text-slate-500 hover:text-brand-primary disabled:text-slate-300 disabled:cursor-not-allowed p-2" disabled={task.completed || (!!activeSession && !isThisTaskActive)}>
            {isEditing ? <CheckIcon className="text-green-600 w-5 h-5" /> : <PencilIcon className="w-5 h-5"/>}
          </button>

          <button onClick={() => onDeleteTask(task.id)} className="text-slate-500 hover:text-red-500 disabled:text-slate-300 disabled:cursor-not-allowed p-2" disabled={isEditing}>
            <TrashIcon className="w-5 h-5"/>
          </button>
        </div>
      )}
    </div>
    
    {showDetail && (
      <TaskDetailModal 
        task={task}
        tags={allTags}
        focusSessions={focusSessions}
        onClose={() => setShowDetail(false)}
        onDeleteFocusSession={onDeleteFocusSession}
      />
    )}

    {showImmersiveFocus && activeSession && (
      <ImmersiveFocusModal
        task={task}
        activeSession={activeSession}
        elapsedTime={elapsedTime}
        onStopTimer={handleStopFocus}
        onResumeTimer={handleResumeFocus}
        onPauseTimer={handlePauseFocus} // 传递暂停功能
        onClose={handleCloseImmersiveFocus}
        onUpdateNote={handleUpdateNote}
        focusSessions={focusSessions}
        isMinimized={isFocusModalMinimized}
        onSetMinimized={onSetFocusModalMinimized}
      />
    )}

    {/* 右键菜单 */}
    {contextMenu?.visible && (
      <div
        className="absolute bg-white shadow-lg rounded-md py-1 z-50 border border-slate-200"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          onClick={() => {
            handleEditClick();
            closeContextMenu();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          disabled={task.completed || (!!activeSession && !isThisTaskActive)}
        >
          编辑
        </button>
        <button
          onClick={() => {
            onDeleteTask(task.id);
            closeContextMenu();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          disabled={isEditing}
        >
          删除
        </button>
        {tabGroups && tabGroups.length > 1 && (
          <>
            <div className="h-px bg-slate-200 my-1"></div>
            <div className="px-4 py-1 text-xs text-slate-500">移动到</div>
            {tabGroups
              .filter(group => group.id !== (task.groupId || 'default'))
              .map(group => (
                <button
                  key={group.id}
                  onClick={() => handleMoveTaskToGroup(group.id)}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {group.name}
                </button>
              ))}
          </>
        )}
      </div>
    )}
  </>
  );
};

export default TaskItem;