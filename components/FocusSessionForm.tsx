import React, { useState, useEffect, useMemo } from 'react';
import { Task, Tag, FocusSession, Scene } from '../types';
import { ClockIcon } from './icons';

interface FocusSessionFormProps {
  tasks: Task[];
  scenes: Scene[];
  tags: Tag[];
  focusSessions: FocusSession[];
  onAddFocusSession: (taskTitle: string, tagNames: string[], startTime: number, endTime: number, note?: string) => void;
}

const FocusSessionForm: React.FC<FocusSessionFormProps> = ({ tasks, scenes, tags, focusSessions, onAddFocusSession }) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');

  // 获取匹配的任务或场景对象
  const matchedTask = useMemo(() => {
    return tasks.find(task => task.title === taskTitle);
  }, [taskTitle, tasks]);

  const matchedScene = useMemo(() => {
    return scenes.find(scene => scene.name === taskTitle);
  }, [taskTitle, scenes]);

  // 当任务标题改变时，自动关联标签
  useEffect(() => {
    if (matchedTask) {
      // 获取任务关联的标签名称
      const taskTagNames = tags
        .filter(tag => matchedTask.tagIds.includes(tag.id))
        .map(tag => tag.name);
      setSelectedTags(taskTagNames);
    } else if (matchedScene) {
      // 获取场景关联的标签名称
      const sceneTagNames = tags
        .filter(tag => matchedScene.tagIds.includes(tag.id))
        .map(tag => tag.name);
      setSelectedTags(sceneTagNames);
    } else {
      // 如果没有匹配的任务或场景，清空选择的标签
      setSelectedTags([]);
    }
  }, [matchedTask, matchedScene, tags]);

  // 获取上次任务结束时间和当前时间作为默认值
  useEffect(() => {
    // 获取今日最后一个已完成的会话
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todaySessions = focusSessions
      .filter(session => session.endTime && session.startTime >= todayTimestamp)
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
    
    if (todaySessions.length > 0 && todaySessions[0].endTime) {
      const lastEndTime = new Date(todaySessions[0].endTime);
      setStartTime(formatTimeForInput(lastEndTime));
    } else {
      // 如果没有历史记录，默认为当前时间前1小时
      const oneHourAgo = new Date(Date.now() - 3600000);
      setStartTime(formatTimeForInput(oneHourAgo));
    }
    
    // 结束时间默认为当前时间
    setEndTime(formatTimeForInput(new Date()));
  }, [focusSessions]);

  // 格式化时间为 HH:MM 格式
  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 获取今天的日期字符串（YYYY-MM-DD）
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 将日期和时间转换为时间戳
  const dateTimeToTimestamp = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return null;
    const dateTime = new Date(`${dateStr}T${timeStr}`);
    return dateTime.getTime();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskTitle.trim()) {
      alert('请输入任务名称');
      return;
    }

    if (!startTime || !endTime) {
      alert('请选择起始时间和结束时间');
      return;
    }

    const today = getTodayString();
    const startTimestamp = dateTimeToTimestamp(today, startTime);
    const endTimestamp = dateTimeToTimestamp(today, endTime);

    if (!startTimestamp || !endTimestamp) {
      alert('时间格式不正确');
      return;
    }

    if (endTimestamp <= startTimestamp) {
      alert('结束时间必须晚于起始时间');
      return;
    }

    // 检查是否跨天
    const duration = (endTimestamp - startTimestamp) / 1000 / 3600; // 小时
    if (duration > 24) {
      alert('时间跨度不能超过24小时');
      return;
    }

    onAddFocusSession(taskTitle.trim(), selectedTags, startTimestamp, endTimestamp, note.trim() || undefined);
    
    // 重置表单，开始时间设为刚才的结束时间，结束时间设为当前时间
    setTaskTitle('');
    setSelectedTags([]);
    setStartTime(endTime);
    setEndTime(formatTimeForInput(new Date()));
    setNote('');
  };

  // 切换标签选择
  const toggleTagSelection = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // 计算时长
  const calculateDuration = () => {
    if (!startTime || !endTime) return '';
    
    const today = getTodayString();
    const startTimestamp = dateTimeToTimestamp(today, startTime);
    const endTimestamp = dateTimeToTimestamp(today, endTime);

    if (!startTimestamp || !endTimestamp || endTimestamp <= startTimestamp) {
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

  // 调整时间（分钟）
  const adjustTime = (field: 'start' | 'end', minutes: number) => {
    const currentTime = field === 'start' ? startTime : endTime;
    if (!currentTime) return;
    
    const [hours, mins] = currentTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins, 0, 0);
    date.setMinutes(date.getMinutes() + minutes);
    
    const newTime = formatTimeForInput(date);
    if (field === 'start') {
      setStartTime(newTime);
    } else {
      setEndTime(newTime);
    }
  };

  // 设置为当前时间
  const setToNow = (field: 'start' | 'end') => {
    const now = formatTimeForInput(new Date());
    if (field === 'start') {
      setStartTime(now);
    } else {
      setEndTime(now);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <div className="flex items-center gap-2 mb-3">
        <ClockIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-semibold text-slate-700">补记专注时间</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* 任务名称输入 */}
        <div>
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="任务名称..."
            list="task-suggestions"
            className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="task-suggestions">
            {/* 任务建议 */}
            {tasks.filter(task => !task.completed).map(task => (
              <option key={task.id} value={task.title} />
            ))}
            {/* 场景建议 */}
            {scenes.map(scene => (
              <option key={scene.id} value={scene.name} />
            ))}
          </datalist>
        </div>

        {/* 标签选择 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTagSelection(tag.name)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all border ${
                  selectedTags.includes(tag.name)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* 时间选择和快捷按钮 */}
        <div className="space-y-2">
          {/* 开始时间 */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">开始时间</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setToNow('start')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
              >
                现在
              </button>
            </div>
            <div className="flex gap-1 mt-1">
              {[-30, -10, -1, 1, 10, 30].map(minutes => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => adjustTime('start', minutes)}
                  className="flex-1 px-1 py-0.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200"
                >
                  {minutes > 0 ? '+' : ''}{minutes}
                </button>
              ))}
            </div>
          </div>

          {/* 结束时间 */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">结束时间</label>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setToNow('end')}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
              >
                现在
              </button>
            </div>
            <div className="flex gap-1 mt-1">
              {[-30, -10, -1, 1, 10, 30].map(minutes => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => adjustTime('end', minutes)}
                  className="flex-1 px-1 py-0.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded border border-slate-200"
                >
                  {minutes > 0 ? '+' : ''}{minutes}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 显示计算的时长 */}
        {calculateDuration() && (
          <div className="text-sm text-indigo-600 font-semibold text-center py-1">
            时长: {calculateDuration()}
          </div>
        )}

        {/* 备注输入框 */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            专注内容备注
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="记录一下这次专注的内容..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
          />
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          className="w-full px-4 py-1.5 text-sm bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors disabled:bg-slate-400"
          disabled={!taskTitle.trim() || !startTime || !endTime}
        >
          添加记录
        </button>
      </form>
    </div>
  );
};

export default FocusSessionForm;
