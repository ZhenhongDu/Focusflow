import React from 'react';

interface DockItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileDockProps {
  items: DockItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

const MobileDock: React.FC<MobileDockProps> = ({ items, activeItem, onItemClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-40">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${
              activeItem === item.id
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className={`${activeItem === item.id ? 'scale-110' : ''} transition-transform`}>
              {item.icon}
            </div>
            <span className={`text-xs font-medium ${activeItem === item.id ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileDock;