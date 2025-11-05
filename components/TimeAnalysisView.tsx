import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell } from 'recharts';
import { Task, Tag, FocusSession, Scene } from '../types';
import TaskDetailModal from './TaskDetailModal';
import SceneDetailModal from './SceneDetailModal';
import TagDetailModal from './TagDetailModal';
import MobileDock from './MobileDock';
import { useIsMobile } from '../utils/deviceDetect';

interface TimeAnalysisViewProps {
    tasks: Task[];
    tags: Tag[];
    focusSessions: FocusSession[];
    scenes: Scene[];
    activeSession?: FocusSession | null;
    elapsedTime?: number;
    onDeleteFocusSession: (sessionId: string) => void;
    onUpdateFocusSession: (sessionId: string, startTime: number, endTime: number) => void;
}

type ViewMode = 'day' | 'week' | 'month' | 'year';
type ChartType = 'task' | 'tag';
type TrendMode = 'week' | 'month' | 'year';

const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
};

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // 格式化为小时（保留一位小数）
    const formatHours = (seconds: number) => {
        const hours = seconds / 3600;
        return hours.toFixed(1);
    };

const TimeAnalysisView: React.FC<TimeAnalysisViewProps> = ({
    tasks,
    tags,
    focusSessions,
    scenes,
    activeSession,
    elapsedTime = 0,
    onDeleteFocusSession,
    onUpdateFocusSession
}) => {
    const isMobile = useIsMobile();
    const [mobileDockPage, setMobileDockPage] = useState<'statistics' | 'tags' | 'detail' | 'heatmap'>('statistics');
    // 专注详情状态
    const [detailViewMode, setDetailViewMode] = useState<ViewMode>('day');
    const [detailChartType, setDetailChartType] = useState<ChartType>('task');
    const [detailDate, setDetailDate] = useState(new Date());
    
    // 专注记录状态
    const [recordDate, setRecordDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
    
    // 专注趋势状态
    const [trendMode, setTrendMode] = useState<TrendMode>('week');
    const [trendDate, setTrendDate] = useState(new Date());
    
    // 今日专注统计饼图状态
    const [pieViewMode, setPieViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [pieChartType, setPieChartType] = useState<ChartType>('task');
    const [pieDate, setPieDate] = useState(new Date());
    
    // Tag分析状态
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [selectedTagForModal, setSelectedTagForModal] = useState<Tag | null>(null);
    const [tagAnalysisDate, setTagAnalysisDate] = useState(new Date());
    const [showTagSettings, setShowTagSettings] = useState(false);
    const [tagOrder, setTagOrder] = useState<string[]>([]);
    
    // 获取日期范围
    const getDateRange = (date: Date, mode: ViewMode) => {
        const start = new Date(date);
        const end = new Date(date);
        
        switch (mode) {
            case 'day':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1); // 周一开始
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end.setDate(diff + 6);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(end.getMonth() + 1, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'year':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setMonth(11, 31);
                end.setHours(23, 59, 59, 999);
                break;
        }
        
        return { start: start.getTime(), end: end.getTime() };
    };
    
    // 日期导航
    const navigateDate = (date: Date, mode: ViewMode, direction: number) => {
        const newDate = new Date(date);
        switch (mode) {
            case 'day':
                newDate.setDate(newDate.getDate() + direction);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + direction * 7);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + direction);
                break;
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + direction);
                break;
        }
        return newDate;
    };
    
    // 专注详情数据
    const detailData = useMemo(() => {
        const { start, end } = getDateRange(detailDate, detailViewMode);
        const sessions = focusSessions.filter(s => 
            s.endTime && s.startTime >= start && s.startTime <= end
        );
        
        if (detailChartType === 'task') {
            const itemMap = new Map<string, { title: string; duration: number }>();
            
            sessions.forEach(session => {
                // 先查找任务
                const task = tasks.find(t => t.id === session.taskId);
                if (task && session.endTime) {
                    const duration = (session.endTime - session.startTime) / 1000;
                    if (itemMap.has(task.id)) {
                        itemMap.get(task.id)!.duration += duration;
                    } else {
                        itemMap.set(task.id, { title: task.title, duration });
                    }
                } else {
                    // 如果不是任务，查找场景
                    const scene = scenes.find(s => s.id === session.taskId);
                    if (scene && session.endTime) {
                        const duration = (session.endTime - session.startTime) / 1000;
                        if (itemMap.has(scene.id)) {
                            itemMap.get(scene.id)!.duration += duration;
                        } else {
                            itemMap.set(scene.id, { title: `${scene.emoji} ${scene.name}`, duration });
                        }
                    }
                }
            });
            
            return Array.from(itemMap.values())
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 8)
                .map(item => ({
                    name: item.title.length > 15 ? item.title.substring(0, 12) + '...' : item.title,
                    时长: parseFloat((item.duration / 3600).toFixed(1))
                }));
        } else {
            const tagMap = new Map<string, { name: string; color: string; duration: number }>();
            
            sessions.forEach(session => {
                // 先查找任务
                const task = tasks.find(t => t.id === session.taskId);
                if (task && session.endTime) {
                    const duration = (session.endTime - session.startTime) / 1000;
                    task.tagIds.forEach(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (tag) {
                            if (tagMap.has(tag.id)) {
                                tagMap.get(tag.id)!.duration += duration;
                            } else {
                                tagMap.set(tag.id, { name: tag.name, color: tag.color, duration });
                            }
                        }
                    });
                } else {
                    // 如果不是任务，查找场景
                    const scene = scenes.find(s => s.id === session.taskId);
                    if (scene && session.endTime) {
                        const duration = (session.endTime - session.startTime) / 1000;
                        scene.tagIds.forEach(tagId => {
                            const tag = tags.find(t => t.id === tagId);
                            if (tag) {
                                if (tagMap.has(tag.id)) {
                                    tagMap.get(tag.id)!.duration += duration;
                                } else {
                                    tagMap.set(tag.id, { name: tag.name, color: tag.color, duration });
                                }
                            }
                        });
                    }
                }
            });
            
            return Array.from(tagMap.values())
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 8)
                .map(item => ({
                    name: item.name,
                    时长: parseFloat((item.duration / 3600).toFixed(1))
                }));
        }
    }, [detailDate, detailViewMode, detailChartType, focusSessions, tasks, scenes, tags]);
    
    // 专注记录数据
    const recordData = useMemo(() => {
        const { start, end } = getDateRange(recordDate, 'day');
        return focusSessions
            .filter(s => s.endTime && s.startTime >= start && s.startTime <= end)
            .sort((a, b) => a.startTime - b.startTime)
            .map(session => {
                const task = tasks.find(t => t.id === session.taskId);
                const scene = task ? null : scenes.find(s => s.id === session.taskId);
                return {
                    session,
                    task,
                    scene
                };
            });
    }, [recordDate, focusSessions, tasks, scenes]);
    
    // 专注趋势数据
    const trendData = useMemo(() => {
        if (trendMode === 'week') {
            const { start } = getDateRange(trendDate, 'week');
            const data = [];
            for (let i = 0; i < 7; i++) {
                const dayStart = start + i * 24 * 60 * 60 * 1000;
                const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
                const sessions = focusSessions.filter(s => 
                    s.endTime && s.startTime >= dayStart && s.startTime <= dayEnd
                );
                const duration = sessions.reduce((sum, s) =>
                    sum + (s.endTime! - s.startTime) / 1000, 0
                );
                const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                data.push({
                    name: weekdays[i],
                    时长: parseFloat((duration / 3600).toFixed(1))
                });
            }
            return data;
        } else if (trendMode === 'month') {
            const { start, end } = getDateRange(trendDate, 'month');
            const daysInMonth = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0).getDate();
            const data = [];
            for (let i = 0; i < daysInMonth; i++) {
                const dayStart = start + i * 24 * 60 * 60 * 1000;
                const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
                const sessions = focusSessions.filter(s => 
                    s.endTime && s.startTime >= dayStart && s.startTime <= dayEnd
                );
                const duration = sessions.reduce((sum, s) =>
                    sum + (s.endTime! - s.startTime) / 1000, 0
                );
                data.push({
                    name: `${i + 1}`,
                    时长: parseFloat((duration / 3600).toFixed(1))
                });
            }
            return data;
        } else {
            const year = trendDate.getFullYear();
            const data = [];
            for (let i = 0; i < 12; i++) {
                const monthStart = new Date(year, i, 1).getTime();
                const monthEnd = new Date(year, i + 1, 0, 23, 59, 59, 999).getTime();
                const sessions = focusSessions.filter(s =>
                    s.endTime && s.startTime >= monthStart && s.startTime <= monthEnd
                );
                const duration = sessions.reduce((sum, s) =>
                    sum + (s.endTime! - s.startTime) / 1000, 0
                );
                data.push({
                    name: `${i + 1}月`,
                    时长: parseFloat((duration / 3600).toFixed(1))
                });
            }
            return data;
        }
    }, [trendMode, trendDate, focusSessions]);
    
    // 时间块数据 (一周视图) - 1小时间隔，限制在7:00-23:00
    const timeBlockData = useMemo(() => {
        const { start } = getDateRange(trendDate, 'week');
        const blocks = [];
        
        for (let day = 0; day < 7; day++) {
            for (let hour = 7; hour < 24; hour++) {
                const blockStart = start + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000;
                const blockEnd = blockStart + 60 * 60 * 1000;
                
                const sessions = focusSessions.filter(s => 
                    s.endTime && 
                    ((s.startTime >= blockStart && s.startTime < blockEnd) ||
                     (s.endTime > blockStart && s.endTime <= blockEnd) ||
                     (s.startTime <= blockStart && s.endTime >= blockEnd))
                );
                
                const tagDurations = new Map<string, number>();
                sessions.forEach(s => {
                    const task = tasks.find(t => t.id === s.taskId);
                    const scene = task ? null : scenes.find(sc => sc.id === s.taskId);
                    const item = task || scene;
                    
                    if (item && s.endTime) {
                        const overlapStart = Math.max(s.startTime, blockStart);
                        const overlapEnd = Math.min(s.endTime, blockEnd);
                        const duration = (overlapEnd - overlapStart) / 1000;
                        
                        item.tagIds.forEach(tagId => {
                            tagDurations.set(tagId, (tagDurations.get(tagId) || 0) + duration);
                        });
                    }
                });
                
                const dominantTag = Array.from(tagDurations.entries())
                    .sort((a, b) => b[1] - a[1])[0];
                
                if (dominantTag) {
                    const tag = tags.find(t => t.id === dominantTag[0]);
                    blocks.push({
                        day,
                        hour,
                        tag: tag?.name || '',
                        color: tag?.color || '',
                        duration: dominantTag[1]
                    });
                }
            }
        }
        
        return blocks;
    }, [trendDate, focusSessions, tasks, scenes, tags]);
    
    // 年度热力图数据 - 按月份断开
    const heatmapData = useMemo(() => {
        const year = new Date().getFullYear();
        const data = [];
        let columnIndex = 0;
        
        // 遍历每个月
        for (let month = 0; month < 12; month++) {
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);
            
            // 获取该月第一天是星期几（0=周日，1=周一）
            const firstDayOfWeek = monthStart.getDay();
            const startWeekday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 转换为0=周一，6=周日
            
            // 当前月的当前日期
            const currentDate = new Date(monthStart);
            
            // 如果第一天不是周一，留空
            let dayOfWeek = startWeekday;
            
            while (currentDate <= monthEnd) {
                const dayStart = new Date(currentDate).setHours(0, 0, 0, 0);
                const dayEnd = new Date(currentDate).setHours(23, 59, 59, 999);
                
                const sessions = focusSessions.filter(s =>
                    s.endTime && s.startTime >= dayStart && s.startTime <= dayEnd
                );
                const duration = sessions.reduce((sum, s) =>
                    sum + (s.endTime! - s.startTime) / 1000, 0
                );
                const hours = duration / 3600;
                
                let level = 0;
                if (hours > 8) level = 4;
                else if (hours > 6) level = 3;
                else if (hours > 4) level = 2;
                else if (hours > 2) level = 1;
                
                data.push({
                    date: currentDate.toISOString().split('T')[0],
                    weekday: dayOfWeek,
                    column: columnIndex,
                    duration: hours,
                    level,
                    month: month
                });
                
                // 移动到下一天
                currentDate.setDate(currentDate.getDate() + 1);
                dayOfWeek = (dayOfWeek + 1) % 7;
                
                // 如果到了周日，移动到下一列
                if (dayOfWeek === 0) {
                    columnIndex++;
                }
            }
            
            // 月份结束后，总是移动到下一列开始新月份（确保月份之间断开）
            columnIndex++;
        }
        
        return { data, totalColumns: columnIndex };
    }, [focusSessions]);
    
    const formatDateLabel = (date: Date, mode: ViewMode) => {
        switch (mode) {
            case 'day':
                return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
            case 'week': {
                const start = new Date(date);
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
            }
            case 'month':
                return `${date.getFullYear()}年${date.getMonth() + 1}月`;
            case 'year':
                return `${date.getFullYear()}年`;
        }
    };
    
    // 今日专注统计数据
    const todayStatistics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = today.getTime() + 24 * 60 * 60 * 1000 - 1;
        
        // 今日已完成的todo数量
        const todayCompletedTodos = tasks.filter(task => 
            task.completed && task.createdAt >= todayStart && task.createdAt <= todayEnd
        ).length;
        
        // 今日创建的todo数量
        const todayCreatedTodos = tasks.filter(task => 
            task.createdAt >= todayStart && task.createdAt <= todayEnd
        ).length;
        
        // 今日专注时长（秒）
        const todaySessions = focusSessions.filter(s => 
            s.endTime && s.startTime >= todayStart && s.startTime <= todayEnd
        );
        const todayDuration = todaySessions.reduce((sum, s) => 
            sum + (s.endTime! - s.startTime) / 1000, 0
        );
        
        // 本周专注时长（秒）
        const { start: weekStart, end: weekEnd } = getDateRange(today, 'week');
        const weekSessions = focusSessions.filter(s => 
            s.endTime && s.startTime >= weekStart && s.startTime <= weekEnd
        );
        const weekDuration = weekSessions.reduce((sum, s) => 
            sum + (s.endTime! - s.startTime) / 1000, 0
        );
        
        // 本月专注时长（秒）
        const { start: monthStart, end: monthEnd } = getDateRange(today, 'month');
        const monthSessions = focusSessions.filter(s => 
            s.endTime && s.startTime >= monthStart && s.startTime <= monthEnd
        );
        const monthDuration = monthSessions.reduce((sum, s) => 
            sum + (s.endTime! - s.startTime) / 1000, 0
        );
        
        return {
            todayCompletedTodos,
            todayCreatedTodos,
            todayDuration,
            weekDuration,
            monthDuration
        };
    }, [tasks, focusSessions]);
    
    // 饼图数据
    const pieData = useMemo(() => {
        const { start, end } = getDateRange(pieDate, pieViewMode);
        const sessions = focusSessions.filter(s =>
            s.endTime && s.startTime >= start && s.startTime <= end
        );
        
        if (pieChartType === 'task') {
            const itemMap = new Map<string, { title: string; duration: number; color: string }>();
            
            sessions.forEach(session => {
                const task = tasks.find(t => t.id === session.taskId);
                if (task && session.endTime) {
                    const duration = (session.endTime - session.startTime) / 1000;
                    if (itemMap.has(task.id)) {
                        itemMap.get(task.id)!.duration += duration;
                    } else {
                        // 使用第一个标签的颜色，或默认颜色
                        const firstTag = tags.find(t => task.tagIds.includes(t.id));
                        itemMap.set(task.id, { 
                            title: task.title, 
                            duration,
                            color: firstTag?.color || 'bg-slate-200 text-slate-800'
                        });
                    }
                } else {
                    const scene = scenes.find(s => s.id === session.taskId);
                    if (scene && session.endTime) {
                        const duration = (session.endTime - session.startTime) / 1000;
                        if (itemMap.has(scene.id)) {
                            itemMap.get(scene.id)!.duration += duration;
                        } else {
                            // 场景使用紫色
                            itemMap.set(scene.id, { 
                                title: `${scene.emoji} ${scene.name}`, 
                                duration,
                                color: 'bg-purple-200 text-purple-800'
                            });
                        }
                    }
                }
            });
            
            return Array.from(itemMap.values())
                .sort((a, b) => b.duration - a.duration)
                .map(item => ({
                    name: item.title,
                    value: Math.round(item.duration / 60), // 转为分钟
                    hours: item.duration / 3600, // 保存小时数
                    color: item.color
                }));
        } else {
            const tagMap = new Map<string, { name: string; color: string; duration: number }>();
            
            sessions.forEach(session => {
                const task = tasks.find(t => t.id === session.taskId);
                if (task && session.endTime) {
                    const duration = (session.endTime - session.startTime) / 1000;
                    task.tagIds.forEach(tagId => {
                        const tag = tags.find(t => t.id === tagId);
                        if (tag) {
                            if (tagMap.has(tag.id)) {
                                tagMap.get(tag.id)!.duration += duration;
                            } else {
                                tagMap.set(tag.id, { name: tag.name, color: tag.color, duration });
                            }
                        }
                    });
                } else {
                    const scene = scenes.find(s => s.id === session.taskId);
                    if (scene && session.endTime) {
                        const duration = (session.endTime - session.startTime) / 1000;
                        scene.tagIds.forEach(tagId => {
                            const tag = tags.find(t => t.id === tagId);
                            if (tag) {
                                if (tagMap.has(tag.id)) {
                                    tagMap.get(tag.id)!.duration += duration;
                                } else {
                                    tagMap.set(tag.id, { name: tag.name, color: tag.color, duration });
                                }
                            }
                        });
                    }
                }
            });
            
            return Array.from(tagMap.values())
                .sort((a, b) => b.duration - a.duration)
                .map(item => ({
                    name: item.name,
                    value: Math.round(item.duration / 60), // 转为分钟
                    hours: item.duration / 3600, // 保存小时数
                    color: item.color
                }));
        }
    }, [pieDate, pieViewMode, pieChartType, focusSessions, tasks, scenes, tags]);
    
    // 饼图颜色映射
    const getColorHex = (colorClass: string): string => {
        const colorMap: { [key: string]: string } = {
            'bg-blue-200 text-blue-800': '#3B82F6',
            'bg-red-200 text-red-800': '#EF4444',
            'bg-green-200 text-green-800': '#22C55E',
            'bg-yellow-200 text-yellow-800': '#EAB308',
            'bg-purple-200 text-purple-800': '#A855F7',
            'bg-pink-200 text-pink-800': '#EC4899',
            'bg-indigo-200 text-indigo-800': '#6366F1',
            'bg-teal-200 text-teal-800': '#14B8A6',
            'bg-slate-200 text-slate-800': '#64748B',
        };
        return colorMap[colorClass] || '#64748B';
    };
    
    // Tag统计数据（基于tagAnalysisDate）
    const tagStatistics = useMemo(() => {
        if (!selectedTagId) return null;
        
        const today = new Date(tagAnalysisDate);
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime();
        const todayEnd = today.getTime() + 24 * 60 * 60 * 1000 - 1;
        
        // 找到所有包含该tag的任务和场景
        const taggedTasks = tasks.filter(task => task.tagIds.includes(selectedTagId));
        const taggedScenes = scenes.filter(scene => scene.tagIds.includes(selectedTagId));
        const taggedIds = new Set([...taggedTasks.map(t => t.id), ...taggedScenes.map(s => s.id)]);
        
        // 今日sessions
        const todaySessions = focusSessions.filter(s =>
            s.endTime && taggedIds.has(s.taskId) && s.startTime >= todayStart && s.startTime <= todayEnd
        );
        const todayDuration = todaySessions.reduce((sum, s) => sum + (s.endTime! - s.startTime) / 1000, 0);
        
        // 本周sessions
        const { start: weekStart, end: weekEnd } = getDateRange(today, 'week');
        const weekSessions = focusSessions.filter(s =>
            s.endTime && taggedIds.has(s.taskId) && s.startTime >= weekStart && s.startTime <= weekEnd
        );
        const weekDuration = weekSessions.reduce((sum, s) => sum + (s.endTime! - s.startTime) / 1000, 0);
        
        // 本月sessions
        const { start: monthStart, end: monthEnd } = getDateRange(today, 'month');
        const monthSessions = focusSessions.filter(s =>
            s.endTime && taggedIds.has(s.taskId) && s.startTime >= monthStart && s.startTime <= monthEnd
        );
        const monthDuration = monthSessions.reduce((sum, s) => sum + (s.endTime! - s.startTime) / 1000, 0);
        
        // 最近的专注记录（今日）
        const recentSessions = todaySessions
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, 3)
            .map(session => {
                const task = tasks.find(t => t.id === session.taskId);
                const scene = task ? null : scenes.find(s => s.id === session.taskId);
                return { session, task, scene };
            });
        
        return {
            todayDuration,
            weekDuration,
            monthDuration,
            todayCount: todaySessions.length,
            recentSessions
        };
    }, [selectedTagId, tasks, scenes, focusSessions, tagAnalysisDate]);
    
    // 获取排序后的tags
    const orderedTags = useMemo(() => {
        if (tagOrder.length === 0) {
            setTagOrder(tags.map(t => t.id));
            return tags;
        }
        const ordered = tagOrder
            .map(id => tags.find(t => t.id === id))
            .filter(t => t !== undefined) as Tag[];
        // 添加新的tag
        const newTags = tags.filter(t => !tagOrder.includes(t.id));
        return [...ordered, ...newTags];
    }, [tags, tagOrder]);

    // 移动端Dock配置
    const mobileDockItems = [
        {
            id: 'statistics',
            label: '统计',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            id: 'tags',
            label: '标签',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            )
        },
        {
            id: 'detail',
            label: '详情',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        {
            id: 'heatmap',
            label: '热力图',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 0h6m8 0h-6m6 0a1 1 0 011 1v10a1 1 0 01-1 1h-4a1 1 0 01-1-1V5a1 1 0 011-1zm-6 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5z" />
                </svg>
            )
        }
    ];

    return (
        <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'pb-20' : ''}`}>
            {/* 今日专注统计和标签时间分析 - 同一行 */}
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-5 gap-6'} mb-6`}>
                {/* 今日专注统计模块 - 占3/5宽度 */}
                <div className={isMobile ? 'bg-white rounded-2xl shadow-md p-4' : 'lg:col-span-3 bg-white rounded-2xl shadow-md p-6'}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">今日专注统计</h2>
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* 左侧：文本统计信息 */}
                        <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-3">
                            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 shadow-sm">
                                <div className="text-xs font-semibold uppercase tracking-wide text-indigo-500 mb-1">今日专注</div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-slate-900">{formatHours(todayStatistics.todayDuration)}</span>
                                    <span className="text-xs font-medium text-slate-500">小时</span>
                                </div>
                                <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                                    与昨日相比保持稳定，坚持下去会看到长远变化。
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                                    <div className="text-xs font-medium text-slate-500">今日已完成</div>
                                    <div className="mt-2 text-2xl font-semibold text-slate-800">{todayStatistics.todayCompletedTodos}</div>
                                    <div className="text-xs text-slate-400 mt-1">个任务</div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                                    <div className="text-xs font-medium text-slate-500">今日创建</div>
                                    <div className="mt-2 text-2xl font-semibold text-slate-800">{todayStatistics.todayCreatedTodos}</div>
                                    <div className="text-xs text-slate-400 mt-1">个任务</div>
                                </div>
                                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
                                    <div className="text-xs font-medium text-blue-500">本周专注</div>
                                    <div className="mt-2 text-2xl font-semibold text-blue-700">{formatHours(todayStatistics.weekDuration)}</div>
                                    <div className="text-xs text-blue-400 mt-1">小时</div>
                                </div>
                                <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4 shadow-sm">
                                    <div className="text-xs font-medium text-purple-500">本月专注</div>
                                    <div className="mt-2 text-2xl font-semibold text-purple-700">{formatHours(todayStatistics.monthDuration)}</div>
                                    <div className="text-xs text-purple-400 mt-1">小时</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* 右侧：饼状图 */}
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPieViewMode('day')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            pieViewMode === 'day' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        日
                                    </button>
                                    <button
                                        onClick={() => setPieViewMode('week')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            pieViewMode === 'week' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        周
                                    </button>
                                    <button
                                        onClick={() => setPieViewMode('month')}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            pieViewMode === 'month' ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        月
                                    </button>
                                </div>
                                <select
                                    value={pieChartType}
                                    onChange={(e) => setPieChartType(e.target.value as ChartType)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-full text-sm text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                >
                                    <option value="task">按任务</option>
                                    <option value="tag">按标签</option>
                                </select>
                            </div>
                            
                            {/* 日期导航 */}
                            <div className="flex items-center justify-center gap-2 mb-5 text-slate-500">
                                <button
                                    onClick={() => setPieDate(navigateDate(pieDate, pieViewMode, -1))}
                                    className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <span className="text-xs font-medium text-slate-600 min-w-[120px] text-center">
                                    {formatDateLabel(pieDate, pieViewMode)}
                                </span>
                                <button
                                    onClick={() => setPieDate(navigateDate(pieDate, pieViewMode, 1))}
                                    className="p-1 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className={`rounded-2xl border border-slate-100 bg-white/60 p-4 shadow-inner ${isMobile ? 'h-48' : 'h-56'}`}>
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={isMobile ? 40 : 50}
                                                outerRadius={isMobile ? 60 : 80}
                                                cornerRadius={isMobile ? 4 : 6}
                                                paddingAngle={isMobile ? 2 : 3}
                                                stroke="transparent"
                                                isAnimationActive={false}
                                                labelLine={false}
                                                label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getColorHex(entry.color)} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }}
                                                formatter={(value) => `${value} 分钟`}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-slate-50 rounded-md">
                                        <p className="text-slate-500">暂无数据</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Top 5 列表 */}
                            {pieData.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">占比最多的前5项</h3>
                                    <div className="space-y-1.5">
                                        {pieData.slice(0, 5).map((item, index) => {
                                                const total = pieData.reduce((sum, d) => sum + d.value, 0);
                                                const percentage = ((item.value / total) * 100).toFixed(1);
                                                const displayName = item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name;
                                                return (
                                                    <div key={index} className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-slate-100 bg-white shadow-sm">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div
                                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: getColorHex(item.color) }}
                                                            ></div>
                                                            <span className="text-slate-700 truncate" title={item.name}>{displayName}</span>
                                                        </div>
                                                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                        <span className="text-slate-500">{item.hours.toFixed(1)}h</span>
                                                        <span className="text-slate-800 font-semibold">{percentage}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* 标签时间分析模块 - 占2/5宽度 */}
                <div className={isMobile ? 'bg-white rounded-2xl shadow-md p-4' : 'lg:col-span-2 bg-white rounded-2xl shadow-md p-6'}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">标签时间分析</h2>
                        <div className="flex items-center gap-2">
                            {/* 日期导航 */}
                            <button
                                onClick={() => setTagAnalysisDate(navigateDate(tagAnalysisDate, 'day', -1))}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-sm font-medium text-slate-600 min-w-[120px] text-center">
                                {formatDateLabel(tagAnalysisDate, 'day')}
                            </span>
                            <button
                                onClick={() => setTagAnalysisDate(navigateDate(tagAnalysisDate, 'day', 1))}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            {/* 设置按钮 */}
                            <button
                                onClick={() => setShowTagSettings(!showTagSettings)}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors ml-2"
                                title="排序标签"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    {/* Tag选项卡 - 支持换行 */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {orderedTags.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => setSelectedTagId(tag.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    selectedTagId === tag.id
                                        ? `${tag.color} shadow-sm ring-2 ring-offset-1 ring-current`
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                #{tag.name}
                            </button>
                        ))}
                    </div>
                    
                    {/* 设置面板 */}
                    {showTagSettings && (
                        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">标签排序</h3>
                            <div className="space-y-2">
                                {orderedTags.map((tag, index) => (
                                    <div key={tag.id} className="flex items-center gap-2 bg-white p-2 rounded-md">
                                        <span className="text-slate-500 text-sm w-6">{index + 1}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${tag.color}`}>
                                            #{tag.name}
                                        </span>
                                        <div className="ml-auto flex gap-1">
                                            <button
                                                onClick={() => {
                                                    if (index > 0) {
                                                        const newOrder = [...tagOrder];
                                                        [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                                                        setTagOrder(newOrder);
                                                    }
                                                }}
                                                disabled={index === 0}
                                                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (index < orderedTags.length - 1) {
                                                        const newOrder = [...tagOrder];
                                                        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                                        setTagOrder(newOrder);
                                                    }
                                                }}
                                                disabled={index === orderedTags.length - 1}
                                                className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Tag统计信息 */}
                    {selectedTagId && tagStatistics ? (
                        <div className="space-y-6">
                            {/* 统计卡片 */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                    <div className="text-xs text-blue-600 mb-1">当日</div>
                                    <div className="text-2xl font-bold text-blue-700">{formatHours(tagStatistics.todayDuration)}<span className="text-sm ml-0.5">h</span></div>
                                    <div className="text-xs text-blue-500 mt-1">{tagStatistics.todayCount}次</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                    <div className="text-xs text-purple-600 mb-1">本周</div>
                                    <div className="text-2xl font-bold text-purple-700">{formatHours(tagStatistics.weekDuration)}<span className="text-sm ml-0.5">h</span></div>
                                </div>
                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                    <div className="text-xs text-green-600 mb-1">本月</div>
                                    <div className="text-2xl font-bold text-green-700">{formatHours(tagStatistics.monthDuration)}<span className="text-sm ml-0.5">h</span></div>
                                </div>
                            </div>
                            
                            {/* 当日专注记录 - 单独一行 */}
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-semibold text-slate-700">当日专注记录</h4>
                                    <button
                                        onClick={() => {
                                            const tag = tags.find(t => t.id === selectedTagId);
                                            if (tag) setSelectedTagForModal(tag);
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        查看全部 →
                                    </button>
                                </div>
                                
                                {tagStatistics.recentSessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {tagStatistics.recentSessions.map(({ session, task, scene }) => {
                                            if (!task && !scene) return null;
                                            const startTime = new Date(session.startTime);
                                            const duration = session.endTime ? (session.endTime - session.startTime) / 1000 : 0;
                                            
                                            return (
                                                <div
                                                    key={session.id}
                                                    className="bg-white rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                                                    onClick={() => {
                                                        if (task) setSelectedTask(task);
                                                        else if (scene) setSelectedScene(scene);
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            {scene && <span className="text-lg">{scene.emoji}</span>}
                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-slate-800 font-medium text-sm block">
                                                                    {task ? task.title : scene?.name}
                                                                </span>
                                                                {scene && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full inline-block mt-1">场景</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 ml-4">
                                                            <span className="text-xs text-slate-500">
                                                                {startTime.getHours().toString().padStart(2, '0')}:{startTime.getMinutes().toString().padStart(2, '0')}
                                                            </span>
                                                            <span className="text-blue-600 font-semibold text-sm">
                                                                {formatDuration(duration)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-white rounded-lg border border-slate-200">
                                        <p className="text-sm text-slate-500">当日暂无专注记录</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-500">请选择一个标签查看统计</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 专注详情和专注记录 */}
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'} mb-6`}>
                {/* 专注详情 */}
                <div className={isMobile ? 'bg-white rounded-lg shadow-md p-4' : 'bg-white rounded-lg shadow-md p-6'}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">专注详情</h2>
                        <div className="flex gap-2">
                            <select 
                                value={detailChartType} 
                                onChange={(e) => setDetailChartType(e.target.value as ChartType)}
                                className="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="task">按任务</option>
                                <option value="tag">按标签</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDetailViewMode('day')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    detailViewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                日
                            </button>
                            <button
                                onClick={() => setDetailViewMode('week')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    detailViewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                周
                            </button>
                            <button
                                onClick={() => setDetailViewMode('month')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    detailViewMode === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                月
                            </button>
                            <button
                                onClick={() => setDetailViewMode('year')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    detailViewMode === 'year' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                年
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setDetailDate(navigateDate(detailDate, detailViewMode, -1))}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-sm font-medium text-slate-700 min-w-[180px] text-center">
                                {formatDateLabel(detailDate, detailViewMode)}
                            </span>
                            <button
                                onClick={() => setDetailDate(navigateDate(detailDate, detailViewMode, 1))}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className={isMobile ? 'h-64' : 'h-80'}>
                        {detailData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={detailData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={isMobile ? 10 : 12} angle={isMobile ? -30 : -15} textAnchor="end" height={isMobile ? 40 : 60} />
                                    <YAxis fontSize={isMobile ? 10 : 12} width={isMobile ? 40 : 50} label={{ value: '小时', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => `${value} 小时`} />
                                    <Bar dataKey="时长" fill="#4f46e5" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full bg-slate-50 rounded-md">
                                <p className="text-slate-500">暂无数据</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 专注记录 */}
                <div className={isMobile ? 'bg-white rounded-lg shadow-md p-4' : 'bg-white rounded-lg shadow-md p-6'}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">专注记录</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRecordDate(navigateDate(recordDate, 'day', -1))}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <span className="text-sm font-medium text-slate-700 min-w-[160px] text-center">
                                {formatDateLabel(recordDate, 'day')}
                            </span>
                            <button
                                onClick={() => setRecordDate(navigateDate(recordDate, 'day', 1))}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div className={`space-y-3 ${isMobile ? 'max-h-80' : 'max-h-96'} overflow-y-auto`}>
                        {recordData.length > 0 ? (
                            recordData.map(({ session, task, scene }) => {
                                if (!task && !scene) return null;
                                const startTime = new Date(session.startTime);
                                const endTime = session.endTime ? new Date(session.endTime) : null;
                                
                                return (
                                    <div
                                        key={session.id}
                                        onClick={() => {
                                            if (task) setSelectedTask(task);
                                            else if (scene) setSelectedScene(scene);
                                        }}
                                        className={`p-3 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${isMobile ? 'p-2' : ''}`}
                                    >
                                        <div className={`flex items-center gap-2 text-sm text-slate-600 mb-1 ${isMobile ? 'text-xs' : ''}`}>
                                            <span>🕐</span>
                                            <span>
                                                {startTime.getHours().toString().padStart(2, '0')}:{startTime.getMinutes().toString().padStart(2, '0')}
                                                {endTime && ` - ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`}
                                            </span>
                                            {session.endTime && (
                                                <span className={`ml-auto text-xs font-semibold text-blue-600 ${isMobile ? 'text-[10px]' : ''}`}>
                                                    {formatDuration((session.endTime - session.startTime) / 1000)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {scene && <span className={`text-lg ${isMobile ? 'text-base' : ''}`}>{scene.emoji}</span>}
                                            <div className={`text-slate-800 font-medium ${isMobile ? 'text-sm' : ''}`}>
                                                {task ? task.title : scene?.name}
                                            </div>
                                            {scene && <span className={`text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full ${isMobile ? 'text-[10px] px-1.5 py-0' : ''}`}>场景</span>}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-md">
                                <p className="text-slate-500">暂无专注记录</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 第二行 */}
            <div className={`grid grid-cols-1 ${isMobile ? 'gap-4' : 'lg:grid-cols-2 gap-6'} mb-6`}>
                {/* 专注趋势 */}
                <div className={isMobile ? 'bg-white rounded-lg shadow-md p-4' : 'bg-white rounded-lg shadow-md p-6'}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">专注趋势</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTrendMode('week')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    trendMode === 'week' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                周
                            </button>
                            <button
                                onClick={() => setTrendMode('month')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    trendMode === 'month' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                月
                            </button>
                            <button
                                onClick={() => setTrendMode('year')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    trendMode === 'year' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                年
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <button
                            onClick={() => setTrendDate(navigateDate(trendDate, trendMode, -1))}
                            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-medium text-slate-700 min-w-[160px] text-center">
                            {formatDateLabel(trendDate, trendMode)}
                        </span>
                        <button
                            onClick={() => setTrendDate(navigateDate(trendDate, trendMode, 1))}
                            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className={isMobile ? 'h-48' : 'h-64'}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={isMobile ? 10 : 12} />
                                <YAxis fontSize={isMobile ? 10 : 12} label={{ value: '小时', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => `${value} 小时`} />
                                <Area type="monotone" dataKey="时长" stroke="#4f46e5" fillOpacity={1} fill="url(#colorTime)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                
                {/* 时间块热力图 */}
                <div className={isMobile ? 'bg-white rounded-lg shadow-md p-4' : 'bg-white rounded-lg shadow-md p-6'}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">时间块热力图</h2>
                    <div className="text-sm text-slate-600 mb-4 text-center">
                        {formatDateLabel(trendDate, 'week')}
                    </div>
                    
                    <div className="overflow-x-auto">
                        <div className="inline-grid gap-1" style={{ gridTemplateColumns: isMobile ? 'auto repeat(17, 1fr)' : 'auto repeat(17, 1fr)' }}>
                            {/* 表头 - 时间 (7:00-23:00) */}
                            <div className="text-xs text-slate-500"></div>
                            {Array.from({ length: 17 }, (_, i) => (
                                <div key={i} className={`text-xs text-center text-slate-600 font-medium ${isMobile ? 'w-5' : 'w-6'}`}>
                                    {i + 7}
                                </div>
                            ))}
                            
                            {/* 数据行 - 每一行是一天 */}
                            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((dayName, dayIndex) => (
                                <React.Fragment key={dayIndex}>
                                    <div className={`text-xs text-slate-600 pr-2 flex items-center justify-end font-medium ${isMobile ? 'text-[10px]' : ''}`}>
                                        {dayName}
                                    </div>
                                    {Array.from({ length: 17 }, (_, i) => {
                                        const hour = i + 7;
                                        const block = timeBlockData.find(b => b.day === dayIndex && b.hour === hour);
                                        return (
                                            <div
                                                key={`${dayIndex}-${hour}`}
                                                className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-sm ${block ? block.color.replace('text-', 'bg-').replace('800', '200') : 'bg-slate-50'}`}
                                                title={block ? `${dayName} ${hour}:00 - ${block.tag}: ${formatDuration(block.duration)}` : ''}
                                            />
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                    
                    {/* 图例 */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {Array.from(new Set(timeBlockData.map(b => b.tag))).map(tagName => {
                            const tag = tags.find(t => t.name === tagName);
                            if (!tag) return null;
                            return (
                                <div key={tag.id} className="flex items-center gap-1 text-xs">
                                    <div className={`w-3 h-3 rounded ${tag.color.replace('text-', 'bg-').replace('800', '200')}`}></div>
                                    <span className="text-slate-600">{tag.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 第三行 - 年度热力图 GitHub风格 */}
            <div className={isMobile ? 'bg-white rounded-lg shadow-md p-4' : 'bg-white rounded-lg shadow-md p-6'}>
                <h2 className="text-xl font-bold text-slate-800 mb-4">年度专注热力图</h2>
                
                <div className="overflow-x-auto">
                    {(() => {
                        const year = new Date().getFullYear();
                        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
                        const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                        
                        // 计算每个月对应的列索引（取该月第一天的列）
                        const monthColumns: { month: number; column: number; label: string }[] = [];
                        const seenMonths = new Set<number>();
                        
                        heatmapData.data.forEach(d => {
                            if (!seenMonths.has(d.month)) {
                                seenMonths.add(d.month);
                                monthColumns.push({
                                    month: d.month,
                                    column: d.column,
                                    label: months[d.month]
                                });
                            }
                        });
                        
                        const columnWidth = isMobile ? 10 : 12;
                        const gridTemplateColumns = `repeat(${heatmapData.totalColumns}, ${columnWidth}px)`;
                        const monthSpans = monthColumns.map((monthInfo, idx) => {
                            const nextColumn = idx < monthColumns.length - 1 ? monthColumns[idx + 1].column : heatmapData.totalColumns;
                            return {
                                ...monthInfo,
                                startColumn: monthInfo.column + 1,
                                span: Math.max(nextColumn - monthInfo.column, 1),
                            };
                        });

                        return (
                            <div className="inline-flex flex-col gap-2">
                                {/* 月份标签 */}
                                <div className="flex">
                                    <div style={{ width: isMobile ? '32px' : '42px' }} />
                                    <div
                                        className="grid text-xs text-slate-600"
                                        style={{ gridTemplateColumns, columnGap: isMobile ? '2px' : '4px' }}
                                    >
                                        {monthSpans.map(span => (
                                            <div
                                                key={span.month}
                                                className={`text-center whitespace-nowrap ${isMobile ? 'text-[10px]' : ''}`}
                                                style={{ gridColumn: `${span.startColumn} / span ${span.span}` }}
                                            >
                                                {span.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2 items-start">
                                    {/* 周几标签 */}
                                    <div
                                        className="grid gap-1"
                                        style={{ gridTemplateRows: `repeat(7, ${isMobile ? '10px' : '12px'})` }}
                                    >
                                        {weekdays.map((day, i) => (
                                            <div
                                                key={i}
                                                className={`text-slate-600 flex items-center ${isMobile ? 'text-[10px] w-7 justify-end pr-1' : 'text-xs w-9 justify-end pr-2'}`}
                                                style={{ height: isMobile ? '10px' : '12px' }}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 热力图网格 */}
                                    <div
                                        className="grid gap-1"
                                        style={{ gridTemplateColumns, gridTemplateRows: `repeat(7, ${isMobile ? '10px' : '12px'})` }}
                                    >
                                        {heatmapData.data.map((data, index) => {
                                            const colors = ['bg-slate-50', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'];
                                            return (
                                                <div
                                                    key={index}
                                                    className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-sm ${colors[data.level]}`}
                                                    style={{ gridRow: data.weekday + 1, gridColumn: data.column + 1 }}
                                                    title={`${data.date}: ${data.duration.toFixed(1)}h`}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
                
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
                    <span>专注时长：</span>
                    <div className="flex items-center gap-1">
                        <span>少</span>
                        {['bg-slate-50', 'bg-green-100', 'bg-green-300', 'bg-green-500', 'bg-green-700'].map((color, i) => (
                            <div key={i} className={`w-4 h-4 rounded-sm ${color} border border-slate-200`} />
                        ))}
                        <span>多</span>
                    </div>
                    <span className="ml-4">（0-2h, 2-4h, 4-6h, 6-8h, {'>'}8h）</span>
                </div>
            </div>
            
            {/* 任务详情弹窗 */}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    tags={tags}
                    focusSessions={focusSessions}
                    onClose={() => setSelectedTask(null)}
                    onDeleteFocusSession={onDeleteFocusSession}
                />
            )}
            
            {/* 场景详情弹窗 */}
            {selectedScene && (
                <SceneDetailModal
                    scene={selectedScene}
                    tags={tags}
                    focusSessions={focusSessions}
                    onClose={() => setSelectedScene(null)}
                    onDeleteFocusSession={onDeleteFocusSession}
                />
            )}
            
            {/* Tag详情弹窗 */}
            {selectedTagForModal && (
                <TagDetailModal
                    tag={selectedTagForModal}
                    tasks={tasks}
                    scenes={scenes}
                    focusSessions={focusSessions}
                    onClose={() => setSelectedTagForModal(null)}
                    onDeleteFocusSession={onDeleteFocusSession}
                />
            )}
        </div>
    );
};

export default TimeAnalysisView;
