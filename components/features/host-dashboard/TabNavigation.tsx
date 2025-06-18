'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  className?: string;
}

export function TabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className 
}: TabNavigationProps) {
  return (
    <div className={cn("border-b border-gray-200 -mx-6 px-6", className)}>
      <nav 
        className="flex space-x-1 overflow-x-auto scrollbar-hide" 
        aria-label="Dashboard tabs"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isDisabled = tab.disabled;
          
          return (
            <button
              key={tab.key}
              onClick={() => !isDisabled && onTabChange(tab.key)}
              disabled={isDisabled}
              className={cn(
                'flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all duration-200 rounded-t-lg whitespace-nowrap min-h-[56px]',
                isActive
                  ? 'border-[#FF6B6B] text-[#FF6B6B] bg-[#FF6B6B]/5'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-gray-500 hover:border-transparent'
              )}
              aria-selected={isActive}
              role="tab"
            >
              {/* Tab Icon */}
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                {tab.icon}
              </span>
              
              {/* Tab Label */}
              <span className="font-medium">
                {tab.label}
              </span>
              
              {/* Badge */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span 
                  className={cn(
                    'inline-flex items-center justify-center rounded-full text-xs font-medium min-w-[1.25rem] h-5 px-1.5',
                    isActive 
                      ? 'bg-[#FF6B6B] text-white'
                      : 'bg-red-500 text-white'
                  )}
                  aria-label={`${tab.badge} notifications`}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Custom scrollbar styles for webkit browsers */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
} 