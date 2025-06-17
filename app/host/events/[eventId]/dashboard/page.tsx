'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { formatEventDate } from '@/lib/utils';
import type { Database } from '@/app/reference/supabase.types';
import {
  GuestManagement,
  MessageComposer,
  EventAnalytics,
  QuickActions,
  NotificationCenter,
  SMSTestPanel,
} from '@/components/features/host-dashboard';
import { WelcomeBanner } from '@/components/features/events';
import { GuestImportWizard } from '@/components/features/guests';
import {
  PageWrapper,
  CardContainer,
  PageTitle,
  SubTitle,
  PrimaryButton,
  SecondaryButton,
  LoadingSpinner,
  DevModeBox
} from '@/components/ui';

type Event = Database['public']['Tables']['events']['Row'];

export default function EventDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showGuestImport, setShowGuestImport] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!eventId) return;

    const fetchEventData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Verify user access and fetch event
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .eq('host_user_id', user.id)
          .single();

        if (eventError) {
          console.error('Event fetch error:', eventError);
          if (eventError.code === 'PGRST116') {
            setError(
              'Event not found or you do not have permission to access it.',
            );
          } else {
            setError('Failed to load event data');
          }
          return;
        }

        setEvent(eventData);

        // Get participant count
        const { data: participantData, error: participantError } =
          await supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', eventId);

        if (participantError) {
          console.error('Participant count error:', participantError);
        } else {
          setParticipantCount(participantData?.length || 0);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, router]);

  useEffect(() => {
    // Listen for navigation tab changes from bottom navigation
    const handleNavigationTabChange = (event: CustomEvent) => {
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab);
      }
    };

    const handleDashboardTabChange = (event: CustomEvent) => {
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab);
      }
    };

    window.addEventListener(
      'navigationTabChange',
      handleNavigationTabChange as EventListener,
    );
    window.addEventListener(
      'dashboardTabChange',
      handleDashboardTabChange as EventListener,
    );

    return () => {
      window.removeEventListener(
        'navigationTabChange',
        handleNavigationTabChange as EventListener,
      );
      window.removeEventListener(
        'dashboardTabChange',
        handleDashboardTabChange as EventListener,
      );
    };
  }, []);

  const handleDataRefresh = async () => {
    // Refresh participant count
    const { data: participantData } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', eventId);

    setParticipantCount(participantData?.length || 0);
  };

  if (loading) {
    return (
      <PageWrapper>
        <LoadingSpinner size="lg" text="Loading event dashboard..." />
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <CardContainer>
          <div className="text-center space-y-6">
            <div className="text-4xl">⚠️</div>
            <div className="space-y-2">
              <PageTitle>Unable to Load Event</PageTitle>
              <SubTitle>{error}</SubTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <PrimaryButton onClick={() => window.location.reload()} fullWidth={false}>
                Try Again
              </PrimaryButton>
              <SecondaryButton 
                onClick={() => router.push('/select-event')}
                fullWidth={false}
              >
                Back to Events
              </SecondaryButton>
            </div>
          </div>
        </CardContainer>
      </PageWrapper>
    );
  }

  if (!event) {
    return (
      <PageWrapper>
        <CardContainer>
          <div className="text-center space-y-6">
            <div className="text-4xl">🤔</div>
            <div className="space-y-2">
              <PageTitle>Event Not Found</PageTitle>
              <SubTitle>
                The event you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </SubTitle>
            </div>
            <PrimaryButton 
              onClick={() => router.push('/select-event')}
              fullWidth={false}
            >
              Back to Events
            </PrimaryButton>
          </div>
        </CardContainer>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper centered={false}>
      {/* Guest Import Modal */}
      {showGuestImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <GuestImportWizard
              eventId={eventId}
              onImportComplete={() => {
                setShowGuestImport(false);
                handleDataRefresh();
              }}
              onClose={() => setShowGuestImport(false)}
            />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Event Header */}
        <CardContainer maxWidth="xl" className="border-b-0 rounded-b-none">
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-4">
                  {event.header_image_url && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={event.header_image_url}
                        alt={event.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <PageTitle className="text-left mb-3">{event.title}</PageTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📅</span>
                        <span>{formatEventDate(event.event_date)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📍</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {event.description && (
                  <SubTitle className="max-w-2xl">
                    {event.description}
                  </SubTitle>
                )}
              </div>

              <div className="flex-shrink-0">
                <QuickActions eventId={eventId} />
              </div>
            </div>
          </div>
        </CardContainer>

        {/* Welcome Banner */}
        <div className="px-6 lg:px-0">
          <WelcomeBanner
            guestCount={participantCount}
            onImportGuests={() => setShowGuestImport(true)}
            onSendFirstMessage={() => setActiveTab('messages')}
          />
        </div>

        {/* Notifications */}
        <div className="px-6 lg:px-0">
          <NotificationCenter eventId={eventId} />
        </div>

        {/* Main Dashboard Content */}
        <CardContainer maxWidth="xl" className="overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 -mx-6 px-6">
            <nav className="flex space-x-8" aria-label="Dashboard tabs">
              {[
                { key: 'overview', label: '📊 Overview' },
                { key: 'guests', label: '👥 Participants' },
                { key: 'messages', label: '💬 Messages' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-[#FF6B6B] text-[#FF6B6B]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === 'overview' && <EventAnalytics eventId={eventId} />}

            {activeTab === 'guests' && (
              <GuestManagement
                eventId={eventId}
                onGuestUpdated={handleDataRefresh}
              />
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <MessageComposer
                  eventId={eventId}
                  onMessageSent={() => {
                    console.log('Message sent successfully!');
                  }}
                />
                <SMSTestPanel eventId={eventId} />
              </div>
            )}
          </div>
        </CardContainer>

        {/* Development Mode */}
        <DevModeBox>
          <p><strong>Event Dashboard State:</strong></p>
          <p>Event ID: {eventId}</p>
          <p>Event Title: {event?.title || 'N/A'}</p>
          <p>Active Tab: {activeTab}</p>
          <p>Participant Count: {participantCount}</p>
          <p>Guest Import Modal: {showGuestImport ? 'open' : 'closed'}</p>
          <p>Loading: {loading ? 'true' : 'false'}</p>
          {error && <p className="text-red-600">Error: {error}</p>}
        </DevModeBox>
      </div>
    </PageWrapper>
  );
}
