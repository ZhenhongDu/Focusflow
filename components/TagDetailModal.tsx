import React, { useMemo, useState } from 'react';
import { Tag, Task, FocusSession, Scene } from '../types';
import { XIcon, TrashIcon } from './icons';
import FocusSessionTimeView from './FocusSessionTimeView';
import { useIsMobile } from '../utils/deviceDetect';

interface TagDetailModalProps {
    tag: Tag;
    tasks: Task[];
    scenes: Scene[];
    focusSessions: FocusSession[];
    onClose: () => void;
    onDeleteFocusSession: (sessionId: string) => void;
}

interface SessionWithItem {
    session: FocusSession;
    item: Task | Scene;
    isScene: boolean;
}

const TagDetailModal: React.FC<TagDetailModalProps> = ({ tag, tasks, scenes, focusSessions, onClose, onDeleteFocusSession }) => {
    const isMobile = useIsMobile();

    // 选中的日期状态
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // 获取所有关联的已完成sessions
    const tagCompletedSessions = useMemo(() => {
        // 找到所有包含该tag的任务和场景
        const taggedTasks = tasks.filter(task => task.tagIds.includes(tag.id));
        const taggedScenes = scenes.filter(scene => scene.tagIds.includes(tag.id));
        const taggedTaskIds = new Set(taggedTasks.map(t => t.id));
        const taggedSceneIds = new Set(taggedScenes.map(s => s.id));
        
        // 找到所有相关的已完成的focus sessions
        return focusSessions.filter(
            session => session.endTime !== null && (taggedTaskIds.has(session.taskId) || taggedSceneIds.has(session.taskId))
        );
    }, [tag.id, tasks, scenes, focusSessions]);
    
    // 根据选中日期过滤sessions
    const selectedDateSessionsWithItems = useMemo((): SessionWithItem[] => {
        const filteredSessions = tagCompletedSessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return (
                sessionDate.getFullYear() === selectedDate.getFullYear() &&
                sessionDate.getMonth() === selectedDate.getMonth() &&
                sessionDate.getDate() === selectedDate.getDate()
            );
        });
        
        // 创建带任务/场景信息的session列表，按时间倒序
        const sessionsWithItems: SessionWithItem[] = [];
        
        filteredSessions.forEach(session => {
            const task = tasks.find(t => t.id === session.taskId);
            if (task) {
                sessionsWithItems.push({ session, item: task, isScene: false });
                return;
            }
            const scene = scenes.find(s => s.id === session.taskId);
            if (scene) {
                sessionsWithItems.push({ session, item: scene, isScene: true });
            }
        });
        
        return sessionsWithItems.sort((a, b) => b.session.startTime - a.session.startTime);
    }, [tagCompletedSessions, selectedDate, tasks, scenes]);
    
    // 计算统计信息
    const statistics = useMemo(() => {
        if (tagCompletedSessions.length === 0) {
            return {
                totalSeconds: 0,
                days: 0,
                avgSecondsPerDay: 0
            };
        }
        
        // 计算总时长（秒）
        const totalSeconds = tagCompletedSessions.reduce((sum, session) => {
            if (session.endTime) {
                return sum + Math.floor((session.endTime - session.startTime) / 1000);
            }
            return sum;
        }, 0);
        
        // 找出所有session发生的日期（天数）
        const uniqueDays = new Set<string>();
        tagCompletedSessions.forEach(session => {
            const date = new Date(session.startTime);
            const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            uniqueDays.add(dayKey);
        });
        
        const days = uniqueDays.size;
        const avgSecondsPerDay = days > 0 ? totalSeconds / days : 0;
        
        return {
            totalSeconds,
            days,
            avgSecondsPerDay
        };
    }, [tagCompletedSessions]);
    
    // 获取所有关联的任务和场景
    const relatedTasks = useMemo(() => {
        return tasks.filter(task => task.tagIds.includes(tag.id));
    }, [tag.id, tasks]);
    
    const relatedScenes = useMemo(() => {
        return scenes.filter(scene => scene.tagIds.includes(tag.id));
    }, [tag.id, scenes]);
    
    // 格式化时间显示（秒转为小时:分:秒）
    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    // 格式化日期时间
    const formatDateTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };
    
    // 计算session时长
    const getSessionDuration = (session: FocusSession) => {
        if (session.endTime) {
            return Math.floor((session.endTime - session.startTime) / 1000);
        }
        return 0;
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
            <div
                className={`bg-white rounded-lg shadow-2xl ${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl'} w-full overflow-hidden flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-slate-200`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <span className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full ${tag.color.replace('text-', 'bg-').split(' ')[0]}`}></span>
                        <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-slate-800 truncate`}>#{tag.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                    >
                        <XIcon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                    </button>
                </div>

                {/* Content */}
                <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-3' : 'p-6'}`}>
                    {/* 统计信息 */}
                    <div className={isMobile ? 'mb-4' : 'mb-6'}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-700 ${isMobile ? 'mb-2' : 'mb-3'}`}>统计信息</h3>
                        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-3`}>
                            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white`}>
                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-100 mb-1`}>总计时长</div>
                                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{formatTime(statistics.totalSeconds)}</div>
                            </div>
                            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-gradient-to-br from-green-500 to-green-600 rounded-lg text-white`}>
                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-100 mb-1`}>活跃天数</div>
                                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{statistics.days} 天</div>
                            </div>
                            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white`}>
                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-100 mb-1`}>日均时长</div>
                                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{formatTime(Math.floor(statistics.avgSecondsPerDay))}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 关联任务 */}
                    <div className={isMobile ? 'mb-4' : 'mb-6'}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-700 ${isMobile ? 'mb-2' : 'mb-3'}`}>关联任务 ({relatedTasks.length})</h3>
                        {relatedTasks.length > 0 ? (
                            <div className={`bg-slate-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'} space-y-2`}>
                                {relatedTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="bg-white p-3 rounded-md shadow-sm flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                readOnly
                                                className="h-4 w-4 rounded border-gray-300 text-brand-primary pointer-events-none flex-shrink-0"
                                            />
                                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${task.completed ? 'line-through text-slate-500' : 'text-slate-700'} truncate`}>
                                                {task.title}
                                            </span>
                                        </div>
                                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-slate-400 flex-shrink-0 ml-2`}>
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={`text-slate-500 text-center ${isMobile ? 'py-3' : 'py-4'} bg-slate-50 rounded-lg`}>暂无关联任务</p>
                        )}
                    </div>

                    {/* 关联场景 */}
                    <div className={isMobile ? 'mb-4' : 'mb-6'}>
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-purple-700 ${isMobile ? 'mb-2' : 'mb-3'}`}>关联场景 ({relatedScenes.length})</h3>
                        {relatedScenes.length > 0 ? (
                            <div className={`bg-purple-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'} space-y-2`}>
                                {relatedScenes.map(scene => (
                                    <div
                                        key={scene.id}
                                        className="bg-white p-3 rounded-md shadow-sm flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span className={`${isMobile ? 'text-lg' : 'text-2xl'} flex-shrink-0`}>{scene.emoji}</span>
                                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-700 truncate`}>{scene.name}</span>
                                        </div>
                                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-slate-400 flex-shrink-0 ml-2`}>
                                            {new Date(scene.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={`text-slate-500 text-center ${isMobile ? 'py-3' : 'py-4'} bg-purple-50 rounded-lg`}>暂无关联场景</p>
                        )}
                    </div>
                    
                    {/* 计时记录 */}
                    <div>
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-700 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                            计时记录
                        </h3>

                        {/* 时间视图选择器 */}
                        <div className={isMobile ? 'mb-3' : 'mb-4'}>
                            <FocusSessionTimeView
                                sessions={tagCompletedSessions}
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                            />
                        </div>

                        {/* 选中日期的记录 */}
                        <div className={isMobile ? 'mb-2' : 'mb-2'}>
                            <h4 className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-slate-600 mb-2`}>
                                {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 的记录 ({selectedDateSessionsWithItems.length})
                            </h4>
                        </div>

                        {selectedDateSessionsWithItems.length > 0 ? (
                            <div className={`bg-slate-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'} ${isMobile ? 'max-h-[50vh]' : 'max-h-96'} overflow-y-auto space-y-2`}>
                                {selectedDateSessionsWithItems.map(({ session, item, isScene }) => (
                                    <div
                                        key={session.id}
                                        className={`bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow group ${isScene ? 'border-l-4 border-purple-400' : ''}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {isScene && <span className={`${isMobile ? 'text-base' : 'text-lg'} flex-shrink-0`}>{(item as Scene).emoji}</span>}
                                                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-slate-800 truncate`}>
                                                        {'title' in item ? item.title : item.name}
                                                    </div>
                                                    {isScene && <span className={`${isMobile ? 'text-xs' : 'text-xs'} bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0`}>场景</span>}
                                                </div>
                                                <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-slate-500`}>
                                                    {formatDateTime(session.startTime)} - {session.endTime && formatDateTime(session.endTime)}
                                                </div>
                                                {/* 显示专注备注 */}
                                                {session.note && (
                                                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 mt-1 bg-slate-50 p-2 rounded`}>
                                                        {session.note}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                <span className={`${isMobile ? 'text-xs' : 'text-sm'} inline-flex items-center px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-800`}>
                                                    {formatTime(getSessionDuration(session))}
                                                </span>
                                                <button
                                                    onClick={() => onDeleteFocusSession(session.id)}
                                                    className={`${isMobile ? 'p-1.5' : 'p-1.5'} text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100`}
                                                    title="删除此记录"
                                                >
                                                    <TrashIcon className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className={`text-slate-500 text-center ${isMobile ? 'py-4' : 'py-4'} bg-slate-50 rounded-lg`}>暂无计时记录</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TagDetailModal;

