import React, { useMemo } from 'react';
import { Scene, Tag, FocusSession } from '../types';
import { XIcon, TrashIcon } from './icons';

interface SceneDetailModalProps {
    scene: Scene;
    tags: Tag[];
    focusSessions: FocusSession[];
    onClose: () => void;
    onDeleteFocusSession: (sessionId: string) => void;
}

const SceneDetailModal: React.FC<SceneDetailModalProps> = ({ scene, tags, focusSessions, onClose, onDeleteFocusSession }) => {
    // 获取场景相关的标签
    const sceneTags = useMemo(() => {
        return tags.filter(tag => scene.tagIds.includes(tag.id));
    }, [tags, scene.tagIds]);
    
    // 计算统计信息
    const statistics = useMemo(() => {
        // 找到所有相关的已完成的focus sessions
        const completedSessions = focusSessions.filter(
            session => session.endTime !== null && session.taskId === scene.id
        );
        
        if (completedSessions.length === 0) {
            return {
                totalSeconds: 0,
                sessionCount: 0,
                avgSecondsPerSession: 0,
                completedSessions: []
            };
        }
        
        // 计算总时长（秒）
        const totalSeconds = completedSessions.reduce((sum, session) => {
            if (session.endTime) {
                return sum + Math.floor((session.endTime - session.startTime) / 1000);
            }
            return sum;
        }, 0);
        
        const sessionCount = completedSessions.length;
        const avgSecondsPerSession = sessionCount > 0 ? totalSeconds / sessionCount : 0;
        
        // 按时间倒序排列
        const sortedSessions = [...completedSessions].sort((a, b) => b.startTime - a.startTime);
        
        return {
            totalSeconds,
            sessionCount,
            avgSecondsPerSession,
            completedSessions: sortedSessions
        };
    }, [scene.id, focusSessions]);
    
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div 
                className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl">{scene.emoji}</span>
                            <h2 className="text-2xl font-bold text-slate-800">{scene.name}</h2>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-600 text-white">
                                场景
                            </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap ml-14">
                            {sceneTags.map(tag => (
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
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* 统计信息 */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">统计信息</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                <div className="text-sm text-purple-100 mb-1">总计时长</div>
                                <div className="text-2xl font-bold">{formatTime(statistics.totalSeconds)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 text-white">
                                <div className="text-sm text-pink-100 mb-1">专注次数</div>
                                <div className="text-2xl font-bold">{statistics.sessionCount} 次</div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
                                <div className="text-sm text-indigo-100 mb-1">平均时长</div>
                                <div className="text-2xl font-bold">{formatTime(Math.floor(statistics.avgSecondsPerSession))}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* 计时记录 */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">
                            计时记录 ({statistics.completedSessions.length})
                        </h3>
                        {statistics.completedSessions.length > 0 ? (
                            <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                                {statistics.completedSessions.map((session) => (
                                    <div 
                                        key={session.id}
                                        className="bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="text-sm text-slate-600 mb-1">
                                                    {formatDateTime(session.startTime)} - {session.endTime && formatDateTime(session.endTime)}
                                                </div>
                                                {/* 显示专注备注 */}
                                                {session.note && (
                                                    <div className="text-sm text-slate-500 mt-1 bg-slate-50 p-2 rounded">
                                                        {session.note}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
                                                    {formatTime(getSessionDuration(session))}
                                                </span>
                                                <button
                                                    onClick={() => onDeleteFocusSession(session.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title="删除此记录"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-center py-8 bg-slate-50 rounded-lg">
                                暂无计时记录
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SceneDetailModal;

