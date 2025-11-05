import React, { useState, useMemo } from 'react';
import { FocusSession } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

type ViewMode = 'week' | 'month';

interface FocusSessionTimeViewProps {
    sessions: FocusSession[];
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

const FocusSessionTimeView: React.FC<FocusSessionTimeViewProps> = ({
    sessions,
    selectedDate,
    onDateChange
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('week');
    const [currentDate, setCurrentDate] = useState(selectedDate);

    // 获取某一天的所有session
    const getSessionsForDate = (date: Date): FocusSession[] => {
        return sessions.filter(session => {
            const sessionDate = new Date(session.startTime);
            return (
                sessionDate.getFullYear() === date.getFullYear() &&
                sessionDate.getMonth() === date.getMonth() &&
                sessionDate.getDate() === date.getDate()
            );
        });
    };

    // 检查某一天是否有session
    const hasSessionOnDate = (date: Date): boolean => {
        return getSessionsForDate(date).length > 0;
    };

    // 获取周的开始日期（周一）
    const getWeekStart = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
        return new Date(d.setDate(diff));
    };

    // 获取周的所有日期
    const getWeekDates = (startDate: Date): Date[] => {
        const dates: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    // 获取月份的所有日期（包括前后填充的日期）
    const getMonthDates = (date: Date): Date[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // 获取当月第一天
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay();
        
        // 获取当月最后一天
        const lastDay = new Date(year, month + 1, 0);
        const lastDate = lastDay.getDate();
        
        const dates: Date[] = [];
        
        // 填充前面的日期（上个月）
        const prevMonthDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
        for (let i = prevMonthDays; i > 0; i--) {
            const d = new Date(year, month, 1 - i);
            dates.push(d);
        }
        
        // 当月日期
        for (let i = 1; i <= lastDate; i++) {
            dates.push(new Date(year, month, i));
        }
        
        // 填充后面的日期（下个月）
        const remainingDays = 42 - dates.length; // 6行 * 7列
        for (let i = 1; i <= remainingDays; i++) {
            dates.push(new Date(year, month + 1, i));
        }
        
        return dates;
    };

    // 格式化日期
    const formatDate = (date: Date, format: string): string => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        if (format === 'MM-dd') {
            return `${month}-${day}`;
        }
        return date.toLocaleDateString();
    };

    // 判断是否是今天
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    // 判断是否是选中的日期
    const isSelectedDate = (date: Date): boolean => {
        return (
            date.getFullYear() === selectedDate.getFullYear() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getDate() === selectedDate.getDate()
        );
    };

    // 周视图导航
    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        setCurrentDate(newDate);
    };

    // 月视图导航
    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
        setCurrentDate(newDate);
    };

    // 处理日期点击
    const handleDateClick = (date: Date) => {
        onDateChange(date);
    };

    // 获取当前视图的日期列表
    const currentDates = useMemo(() => {
        if (viewMode === 'week') {
            const weekStart = getWeekStart(currentDate);
            return getWeekDates(weekStart);
        } else {
            return getMonthDates(currentDate);
        }
    }, [viewMode, currentDate]);

    // 周名称
    const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    return (
        <div className="space-y-4">
            {/* 视图切换和导航 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'week'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        周视图
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            viewMode === 'month'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        月视图
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium text-slate-700 min-w-[120px] text-center">
                        {viewMode === 'week'
                            ? `${currentDate.getFullYear()}年 第${Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}周`
                            : `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`}
                    </span>
                    <button
                        onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                    >
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 周视图 */}
            {viewMode === 'week' && (
                <div className="grid grid-cols-7 gap-2">
                    {currentDates.map((date, index) => {
                        const hasSession = hasSessionOnDate(date);
                        const isTodayDate = isToday(date);
                        const isSelected = isSelectedDate(date);
                        
                        return (
                            <button
                                key={index}
                                onClick={() => handleDateClick(date)}
                                className={`p-3 rounded-lg transition-all ${
                                    isSelected
                                        ? 'bg-blue-500 text-white shadow-lg'
                                        : isTodayDate
                                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <div className="text-xs mb-1">{weekDayNames[index]}</div>
                                <div className="text-sm font-medium">{formatDate(date, 'MM-dd')}</div>
                                {hasSession && (
                                    <div className="mt-1 flex justify-center">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 月视图 */}
            {viewMode === 'month' && (
                <div>
                    {/* 星期标题 */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDayNames.map((name, index) => (
                            <div key={index} className="text-center text-xs font-medium text-slate-500 py-2">
                                {name}
                            </div>
                        ))}
                    </div>
                    
                    {/* 日期网格 */}
                    <div className="grid grid-cols-7 gap-1">
                        {currentDates.map((date, index) => {
                            const hasSession = hasSessionOnDate(date);
                            const isTodayDate = isToday(date);
                            const isSelected = isSelectedDate(date);
                            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                            
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleDateClick(date)}
                                    className={`aspect-square p-2 rounded-lg transition-all text-sm relative ${
                                        isSelected
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : isTodayDate
                                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                                            : isCurrentMonth
                                            ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                            : 'bg-transparent text-slate-400'
                                    }`}
                                >
                                    <div className="font-medium">{date.getDate()}</div>
                                    {hasSession && (
                                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FocusSessionTimeView;