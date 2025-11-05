import React, { useState } from 'react';
import { Tag, Task, FocusSession, Scene } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, TagIcon } from './icons';
import TagDetailModal from './TagDetailModal';

interface TagListItemProps {
    tag: Tag;
    tasks: Task[];
    scenes: Scene[];
    focusSessions: FocusSession[];
    onUpdate: (id: string, name: string) => void;
    onDelete: (id:string) => void;
    onDeleteFocusSession: (sessionId: string) => void;
}

const TagListItem: React.FC<TagListItemProps> = ({ tag, tasks, scenes, focusSessions, onUpdate, onDelete, onDeleteFocusSession }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(tag.name);
    const [showDetail, setShowDetail] = useState(false);

    const handleUpdate = () => {
        if(name.trim() && name.trim() !== tag.name) {
            onUpdate(tag.id, name.trim());
        }
        setIsEditing(false);
    }

    const handleCancel = () => {
        setName(tag.name);
        setIsEditing(false);
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUpdate();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }

    return (
        <>
            <li className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 group">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${tag.color.replace('text-', 'bg-').split(' ')[0]}`}></span>
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="text-sm px-1 border border-brand-primary rounded-sm focus:outline-none"
                                autoFocus
                            />
                            <button 
                                onClick={handleUpdate}
                                className="text-green-600 hover:text-green-700"
                                title="确认"
                            >
                                ✓
                            </button>
                            <button 
                                onClick={handleCancel}
                                className="text-red-600 hover:text-red-700"
                                title="取消"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowDetail(true)}
                            className="text-sm text-slate-700 hover:text-brand-primary hover:underline cursor-pointer transition-colors"
                        >
                            {tag.name}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setIsEditing(!isEditing)} className="text-slate-500 hover:text-brand-primary">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(tag.id)} className="text-slate-500 hover:text-red-500">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </li>
            {showDetail && (
                <TagDetailModal 
                    tag={tag}
                    tasks={tasks}
                    scenes={scenes}
                    focusSessions={focusSessions}
                    onClose={() => setShowDetail(false)}
                    onDeleteFocusSession={onDeleteFocusSession}
                />
            )}
        </>
    );
};


interface TagManagementPanelProps {
    tags: Tag[];
    tasks: Task[];
    scenes: Scene[];
    focusSessions: FocusSession[];
    onDeleteTag: (tagId: string) => void;
    onUpdateTag: (tagId: string, newName: string) => void;
    onCreateTag: (name: string) => void;
    onDeleteFocusSession: (sessionId: string) => void;
    onUpdateTagColor: (tagId: string, newColor: string) => void; // 添加更新颜色的函数
}

const TagManagementPanel: React.FC<TagManagementPanelProps> = ({ tags, tasks, scenes, focusSessions, onDeleteTag, onUpdateTag, onCreateTag, onDeleteFocusSession, onUpdateTagColor }) => {
    const [newTagName, setNewTagName] = useState('');
    const [showBatchEditModal, setShowBatchEditModal] = useState(false); // 批量编辑模态框状态
    const [batchEditTags, setBatchEditTags] = useState<{id: string, name: string, color: string}[]>([]); // 批量编辑的标签

    const handleCreateTag = (e: React.FormEvent) => {
        e.preventDefault();
        if(newTagName.trim()) {
            onCreateTag(newTagName.trim());
            setNewTagName('');
        }
    }

    // 处理批量编辑
    const handleBatchEdit = () => {
        // 初始化批量编辑数据
        setBatchEditTags(tags.map(tag => ({id: tag.id, name: tag.name, color: tag.color})));
        setShowBatchEditModal(true);
    };

    // 更新批量编辑中的标签名称
    const updateBatchEditTagName = (id: string, name: string) => {
        setBatchEditTags(prev => prev.map(tag => 
            tag.id === id ? {...tag, name} : tag
        ));
    };

    // 更新批量编辑中的标签颜色
    const updateBatchEditTagColor = (id: string, color: string) => {
        setBatchEditTags(prev => prev.map(tag => 
            tag.id === id ? {...tag, color} : tag
        ));
    };

    // 确认批量编辑
    const confirmBatchEdit = () => {
        batchEditTags.forEach(tag => {
            const originalTag = tags.find(t => t.id === tag.id);
            if (originalTag) {
                // 更新名称
                if (originalTag.name !== tag.name) {
                    onUpdateTag(tag.id, tag.name);
                }
                // 更新颜色
                if (originalTag.color !== tag.color) {
                    onUpdateTagColor(tag.id, tag.color);
                }
            }
        });
        setShowBatchEditModal(false);
    };

    // 预定义的颜色选项
    const colorOptions = [
        'bg-blue-200 text-blue-800',
        'bg-red-200 text-red-800',
        'bg-green-200 text-green-800',
        'bg-yellow-200 text-yellow-800',
        'bg-purple-200 text-purple-800',
        'bg-pink-200 text-pink-800',
        'bg-indigo-200 text-indigo-800',
        'bg-teal-200 text-teal-800',
    ];

    return (
        <div className="mt-4">
             <h2 className="text-lg font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <TagIcon className="w-5 h-5" />
                Tag管理
                {/* 设置按钮 - 批量编辑 */}
                <button
                    onClick={handleBatchEdit}
                    className="ml-auto text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
                    title="批量编辑标签"
                >
                    ⚙️
                </button>
             </h2>
             <div className="bg-white p-4 rounded-lg shadow-md">
                <form onSubmit={handleCreateTag} className="flex items-center gap-2 mb-4">
                    <input 
                        type="text"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        placeholder="创建新标签..."
                        className="flex-grow px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    />
                    <button type="submit" className="flex items-center gap-1 px-3 py-1.5 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700 transition-colors" disabled={!newTagName.trim()}>
                        <PlusIcon className="w-4 h-4" />
                        <span>添加标签</span>
                    </button>
                </form>
                {tags.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                        {tags.sort((a,b) => a.name.localeCompare(b.name)).map(tag => (
                            <TagListItem 
                                key={tag.id} 
                                tag={tag}
                                tasks={tasks}
                                scenes={scenes}
                                focusSessions={focusSessions}
                                onUpdate={onUpdateTag} 
                                onDelete={onDeleteTag}
                                onDeleteFocusSession={onDeleteFocusSession}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center text-sm py-4">No tags created yet. Add one above or when creating a task.</p>
                )}
             </div>

             {/* 批量编辑模态框 */}
             {showBatchEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">批量编辑标签</h3>
                        <div className="space-y-4">
                            {batchEditTags.map(tag => {
                                const originalTag = tags.find(t => t.id === tag.id);
                                return (
                                    <div key={tag.id} className="border-b border-slate-200 pb-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-3 h-3 rounded-full ${tag.color.replace('text-', 'bg-').split(' ')[0]}`}></span>
                                            <input
                                                type="text"
                                                value={tag.name}
                                                onChange={(e) => updateBatchEditTagName(tag.id, e.target.value)}
                                                className="flex-grow px-2 py-1 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary text-sm"
                                                placeholder="标签名称"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {colorOptions.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => updateBatchEditTagColor(tag.id, color)}
                                                    className={`w-6 h-6 rounded-full ${color.split(' ')[0]} ${tag.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                                                    title={color}
                                                />
                                            ))}
                                            <input
                                                type="text"
                                                value={tag.color}
                                                onChange={(e) => updateBatchEditTagColor(tag.id, e.target.value)}
                                                className="w-20 px-1 py-1 border border-slate-300 rounded-md text-xs"
                                                placeholder="#hex"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setShowBatchEditModal(false)}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmBatchEdit}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TagManagementPanel;
