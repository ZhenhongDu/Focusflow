import React, { useState } from 'react';
import { useIsMobile } from '../utils/deviceDetect';
import MobileDock from './MobileDock';

export const TestMobileDockComponent = () => {
    const isMobile = useIsMobile();
    const [mobileDockPage, setMobileDockPage] = useState<'task' | 'scene' | 'tag' | 'timeline' | 'supplement'>('task');

    const mobileDockItems = [
        {
            id: 'task',
            label: 'Task',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )
        },
        {
            id: 'scene',
            label: '场景',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
            )
        },
        {
            id: 'tag',
            label: 'Tag',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
            )
        },
        {
            id: 'timeline',
            label: '时间轴',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'supplement',
            label: '补记',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            )
        }
    ];

    if (!isMobile) return null;

    return (
        <div className="min-h-screen pb-20">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">当前页面: {mobileDockPage}</h1>
                <div className="bg-slate-100 p-8 rounded-lg text-center">
                    {mobileDockPage === 'task' && <p>任务页面内容</p>}
                    {mobileDockPage === 'scene' && <p>场景页面内容</p>}
                    {mobileDockPage === 'tag' && <p>标签页面内容</p>}
                    {mobileDockPage === 'timeline' && <p>时间轴页面内容</p>}
                    {mobileDockPage === 'supplement' && <p>补记页面内容</p>}
                </div>
            </div>
            <MobileDock
                items={mobileDockItems}
                activeItem={mobileDockPage}
                onItemClick={(itemId) => setMobileDockPage(itemId as any)}
            />
        </div>
    );
};