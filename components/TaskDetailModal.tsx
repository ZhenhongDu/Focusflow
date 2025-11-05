import React, { useMemo, useState } from 'react';
import { Task, Tag, FocusSession } from '../types';
import { XIcon, TrashIcon } from './icons';
import FocusSessionTimeView from './FocusSessionTimeView';
import { useIsMobile } from '../utils/deviceDetect';

interface TaskDetailModalProps {
    task: Task;
    tags: Tag[];
    focusSessions: FocusSession[];
    onClose: () => void;
    onDeleteFocusSession: (sessionId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, tags, focusSessions, onClose, onDeleteFocusSession }) => {
    const isMobile = useIsMobile();

    // 选中的日期状态
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // 获取任务相关的标签
    const taskTags = useMemo(() => {
        return tags.filter(tag => task.tagIds.includes(tag.id));
    }, [tags, task.tagIds]);
    
    // 获取任务的所有已完成的sessions
    const taskCompletedSessions = useMemo(() => {
        return focusSessions.filter(
            session => session.endTime !== null && session.taskId === task.id
        );
    }, [task.id, focusSessions]);
    
    // 根据选中日期过滤sessions
    const selectedDateSessions = useMemo(() => {
        return taskCompletedSessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return (
                sessionDate.getFullYear() === selectedDate.getFullYear() &&
                sessionDate.getMonth() === selectedDate.getMonth() &&
                sessionDate.getDate() === selectedDate.getDate()
            );
        }).sort((a, b) => b.startTime - a.startTime);
    }, [taskCompletedSessions, selectedDate]);
    
    // 计算统计信息
    const statistics = useMemo(() => {
        if (taskCompletedSessions.length === 0) {
            return {
                totalSeconds: 0,
                sessionCount: 0,
                avgSecondsPerSession: 0
            };
        }
        
        // 计算总时长（秒）
        const totalSeconds = taskCompletedSessions.reduce((sum, session) => {
            if (session.endTime) {
                return sum + Math.floor((session.endTime - session.startTime) / 1000);
            }
            return sum;
        }, 0);
        
        const sessionCount = taskCompletedSessions.length;
        const avgSecondsPerSession = sessionCount > 0 ? totalSeconds / sessionCount : 0;
        
        return {
            totalSeconds,
            sessionCount,
            avgSecondsPerSession
        };
    }, [taskCompletedSessions]);
    
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
                className={`bg-white rounded-lg shadow-2xl ${isMobile ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-3xl'} w-full overflow-hidden flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-slate-200`}>
                    <div className={`flex-1 ${isMobile ? 'pr-2' : 'pr-4'}`}>
                        <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-slate-800 ${isMobile ? 'mb-1' : 'mb-2'}`}>{task.title}</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            {task.completed && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    ✓ 已完成
                                </span>
                            )}
                            {taskTags.map(tag => (
                                <span key={tag.id} className={`text-xs font-semibold px-2 py-1 rounded-full ${tag.color}`}>
                                    #{tag.name}
                                </span>
                            ))}
                        </div>
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
                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-100 mb-1`}>专注次数</div>
                                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{statistics.sessionCount} 次</div>
                            </div>
                            <div className={`${isMobile ? 'p-3' : 'p-4'} bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white`}>
                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-100 mb-1`}>平均时长</div>
                                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{formatTime(Math.floor(statistics.avgSecondsPerSession))}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 计时记录 */}
                    <div>
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-slate-700 ${isMobile ? 'mb-2' : 'mb-3'}`}>
                            计时记录
                        </h3>

                        {/* 时间视图选择器 */}
                        <div className={isMobile ? 'mb-3' : 'mb-4'}>
                            <FocusSessionTimeView
                                sessions={taskCompletedSessions}
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                            />
                        </div>

                        {/* 选中日期的记录 */}
                        <div className={isMobile ? 'mb-2' : 'mb-2'}>
                            <h4 className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-slate-600 mb-2`}>
                                {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })} 的记录 ({selectedDateSessions.length})
                            </h4>
                        </div>

                        {selectedDateSessions.length > 0 ? (
                            <div className={`bg-slate-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'} ${isMobile ? 'max-h-[50vh]' : 'max-h-96'} overflow-y-auto space-y-2`}>
                                {selectedDateSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-600 mb-1`}>
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
                            <p className={`text-slate-500 text-center ${isMobile ? 'py-4' : 'py-8'} bg-slate-50 rounded-lg`}>
                                暂无计时记录
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;

