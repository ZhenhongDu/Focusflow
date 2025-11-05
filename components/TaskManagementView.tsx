
import React, { useState, useMemo } from 'react';
import { Task, Tag, FocusSession, Scene, TabGroup } from '../types';
import AddTaskForm from './AddTaskForm';
import TaskItem from './TaskItem';
import SceneItem from './SceneItem';
import AddSceneForm from './AddSceneForm';
import TagManagementPanel from './TagManagementPanel';
import DailyTimelineView from './DailyTimelineView';
import FocusSessionForm from './FocusSessionForm';
import CompletedTasksView from './CompletedTasksView';
import MobileDock from './MobileDock';
import { PlusIcon } from './icons';
import { useIsMobile } from '../utils/deviceDetect';

interface TaskManagementViewProps {
    tasks: Task[];
    tags: Tag[];
    focusSessions: FocusSession[];
    scenes: Scene[];
    tabGroups: TabGroup[];
    activeSession: FocusSession | null;
    elapsedTime: number;
    onAddTask: (title: string, tagNames: string[], dueDate?: number, groupId?: string) => void;
    onToggleComplete: (taskId: string) => void;
    onStartTimer: (taskId: string) => void;
    onStopTimer: (sessionId: string) => void;
    onCreateTag: (name: string) => void;
    onUpdateTag: (tagId: string, newName: string) => void;
    onUpdateTagColor: (tagId: string, newColor: string) => void;
    onDeleteTag: (tagId: string) => void;
    onAddTagToTask: (taskId: string, tagId: string) => void;
    onRemoveTagFromTask: (taskId: string, tagId: string) => void;
    onUpdateTaskTitle: (taskId: string, newTitle: string) => void;
    onUpdateTaskDueDate: (taskId: string, dueDate: number | undefined) => void;
    onDeleteTask: (taskId: string) => void;
    onAddFocusSession: (taskTitle: string, tagNames: string[], startTime: number, endTime: number) => void;
    onDeleteFocusSession: (sessionId: string) => void;
    onUpdateFocusSession: (sessionId: string, startTime: number, endTime: number) => void;
    onAddScene: (emoji: string, name: string, tagNames: string[]) => void;
    onStartSceneTimer: (sceneId: string) => void;
    onAddTagToScene: (sceneId: string, tagId: string) => void;
    onRemoveTagFromScene: (sceneId: string, tagId: string) => void;
    onUpdateSceneName: (sceneId: string, newName: string) => void;
    onUpdateSceneEmoji: (sceneId: string, newEmoji: string) => void;
    onDeleteScene: (sceneId: string) => void;
    onAddTabGroup: (name: string) => void;
    onUpdateTabGroup: (groupId: string, newName: string) => void;
    onDeleteTabGroup: (groupId: string) => void;
    onReorderTabGroups: (reorderedGroups: TabGroup[]) => void;
    onResumeTimer?: () => void;
    onPauseTimer?: () => void;
    onUpdateFocusNote?: (sessionId: string, note: string) => void;
    isFocusModalMinimized?: boolean;
    onArchiveScene?: (sceneId: string, reason?: string) => void;
    onUnarchiveScene?: (sceneId: string) => void;
    onSetFocusModalMinimized?: (minimized: boolean) => void;
    onMoveTaskToGroup?: (taskId: string, groupId: string) => void; // 添加移动任务到分组的功能
}

const TaskManagementView: React.FC<TaskManagementViewProps> = (props) => {
    const {
        tasks, tags, focusSessions, scenes, tabGroups, activeSession, elapsedTime, onAddTask, onToggleComplete, onStartTimer, onStopTimer,
        onCreateTag, onUpdateTag, onUpdateTagColor, onDeleteTag, onAddTagToTask, onRemoveTagFromTask, onUpdateTaskTitle, onUpdateTaskDueDate, onDeleteTask,
        onAddFocusSession, onDeleteFocusSession, onUpdateFocusSession, onAddScene, onStartSceneTimer, onAddTagToScene, onRemoveTagFromScene,
        onUpdateSceneName, onUpdateSceneEmoji, onDeleteScene, onAddTabGroup, onUpdateTabGroup, onDeleteTabGroup, onReorderTabGroups, onResumeTimer, onPauseTimer, onUpdateFocusNote,
        isFocusModalMinimized, onSetFocusModalMinimized, onArchiveScene, onUnarchiveScene, onMoveTaskToGroup
    } = props;
    
    const isMobile = useIsMobile();

    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
    const [showCompleted, setShowCompleted] = useState(false);
    const [showCompletedView, setShowCompletedView] = useState(true);
    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [showAddSceneForm, setShowAddSceneForm] = useState(false);
    const [activeTabGroup, setActiveTabGroup] = useState<string>('default');
    const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; groupId: string } | null>(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameGroupId, setRenameGroupId] = useState<string>('');
    const [renameGroupName, setRenameGroupName] = useState('');
    const [showBatchRenameModal, setShowBatchRenameModal] = useState(false);
    const [batchRenameGroups, setBatchRenameGroups] = useState<{id: string, name: string, order: number}[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [mobileDockPage, setMobileDockPage] = useState<'task' | 'scene' | 'tag' | 'timeline' | 'supplement'>('task');
    const [showArchivedScenes, setShowArchivedScenes] = useState(false);

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => (task.groupId || 'default') === activeTabGroup);
    }, [tasks, activeTabGroup]);

    const sortedTasks = useMemo(() => {
        return [...filteredTasks].sort((a, b) => {
            switch (sortOrder) {
                case 'oldest':
                    return a.createdAt - b.createdAt;
                case 'alphabetical':
                    return a.title.localeCompare(b.title);
                case 'newest':
                default:
                    return b.createdAt - a.createdAt;
            }
        });
    }, [filteredTasks, sortOrder]);

    const pendingTasks = sortedTasks.filter(task => !task.completed);
    const completedTasks = sortedTasks.filter(task => task.completed);
    
    const hasCompletedTasksToday = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        return completedTasks.some(task =>
            task.completedAt &&
            task.completedAt >= todayStart.getTime() &&
            task.completedAt <= todayEnd.getTime()
        );
    }, [completedTasks]);
    
    React.useEffect(() => {
        setShowCompletedView(hasCompletedTasksToday);
    }, [hasCompletedTasksToday]);
    
    const renderTaskItem = (task: Task) => (
        <TaskItem
            key={task.id}
            task={task}
            tags={tags.filter(tag => task.tagIds.includes(tag.id))}
            allTags={tags}
            focusSessions={focusSessions}
            onToggleComplete={onToggleComplete}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
            activeSession={activeSession}
            elapsedTime={elapsedTime}
            onAddTagToTask={onAddTagToTask}
            onRemoveTagFromTask={onRemoveTagFromTask}
            onUpdateTaskTitle={onUpdateTaskTitle}
            onUpdateTaskDueDate={onUpdateTaskDueDate}
            onDeleteTask={onDeleteTask}
            onDeleteFocusSession={onDeleteFocusSession}
            onResumeTimer={onResumeTimer}
            onPauseTimer={onPauseTimer}
            onUpdateFocusNote={onUpdateFocusNote}
            isFocusModalMinimized={isFocusModalMinimized}
            onSetFocusModalMinimized={onSetFocusModalMinimized}
            tabGroups={tabGroups}
            onMoveTaskToGroup={onMoveTaskToGroup}
        />
    );

    const handleContextMenu = (e: React.MouseEvent, groupId: string) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            groupId
        });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const handleDeleteGroup = (groupId: string) => {
        onDeleteTabGroup(groupId);
        closeContextMenu();
    };

    const handleRenameGroup = (groupId: string, currentName: string) => {
        setRenameGroupId(groupId);
        setRenameGroupName(currentName);
        setShowRenameModal(true);
        closeContextMenu();
    };

    const confirmRename = () => {
        if (renameGroupName.trim()) {
            onUpdateTabGroup(renameGroupId, renameGroupName.trim());
        }
        setShowRenameModal(false);
        setRenameGroupId('');
        setRenameGroupName('');
    };

    const handleBatchRename = () => {
        const sortedGroups = [...tabGroups].sort((a, b) => a.order - b.order);
        setBatchRenameGroups(sortedGroups.map(group => ({
            id: group.id,
            name: group.name,
            order: group.order
        })));
        setShowBatchRenameModal(true);
    };

    const updateBatchRenameGroupName = (id: string, name: string) => {
        setBatchRenameGroups(prev => prev.map(group =>
            group.id === id ? {...group, name} : group
        ));
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newGroups = [...batchRenameGroups];
        const draggedItem = newGroups[draggedIndex];
        newGroups.splice(draggedIndex, 1);
        newGroups.splice(index, 0, draggedItem);

        const reorderedGroups = newGroups.map((group, idx) => ({
            ...group,
            order: idx
        }));

        setBatchRenameGroups(reorderedGroups);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const confirmBatchRename = () => {
        batchRenameGroups.forEach(group => {
            const originalGroup = tabGroups.find(g => g.id === group.id);
            if (originalGroup && originalGroup.name !== group.name) {
                onUpdateTabGroup(group.id, group.name);
            }
        });

        const reorderedGroups = batchRenameGroups.map(group => {
            const originalGroup = tabGroups.find(g => g.id === group.id);
            return {
                ...originalGroup!,
                name: group.name,
                order: group.order
            };
        });
        onReorderTabGroups(reorderedGroups);

        setShowBatchRenameModal(false);
    };

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

    const mobileDockItems = [
        {
            id: 'task',
            label: 'Task',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            id: 'scene',
            label: '场景',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            )
        },
        {
            id: 'tag',
            label: 'Tag',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            )
        },
        {
            id: 'timeline',
            label: '时间轴',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'supplement',
            label: '补记',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            )
        }
    ];

    // 渲染任务列表区域
    const renderTaskSection = () => (
        <div className="mb-6 border-2 border-blue-200 rounded-lg p-4">
            <div className={`flex ${isMobile ? 'overflow-x-auto gap-2 py-2 -mx-2 px-2' : 'flex-wrap gap-2 justify-center'} mb-4 -mt-2`}>
                <div className={`flex ${isMobile ? 'gap-2 min-w-max' : 'flex-wrap gap-2'}`}>
                    {[...tabGroups].sort((a, b) => a.order - b.order).map(group => (
                        <button
                            key={group.id}
                            onClick={() => setActiveTabGroup(group.id)}
                            onContextMenu={(e) => handleContextMenu(e, group.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                                activeTabGroup === group.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {group.name}
                        </button>
                    ))}
                    {!isMobile && (
                        <>
                            <button
                                onClick={() => {
                                    const name = prompt('请输入新分组的名称:');
                                    if (name) onAddTabGroup(name);
                                }}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                                <PlusIcon className="w-4 h-4" />
                                添加分组
                            </button>
                            <button
                                onClick={handleBatchRename}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                                title="设置分组"
                            >
                                ⚙️ 设置
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-700">
                        {tabGroups.find(g => g.id === activeTabGroup)?.name || 'Tasks'} 
                        ({pendingTasks.length})
                    </h2>
                    {isFocusModalMinimized && activeSession && (
                        <button
                            onClick={() => onSetFocusModalMinimized?.(false)}
                            className="ml-2 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg transition-all shadow-md hover:shadow-lg whitespace-nowrap border border-cyan-300 hover:border-cyan-200 animate-pulse"
                            title="恢复专注弹窗"
                        >
                            🎯 Back to focus ↗️
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {!isMobile && (
                        <>
                            <label htmlFor="sort-order" className="text-sm font-medium text-slate-600 mr-2">排序:</label>
                            <select 
                                id="sort-order" 
                                value={sortOrder} 
                                onChange={e => setSortOrder(e.target.value as any)} 
                                className="text-sm border-slate-300 rounded-md focus:ring-brand-primary focus:border-brand-primary py-1 pl-2 pr-8"
                            >
                                <option value="newest">最新优先</option>
                                <option value="oldest">最早优先</option>
                                <option value="alphabetical">A-Z</option>
                            </select>
                        </>
                    )}
                    <button
                        onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                        title="添加任务"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            {showAddTaskForm && (
                <div className="mb-4">
                    <AddTaskForm 
                        onAddTask={(title, tagNames, dueDate) => {
                            onAddTask(title, tagNames, dueDate, activeTabGroup);
                            setShowAddTaskForm(false);
                        }} 
                        allTags={tags}
                        defaultGroupId={activeTabGroup}
                    />
                </div>
            )}
            
            <div className="space-y-3">
                {pendingTasks.length > 0 ? (
                    pendingTasks.map(renderTaskItem)
                ) : (
                    <p className="text-slate-500 text-center py-4">暂无待办任务</p>
                )}
            </div>
            
            {completedTasks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <button
                        onClick={() => setShowCompletedView(!showCompletedView)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors mb-3"
                    >
                        <span>{showCompletedView ? '▼' : '▶'}</span>
                        <span>已完成任务</span>
                    </button>
                    {showCompletedView && (
                        <CompletedTasksView
                            tasks={filteredTasks}
                            tags={tags}
                        />
                    )}
                </div>
            )}
        </div>
    );

    // 渲染场景区域
    const renderSceneSection = () => (
        <div className="border-2 border-purple-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-purple-700">场景 ({scenes.length})</h2>
                <button
                    onClick={() => setShowAddSceneForm(!showAddSceneForm)}
                    className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors shadow-md hover:shadow-lg"
                    title="添加场景"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            
            {showAddSceneForm && (
                <div className="mb-4">
                    <AddSceneForm onAddScene={(emoji, name, tagNames) => {
                        onAddScene(emoji, name, tagNames);
                        setShowAddSceneForm(false);
                    }} allTags={tags} />
                </div>
            )}
            
            {scenes.filter(scene => !scene.isArchived).length > 0 ? (
                <div className="space-y-3">
                    {scenes
                      .filter(scene => !scene.isArchived)
                      .map(scene => (
                        <SceneItem
                            key={scene.id}
                            scene={scene}
                            tags={tags.filter(tag => scene.tagIds.includes(tag.id))}
                            allTags={tags}
                            focusSessions={focusSessions}
                            onStartTimer={onStartSceneTimer}
                            onStopTimer={onStopTimer}
                            activeSession={activeSession}
                            elapsedTime={elapsedTime}
                            onAddTagToScene={onAddTagToScene}
                            onRemoveTagFromScene={onRemoveTagFromScene}
                            onUpdateSceneName={onUpdateSceneName}
                            onUpdateSceneEmoji={onUpdateSceneEmoji}
                            onDeleteScene={onDeleteScene}
                            onDeleteFocusSession={onDeleteFocusSession}
                            onResumeTimer={onResumeTimer}
                            onPauseTimer={onPauseTimer}
                            onUpdateFocusNote={onUpdateFocusNote}
                            isFocusModalMinimized={isFocusModalMinimized}
                            onSetFocusModalMinimized={onSetFocusModalMinimized}
                            onArchiveScene={onArchiveScene}
                            onUnarchiveScene={onUnarchiveScene}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 text-center py-4 bg-purple-50 rounded-lg">暂无场景，点击+按钮添加</p>
            )}
            
            {/* 已归档场景 */}
            {scenes.some(scene => scene.isArchived) && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                    <button
                        onClick={() => setShowArchivedScenes(!showArchivedScenes)}
                        className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors mb-3"
                    >
                        <span>{showArchivedScenes ? '▼' : '▶'}</span>
                        <span>已归档场景</span>
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {scenes.filter(s => s.isArchived).length}
                        </span>
                    </button>
                    {showArchivedScenes && (
                        <div className="space-y-3">
                            {scenes
                                .filter(scene => scene.isArchived)
                                .map(scene => (
                                    <SceneItem
                                        key={scene.id}
                                        scene={scene}
                                        tags={tags.filter(tag => scene.tagIds.includes(tag.id))}
                                        allTags={tags}
                                        focusSessions={focusSessions}
                                        onStartTimer={onStartSceneTimer}
                                        onStopTimer={onStopTimer}
                                        activeSession={activeSession}
                                        elapsedTime={elapsedTime}
                                        onAddTagToScene={onAddTagToScene}
                                        onRemoveTagFromScene={onRemoveTagFromScene}
                                        onUpdateSceneName={onUpdateSceneName}
                                        onUpdateSceneEmoji={onUpdateSceneEmoji}
                                        onDeleteScene={onDeleteScene}
                                        onDeleteFocusSession={onDeleteFocusSession}
                                        onResumeTimer={onResumeTimer}
                                        onPauseTimer={onPauseTimer}
                                        onUpdateFocusNote={onUpdateFocusNote}
                                        isFocusModalMinimized={isFocusModalMinimized}
                                        onSetFocusModalMinimized={onSetFocusModalMinimized}
                                        onArchiveScene={onArchiveScene}
                                        onUnarchiveScene={onUnarchiveScene}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // 渲染Tag管理区域
    const renderTagSection = () => (
        <div className="border-2 border-slate-300 rounded-lg p-4">
            <TagManagementPanel 
                tags={tags}
                tasks={tasks}
                scenes={scenes}
                focusSessions={focusSessions}
                onCreateTag={onCreateTag}
                onUpdateTag={onUpdateTag}
                onUpdateTagColor={onUpdateTagColor}
                onDeleteTag={onDeleteTag}
                onDeleteFocusSession={onDeleteFocusSession}
            />
        </div>
    );

    return (
        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'pb-20' : ''}`}>
            {/* 右键菜单 */}
            {contextMenu?.visible && (
                <div 
                    className="absolute bg-white shadow-lg rounded-md py-1 z-50 border border-slate-200"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        onClick={() => handleRenameGroup(contextMenu.groupId, tabGroups.find(g => g.id === contextMenu.groupId)?.name || '')}
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                        重命名
                    </button>
                    {!tabGroups.find(g => g.id === contextMenu.groupId)?.isDefault && (
                        <button
                            onClick={() => handleDeleteGroup(contextMenu.groupId)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            删除
                        </button>
                    )}
                </div>
            )}

            {/* 重命名模态框 */}
            {showRenameModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">重命名分组</h3>
                        <input
                            type="text"
                            value={renameGroupName}
                            onChange={(e) => setRenameGroupName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
                            placeholder="输入新的分组名称"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowRenameModal(false)}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmRename}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 设置模态框 */}
            {showBatchRenameModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[480px] max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">⚙️ 设置分组</h3>
                        <p className="text-sm text-slate-600 mb-3">拖动调整顺序，修改名称</p>
                        <div className="space-y-2">
                            {batchRenameGroups.map((group, index) => {
                                const isDefault = tabGroups.find(g => g.id === group.id)?.isDefault;
                                return (
                                    <div
                                        key={group.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-2 p-2 bg-slate-50 rounded-md border-2 transition-all cursor-move hover:bg-slate-100 ${
                                            draggedIndex === index ? 'border-blue-400 opacity-50' : 'border-transparent'
                                        }`}
                                    >
                                        <span className="text-slate-400 text-lg cursor-move" title="拖动排序">
                                            ⋮⋮
                                        </span>
                                        <span className="text-slate-500 text-sm w-6">{index + 1}</span>
                                        <input
                                            type="text"
                                            value={group.name}
                                            onChange={(e) => updateBatchRenameGroupName(group.id, e.target.value)}
                                            className="flex-grow px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="分组名称"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        {isDefault && (
                                            <span className="text-xs text-slate-500 px-2 py-1 bg-slate-200 rounded whitespace-nowrap">默认</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowBatchRenameModal(false)}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmBatchRename}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 主内容区域 */}
            {isMobile ? (
                <>
                    {mobileDockPage === 'task' && renderTaskSection()}
                    {mobileDockPage === 'scene' && renderSceneSection()}
                    {mobileDockPage === 'tag' && renderTagSection()}
                    {mobileDockPage === 'timeline' && (
                        <DailyTimelineView
                            focusSessions={focusSessions}
                            tasks={tasks}
                            scenes={scenes}
                            tags={tags}
                            onDeleteFocusSession={onDeleteFocusSession}
                            onUpdateFocusSession={onUpdateFocusSession}
                            onUpdateFocusNote={onUpdateFocusNote}
                        />
                    )}
                    {mobileDockPage === 'supplement' && (
                        <FocusSessionForm
                            tasks={tasks}
                            scenes={scenes}
                            tags={tags}
                            focusSessions={focusSessions}
                            onAddFocusSession={onAddFocusSession}
                        />
                    )}
                    <MobileDock
                        items={mobileDockItems}
                        activeItem={mobileDockPage}
                        onItemClick={(itemId) => setMobileDockPage(itemId as any)}
                    />
                </>
            ) : (
                <>
                    {/* 左右两栏布局 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* 左栏：To Do + 已完成 */}
                        <div>
                            {renderTaskSection()}
                        </div>

                        {/* 右栏：场景（上） + Tag Management（下） */}
                        <div className="space-y-6">
                            {renderSceneSection()}
                            {renderTagSection()}
                        </div>
                    </div>

                    {/* 底部：今日专注时间轴（左3/4） + 专注时间补记（右1/4） */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3">
                            <DailyTimelineView
                                focusSessions={focusSessions}
                                tasks={tasks}
                                scenes={scenes}
                                tags={tags}
                                onDeleteFocusSession={onDeleteFocusSession}
                                onUpdateFocusSession={onUpdateFocusSession}
                                onUpdateFocusNote={onUpdateFocusNote}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <FocusSessionForm
                                tasks={tasks}
                                scenes={scenes}
                                tags={tags}
                                focusSessions={focusSessions}
                                onAddFocusSession={onAddFocusSession}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TaskManagementView;
