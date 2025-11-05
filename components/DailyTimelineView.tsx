import React, { useMemo, useState } from 'react';
import { Task, Tag, FocusSession, Scene } from '../types';

interface DailyTimelineViewProps {
    tasks: Task[];
    scenes: Scene[];
    tags: Tag[];
    focusSessions: FocusSession[];
    onDeleteFocusSession: (sessionId: string) => void;
    onUpdateFocusSession: (sessionId: string, startTime: number, endTime: number) => void;
    onUpdateFocusNote?: (sessionId: string, note: string) => void;
}

interface TimeBlock {
    session: FocusSession;
    item: Task | Scene;
    isScene: boolean;
    itemTags: Tag[];
    startHour: number;
    startMinute: number;
    durationMinutes: number;
}

// 颜色映射表
const COLOR_MAP: { [key: string]: { bg: string; border: string; text: string } } = {
    'bg-blue-200 text-blue-800': { bg: '#BFDBFE', border: '#3B82F6', text: '#1E40AF' },
    'bg-red-200 text-red-800': { bg: '#FECACA', border: '#EF4444', text: '#991B1B' },
    'bg-green-200 text-green-800': { bg: '#BBF7D0', border: '#22C55E', text: '#166534' },
    'bg-yellow-200 text-yellow-800': { bg: '#FEF08A', border: '#EAB308', text: '#854D0E' },
    'bg-purple-200 text-purple-800': { bg: '#E9D5FF', border: '#A855F7', text: '#6B21A8' },
    'bg-pink-200 text-pink-800': { bg: '#FBCFE8', border: '#EC4899', text: '#9F1239' },
    'bg-indigo-200 text-indigo-800': { bg: '#C7D2FE', border: '#6366F1', text: '#3730A3' },
    'bg-teal-200 text-teal-800': { bg: '#99F6E4', border: '#14B8A6', text: '#115E59' },
};

const DailyTimelineView: React.FC<DailyTimelineViewProps> = ({ tasks, scenes, tags, focusSessions, onDeleteFocusSession, onUpdateFocusSession, onUpdateFocusNote }) => {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sessionId: string } | null>(null);
    const [editingSession, setEditingSession] = useState<{ session: FocusSession; block: TimeBlock } | null>(null);
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');
    const [editNote, setEditNote] = useState('');
    // 添加日期状态，默认为今天
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // 格式化日期为 YYYY-MM-DD 格式
    const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    // 设置为今天
    const setToToday = () => {
        setSelectedDate(new Date());
    };

    // 设置为昨天
    const setToYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setSelectedDate(yesterday);
    };

    // 设置为前天
    const setToDayBeforeYesterday = () => {
        const dayBeforeYesterday = new Date();
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        setSelectedDate(dayBeforeYesterday);
    };

    // 处理日期变化
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        if (!isNaN(newDate.getTime())) {
            setSelectedDate(newDate);
        }
    };

    const timeBlocks = useMemo(() => {
        // 使用选中的日期而不是今天
        const targetDate = new Date(selectedDate);
        targetDate.setHours(0, 0, 0, 0);
        const targetDateTimestamp = targetDate.getTime();
        const nextDayTimestamp = targetDateTimestamp + 24 * 60 * 60 * 1000;

        // 获取选定日期的所有已完成的专注会话
        const dateSessions = focusSessions.filter(session => 
            session.startTime >= targetDateTimestamp && 
            session.startTime < nextDayTimestamp && 
            session.endTime !== null
        );

        // 转换为时间块
        const blocks: TimeBlock[] = dateSessions.map(session => {
            const task = tasks.find(t => t.id === session.taskId);
            if (task) {
                const startDate = new Date(session.startTime);
                const endDate = new Date(session.endTime!);
                const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
                const itemTags = tags.filter(tag => task.tagIds.includes(tag.id));

                return {
                    session,
                    item: task,
                    isScene: false,
                    itemTags,
                    startHour: startDate.getHours(),
                    startMinute: startDate.getMinutes(),
                    durationMinutes
                };
            }
            
            const scene = scenes.find(s => s.id === session.taskId);
            if (scene) {
                const startDate = new Date(session.startTime);
                const endDate = new Date(session.endTime!);
                const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
                const itemTags = tags.filter(tag => scene.tagIds.includes(tag.id));

                return {
                    session,
                    item: scene,
                    isScene: true,
                    itemTags,
                    startHour: startDate.getHours(),
                    startMinute: startDate.getMinutes(),
                    durationMinutes
                };
            }
            
            return null;
        }).filter(block => block !== null) as TimeBlock[];

        return blocks;
    }, [tasks, scenes, tags, focusSessions, selectedDate]);

    // 时间段定义
    const TIME_PERIODS = [
        { name: '上午', emoji: '🌅', start: 7, end: 12, hours: 5 },
        { name: '下午', emoji: '☀️', start: 13, end: 18, hours: 5 },
        { name: '晚上', emoji: '🌙', start: 18, end: 23, hours: 5 }
    ];

    // 计算时间块的位置和宽度（针对特定时间段）
    const getBlockStyle = (block: TimeBlock, periodStart: number, periodEnd: number) => {
        const blockStart = block.startHour + block.startMinute / 60;
        const blockEnd = blockStart + block.durationMinutes / 60;

        // 如果不在时间范围内，不显示
        if (blockEnd <= periodStart || blockStart >= periodEnd) {
            return null;
        }

        // 裁剪到可见范围
        const visibleStart = Math.max(blockStart, periodStart);
        const visibleEnd = Math.min(blockEnd, periodEnd);

        const periodHours = periodEnd - periodStart;

        // 计算位置百分比（横向）
        const left = ((visibleStart - periodStart) / periodHours) * 100;
        const width = ((visibleEnd - visibleStart) / periodHours) * 100;

        return {
            left: `${left}%`,
            width: `${width}%`
        };
    };

    // 获取任务/场景标签的颜色
    const getBlockColors = (block: TimeBlock) => {
        if (block.isScene) {
            // 场景使用紫色
            return { bg: '#E9D5FF', border: '#A855F7', text: '#6B21A8' };
        }
        if (block.itemTags.length > 0) {
            const colorKey = block.itemTags[0].color;
            return COLOR_MAP[colorKey] || { bg: '#E2E8F0', border: '#94A3B8', text: '#475569' };
        }
        return { bg: '#E2E8F0', border: '#94A3B8', text: '#475569' };
    };

    // 格式化时间显示
    const formatTime = (hour: number, minute: number) => {
        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}小时${mins}分钟`;
        }
        return `${mins}分钟`;
    };
    
    // 处理右键菜单
    const handleContextMenu = (e: React.MouseEvent, sessionId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, sessionId });
    };
    
    // 关闭右键菜单
    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };
    
    // 删除会话
    const handleDeleteSession = () => {
        if (contextMenu) {
            onDeleteFocusSession(contextMenu.sessionId);
            setContextMenu(null);
        }
    };
    
    // 点击其他地方关闭菜单
    React.useEffect(() => {
        if (contextMenu) {
            const handleClick = () => setContextMenu(null);
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    // 格式化时间为 HH:MM 格式
    const formatTimeForInput = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // 处理点击时间块进入编辑模式
    const handleBlockClick = (block: TimeBlock) => {
        setEditingSession({ session: block.session, block });
        setEditStartTime(formatTimeForInput(new Date(block.session.startTime)));
        setEditEndTime(formatTimeForInput(new Date(block.session.endTime!)));
        setEditNote(block.session.note ?? '');
    };

    // 关闭编辑模态框
    const handleCloseEditModal = () => {
        setEditingSession(null);
        setEditStartTime('');
        setEditEndTime('');
        setEditNote('');
    };

    // 提交编辑
    const handleSubmitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSession) return;

        if (!editStartTime || !editEndTime) {
            alert('请选择起始时间和结束时间');
            return;
        }

        // 获取选中的日期
        const selectedDateStr = formatDate(selectedDate);
        const startTimestamp = new Date(`${selectedDateStr}T${editStartTime}`).getTime();
        const endTimestamp = new Date(`${selectedDateStr}T${editEndTime}`).getTime();

        if (endTimestamp <= startTimestamp) {
            alert('结束时间必须晚于起始时间');
            return;
        }

        onUpdateFocusSession(editingSession.session.id, startTimestamp, endTimestamp);

        if (onUpdateFocusNote) {
            const originalNote = editingSession.session.note ?? '';
            const normalizedNote = editNote.trim();
            if (normalizedNote !== originalNote) {
                onUpdateFocusNote(editingSession.session.id, normalizedNote);
            }
        }

        handleCloseEditModal();
    };

    // 调整编辑时间
    const adjustEditTime = (field: 'start' | 'end', minutes: number) => {
        const currentTime = field === 'start' ? editStartTime : editEndTime;
        if (!currentTime) return;
        
        const [hours, mins] = currentTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins, 0, 0);
        date.setMinutes(date.getMinutes() + minutes);
        
        const newTime = formatTimeForInput(date);
        if (field === 'start') {
            setEditStartTime(newTime);
        } else {
            setEditEndTime(newTime);
        }
    };

    // 设置为当前时间
    const setEditToNow = (field: 'start' | 'end') => {
        const now = formatTimeForInput(new Date());
        if (field === 'start') {
            setEditStartTime(now);
        } else {
            setEditEndTime(now);
        }
    };

    // 计算编辑时长
    const calculateEditDuration = () => {
        if (!editStartTime || !editEndTime) return '';
        
        const selectedDateStr = formatDate(selectedDate);
        const startTimestamp = new Date(`${selectedDateStr}T${editStartTime}`).getTime();
        const endTimestamp = new Date(`${selectedDateStr}T${editEndTime}`).getTime();

        if (endTimestamp <= startTimestamp) {
            return '';
        }

        const durationSeconds = (endTimestamp - startTimestamp) / 1000;
        const hours = Math.floor(durationSeconds / 3600);
        const minutes = Math.floor((durationSeconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    // 格式化显示日期
    const formatDisplayDate = (date: Date): string => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        
        const timeDiff = today.getTime() - targetDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        if (daysDiff === 0) {
            return '今天';
        } else if (daysDiff === 1) {
            return '昨天';
        } else if (daysDiff === 2) {
            return '前天';
        } else {
            return `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-lg font-semibold text-slate-700">专注时间轴</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <button 
                        onClick={setToToday}
                        className={`px-2 py-1 text-xs rounded ${formatDate(selectedDate) === formatDate(new Date()) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        今天
                    </button>
                    <button 
                        onClick={setToYesterday}
                        className={`px-2 py-1 text-xs rounded ${(() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            return formatDate(selectedDate) === formatDate(yesterday);
                        })() ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        昨天
                    </button>
                    <button 
                        onClick={setToDayBeforeYesterday}
                        className={`px-2 py-1 text-xs rounded ${(() => {
                            const dayBeforeYesterday = new Date();
                            dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
                            return formatDate(selectedDate) === formatDate(dayBeforeYesterday);
                        })() ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        前天
                    </button>
                    <input
                        type="date"
                        value={formatDate(selectedDate)}
                        onChange={handleDateChange}
                        className="px-2 py-1 text-xs border border-slate-300 rounded"
                    />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDisplayDate(selectedDate)}
                    </span>
                </div>
            </div>
            
            {/* 三个时间段分别显示 */}
            <div className="space-y-4">
                {TIME_PERIODS.map((period, index) => {
                    const periodHours = Array.from({ length: period.hours + 1 }, (_, i) => period.start + i);
                    const periodBlocks = timeBlocks.filter(block => {
                        const blockStart = block.startHour + block.startMinute / 60;
                        const blockEnd = blockStart + block.durationMinutes / 60;
                        return blockEnd > period.start && blockStart < period.end;
                    });

                    return (
                        <div key={period.name} className="relative">
                            {/* 时间段分割线 - 在上午和下午、下午和晚上之间显示 */}
                            {index > 0 && (
                                <div className="flex items-center gap-1 mb+2 -mt+2">
                                    <div className="flex-1 border-t border-dashed border-slate-300"></div>
                                    <div className="flex-1 border-t border-dashed border-slate-300"></div>
                                </div>
                            )}
                            {/* 时间段标题 */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{period.emoji}</span>
                                <span className="text-sm font-semibold text-slate-600">{period.name}</span>
                                <span className="text-xs text-slate-400">
                                    {period.start}:00 - {period.end}:00
                                </span>
                            </div>
                            
                            {/* 时间轴 */}
                            <div className="relative h-24 border-b-2 border-slate-200 pt-2">
                                {/* 时间刻度 */}
                                {periodHours.map((hour, index) => (
                                    <div
                                        key={hour}
                                        className="absolute top-0 bottom-0 border-l border-slate-100"
                                        style={{ left: `${(index / period.hours) * 100}%` }}
                                    >
                                        <span className="absolute -bottom-5 -left-4 text-xs text-slate-500 font-medium">
                                            {hour}:00
                                        </span>
                                    </div>
                                ))}
                                
                                {/* 时间块 */}
                                <div className="absolute left-0 right-0 top-3 bottom-3">
                                    {periodBlocks.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-slate-300 text-xs">暂无记录</p>
                                        </div>
                                    ) : (
                                        periodBlocks.map((block, index) => {
                                            const style = getBlockStyle(block, period.start, period.end);
                                            if (!style) return null;
                                            
                                            const colors = getBlockColors(block);
                                            const startTime = formatTime(block.startHour, block.startMinute);
                                            const endHour = block.startHour + Math.floor((block.startMinute + block.durationMinutes) / 60);
                                            const endMinute = (block.startMinute + block.durationMinutes) % 60;
                                            const endTime = formatTime(endHour, endMinute);
                                            
                                            // 计算宽度百分比
                                            const widthPercent = parseFloat(style.width);
                                            
                                            // 判断文字显示逻辑
                                            // 如果宽度 >= 8%，显示完整文字
                                            // 如果宽度 >= 2%，显示1-2个字
                                            // 如果宽度 < 2%，不显示文字
                                            const showFullText = widthPercent >= 5;
                                            const showShortText = widthPercent >= 2 && widthPercent < 5;
                                            const showText = showFullText || showShortText;
                                            
                                            const itemText = 'title' in block.item ? block.item.title : block.item.name;
                                            const displayText = showShortText ? itemText.substring(0, 2) : itemText;
                                            
                                            return (
                                                <div
                                                    key={`${block.session.id}-${index}`}
                                                    className="absolute top-0 bottom-0 rounded-md cursor-pointer transition-all hover:opacity-90 hover:shadow-lg group"
                                                    style={{
                                                        left: style.left,
                                                        width: style.width,
                                                        minWidth: '16px',
                                                        backgroundColor: colors.bg,
                                                        borderTop: `4px solid ${colors.border}`
                                                    }}
                                                    onClick={() => handleBlockClick(block)}
                                                    onContextMenu={(e) => handleContextMenu(e, block.session.id)}
                                                >
                                                    {/* 显示文字逻辑 */}
                                                    {showText && (
                                                        <div className="flex flex-col items-center justify-center gap-1 px-0.5 py-1 h-full overflow-hidden" style={{ color: colors.text }}>
                                                            {block.isScene && showFullText && <span className="text-base leading-none">{(block.item as Scene).emoji}</span>}
                                                            <div className="text-xs font-medium text-center leading-tight break-words w-full px-0.5" style={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: showShortText ? 1 : 4,
                                                                lineClamp: showShortText ? 1 : 4,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                wordBreak: 'break-word',
                                                                fontSize: showShortText ? '0.65rem' : '0.75rem',
                                                                lineHeight: showShortText ? '1rem' : '1.05rem'
                                                            }}>
                                                                {displayText}
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* 悬停提示 */}
                                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-800 text-white text-xs rounded-md px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {block.isScene && <span className="text-lg">{(block.item as Scene).emoji}</span>}
                                                            <div className="font-semibold">{'title' in block.item ? block.item.title : block.item.name}</div>
                                                            {block.isScene && <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full">场景</span>}
                                                        </div>
                                                        <div className="text-slate-300">{startTime} - {endTime}</div>
                                                        <div className="text-slate-300">总时长: {formatDuration(block.durationMinutes)}</div>
                                                        {block.session.note && (
                                                            <div className="text-slate-300 mt-1 max-w-xs whitespace-normal">
                                                                备注: {block.session.note}
                                                            </div>
                                                        )}
                                                        {block.itemTags.length > 0 && (
                                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                                {block.itemTags.map(tag => (
                                                                    <span key={tag.id} className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                                                                        #{tag.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {/* 小箭头 */}
                                                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* 右键菜单 */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50"
                    style={{ 
                        left: `${contextMenu.x}px`, 
                        top: `${contextMenu.y}px` 
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleDeleteSession}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        删除此记录
                    </button>
                </div>
            )}
            
            {/* 编辑模态框 */}
            {editingSession && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseEditModal}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-700">编辑专注记录</h3>
                            <button
                                onClick={handleCloseEditModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* 显示任务/场景信息 */}
                        <div className="mb-4 p-3 bg-slate-50 rounded-md">
                            <div className="flex items-center gap-2">
                                {editingSession.block.isScene && (
                                    <span className="text-2xl">{(editingSession.block.item as Scene).emoji}</span>
                                )}
                                <div className="font-medium text-slate-700">
                                    {'title' in editingSession.block.item ? editingSession.block.item.title : editingSession.block.item.name}
                                </div>
                                {editingSession.block.isScene && (
                                    <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">场景</span>
                                )}
                            </div>
                            {editingSession.block.itemTags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {editingSession.block.itemTags.map(tag => (
                                        <span key={tag.id} className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                            #{tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <form onSubmit={handleSubmitEdit} className="space-y-3">
                            {/* 开始时间 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">开始时间</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={editStartTime}
                                        onChange={(e) => setEditStartTime(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEditToNow('start')}
                                        className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                                    >
                                        现在
                                    </button>
                                </div>
                                <div className="flex gap-1 mt-1.5">
                                    {[-30, -10, -1, 1, 10, 30].map(minutes => (
                                        <button
                                            key={minutes}
                                            type="button"
                                            onClick={() => adjustEditTime('start', minutes)}
                                            className="flex-1 px-1 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200"
                                        >
                                            {minutes > 0 ? '+' : ''}{minutes}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* 结束时间 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">结束时间</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={editEndTime}
                                        onChange={(e) => setEditEndTime(e.target.value)}
                                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEditToNow('end')}
                                        className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                                    >
                                        现在
                                    </button>
                                </div>
                                <div className="flex gap-1 mt-1.5">
                                    {[-30, -10, -1, 1, 10, 30].map(minutes => (
                                        <button
                                            key={minutes}
                                            type="button"
                                            onClick={() => adjustEditTime('end', minutes)}
                                            className="flex-1 px-1 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200"
                                        >
                                            {minutes > 0 ? '+' : ''}{minutes}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* 备注 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
                                <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder="输入或修改本次专注的备注（可留空）"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    rows={3}
                                />
                            </div>
                            
                            {/* 显示计算的时长 */}
                            {calculateEditDuration() && (
                                <div className="text-sm text-indigo-600 font-semibold text-center py-2">
                                    时长: {calculateEditDuration()}
                                </div>
                            )}
                            
                            {/* 提交按钮 */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseEditModal}
                                    className="flex-1 px-4 py-2 text-sm bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-slate-400"
                                    disabled={!editStartTime || !editEndTime}
                                >
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DailyTimelineView;

