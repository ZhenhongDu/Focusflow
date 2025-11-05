import React, { useState, useEffect } from 'react';
import { Scene, Tag, FocusSession } from '../types';
import { PlayIcon, StopIcon, PlusIcon, XIcon, PencilIcon, TrashIcon, CheckIcon } from './icons';
import SceneDetailModal from './SceneDetailModal';
import ImmersiveFocusModal from './ImmersiveFocusModal';
import { useIsMobile } from '../utils/deviceDetect';

interface SceneItemProps {
  scene: Scene;
  tags: Tag[];
  allTags: Tag[];
  focusSessions: FocusSession[];
  onStartTimer: (sceneId: string) => void;
  onStopTimer: (sessionId: string) => void;
  activeSession: FocusSession | null;
  elapsedTime: number;
  onAddTagToScene: (sceneId: string, tagId: string) => void;
  onRemoveTagFromScene: (sceneId: string, tagId: string) => void;
  onUpdateSceneName: (sceneId: string, newName: string) => void;
  onUpdateSceneEmoji: (sceneId: string, newEmoji: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onDeleteFocusSession: (sessionId: string) => void;
  onResumeTimer?: () => void;
  onPauseTimer?: () => void; // 添加暂停功能
  onUpdateFocusNote?: (sessionId: string, note: string) => void;
  isFocusModalMinimized?: boolean;
  onSetFocusModalMinimized?: (minimized: boolean) => void;
  onCreateTag?: (name: string) => void;
  onArchiveScene?: (sceneId: string, reason?: string) => void;
  onUnarchiveScene?: (sceneId: string) => void;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const SceneItem: React.FC<SceneItemProps> = (props) => {
  const {
    scene,
    tags: sceneTags,
    allTags,
    focusSessions,
    onStartTimer,
    onStopTimer,
    activeSession,
    elapsedTime,
    onAddTagToScene,
    onRemoveTagFromScene,
    onUpdateSceneName,
    onUpdateSceneEmoji,
    onDeleteScene,
    onDeleteFocusSession,
    onResumeTimer,
    onPauseTimer, // 添加暂停功能
    onUpdateFocusNote,
    isFocusModalMinimized,
    onSetFocusModalMinimized,
    onCreateTag,
    onArchiveScene,
    onUnarchiveScene
  } = props;
  
  const isMobile = useIsMobile();
  
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagQuery, setTagQuery] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(scene.name);
  const [isEditingEmoji, setIsEditingEmoji] = useState(false);
  const [editedEmoji, setEditedEmoji] = useState(scene.emoji);
  const [showDetail, setShowDetail] = useState(false);
  const [showImmersiveFocus, setShowImmersiveFocus] = useState(false);
  const [focusNote, setFocusNote] = useState('');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState<NodeJS.Timeout | null>(null);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number } | null>(null);

  const isThisSceneActive = activeSession?.taskId === scene.id;
  
  const availableTagsToAdd = allTags.filter(globalTag => !scene.tagIds.includes(globalTag.id));
  
  const normalizedTagQuery = tagQuery.trim().toLowerCase();
  const filteredTagOptions = normalizedTagQuery
    ? availableTagsToAdd.filter(tag => tag.name.toLowerCase().includes(normalizedTagQuery))
    : availableTagsToAdd;
  
  const handleAddTag = (tagId: string) => {
    onAddTagToScene(scene.id, tagId);
    setTagQuery('');
    resetAutoCloseTimer(); // 重置自动关闭定时器，方便连续添加多个标签
  };

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
        if (startsWithEmoji(trimmedQuery)) {
          // 检查标签名是否以emoji开头
          onCreateTag(trimmedQuery);
          // 等待一小段时间让标签创建完成后再添加
          setTimeout(() => {
            const newTag = allTags.find(t => t.name === trimmedQuery);
            if (newTag) {
              handleAddTag(newTag.id);
            }
          }, 100);
        } else {
          alert('标签名必须以 emoji 开头，例如：📚 阅读');
        }
      }
    }
    if (e.key === 'Escape') {
      handleCloseTagPanel();
    }
  };

  const handleUpdateName = () => {
    if (editedName.trim() && editedName.trim() !== scene.name) {
        onUpdateSceneName(scene.id, editedName.trim());
    }
    setIsEditingName(false);
  };
  
  const handleCancelEditName = () => {
      setEditedName(scene.name);
      setIsEditingName(false);
  };

  const handleKeyDownName = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleUpdateName();
      if (e.key === 'Escape') handleCancelEditName();
  };
  
  const handleEditNameClick = () => {
      if (isEditingName) {
          handleUpdateName();
      } else {
          setEditedName(scene.name);
          setIsEditingName(true);
      }
  };

  const handleUpdateEmoji = () => {
    if (editedEmoji.trim() && editedEmoji.trim() !== scene.emoji) {
        onUpdateSceneEmoji(scene.id, editedEmoji.trim());
    }
    setIsEditingEmoji(false);
  };
  
  const handleCancelEditEmoji = () => {
      setEditedEmoji(scene.emoji);
      setIsEditingEmoji(false);
  };

  const handleKeyDownEmoji = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleUpdateEmoji();
      if (e.key === 'Escape') handleCancelEditEmoji();
  };

  const handleStartFocus = () => {
    if (!activeSession || !isThisSceneActive) {
      onStartTimer(scene.id);
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

  // 长按手势处理（仅移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || isEditingName) return;
    
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

  const handleArchiveScene = () => {
    if (onArchiveScene) {
      onArchiveScene(scene.id);
    }
  };

  const handleUnarchiveScene = () => {
    if (onUnarchiveScene) {
      onUnarchiveScene(scene.id);
    }
  };

  return (
    <>
    <div
      className={`${scene.isArchived ? 'bg-gray-100 opacity-75' : 'bg-gradient-to-br from-purple-50 to-pink-50'} rounded-lg shadow-sm transition-all hover:shadow-md border ${scene.isArchived ? 'border-gray-300' : 'border-purple-100'} ${isMobile ? 'p-2 gap-2 relative' : 'p-4 gap-4 flex items-center justify-between'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
    >
      
      <div className={`flex items-center flex-grow min-w-0 ${isMobile ? 'gap-2 pr-10' : 'gap-4'}`}>
        {/* Emoji 封面 */}
        <div className="flex-shrink-0">
          {isEditingEmoji ? (
            <input
              type="text"
              value={editedEmoji}
              onChange={(e) => setEditedEmoji(e.target.value)}
              onKeyDown={handleKeyDownEmoji}
              onBlur={handleUpdateEmoji}
              className="text-3xl w-14 h-14 text-center bg-white rounded-lg border-2 border-purple-300 focus:outline-none"
              maxLength={2}
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setEditedEmoji(scene.emoji);
                setIsEditingEmoji(true);
              }}
              className="text-3xl w-14 h-14 flex items-center justify-center bg-white rounded-lg hover:bg-purple-50 transition-colors"
              title="点击修改emoji"
            >
              {scene.emoji}
            </button>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          {isEditingName ? (
             <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDownName}
                onBlur={handleUpdateName}
                className="font-medium text-slate-800 bg-white px-2 py-1 border-b-2 border-purple-400 w-full focus:outline-none rounded"
                autoFocus
             />
          ) : (
            <button
              onClick={() => setShowDetail(true)}
              className={`font-medium text-left hover:underline cursor-pointer transition-colors flex-grow ${scene.isArchived ? 'text-gray-500 line-through' : 'text-slate-800 hover:text-purple-600'}`}
            >
              {scene.name}
            </button>
          )}
          <div className="flex gap-2 mt-1 items-start flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {sceneTags.map(tag => (
                <span key={tag.id} className={`group relative text-xs font-semibold pl-2 pr-1 py-0.5 rounded-full ${tag.color} flex items-center`}>
                  {tag.name}
                  <button onClick={() => onRemoveTagFromScene(scene.id, tag.id)} className="ml-1 opacity-50 group-hover:opacity-100 transition-opacity" disabled={isEditingName}>
                      <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {!isEditingName && (
                <div className="relative">
                  <button
                    onClick={() => setIsAddingTag(!isAddingTag)}
                    className="w-5 h-5 flex items-center justify-center bg-purple-200 text-purple-600 rounded-full hover:bg-purple-300 transition-colors"
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
                      <div className="absolute left-0 top-6 z-20 bg-white rounded-lg shadow-lg border border-purple-200 p-3 w-64">
                        {availableTagsToAdd.length > 0 ? (
                          <div className="space-y-2">
                            {/* 搜索框 */}
                            <div className="relative">
                              <input
                                type="text"
                                value={tagQuery}
                                onChange={(e) => {
                                  setTagQuery(e.target.value);
                                  resetAutoCloseTimer(); // 重置自动关闭定时器
                                }}
                                onKeyDown={handleTagInputKeyDown}
                                placeholder="筛选标签，回车选中首项"
                                className="w-full px-2 py-1.5 text-xs border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400 pr-6"
                                autoFocus
                              />
                              {tagQuery && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTagQuery('');
                                    resetAutoCloseTimer(); // 重置自动关闭定时器
                                  }}
                                  className="absolute inset-y-0 right-1 flex items-center text-purple-400 hover:text-purple-600"
                                  title="清空搜索"
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            
                            {/* 标签按钮列表 */}
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                              {filteredTagOptions.length > 0 ? (
                                filteredTagOptions.map(tag => (
                                  <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => handleAddTag(tag.id)}
                                    className="px-2 py-0.5 rounded-full text-xs font-medium border border-purple-100 bg-white text-purple-600 hover:bg-purple-100 hover:text-purple-800 transition-colors"
                                  >
                                    {tag.name}
                                  </button>
                                ))
                              ) : (
                                <span className="text-xs text-slate-400">无匹配标签</span>
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
        </div>
      </div>
      
      {/* 按钮区域 */}
      {isMobile ? (
        <>
          {/* 移动端：计时器和播放/停止按钮在右侧水平排列 */}
          {!scene.isArchived && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
              {isThisSceneActive ? (
                <>
                  <div className="text-xs font-mono font-semibold text-slate-700 bg-white rounded-md px-1.5 py-0.5 min-w-[56px] text-center shadow-sm">
                    {formatTime(elapsedTime)}
                  </div>
                  <button onClick={handleStopFocus} className="text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center p-2 shadow-md">
                    <StopIcon className="w-5 h-5"/>
                  </button>
                </>
              ) : (
                <button onClick={handleStartFocus} className="text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed p-2 shadow-md" disabled={!!activeSession && !isThisSceneActive || isEditingName}>
                  <PlayIcon className="w-5 h-5"/>
                </button>
              )}
            </div>
          )}
          
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
                    handleEditNameClick();
                    setShowActionMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:text-slate-300 disabled:cursor-not-allowed"
                  disabled={!!activeSession && !isThisSceneActive}
                >
                  <PencilIcon className="w-4 h-4" />
                  编辑
                </button>
                <div className="h-px bg-slate-100" />
                <button
                  onClick={() => {
                    onDeleteScene(scene.id);
                    setShowActionMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:text-slate-300 disabled:cursor-not-allowed"
                  disabled={isEditingName}
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
          {!scene.isArchived && (
            <>
              {isThisSceneActive && (
                <div className="text-sm font-mono text-slate-700 bg-white rounded-md px-3 py-1 w-24 text-center">
                  {formatTime(elapsedTime)}
                </div>
              )}
              {isThisSceneActive ? (
                <button onClick={handleStopFocus} className="text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors flex items-center justify-center p-2">
                  <StopIcon className="w-5 h-5"/>
                </button>
              ) : (
                <button onClick={handleStartFocus} className="text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed p-2" disabled={!!activeSession && !isThisSceneActive || isEditingName}>
                  <PlayIcon className="w-5 h-5"/>
                </button>
              )}

              <div className="w-px h-6 bg-purple-200 mx-1"></div>
            </>
          )}
          
          <button onClick={handleEditNameClick} className="text-slate-500 hover:text-purple-600 disabled:text-slate-300 disabled:cursor-not-allowed p-2" disabled={!!activeSession && !isThisSceneActive}>
            {isEditingName ? <CheckIcon className="text-green-600 w-5 h-5" /> : <PencilIcon className="w-5 h-5"/>}
          </button>

          <button onClick={() => onDeleteScene(scene.id)} className="text-slate-500 hover:text-red-500 disabled:text-slate-300 disabled:cursor-not-allowed p-2" disabled={isEditingName}>
            <TrashIcon className="w-5 h-5"/>
          </button>
        </div>
      )}
    </div>
    
    {showDetail && (
      <SceneDetailModal 
        scene={scene}
        tags={allTags}
        focusSessions={focusSessions}
        onClose={() => setShowDetail(false)}
        onDeleteFocusSession={onDeleteFocusSession}
      />
    )}

    {showImmersiveFocus && activeSession && (
      <ImmersiveFocusModal
        scene={scene}
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
            handleEditNameClick();
            closeContextMenu();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          disabled={!!activeSession && !isThisSceneActive}
        >
          编辑
        </button>
        <button
          onClick={() => {
            onDeleteScene(scene.id);
            closeContextMenu();
          }}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          disabled={isEditingName}
        >
          删除
        </button>
        <div className="h-px bg-slate-200 my-1"></div>
        {scene.isArchived ? (
          <button
            onClick={() => {
              handleUnarchiveScene();
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            恢复使用
          </button>
        ) : (
          <button
            onClick={() => {
              handleArchiveScene();
              closeContextMenu();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            归档场景
          </button>
        )}
      </div>
    )}
    </>
  );
};

export default SceneItem;

