import React, { useState, useEffect, useCallback } from 'react';
import { Task, Tag, FocusSession, Scene, TabGroup } from './types';
import { TAG_COLORS } from './constants';
import Header from './components/Header';
import TaskManagementView from './components/TaskManagementView';
import TimeAnalysisView from './components/TimeAnalysisView';
import LoginModal from './components/LoginModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'tasks' | 'analysis'>('tasks');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        // 从localStorage检查是否已认证
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem('tasks');
        return saved ? JSON.parse(saved) : [];
    });
    const [tags, setTags] = useState<Tag[]>(() => {
        const saved = localStorage.getItem('tags');
        return saved ? JSON.parse(saved) : [];
    });
    const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => {
        const saved = localStorage.getItem('focusSessions');
        return saved ? JSON.parse(saved) : [];
    });
    const [scenes, setScenes] = useState<Scene[]>(() => {
        const saved = localStorage.getItem('scenes');
        return saved ? JSON.parse(saved) : [];
    });
    
    // 添加Tab分组状态
    const [tabGroups, setTabGroups] = useState<TabGroup[]>(() => {
        const saved = localStorage.getItem('tabGroups');
        if (saved) {
            const groups = JSON.parse(saved);
            // 为旧数据添加 order 字段（如果不存在）
            return groups.map((group: TabGroup, index: number) => ({
                ...group,
                order: group.order !== undefined ? group.order : index
            }));
        }
        // 默认创建两个分组
        return [
            { id: 'default', name: 'Tasks', isDefault: true, order: 0 },
            { id: 'goal', name: 'Goals', isDefault: true, order: 1 }
        ];
    });

    const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [focusNotes, setFocusNotes] = useState<Record<string, string>>({});
    const [isTimerPaused, setIsTimerPaused] = useState(false);
    const [pausedTime, setPausedTime] = useState(0); // 记录暂停的总时间
    const [pauseStartTime, setPauseStartTime] = useState<number | null>(null); // 记录当前暂停开始的时间
    const [isFocusModalMinimized, setIsFocusModalMinimized] = useState(false); // 追踪专注弹窗最小化状态

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('tags', JSON.stringify(tags));
    }, [tags]);

    useEffect(() => {
        localStorage.setItem('focusSessions', JSON.stringify(focusSessions));
    }, [focusSessions]);

    useEffect(() => {
        localStorage.setItem('scenes', JSON.stringify(scenes));
    }, [scenes]);
    
    // 添加Tab分组的本地存储同步
    useEffect(() => {
        localStorage.setItem('tabGroups', JSON.stringify(tabGroups));
    }, [tabGroups]);
    
    useEffect(() => {
        const activeSess = focusSessions.find(s => s.endTime === null);
        setActiveSession(activeSess || null);
        // 重置暂停状态
        if (!activeSess) {
            setIsTimerPaused(false);
            setPausedTime(0);
            setPauseStartTime(null);
        }
    }, [focusSessions]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (activeSession && !isTimerPaused) {
            interval = setInterval(() => {
                // 计算实际专注时间：当前时间 - 开始时间 - 暂停时间
                const actualElapsedTime = Math.floor((Date.now() - activeSession.startTime) / 1000) - pausedTime;
                setElapsedTime(actualElapsedTime);
            }, 1000);
        } else if (!activeSession) {
            setElapsedTime(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeSession, isTimerPaused, pausedTime]);

    const handleLogin = (username: string) => {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
    };

    const findOrCreateTags = useCallback((tagNames: string[]): { newTags: Tag[], tagIds: string[] } => {
        const newTagIds: string[] = [];
        const createdTags: Tag[] = [];
        let currentTags = [...tags];

        tagNames.forEach(tagName => {
            const normalizedTagName = tagName.replace(/^#/, '').trim();
            if(!normalizedTagName) return;

            let existingTag = currentTags.find(t => t.name.toLowerCase() === normalizedTagName.toLowerCase());
            if (existingTag) {
                if (!newTagIds.includes(existingTag.id)) {
                    newTagIds.push(existingTag.id);
                }
            } else {
                const newTag: Tag = {
                    id: `tag-${Date.now()}-${Math.random()}`,
                    name: normalizedTagName,
                    color: TAG_COLORS[currentTags.length % TAG_COLORS.length],
                };
                createdTags.push(newTag);
                currentTags.push(newTag);
                newTagIds.push(newTag.id);
            }
        });
        return { newTags: createdTags, tagIds: newTagIds };
    }, [tags]);

    const handleAddTask = (title: string, tagNames: string[], dueDate?: number, groupId?: string) => {
        const { newTags, tagIds } = findOrCreateTags(tagNames);

        if (newTags.length > 0) {
            setTags(prev => [...prev, ...newTags]);
        }

        const newTask: Task = {
            id: `task-${Date.now()}`,
            title,
            completed: false,
            tagIds: tagIds,
            createdAt: Date.now(),
            dueDate: dueDate,
            groupId: groupId || 'default', // 默认分组为'default'
        };
        setTasks(prev => [...prev, newTask]);
    };

    const handleCreateTag = (name: string) => {
        const { newTags } = findOrCreateTags([name]);
        if (newTags.length > 0) {
            setTags(prev => [...prev, ...newTags]);
        } else {
            alert('A tag with this name already exists.');
        }
    };

    const handleDeleteTag = (tagId: string) => {
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        setTasks(prevTasks => prevTasks.map(task => ({
            ...task,
            tagIds: task.tagIds.filter(id => id !== tagId),
        })));
    };

    const handleUpdateTag = (tagId: string, newName: string) => {
        const normalized = newName.trim();
        if (!normalized) return;
        if (tags.some(t => t.name.toLowerCase() === normalized.toLowerCase() && t.id !== tagId)) {
            alert('A tag with this name already exists.');
            return;
        }
        setTags(prev => prev.map(tag =>
            tag.id === tagId ? { ...tag, name: normalized } : tag
        ));
    };

    // 添加更新标签颜色的函数
    const handleUpdateTagColor = (tagId: string, newColor: string) => {
        setTags(prev => prev.map(tag =>
            tag.id === tagId ? { ...tag, color: newColor } : tag
        ));
    };

    const handleAddTagToTask = (taskId: string, tagId: string) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId && !task.tagIds.includes(tagId)) {
                return { ...task, tagIds: [...task.tagIds, tagId] };
            }
            return task;
        }));
    };
    
    const handleRemoveTagFromTask = (taskId: string, tagId: string) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                return { ...task, tagIds: task.tagIds.filter(id => id !== tagId) };
            }
            return task;
        }));
    };


    const handleToggleComplete = (taskId: string) => {
        setTasks(prev => prev.map(task => {
            if (task.id === taskId) {
                const newCompleted = !task.completed;
                return {
                    ...task,
                    completed: newCompleted,
                    completedAt: newCompleted ? Date.now() : undefined
                };
            }
            return task;
        }));
    };

    const handleStartTimer = (taskId: string) => {
        if (activeSession) {
            alert("Another task is already being timed. Please stop it first.");
            return;
        }
        const newSession: FocusSession = {
            id: `session-${Date.now()}`,
            taskId,
            startTime: Date.now(),
            endTime: null,
        };
        setFocusSessions(prev => [...prev, newSession]);
        setIsTimerPaused(false);
        setPausedTime(0);
        setPauseStartTime(null);
    };

    const handleStopTimer = (sessionId: string) => {
        setFocusSessions(prev => prev.map(session => 
            session.id === sessionId ? { ...session, endTime: Date.now() } : session
        ));
        setIsTimerPaused(false);
        setPausedTime(0);
        setPauseStartTime(null);
    };

    const handleResumeTimer = () => {
        if (isTimerPaused && pauseStartTime) {
            // 计算这次暂停的时长并加到总暂停时间中
            const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
            setPausedTime(prev => prev + pauseDuration);
        }
        setIsTimerPaused(false);
        setPauseStartTime(null);
    };

    const handlePauseTimer = () => {
        setIsTimerPaused(true);
        // 记录暂停开始的时间
        setPauseStartTime(Date.now());
    };

    const handleDeleteTask = (taskId: string) => {
        if (window.confirm('Are you sure you want to delete this task and all its timed sessions?')) {
            setTasks(prev => prev.filter(task => task.id !== taskId));
            setFocusSessions(prev => prev.filter(session => session.taskId !== taskId));
        }
    };
    
    const handleUpdateTaskTitle = (taskId: string, newTitle: string) => {
        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, title: newTitle.trim() } : task
        ));
    };

    const handleUpdateTaskDueDate = (taskId: string, dueDate: number | undefined) => {
        setTasks(prev => prev.map(task => 
            task.id === taskId ? { ...task, dueDate: dueDate } : task
        ));
    };

    const handleAddFocusSession = (taskTitle: string, tagNames: string[], startTime: number, endTime: number, note?: string) => {
        // 查找任务或场景
        let targetTask = tasks.find(t => t.title.toLowerCase() === taskTitle.toLowerCase());
        let targetScene = scenes.find(s => s.name.toLowerCase() === taskTitle.toLowerCase());
        
        let targetId: string;
        
        if (!targetTask && !targetScene) {
            // 既不是任务也不是场景，创建新任务
            const { newTags, tagIds } = findOrCreateTags(tagNames);
            if (newTags.length > 0) {
                setTags(prev => [...prev, ...newTags]);
            }

            const newTask: Task = {
                id: `task-${Date.now()}`,
                title: taskTitle,
                completed: false,
                tagIds: tagIds,
                createdAt: Date.now(),
            };
            setTasks(prev => [...prev, newTask]);
            targetId = newTask.id;
        } else if (targetTask) {
            // 找到匹配的任务
            targetId = targetTask.id;
            
            if (tagNames.length > 0) {
                // 如果任务已存在，添加新标签
                const { newTags, tagIds } = findOrCreateTags(tagNames);
                if (newTags.length > 0) {
                    setTags(prev => [...prev, ...newTags]);
                }
                // 合并标签
                const combinedTagIds = [...new Set([...targetTask.tagIds, ...tagIds])];
                setTasks(prev => prev.map(task =>
                    task.id === targetTask!.id ? { ...task, tagIds: combinedTagIds } : task
                ));
            }
        } else if (targetScene) {
            // 找到匹配的场景
            targetId = targetScene.id;
            
            if (tagNames.length > 0) {
                // 如果场景已存在，添加新标签
                const { newTags, tagIds } = findOrCreateTags(tagNames);
                if (newTags.length > 0) {
                    setTags(prev => [...prev, ...newTags]);
                }
                // 合并标签
                const combinedTagIds = [...new Set([...targetScene.tagIds, ...tagIds])];
                setScenes(prev => prev.map(scene =>
                    scene.id === targetScene!.id ? { ...scene, tagIds: combinedTagIds } : scene
                ));
            }
        }

        // 创建专注会话
        const newSession: FocusSession = {
            id: `session-${Date.now()}-${Math.random()}`,
            taskId: targetId,
            startTime: startTime,
            endTime: endTime,
            note: note, // 添加备注字段
        };
        setFocusSessions(prev => [...prev, newSession]);
    };

    const handleDeleteFocusSession = (sessionId: string) => {
        if (window.confirm('确定要删除这条专注记录吗？')) {
            setFocusSessions(prev => prev.filter(session => session.id !== sessionId));
        }
    };

    const handleUpdateFocusSession = (sessionId: string, startTime: number, endTime: number) => {
        if (endTime <= startTime) {
            alert('结束时间必须晚于开始时间');
            return;
        }
        setFocusSessions(prev => prev.map(session => 
            session.id === sessionId ? { ...session, startTime, endTime } : session
        ));
    };

    const handleUpdateFocusNote = (sessionId: string, note: string) => {
        const normalizedNote = note.trim();
        const noteValue = normalizedNote || undefined;

        setFocusNotes(prev => {
            const next = { ...prev };
            if (noteValue) {
                next[sessionId] = normalizedNote;
            } else {
                delete next[sessionId];
            }
            return next;
        });

        setFocusSessions(prev => prev.map(session =>
            session.id === sessionId ? { ...session, note: noteValue } : session
        ));
    };

    // Tab分组相关的处理函数
    const handleAddTabGroup = (name: string) => {
        const maxOrder = Math.max(...tabGroups.map(g => g.order), -1);
        const newGroup: TabGroup = {
            id: `group-${Date.now()}`,
            name,
            order: maxOrder + 1,
        };
        setTabGroups(prev => [...prev, newGroup]);
    };

    const handleUpdateTabGroup = (groupId: string, newName: string) => {
        setTabGroups(prev => prev.map(group => 
            group.id === groupId ? { ...group, name: newName } : group
        ));
    };

    const handleDeleteTabGroup = (groupId: string) => {
        // 不能删除默认分组
        if (tabGroups.find(g => g.id === groupId)?.isDefault) {
            alert('不能删除默认分组');
            return;
        }
        
        // 确认删除
        if (window.confirm('确定要删除这个分组吗？分组中的任务将移动到默认分组。')) {
            // 将该分组中的任务移动到默认分组
            setTasks(prev => prev.map(task =>
                task.groupId === groupId ? { ...task, groupId: 'default' } : task
            ));
            
            // 删除分组并重新排序
            const deletedGroup = tabGroups.find(g => g.id === groupId);
            if (deletedGroup) {
                setTabGroups(prev =>
                    prev.filter(group => group.id !== groupId)
                        .map(group => group.order > deletedGroup.order
                            ? { ...group, order: group.order - 1 }
                            : group
                        )
                );
            }
        }
    };

    const handleReorderTabGroups = (reorderedGroups: TabGroup[]) => {
        // 更新排序后的分组
        const updatedGroups = reorderedGroups.map((group, index) => ({
            ...group,
            order: index
        }));
        setTabGroups(updatedGroups);
    };

    // 场景相关的处理函数
    const handleAddScene = (emoji: string, name: string, tagNames: string[]) => {
        const { newTags, tagIds } = findOrCreateTags(tagNames);

        if (newTags.length > 0) {
            setTags(prev => [...prev, ...newTags]);
        }

        const newScene: Scene = {
            id: `scene-${Date.now()}`,
            emoji,
            name,
            tagIds: tagIds,
            createdAt: Date.now(),
        };
        setScenes(prev => [...prev, newScene]);
    };

    const handleStartSceneTimer = (sceneId: string) => {
        if (activeSession) {
            alert("当前有任务或场景正在计时，请先停止。");
            return;
        }
        const newSession: FocusSession = {
            id: `session-${Date.now()}`,
            taskId: sceneId, // 场景和任务共用同一个session机制
            startTime: Date.now(),
            endTime: null,
        };
        setFocusSessions(prev => [...prev, newSession]);
        setIsTimerPaused(false);
        setPausedTime(0);
        setPauseStartTime(null);
    };

    const handleAddTagToScene = (sceneId: string, tagId: string) => {
        setScenes(prev => prev.map(scene => {
            if (scene.id === sceneId && !scene.tagIds.includes(tagId)) {
                return { ...scene, tagIds: [...scene.tagIds, tagId] };
            }
            return scene;
        }));
    };
    
    const handleRemoveTagFromScene = (sceneId: string, tagId: string) => {
        setScenes(prev => prev.map(scene => {
            if (scene.id === sceneId) {
                return { ...scene, tagIds: scene.tagIds.filter(id => id !== tagId) };
            }
            return scene;
        }));
    };

    const handleUpdateSceneName = (sceneId: string, newName: string) => {
        setScenes(prev => prev.map(scene => 
            scene.id === sceneId ? { ...scene, name: newName.trim() } : scene
        ));
    };

    const handleUpdateSceneEmoji = (sceneId: string, newEmoji: string) => {
        setScenes(prev => prev.map(scene => 
            scene.id === sceneId ? { ...scene, emoji: newEmoji.trim() } : scene
        ));
    };

    const handleDeleteScene = (sceneId: string) => {
        if (window.confirm('确定要删除这个场景及其所有专注记录吗？')) {
            setScenes(prev => prev.filter(scene => scene.id !== sceneId));
            setFocusSessions(prev => prev.filter(session => session.taskId !== sceneId));
        }
    };

    const handleArchiveScene = (sceneId: string) => {
        setScenes(prev => prev.map(scene =>
            scene.id === sceneId ? {
                ...scene,
                isArchived: true,
                archivedAt: Date.now()
            } : scene
        ));
    };

    const handleUnarchiveScene = (sceneId: string) => {
        setScenes(prev => prev.map(scene =>
            scene.id === sceneId ? {
                ...scene,
                isArchived: false,
                archivedAt: undefined
            } : scene
        ));
    };

    // 移动任务到其他分组
    const handleMoveTaskToGroup = (taskId: string, groupId: string) => {
        setTasks(prev => prev.map(task =>
            task.id === taskId ? { ...task, groupId } : task
        ));
    };

    if (!isAuthenticated) {
        return <LoginModal onLogin={handleLogin} isAuthenticated={isAuthenticated} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Header currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} />
            <main>
                {currentView === 'tasks' ? (
                    <TaskManagementView 
                        tasks={tasks}
                        tags={tags}
                        focusSessions={focusSessions}
                        scenes={scenes}
                        tabGroups={tabGroups}
                        activeSession={activeSession}
                        elapsedTime={elapsedTime}
                        isFocusModalMinimized={isFocusModalMinimized}
                        onSetFocusModalMinimized={setIsFocusModalMinimized}
                        onAddTask={handleAddTask}
                        onToggleComplete={handleToggleComplete}
                        onStartTimer={handleStartTimer}
                        onStopTimer={handleStopTimer}
                        onResumeTimer={handleResumeTimer}
                        onPauseTimer={handlePauseTimer}
                        onCreateTag={handleCreateTag}
                        onUpdateTag={handleUpdateTag}
                        onUpdateTagColor={handleUpdateTagColor}
                        onDeleteTag={handleDeleteTag}
                        onAddTagToTask={handleAddTagToTask}
                        onRemoveTagFromTask={handleRemoveTagFromTask}
                        onUpdateTaskTitle={handleUpdateTaskTitle}
                        onUpdateTaskDueDate={handleUpdateTaskDueDate}
                        onDeleteTask={handleDeleteTask}
                        onAddFocusSession={handleAddFocusSession}
                        onDeleteFocusSession={handleDeleteFocusSession}
                        onUpdateFocusSession={handleUpdateFocusSession}
                        onUpdateFocusNote={handleUpdateFocusNote}
                        onAddScene={handleAddScene}
                        onStartSceneTimer={handleStartSceneTimer}
                        onAddTagToScene={handleAddTagToScene}
                        onRemoveTagFromScene={handleRemoveTagFromScene}
                        onUpdateSceneName={handleUpdateSceneName}
                        onUpdateSceneEmoji={handleUpdateSceneEmoji}
                        onDeleteScene={handleDeleteScene}
                        onArchiveScene={handleArchiveScene}
                        onUnarchiveScene={handleUnarchiveScene}
                        onAddTabGroup={handleAddTabGroup}
                        onUpdateTabGroup={handleUpdateTabGroup}
                        onDeleteTabGroup={handleDeleteTabGroup}
                        onReorderTabGroups={handleReorderTabGroups}
                        onMoveTaskToGroup={handleMoveTaskToGroup}
                    />
                ) : (
                    <TimeAnalysisView 
                        tasks={tasks}
                        tags={tags}
                        focusSessions={focusSessions}
                        scenes={scenes}
                        activeSession={activeSession}
                        elapsedTime={elapsedTime}
                        onDeleteFocusSession={handleDeleteFocusSession}
                        onUpdateFocusSession={handleUpdateFocusSession}
                    />
                )}
            </main>
            
            {/* PWA 安装提示 */}
            <PWAInstallPrompt 
                onInstall={() => console.log('PWA 安装成功')}
                onDismiss={() => console.log('PWA 安装提示已关闭')}
            />
        </div>
    );
}

export default App;