import React, { useState, useEffect, useRef } from 'react';
import { Task, Scene, FocusSession } from '../types';
import { useIsMobile } from '../utils/deviceDetect';

interface ImmersiveFocusModalProps {
  task?: Task;
  scene?: Scene;
  activeSession: FocusSession;
  elapsedTime: number;
  onStopTimer: (sessionId: string) => void;
  onResumeTimer: () => void;
  onClose: () => void;
  onUpdateNote: (note: string) => void;
  focusSessions: FocusSession[]; // 添加focusSessions属性用于计算统计数据
  onPauseTimer?: () => void; // 添加暂停计时器功能
  isMinimized?: boolean;
  onSetMinimized?: (minimized: boolean) => void;
}

const ImmersiveFocusModal: React.FC<ImmersiveFocusModalProps> = ({
  task,
  scene,
  activeSession,
  elapsedTime,
  onStopTimer,
  onResumeTimer,
  onClose,
  onUpdateNote,
  focusSessions,
  onPauseTimer,
  isMinimized: externalIsMinimized,
  onSetMinimized
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseButtons, setShowPauseButtons] = useState(false);
  const [note, setNote] = useState('');
  const [isMinimized, setIsMinimized] = useState(false); // 添加最小化状态
  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // 计算已完成的刻度数（总共120条刻度，每条代表1秒）
  const totalTicks = 120;

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化开始时间
  const formatStartTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // 处理暂停按钮点击
  const handlePause = () => {
    if (onPauseTimer) {
      onPauseTimer();
    }
    setIsPaused(true);
    setShowPauseButtons(true);
  };

  // 处理继续专注
  const handleContinue = () => {
    setIsPaused(false);
    setShowPauseButtons(false);
    onResumeTimer();
  };

  // 处理结束专注
  const handleEnd = () => {
    onStopTimer(activeSession.id);
    onClose();
  };

  // 处理最小化
  const handleMinimize = () => {
    if (onSetMinimized) {
      onSetMinimized(true);
    } else {
      setIsMinimized(true);
    }
  };

  // 处理最大化（恢复面板）
  const handleMaximize = () => {
    if (onSetMinimized) {
      onSetMinimized(false);
    } else {
      setIsMinimized(false);
    }
  };

  // 处理备注更新
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    onUpdateNote(newNote);
  };

  // 点击外部区域最小化
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleMinimize();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 移除页面失去焦点时自动最小化面板的功能
  // useEffect(() => {
  //   const handleBlur = () => {
  //     handleMinimize();
  //   };

  //   window.addEventListener('blur', handleBlur);
  //   return () => {
  //     window.removeEventListener('blur', handleBlur);
  //   };
  // }, []);

  // 计算今天的专注时间
  const getTodayFocusTime = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todaySessions = focusSessions.filter(session => {
      // 包括今天已完成的会话和当前活动会话
      return (
        (session.endTime && session.startTime >= todayTimestamp) ||
        (!session.endTime && activeSession && session.id === activeSession.id)
      );
    });
    
    const totalSeconds = todaySessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + Math.floor((session.endTime - session.startTime) / 1000);
      } else if (activeSession && session.id === activeSession.id) {
        return sum + elapsedTime;
      }
      return sum;
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // 计算本周的专注时间
  const getWeekFocusTime = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // 本周开始日期
    weekStart.setHours(0, 0, 0, 0);
    const weekStartTimestamp = weekStart.getTime();
    
    const weekSessions = focusSessions.filter(session => {
      // 包括本周已完成的会话和当前活动会话
      return (
        (session.endTime && session.startTime >= weekStartTimestamp) ||
        (!session.endTime && activeSession && session.id === activeSession.id)
      );
    });
    
    const totalSeconds = weekSessions.reduce((sum, session) => {
      if (session.endTime) {
        return sum + Math.floor((session.endTime - session.startTime) / 1000);
      } else if (activeSession && session.id === activeSession.id) {
        return sum + elapsedTime;
      }
      return sum;
    }, 0);
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // 计算刻度线的颜色强度
  const getTickColor = (index: number) => {
    // 保持明亮的刻度条长度为总长度的1/3 (40条刻度)
    const brightLength = Math.floor(totalTicks);
    
    // 如果还没有开始计时，所有刻度都是灰色
    if (elapsedTime === 0) {
      return "#d1d5db";
    }
    
    // 计算这个刻度最后一次被完成是在第几秒
    // index = 0 在第 1, 121, 241, ... 秒完成
    // index = 1 在第 2, 122, 242, ... 秒完成
    // index = n 在第 n+1, n+121, n+241, ... 秒完成
    let lastCompletedAt = index + 1;
    while (lastCompletedAt + totalTicks <= elapsedTime) {
      lastCompletedAt += totalTicks;
    }
    
    // 如果这个刻度还没有完成，返回灰色
    if (lastCompletedAt > elapsedTime) {
      return "#d1d5db";
    }
    
    // 计算这个刻度距离当前时间的距离
    const distance = elapsedTime - lastCompletedAt;
    
    // 如果距离大于等于 brightLength，说明太久远了，返回灰色
    if (distance >= brightLength) {
      return "#d1d5db";
    }
    
    // 在明亮区域内，根据距离计算颜色强度
    // distance = 0 时在当前位置（最亮）
    // distance = 39 时在起点位置（最暗但仍可见）
    const alpha = Math.max(0.2, 1 - distance / brightLength);
    return `rgba(0, 200, 200, ${alpha})`;
  };

  // 渲染刻度线进度条
  const renderTickProgress = () => {
    const ticks = [];
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    for (let i = 0; i < totalTicks; i++) {
      const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2; // 从顶部开始
      const x1 = centerX + Math.cos(angle) * (radius - 5);
      const y1 = centerY + Math.sin(angle) * (radius - 5);
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;
      
      const color = getTickColor(i);
      
      ticks.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      );
    }
    
    return ticks;
  };

  const actualIsMinimized = externalIsMinimized !== undefined ? externalIsMinimized : isMinimized;

  return (
    <>
      {actualIsMinimized ? (
        <button
          onClick={handleMaximize}
          className={`fixed top-4 left-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-lg transition-all z-50 group ${isMobile ? 'p-2.5' : 'p-3'}`}
          title="恢复专注面板"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`fill-current ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div className={`absolute inset-0 rounded-full border-2 border-cyan-300 opacity-60 group-hover:opacity-100 transition-opacity duration-300 animate-border-glow ${isMobile ? 'border-[1.5px]' : ''}`}></div>
        </button>
      ) : (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            ref={modalRef}
            className={`bg-white rounded-2xl shadow-2xl w-full ${isMobile ? 'max-w-[90vw] max-h-[90vh]' : 'max-w-2xl'} overflow-y-auto`}
          >
            {/* 头部：标题和最小化按钮 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className={`font-bold text-gray-800 truncate ${isMobile ? 'text-lg' : 'text-xl'}`}>
                {task ? task.title : scene ? scene.name : '专注计时'}
              </h2>
              <button
                onClick={handleMinimize}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="最小化"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`fill-current ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
            </div>

            {/* 主体内容 - 垂直布局 */}
            <div className="flex flex-col p-4 md:p-6 gap-4 md:gap-6">
              {/* 上部：刻度线进度条 */}
              <div className="flex flex-col items-center">
                <div className="relative flex items-center justify-center mb-4">
                  <div className={`relative ${isMobile ? 'w-40 h-40' : 'w-52 h-52'}`}>
                    <svg width="100%" height="100%" viewBox="0 0 200 200" className="absolute inset-0">
                      {/* 刻度线进度条 */}
                      {renderTickProgress()}
                    </svg>
                    {/* 番茄emoji在中心 - 绝对定位 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`${isMobile ? "text-4xl" : "text-5xl"} select-none`} style={{
                        transform: 'translateY(-4px)',
                        lineHeight: 1
                      }}>🍅</span>
                    </div>
                  </div>
                </div>

                {/* 正计时显示 */}
                <div className="text-center mb-4">
                  <div className={`font-bold text-gray-800 mb-2 font-mono ${isMobile ? 'text-4xl' : 'text-5xl'}`}>
                    {formatTime(elapsedTime)}
                  </div>
                  <div className={isMobile ? 'text-base text-gray-600' : 'text-lg text-gray-600'}>
                    开始时间：{formatStartTime(activeSession.startTime)}
                  </div>
                </div>

                {/* 暂停/继续按钮 */}
                <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'} mb-4 justify-center`}>
                  {!showPauseButtons ? (
                    <>
                      <button
                        onClick={handlePause}
                        className={`flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-2 text-base min-w-[90px]' : 'px-6 py-3 text-lg'} bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="5" width="4" height="14" rx="1" />
                          <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                        {isMobile ? '暂停' : '暂停'}
                      </button>
                      <button
                        onClick={handleEnd}
                        className={`flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-2 text-base min-w-[90px]' : 'px-6 py-3 text-lg'} bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} viewBox="0 0 24 24" fill="currentColor">
                          <rect x="7" y="7" width="10" height="10" rx="1" />
                        </svg>
                        {isMobile ? '结束' : '结束'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleContinue}
                        className={`flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-2 text-base min-w-[120px]' : 'px-6 py-3 text-lg'} bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
                      >
                        继续专注
                      </button>
                      <button
                        onClick={handleEnd}
                        className={`flex items-center justify-center gap-2 ${isMobile ? 'px-4 py-2 text-base min-w-[120px]' : 'px-6 py-3 text-lg'} bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
                      >
                        结束专注
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 下部：备注和激励信息 */}
              <div className="flex flex-col gap-4 md:gap-6">
                {/* 备注输入框 */}
                <div className="flex-grow">
                  <label className={`block font-medium text-gray-700 mb-2 ${isMobile ? 'text-sm' : 'text-base'}`}>
                    专注内容备注
                  </label>
                  <textarea
                    value={note}
                    onChange={handleNoteChange}
                    placeholder="记录一下这次专注的内容..."
                    className={`w-full border-2 border-gray-200 rounded-xl focus:border-cyan-400 focus:outline-none resize-none ${isMobile ? 'px-3 py-2 text-sm h-32' : 'px-4 py-3 text-base h-40'}`}
                  />
                </div>

                {/* 激励信息 */}
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-100">
                  <h3 className={`font-semibold text-gray-800 mb-2 ${isMobile ? 'text-base' : ''}`}>专注时间统计</h3>
                  <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <div>
                      <span className="text-gray-600">今日专注：</span>
                      <span className="font-semibold text-cyan-600">{getTodayFocusTime()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">本周专注：</span>
                      <span className="font-semibold text-teal-600">{getWeekFocusTime()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>

  );
};

export default ImmersiveFocusModal;