import React, { useState } from 'react';
import { Tag } from '../types';
import { PlusIcon, CalendarIcon, XIcon } from './icons';
import { useIsMobile } from '../utils/deviceDetect';

interface AddTaskFormProps {
  onAddTask: (title: string, tagNames: string[], dueDate?: number, groupId?: string) => void;
  allTags: Tag[];
  defaultGroupId?: string;
  onCreateTag?: (name: string) => void;
}

// 预设的标签emoji选项
const TAG_PRESET_EMOJIS = [
  '📚', '💻', '🔬', '💼', '📝', '🎯', '🧠', '📖', '✍️', '🎨', '🏃', '🎵',
];

const AddTaskForm: React.FC<AddTaskFormProps> = ({ onAddTask, allTags, defaultGroupId = 'default', onCreateTag }) => {
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [groupId, setGroupId] = useState<string>(defaultGroupId);
  const [tagQuery, setTagQuery] = useState('');
  const [selectedTagEmoji, setSelectedTagEmoji] = useState('');
  const [showTagEmojiPicker, setShowTagEmojiPicker] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const dueDateTimestamp = dueDate ? new Date(dueDate).getTime() : undefined;
      onAddTask(title.trim(), selectedTags, dueDateTimestamp, groupId);
      setTitle('');
      setSelectedTags([]);
      setDueDate('');
      setShowDatePicker(false);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleShowDatePicker = () => {
    if (!dueDate) {
      setDueDate(getTodayDateString());
    }
    setShowDatePicker(true);
  };

  const handleClearDate = () => {
    setDueDate('');
    setShowDatePicker(false);
  };

  // 切换标签选择
  const toggleTagSelection = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const availableTagOptions = allTags.filter(tag => !selectedTags.includes(tag.name));
  const normalizedTagQuery = tagQuery.trim().toLowerCase();
  const filteredTagOptions = normalizedTagQuery
    ? availableTagOptions.filter(tag => tag.name.toLowerCase().includes(normalizedTagQuery))
    : availableTagOptions;

  const handleTagSuggestionClick = (tagName: string) => {
    toggleTagSelection(tagName);
    setTagQuery('');
  };

  // 检查字符串是否以emoji开头
  const startsWithEmoji = (str: string) => {
    // 使用正则匹配emoji（基本emoji范围）
    const emojiRegex = /^[\p{Emoji}\p{Emoji_Component}]/u;
    return emojiRegex.test(str);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTagOptions.length > 0) {
        // 如果有匹配项，选中第一个
        handleTagSuggestionClick(filteredTagOptions[0].name);
      } else if (tagQuery.trim() && onCreateTag) {
        // 如果没有匹配项但有输入内容，尝试创建新标签
        const trimmedQuery = tagQuery.trim();
        const newTagName = selectedTagEmoji ? `${selectedTagEmoji} ${trimmedQuery}` : trimmedQuery;
        
        if (startsWithEmoji(newTagName)) {
          // 检查标签名是否以emoji开头
          onCreateTag(newTagName);
          toggleTagSelection(newTagName);
          setTagQuery('');
          setSelectedTagEmoji('');
          setShowTagEmojiPicker(false);
        } else {
          alert('标签名必须以 emoji 开头。请先选择emoji或直接输入emoji开头的标签名');
        }
      }
    }
    if (e.key === 'Escape') {
      setTagQuery('');
    }
  };

  const handleSelectTagEmoji = (emoji: string) => {
    setSelectedTagEmoji(emoji);
    setShowTagEmojiPicker(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md h-full ${isMobile ? 'p-3' : 'p-4'}`}>
        <h3 className={`font-semibold text-slate-700 ${isMobile ? 'text-sm mb-2' : 'text-base mb-3'}`}>添加任务</h3>
        <form onSubmit={handleSubmit}>
            <div className={`space-y-${isMobile ? '2' : '2.5'}`}>
                <div className={`flex ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="任务名称..."
                        className={`flex-grow ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary`}
                    />
                    
                    {/* 添加日期按钮移到这里 */}
                    {!showDatePicker && (
                      <button
                        type="button"
                        onClick={handleShowDatePicker}
                        className={`flex items-center justify-center ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors flex-shrink-0`}
                      >
                        <CalendarIcon className={`w-4 h-4 ${isMobile ? 'w-3 h-3' : ''}`} />
                      </button>
                    )}
                </div>
                
                {/* 日期选择区域 */}
                {showDatePicker ? (
                  <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                    <CalendarIcon className={`text-slate-500 flex-shrink-0 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={`flex-grow ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleClearDate}
                      className={`p-1 text-slate-400 hover:text-slate-600 transition-colors ${isMobile ? 'p-0.5' : ''}`}
                      title="清除日期"
                    >
                      <XIcon className={`w-4 h-4 ${isMobile ? 'w-3 h-3' : ''}`} />
                    </button>
                  </div>
                ) : null}
                
                {/* 标签选择区域 */}
                {allTags.length > 0 && (
                  <div className={`space-y-${isMobile ? '1.5' : '2'}`}>
                    <div className={`flex flex-wrap gap-1 min-h-[${isMobile ? '24px' : '28px'}]`}>
                      {selectedTags.length ? (
                        selectedTags.map(tagName => (
                          <span
                            key={tagName}
                            className={`flex items-center gap-1 ${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-full`}
                          >
                            {tagName}
                            <button
                              type="button"
                              onClick={() => toggleTagSelection(tagName)}
                              className="text-blue-700 hover:text-blue-900 transition-colors"
                              title="移除标签"
                            >
                              <XIcon className={`w-3 h-3 ${isMobile ? 'w-2.5 h-2.5' : ''}`} />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className={`text-${isMobile ? 'xs' : 'xs'} text-slate-400`}>暂未选择标签</span>
                      )}
                    </div>

                    <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                      <div className="relative flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowTagEmojiPicker(!showTagEmojiPicker)}
                          className={`flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors ${isMobile ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'}`}
                          title="选择emoji"
                        >
                          {selectedTagEmoji || '😀'}
                        </button>
                        
                        {showTagEmojiPicker && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowTagEmojiPicker(false)} />
                            <div className={`absolute left-0 z-20 bg-white rounded-lg shadow-lg border border-slate-200 ${isMobile ? 'p-1.5 w-40 top-8' : 'p-2 w-48 top-10'}`}>
                              <div className="grid grid-cols-6 gap-1">
                                {TAG_PRESET_EMOJIS.map((emoji, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectTagEmoji(emoji)}
                                    className={`flex items-center justify-center rounded hover:bg-blue-100 transition-colors ${selectedTagEmoji === emoji ? 'bg-blue-200 ring-1 ring-blue-400' : ''} ${isMobile ? 'text-base w-6 h-6' : 'text-lg w-7 h-7'}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              {selectedTagEmoji && (
                                <button type="button" onClick={() => setSelectedTagEmoji('')} className={`w-full pt-2 border-t text-slate-500 hover:text-slate-700 ${isMobile ? 'mt-1.5 text-[10px]' : 'mt-2 text-xs'}`}>
                                  清除选择
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={tagQuery}
                          onChange={(e) => setTagQuery(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          placeholder={selectedTagEmoji ? "输入标签名称，回车创建" : "筛选标签或输入新标签名"}
                          className={`w-full ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary pr-8`}
                        />
                        {tagQuery && (
                          <button
                            type="button"
                            onClick={() => setTagQuery('')}
                            className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                            title="清空搜索"
                          >
                            <XIcon className={`w-4 h-4 ${isMobile ? 'w-3 h-3' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={`flex flex-wrap gap-1.5 max-h-${isMobile ? '20' : '24'} overflow-y-auto pr-1`}>
                      {filteredTagOptions.length ? (
                        filteredTagOptions.map(tag => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleTagSuggestionClick(tag.name)}
                            className={`rounded-full font-medium border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors ${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
                          >
                            {tag.name}
                          </button>
                        ))
                      ) : (
                        <span className={`text-${isMobile ? 'xs' : 'xs'} text-slate-400`}>
                          {availableTagOptions.length === 0
                            ? '所有标签均已选择'
                            : tagQuery.trim()
                              ? '无匹配标签，按回车创建新标签（需以emoji开头）'
                              : '无匹配标签'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                    type="submit"
                    className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'} bg-brand-primary text-white font-semibold rounded-md hover:bg-brand-secondary transition-colors disabled:bg-slate-400`}
                    disabled={!title.trim()}
                >
                    <PlusIcon className={`w-4 h-4 ${isMobile ? 'w-3 h-3' : ''}`} />
                    <span>{isMobile ? '添加' : '添加任务'}</span>
                </button>
            </div>
        </form>
    </div>
  );
};

export default AddTaskForm;
