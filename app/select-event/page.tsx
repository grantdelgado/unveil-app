'use client';

import React from 'react';
import { formatEventDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import { useUserEventsSorted } from '@/hooks';
import { useAuth } from '@/hooks/auth';
import { 
  PageWrapper,
  CardContainer,
  LogoContainer,
  PageTitle,
  SubTitle,
  SectionTitle,
  PrimaryButton,
  IconButton,
  MicroCopy,
  DevModeBox,
  LoadingSpinner
} from '@/components/ui';

export default function SelectEventPage() {
  const { events, loading, error, refetch } = useUserEventsSorted();
  const { user } = useAuth();

  if (loading) {
    return (
      <PageWrapper>
        <LoadingSpinner size="lg" text="Loading events..." />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <CardContainer>
          <div className="text-center space-y-4">
            <PageTitle>Error Loading Events</PageTitle>
            <SubTitle>
              {error}
            </SubTitle>
            <PrimaryButton onClick={refetch}>
              Try Again
            </PrimaryButton>
          </div>
        </CardContainer>
      </PageWrapper>
    );
  }

  const handleEventSelect = (event: {
    event_id: string;
    user_role: string;
    title: string;
  }) => {
    const path = event.user_role === 'host' 
      ? `/host/events/${event.event_id}/dashboard`
      : `/guest/events/${event.event_id}/home`;
    window.location.href = path;
  };

  const handleCreateEvent = () => {
    window.location.href = '/host/events/create';
  };

  const handleProfile = () => {
    window.location.href = '/profile';
  };

  return (
    <PageWrapper>
      <CardContainer maxWidth="md">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <LogoContainer className="justify-start mb-4" />
            <PageTitle className="text-left mb-2">
              Welcome!
            </PageTitle>
            <SubTitle>Choose an event to continue</SubTitle>
          </div>
          <IconButton 
            onClick={handleProfile}
            size="lg"
            aria-label="Profile settings"
          >
            <span className="text-gray-600">👤</span>
          </IconButton>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {events && events.length > 0 ? (
            <>
              <SectionTitle>Your Events</SectionTitle>
                             <div className="space-y-4">
                 {events.map((event) => {
                   const formattedDate = formatEventDate(event.event_date);
                   
                   return (
                     <button
                       key={event.event_id}
                       onClick={() => handleEventSelect(event)}
                       className={cn(
                         'w-full p-5 border border-gray-200 rounded-lg bg-white text-left',
                         'transition-all duration-200 hover:border-pink-300 hover:shadow-md hover:bg-pink-50',
                         'focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2',
                         'active:scale-[0.98] active:shadow-sm',
                         'min-h-[44px]' // Touch-friendly minimum height
                       )}
                       aria-label={`Enter ${event.title} as ${event.user_role === 'host' ? 'Event Host' : 'Guest'}`}
                       title={`Click to enter ${event.title} as ${event.user_role === 'host' ? 'Host' : 'Guest'}`}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-3">
                             <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-700">
                               {event.title}
                             </h3>
                             <span className={cn(
                               'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                               event.user_role === 'host' 
                                 ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                 : 'bg-rose-100 text-rose-700 border border-rose-200'
                             )}>
                               {event.user_role === 'host' ? '👑 Host' : '🎊 Guest'}
                             </span>
                           </div>
                           
                           <div className="space-y-1 text-sm text-gray-600">
                             <p className="flex items-center gap-2">
                               <span>📅</span>
                               <span>{formattedDate}</span>
                             </p>
                             {event.location && (
                               <p className="flex items-center gap-2">
                                 <span>📍</span>
                                 <span>{event.location}</span>
                               </p>
                             )}
                           </div>
                         </div>
                        
                        <div className="text-gray-400 group-hover:text-pink-500 transition-colors duration-200 ml-4">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                   );
                 })}
              </div>
            </>
          ) : (
            <div className="text-center space-y-4 py-8">
              <div className="text-6xl mb-4">🎉</div>
              <SectionTitle>No Events Yet</SectionTitle>
              <SubTitle>
                You haven&apos;t been invited to any events yet, but you can create your own!
              </SubTitle>
            </div>
          )}

          {/* Create Event Button */}
          <div className="space-y-4">
            <PrimaryButton onClick={handleCreateEvent}>
              + Create New Event
            </PrimaryButton>
          </div>
        </div>

        {/* Microcopy */}
        <div className="mt-6">
          <MicroCopy>
            Need help? Contact support at help@unveil.app
          </MicroCopy>
        </div>

        {/* Development Mode */}
        <DevModeBox>
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Events Found:</strong> {events?.length || 0}</p>
          <p><strong>User Role:</strong> {user?.role || 'unknown'}</p>
        </DevModeBox>
      </CardContainer>
    </PageWrapper>
  );
}
