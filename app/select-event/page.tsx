'use client';

import { useRouter } from 'next/navigation';
import { useUserEventsSorted } from '@/hooks/events/useUserEventsSorted';

export default function SelectEventPage() {
  const { events, loading, error, refetch } = useUserEventsSorted();
  const router = useRouter();

  const handleEventSelect = (event: {
    event_id: string;
    user_role: string;
  }) => {
    if (!event.user_role) {
      console.error('Unable to determine user role for this event.');
      return;
    }

    // Route based on user's role for this event
    if (event.user_role === 'host') {
      router.push(`/host/events/${event.event_id}/dashboard`);
    } else if (event.user_role === 'guest') {
      router.push(`/guest/events/${event.event_id}/home`);
    } else {
      console.error('Invalid role for this event.');
    }
  };

  const formatEventDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getRoleDisplay = (event: {
    user_role: string;
    is_primary_host: boolean;
  }) => {
    if (event.is_primary_host) {
      return { text: 'Host', color: 'bg-rose-100 text-rose-800', icon: '👑' };
    } else if (event.user_role === 'host') {
      return {
        text: 'Co-Host',
        color: 'bg-purple-100 text-purple-800',
        icon: '🤝',
      };
    } else {
      return { text: 'Guest', color: 'bg-blue-100 text-blue-800', icon: '🎉' };
    }
  };

  const getRSVPDisplay = (status: string | null) => {
    switch (status) {
      case 'attending':
        return { text: 'Attending', color: 'bg-green-100 text-green-800' };
      case 'declined':
        return { text: 'Declined', color: 'bg-red-100 text-red-800' };
      case 'maybe':
        return { text: 'Maybe', color: 'bg-amber-100 text-amber-800' };
      default:
        return { text: 'Pending', color: 'bg-stone-100 text-stone-800' };
    }
  };

  // Separate events by role
  const hostedEvents = events.filter((event) => event.user_role === 'host');
  const guestEvents = events.filter((event) => event.user_role === 'guest');

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        {/* App Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-brand-pink mb-6 tracking-tight">
            Unveil
          </h1>
        </div>

        {/* Profile Button - simplified to icon only */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="w-8 h-8 bg-stone-300 rounded-full hover:bg-stone-400 transition-colors"
            aria-label="Go to profile"
          ></button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm text-center">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 w-full px-4 py-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Events Sections */}
        <div className="space-y-8">
          {/* No Events State */}
          {events.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎭</div>
              <h2 className="text-xl font-semibold text-stone-800 mb-2">
                You don&apos;t have any events yet.
              </h2>
              <p className="text-stone-600 mb-6">
                Create an event or wait to be invited to one.
              </p>
              <p className="text-stone-500 text-sm">
                Visit your profile to create or manage events.
              </p>
            </div>
          )}

          {/* Host Events Section */}
          {hostedEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-4">
                Your Event
              </h2>
              <div className="space-y-4">
                {hostedEvents.map((event) => {
                  const role = getRoleDisplay(event);

                  return (
                    <button
                      key={event.event_id}
                      onClick={() => handleEventSelect(event)}
                      className="w-full p-6 bg-app rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-stone-800 group-hover:text-stone-900">
                              {event.title}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${role.color}`}
                            >
                              <span>{role.icon}</span>
                              {role.text}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-stone-600">
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span>{formatEventDate(event.event_date)}</span>
                            </div>

                            {event.location && (
                              <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-stone-400 group-hover:text-stone-600 transition-colors">
                          →
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guest Events Section */}
          {guestEvents.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-stone-800 mb-4">
                Invited To
              </h2>
              <div className="space-y-4">
                {guestEvents.map((event) => {
                  const role = getRoleDisplay(event);
                  const rsvp = getRSVPDisplay(event.rsvp_status);

                  return (
                    <button
                      key={event.event_id}
                      onClick={() => handleEventSelect(event)}
                      className="w-full p-6 bg-app rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:border-stone-300 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-stone-800 group-hover:text-stone-900">
                              {event.title}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${role.color}`}
                            >
                              <span>{role.icon}</span>
                              {role.text}
                            </span>
                          </div>

                          <div className="space-y-1 text-sm text-stone-600">
                            <div className="flex items-center gap-2">
                              <span>📅</span>
                              <span>{formatEventDate(event.event_date)}</span>
                            </div>

                            {event.location && (
                              <div className="flex items-center gap-2">
                                <span>📍</span>
                                <span>{event.location}</span>
                              </div>
                            )}

                            {event.rsvp_status && (
                              <div className="flex items-center gap-2">
                                <span>✉️</span>
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rsvp.color}`}
                                >
                                  {rsvp.text}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-stone-400 group-hover:text-stone-600 transition-colors">
                          →
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
