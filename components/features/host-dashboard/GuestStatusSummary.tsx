'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface GuestStatusSummaryProps {
  eventId: string;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

interface StatusCount {
  attending: number;
  pending: number;
  declined: number;
  maybe: number;
  total: number;
}

const statusConfig = [
  {
    key: 'all',
    label: 'All',
    icon: '👥',
    bgColor: 'bg-gray-100',
    activeColor: 'bg-gray-200',
    textColor: 'text-gray-700',
    activeTextColor: 'text-gray-900',
  },
  {
    key: 'attending',
    label: 'Attending',
    icon: '✅',
    bgColor: 'bg-green-50',
    activeColor: 'bg-green-100',
    textColor: 'text-green-700',
    activeTextColor: 'text-green-800',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: '⏳',
    bgColor: 'bg-orange-50',
    activeColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    activeTextColor: 'text-orange-800',
  },
  {
    key: 'maybe',
    label: 'Maybe',
    icon: '🤷‍♂️',
    bgColor: 'bg-yellow-50',
    activeColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    activeTextColor: 'text-yellow-800',
  },
  {
    key: 'declined',
    label: 'Declined',
    icon: '❌',
    bgColor: 'bg-red-50',
    activeColor: 'bg-red-100',
    textColor: 'text-red-700',
    activeTextColor: 'text-red-800',
  },
] as const;

export function GuestStatusSummary({
  eventId,
  activeFilter,
  onFilterChange,
  className,
}: GuestStatusSummaryProps) {
  const [statusCounts, setStatusCounts] = useState<StatusCount>({
    attending: 0,
    pending: 0,
    declined: 0,
    maybe: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusCounts = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('event_participants')
          .select('rsvp_status')
          .eq('event_id', eventId);

        if (error) {
          console.error('Error fetching RSVP status counts:', error);
          return;
        }

        const counts = {
          attending: 0,
          pending: 0,
          declined: 0,
          maybe: 0,
          total: data?.length || 0,
        };

        data?.forEach((participant) => {
          const status = participant.rsvp_status || 'pending';
          if (status in counts) {
            counts[status as keyof Omit<StatusCount, 'total'>]++;
          }
        });

        setStatusCounts(counts);
      } catch (error) {
        console.error('Unexpected error fetching status counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusCounts();
  }, [eventId]);

  const getCountForStatus = (key: string): number => {
    if (key === 'all') return statusCounts.total;
    return statusCounts[key as keyof Omit<StatusCount, 'total'>] || 0;
  };

  if (loading) {
    return (
      <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide py-2', className)}>
        {statusConfig.map((status) => (
          <div 
            key={status.key}
            className="flex-shrink-0 bg-gray-100 rounded-full px-4 py-2 animate-pulse"
            style={{ minWidth: '88px', height: '44px' }}
          >
            <div className="h-full bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2 overflow-x-auto scrollbar-hide py-2', className)}>
      {statusConfig.map((status) => {
        const isActive = activeFilter === status.key;
        const count = getCountForStatus(status.key);
        
        return (
          <button
            key={status.key}
            onClick={() => onFilterChange(status.key)}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2',
              'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:ring-offset-1',
              'min-h-[44px] min-w-[88px] justify-center', // Touch-friendly sizing
              isActive
                ? `${status.activeColor} ${status.activeTextColor} border-[#FF6B6B]`
                : `${status.bgColor} ${status.textColor} border-transparent hover:border-gray-200`
            )}
            type="button"
            aria-pressed={isActive}
            aria-label={`Filter by ${status.label} participants (${count})`}
          >
            <span className="text-base" role="img" aria-hidden="true">
              {status.icon}
            </span>
            <span className="whitespace-nowrap">
              {status.label}
              <span className="ml-1 font-semibold">({count})</span>
            </span>
          </button>
        );
      })}
    </div>
  );
} 