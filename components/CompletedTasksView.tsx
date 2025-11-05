import React, { useState, useMemo } from 'react';
import { Task, Tag } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CompletedTasksViewProps {
  tasks: Task[];
  tags: Tag[];
}

const CompletedTasksView: React.FC<CompletedTasksViewProps> = ({ tasks, tags }) => {
  const [weekOffset, setWeekOffset] = useState(0); // 0表示当前周，-1表示上一周，1表示下一周

  // 获取指定周的开始和结束时间
  const getWeekRange = (offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (周日) 到 6 (周六)
    const monday = new Date(now);
    // 调整到本周一（周一为一周的开始）
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    
    // 根据offset调整到指定周
    monday.setDate(monday.getDate() + offset * 7);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { start: monday.getTime(), end: sunday.getTime() };
  };

  const { start: weekStart, end: weekEnd } = getWeekRange(weekOffset);

  // 过滤出本周已完成的任务
  const completedTasksInWeek = useMemo(() => {
    return tasks.filter(task => 
      task.completed && 
      task.completedAt && 
      task.completedAt >= weekStart && 
      task.completedAt <= weekEnd
    );
  }, [tasks, weekStart, weekEnd]);

  // 按日期分组
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    completedTasksInWeek.forEach(task => {
      if (task.completedAt) {
        const date = new Date(task.completedAt);
        const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    
    return grouped;
  }, [completedTasksInWeek]);

  // 生成本周7天的日期数组
  const weekDays = useMemo(() => {
    const days: { date: Date; dateKey: string; dayName: string }[] = [];
    const monday = new Date(weekStart);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayName = dayNames[date.getDay()];
      
      days.push({ date, dateKey, dayName });
    }
    
    return days;
  }, [weekStart]);

  const formatDateRange = () => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
  };

  const getTaskTags = (task: Task) => {
    return tags.filter(tag => task.tagIds.includes(tag.id));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-700">已完成任务</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            title="上一周"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-600 min-w-[140px] text-center">
            {formatDateRange()}
          </span>
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
            title="下一周"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 周视图日期导航 */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map(({ date, dateKey, dayName }) => {
          const hasTasks = tasksByDate[dateKey] && tasksByDate[dateKey].length > 0;
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
            <div
              key={dateKey}
              className={`text-center p-2 rounded-lg transition-colors ${
                hasTasks
                  ? 'bg-green-100 border-2 border-green-400 cursor-pointer hover:bg-green-200'
                  : 'bg-slate-50 border-2 border-slate-200'
              } ${isToday ? 'ring-2 ring-blue-400' : ''}`}
            >
              <div className="text-xs text-slate-600 font-medium">{dayName}</div>
              <div className={`text-sm font-bold ${hasTasks ? 'text-green-700' : 'text-slate-400'}`}>
                {date.getDate()}
              </div>
              {hasTasks && (
                <div className="text-xs text-green-600 mt-1">
                  {tasksByDate[dateKey].length}个
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 按日期显示已完成的任务 */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {weekDays.map(({ date, dateKey, dayName }) => {
          const dayTasks = tasksByDate[dateKey];
          
          if (!dayTasks || dayTasks.length === 0) return null;
          
          return (
            <div key={dateKey} className="border-l-4 border-green-500 pl-3">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                {dayName} {date.getMonth() + 1}月{date.getDate()}日
                <span className="ml-2 text-xs text-slate-500">({dayTasks.length}个任务)</span>
              </h3>
              <div className="space-y-2">
                {dayTasks.map(task => {
                  const taskTags = getTaskTags(task);
                  const completedTime = task.completedAt ? new Date(task.completedAt) : null;
                  
                  return (
                    <div
                      key={task.id}
                      className="bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-grow min-w-0">
                          <div className="font-medium text-slate-800 line-through">
                            {task.title}
                          </div>
                          {taskTags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {taskTags.map(tag => (
                                <span
                                  key={tag.id}
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tag.color}`}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {completedTime && (
                          <div className="text-xs text-slate-500 flex-shrink-0">
                            {completedTime.getHours().toString().padStart(2, '0')}:
                            {completedTime.getMinutes().toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {completedTasksInWeek.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            本周暂无已完成的任务
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedTasksView;