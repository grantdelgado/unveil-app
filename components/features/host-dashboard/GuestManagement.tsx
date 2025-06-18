'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SecondaryButton, CardContainer } from '@/components/ui';
import { GuestStatusSummary } from './GuestStatusSummary';
import { BulkActionShortcuts } from './BulkActionShortcuts';
import { cn } from '@/lib/utils';
import type { Database } from '@/app/reference/supabase.types';

type Participant = Database['public']['Tables']['event_participants']['Row'] & {
  user: Database['public']['Views']['public_user_profiles']['Row'];
};

interface GuestManagementProps {
  eventId: string;
  onGuestUpdated?: () => void;
  onImportGuests?: () => void;
  onSendMessage?: (messageType: 'reminder') => void;
}

export function GuestManagement({
  eventId,
  onGuestUpdated,
  onImportGuests,
  onSendMessage,
}: GuestManagementProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  
  // Enhanced filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByRSVP, setFilterByRSVP] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:public_user_profiles(*)
        `)
        .eq('event_id', eventId);

      if (participantError) throw participantError;
      setParticipants(participantData || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Enhanced RSVP update with optimistic updates
  const handleRSVPUpdate = async (participantId: string, newStatus: string) => {
    try {
             // Optimistic update
       setParticipants(prev => 
         prev.map(p => 
           p.id === participantId 
             ? { ...p, rsvp_status: newStatus as 'attending' | 'declined' | 'maybe' | 'pending' }
             : p
         )
       );

      const { error } = await supabase
        .from('event_participants')
        .update({ rsvp_status: newStatus })
        .eq('id', participantId);

      if (error) throw error;
      onGuestUpdated?.();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      // Revert optimistic update on error
      await fetchData();
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
      await fetchData();
      onGuestUpdated?.();
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  // Bulk actions
  const handleMarkAllPendingAsAttending = async () => {
    const pendingParticipants = participants.filter(p => p.rsvp_status === 'pending');
    if (pendingParticipants.length === 0) return;

    if (!confirm(`Mark ${pendingParticipants.length} pending participants as attending?`)) return;

    try {
      const operations = pendingParticipants.map(p =>
        supabase
          .from('event_participants')
          .update({ rsvp_status: 'attending' })
          .eq('id', p.id)
      );

      await Promise.all(operations);
      await fetchData();
      onGuestUpdated?.();
    } catch (error) {
      console.error('Error updating pending RSVPs:', error);
    }
  };

  const handleSendReminderToPending = () => {
    onSendMessage?.('reminder');
  };

  const handleBulkRSVPUpdate = async (newStatus: string) => {
    if (selectedParticipants.size === 0) return;

    try {
      const operations = Array.from(selectedParticipants).map(participantId =>
        supabase
          .from('event_participants')
          .update({ rsvp_status: newStatus })
          .eq('id', participantId)
      );

      await Promise.all(operations);
      await fetchData();
      setSelectedParticipants(new Set());
      onGuestUpdated?.();
    } catch (error) {
      console.error('Error updating RSVPs:', error);
    }
  };

  // Enhanced filtering
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = !searchTerm || 
      participant.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.user?.id?.includes(searchTerm);

    const matchesRSVP = filterByRSVP === 'all' || participant.rsvp_status === filterByRSVP;
    return matchesSearch && matchesRSVP;
  });

  // Status counts
  const statusCounts = {
    total: participants.length,
    attending: participants.filter(p => p.rsvp_status === 'attending').length,
    pending: participants.filter(p => p.rsvp_status === 'pending').length,
    maybe: participants.filter(p => p.rsvp_status === 'maybe').length,
    declined: participants.filter(p => p.rsvp_status === 'declined').length,
  };

  const selectAll = () => {
    if (selectedParticipants.size === filteredParticipants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredParticipants.map(p => p.id)));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-100 rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Pills - Always at Top */}
      <div>
        <GuestStatusSummary
          eventId={eventId}
          activeFilter={filterByRSVP}
          onFilterChange={setFilterByRSVP}
          className="mb-4"
        />
      </div>

      {/* Search Bar - Sticky on Mobile */}
      <div className="sticky top-0 z-10 bg-white pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Search guests by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg',
              'focus:ring-2 focus:ring-[#FF6B6B] focus:border-transparent',
              'text-base min-h-[44px]', // Touch-friendly
              'placeholder:text-gray-500'
            )}
            autoComplete="off"
            autoFocus={false}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-lg">🔍</span>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              type="button"
            >
              <span className="text-gray-400 hover:text-gray-600 text-lg">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Sidebar for Mobile */}
      <BulkActionShortcuts
        onMarkAllPendingAsAttending={handleMarkAllPendingAsAttending}
        onSendReminderToPending={handleSendReminderToPending}
        onImportGuests={() => onImportGuests?.()}
        pendingCount={statusCounts.pending}
        totalCount={statusCounts.total}
        loading={loading}
      />

      {/* Selected Actions Bar */}
      {selectedParticipants.size > 0 && (
        <div className="bg-[#FF6B6B] text-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-medium">
              {selectedParticipants.size} participant{selectedParticipants.size > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => setSelectedParticipants(new Set())}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
                     <div className="flex flex-wrap gap-2">
             <SecondaryButton
               onClick={() => handleBulkRSVPUpdate('attending')}
               className="bg-white text-gray-900 hover:bg-gray-100 py-2 px-3"
               fullWidth={false}
             >
               ✅ Attending
             </SecondaryButton>
             <SecondaryButton
               onClick={() => handleBulkRSVPUpdate('maybe')}
               className="bg-white text-gray-900 hover:bg-gray-100 py-2 px-3"
               fullWidth={false}
             >
               🤷‍♂️ Maybe
             </SecondaryButton>
             <SecondaryButton
               onClick={() => handleBulkRSVPUpdate('declined')}
               className="bg-white text-gray-900 hover:bg-gray-100 py-2 px-3"
               fullWidth={false}
             >
               ❌ Declined
             </SecondaryButton>
             <SecondaryButton
               onClick={() => handleBulkRSVPUpdate('pending')}
               className="bg-white text-gray-900 hover:bg-gray-100 py-2 px-3"
               fullWidth={false}
             >
               ⏳ Pending
             </SecondaryButton>
           </div>
        </div>
      )}

      {/* Participant List - Mobile Optimized */}
      <CardContainer className="overflow-hidden">
        {/* Header with Select All */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedParticipants.size === filteredParticipants.length && filteredParticipants.length > 0}
              onChange={selectAll}
              className="h-4 w-4 text-[#FF6B6B] focus:ring-[#FF6B6B] border-gray-300 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''}
              {searchTerm || filterByRSVP !== 'all' ? ` (filtered)` : ''}
            </span>
          </div>
        </div>

        {/* Participant Cards */}
        <div className="divide-y divide-gray-100">
          {filteredParticipants.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-3xl mb-2">
                {searchTerm || filterByRSVP !== 'all' ? '🔍' : '👥'}
              </div>
              <p className="font-medium">
                {searchTerm || filterByRSVP !== 'all' 
                  ? 'No participants match your filters' 
                  : 'No participants yet'}
              </p>
              {!searchTerm && filterByRSVP === 'all' && (
                <p className="text-sm mt-1">Import your guest list to get started</p>
              )}
            </div>
          ) : (
            filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.has(participant.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedParticipants);
                      if (e.target.checked) {
                        newSelected.add(participant.id);
                      } else {
                        newSelected.delete(participant.id);
                      }
                      setSelectedParticipants(newSelected);
                    }}
                    className="mt-1 h-4 w-4 text-[#FF6B6B] focus:ring-[#FF6B6B] border-gray-300 rounded"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {participant.user?.full_name || 'Unnamed Participant'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Role: {participant.role}
                        </p>
                      </div>
                      
                      {/* RSVP Status and Actions */}
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <select
                          value={participant.rsvp_status || 'pending'}
                          onChange={(e) => handleRSVPUpdate(participant.id, e.target.value)}
                          className={cn(
                            'text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-[#FF6B6B]',
                            'min-h-[32px] min-w-[80px]' // Touch-friendly
                          )}
                        >
                          <option value="attending">✅ Attending</option>
                          <option value="maybe">🤷‍♂️ Maybe</option>
                          <option value="declined">❌ Declined</option>
                          <option value="pending">⏳ Pending</option>
                        </select>
                        
                        <button
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className={cn(
                            'text-xs px-2 py-1 text-red-600 hover:text-red-700',
                            'hover:bg-red-50 rounded transition-colors',
                            'min-h-[32px] min-w-[60px]' // Touch-friendly
                          )}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContainer>
    </div>
  );
}
