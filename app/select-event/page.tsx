'use client';

import React from 'react';
import { formatEventDate } from '@/lib/utils/date';
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
                             <div className="space-y-3">
                 {events.map((event) => {
                   const formattedDate = formatEventDate(event.event_date);
                   
                   return (
                     <div
                       key={event.event_id}
                       onClick={() => handleEventSelect(event)}
                       className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors duration-200 cursor-pointer group"
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                             <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-700">
                               {event.title}
                             </h3>
                             <span className={`
                               inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                               ${event.user_role === 'host' 
                                 ? 'bg-pink-100 text-pink-800' 
                                 : 'bg-gray-100 text-gray-800'}
                             `}>
                               {event.user_role === 'host' ? 'Host' : 'Guest'}
                             </span>
                           </div>
                           
                           <div className="space-y-1 text-sm text-gray-600">
                             <p>📅 {formattedDate}</p>
                             {event.location && <p>📍 {event.location}</p>}
                           </div>
                         </div>
                        
                        <div className="text-gray-400 group-hover:text-pink-500 transition-colors duration-200">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
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
