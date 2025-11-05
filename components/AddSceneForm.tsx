import React, { useState } from 'react';
import { Tag } from '../types';
import { PlusIcon, XIcon } from './icons';
import { useIsMobile } from '../utils/deviceDetect';

interface AddSceneFormProps {
  onAddScene: (emoji: string, name: string, tagNames: string[]) => void;
  allTags: Tag[];
  onCreateTag?: (name: string) => void;
}

// 预设的场景emoji选项
const PRESET_EMOJIS = [
  '📚', // 阅读
  '💻', // 代码
  '🔬', // 研究
  '💼', // 工作
  '📖', // 读书
  '✍️', // 写作
  '🎯', // 目标
  '🧠', // 思考
  '🎨', // 创作
  '🏃', // 运动
];

// 预设的标签emoji选项
const TAG_PRESET_EMOJIS = [
  '📚', '💻', '🔬', '💼', '📝', '🎯', '🧠', '📖', '✍️', '🎨', '🏃', '🎵',
];

const AddSceneForm: React.FC<AddSceneFormProps> = ({ onAddScene, allTags, onCreateTag }) => {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(PRESET_EMOJIS[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  const [selectedTagEmoji, setSelectedTagEmoji] = useState('');
  const [showTagEmojiPicker, setShowTagEmojiPicker] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && selectedEmoji) {
      onAddScene(selectedEmoji, name.trim(), selectedTags);
      setName('');
      setSelectedEmoji(PRESET_EMOJIS[0]);
      setSelectedTags([]);
      setCustomEmoji('');
      setShowEmojiPicker(false);
    }
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

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setShowEmojiPicker(false);
  };

  const handleCustomEmojiConfirm = () => {
    if (customEmoji.trim()) {
      setSelectedEmoji(customEmoji.trim());
      setCustomEmoji('');
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow-md h-full border border-purple-100 ${isMobile ? 'p-3' : 'p-4'}`}>
        <h3 className={`font-semibold text-purple-700 ${isMobile ? 'text-sm mb-2' : 'text-base mb-3'}`}>添加场景</h3>
        <form onSubmit={handleSubmit}>
            <div className={`space-y-${isMobile ? '2' : '2.5'}`}>
                {/* Emoji 选择区域 */}
                <div className={`space-y-${isMobile ? '1.5' : '2'}`}>
                  <label className={`text-${isMobile ? 'xs' : 'xs'} font-medium text-slate-600`}>封面 Emoji</label>
                  <div className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
                    <div className={`flex items-center justify-center bg-white rounded-lg border-2 border-purple-200 ${isMobile ? 'text-2xl w-12 h-12' : 'text-3xl w-14 h-14'}`}>
                      {selectedEmoji}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors font-medium`}
                    >
                      {showEmojiPicker ? (isMobile ? '收起' : '收起') : (isMobile ? '选择' : '选择')}
                    </button>
                  </div>
                  
                  {/* Emoji 选择器 */}
                  {showEmojiPicker && (
                    <div className={`bg-white rounded-lg border border-purple-200 space-y-${isMobile ? '1.5' : '2'} ${isMobile ? 'p-2' : 'p-3'}`}>
                      <div className={`grid ${isMobile ? 'grid-cols-6 gap-1' : 'grid-cols-5 gap-2'}`}>
                        {PRESET_EMOJIS.map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className={`flex items-center justify-center rounded-lg hover:bg-purple-100 transition-colors ${
                              selectedEmoji === emoji ? 'bg-purple-200 ring-2 ring-purple-400' : ''
                            } ${isMobile ? 'text-xl w-8 h-8' : 'text-2xl w-10 h-10'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className={`flex items-center ${isMobile ? 'gap-1.5 pt-1.5' : 'gap-2 pt-2'} border-t border-purple-100`}>
                        <input
                          type="text"
                          value={customEmoji}
                          onChange={(e) => setCustomEmoji(e.target.value)}
                          placeholder="或输入自定义emoji..."
                          className={`flex-grow ${isMobile ? 'px-1.5 py-1 text-xs' : 'px-2 py-1 text-sm'} border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-400`}
                          maxLength={2}
                        />
                        <button
                          type="button"
                          onClick={handleCustomEmojiConfirm}
                          className={`${isMobile ? 'px-1.5 py-1 text-xs' : 'px-2 py-1 text-sm'} bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors`}
                          disabled={!customEmoji.trim()}
                        >
                          确认
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 场景名称 */}
                <div>
                  <label className={`text-${isMobile ? 'xs' : 'xs'} font-medium text-slate-600`}>场景名称</label>
                  <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="例如：深度学习..."
                      className={`w-full ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 mt-1`}
                  />
                </div>
                
                {/* 标签选择区域 */}
                {allTags.length > 0 && (
                  <div className={`space-y-${isMobile ? '1.5' : '2'}`}>
                    <label className={`text-${isMobile ? 'xs' : 'xs'} font-medium text-slate-600`}>标签（可选）</label>
                    
                    <div className={`flex flex-wrap gap-1 mt-1 min-h-[${isMobile ? '24px' : '28px'}]`}>
                      {selectedTags.length ? (
                        selectedTags.map(tagName => (
                          <span
                            key={tagName}
                            className={`flex items-center gap-1 font-semibold bg-purple-100 text-purple-800 border border-purple-200 rounded-full ${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
                          >
                            {tagName}
                            <button
                              type="button"
                              onClick={() => toggleTagSelection(tagName)}
                              className="text-purple-700 hover:text-purple-900 transition-colors"
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
                          className={`flex items-center justify-center bg-white hover:bg-purple-50 rounded border border-purple-300 transition-colors ${isMobile ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'}`}
                          title="选择emoji"
                        >
                          {selectedTagEmoji || '😀'}
                        </button>
                        
                        {showTagEmojiPicker && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowTagEmojiPicker(false)} />
                            <div className={`absolute left-0 z-20 bg-white rounded-lg shadow-lg border border-purple-200 ${isMobile ? 'p-1.5 w-40 top-8' : 'p-2 w-48 top-10'}`}>
                              <div className="grid grid-cols-6 gap-1">
                                {TAG_PRESET_EMOJIS.map((emoji, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectTagEmoji(emoji)}
                                    className={`flex items-center justify-center rounded hover:bg-purple-100 transition-colors ${selectedTagEmoji === emoji ? 'bg-purple-200 ring-1 ring-purple-400' : ''} ${isMobile ? 'text-base w-6 h-6' : 'text-lg w-7 h-7'}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              {selectedTagEmoji && (
                                <button type="button" onClick={() => setSelectedTagEmoji('')} className={`w-full pt-2 border-t text-purple-500 hover:text-purple-700 ${isMobile ? 'mt-1.5 text-[10px]' : 'mt-2 text-xs'}`}>
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
                          className={`w-full ${isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 pr-8`}
                        />
                        {tagQuery && (
                          <button
                            type="button"
                            onClick={() => setTagQuery('')}
                            className="absolute inset-y-0 right-2 flex items-center text-purple-400 hover:text-purple-600"
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
                            className={`rounded-full font-medium border border-purple-100 bg-white text-purple-600 hover:bg-purple-100 hover:text-purple-800 transition-colors ${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}
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
                    className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'} bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors disabled:bg-slate-400`}
                    disabled={!name.trim() || !selectedEmoji}
                >
                    <PlusIcon className={`w-4 h-4 ${isMobile ? 'w-3 h-3' : ''}`} />
                    <span>{isMobile ? '添加' : '添加场景'}</span>
                </button>
            </div>
        </form>
    </div>
  );
};

export default AddSceneForm;

