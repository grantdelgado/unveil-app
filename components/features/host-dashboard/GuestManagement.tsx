'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Database } from '@/app/reference/supabase.types';

type Participant = Database['public']['Tables']['event_participants']['Row'] & {
  user: Database['public']['Views']['public_user_profiles']['Row'];
};

interface GuestManagementProps {
  eventId: string;
  onGuestUpdated?: () => void;
}

export function GuestManagement({
  eventId,
  onGuestUpdated,
}: GuestManagementProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(),
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByRSVP, setFilterByRSVP] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('event_participants')
        .select(
          `
          *,
          user:public_user_profiles(*)
        `,
        )
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

  const handleRSVPUpdate = async (participantId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ rsvp_status: newStatus })
        .eq('id', participantId);

      if (error) throw error;

      await fetchData();
      onGuestUpdated?.();
    } catch (error) {
      console.error('Error updating RSVP:', error);
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

  const handleSelectAll = () => {
    if (selectedParticipants.size === filteredParticipants.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredParticipants.map((p) => p.id)));
    }
  };

  const handleBulkRSVPUpdate = async (newStatus: string) => {
    if (selectedParticipants.size === 0) return;

    try {
      const operations = Array.from(selectedParticipants).map((participantId) =>
        supabase
          .from('event_participants')
          .update({ rsvp_status: newStatus })
          .eq('id', participantId),
      );

      await Promise.all(operations);
      await fetchData();
      setSelectedParticipants(new Set());
      onGuestUpdated?.();
    } catch (error) {
      console.error('Error updating RSVPs:', error);
    }
  };

  // Apply filters
  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      !searchTerm ||
      participant.user?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      participant.user?.id?.includes(searchTerm); // Search by phone (stored in users table)

    const matchesRSVP =
      filterByRSVP === 'all' || participant.rsvp_status === filterByRSVP;

    return matchesSearch && matchesRSVP;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200">
      <div className="p-6 border-b border-stone-200">
        <h2 className="text-xl font-semibold text-stone-800 flex items-center">
          <span className="text-2xl mr-2">👥</span>
          Participant Management
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          {participants.length} total participants
        </p>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-stone-100 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <select
            value={filterByRSVP}
            onChange={(e) => setFilterByRSVP(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All RSVP Status</option>
            <option value="attending">Attending</option>
            <option value="declined">Declined</option>
            <option value="maybe">Maybe</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <Button
            variant="outline"
            onClick={handleSelectAll}
            className="w-full"
          >
            {selectedParticipants.size === filteredParticipants.length
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedParticipants.size > 0 && (
        <div className="bg-purple-50 border-b border-purple-200 p-4">
          <p className="text-sm text-purple-700 mb-3">
            {selectedParticipants.size} participant
            {selectedParticipants.size > 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleBulkRSVPUpdate('attending')}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark Attending
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkRSVPUpdate('declined')}
              className="bg-red-600 hover:bg-red-700"
            >
              Mark Declined
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkRSVPUpdate('maybe')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Mark Maybe
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkRSVPUpdate('pending')}
              variant="outline"
            >
              Mark Pending
            </Button>
          </div>
        </div>
      )}

      {/* Participant List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredParticipants.length === 0 ? (
          <div className="p-6 text-center text-stone-500">
            {searchTerm || filterByRSVP !== 'all'
              ? 'No participants match your filters'
              : 'No participants yet'}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                className="p-4 flex items-center justify-between hover:bg-stone-50"
              >
                <div className="flex items-center">
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
                    className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-stone-300 rounded"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {participant.user?.full_name || 'Unnamed Participant'}
                    </p>
                    <div className="text-xs text-stone-500 space-y-1">
                      <div>Role: {participant.role}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={participant.rsvp_status || 'pending'}
                    onChange={(e) =>
                      handleRSVPUpdate(participant.id, e.target.value)
                    }
                    className="text-xs px-2 py-1 border border-stone-300 rounded focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                    <option value="maybe">Maybe</option>
                    <option value="pending">Pending</option>
                  </select>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
