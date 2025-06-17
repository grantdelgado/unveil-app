'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CardContainer } from '@/components/ui/CardContainer';
import { SectionTitle, FieldLabel, MicroCopy } from '@/components/ui/Typography';
import type { Database } from '@/app/reference/supabase.types';

type Participant = Database['public']['Tables']['event_participants']['Row'] & {
  user: Database['public']['Views']['public_user_profiles']['Row'];
};

interface MessageComposerProps {
  eventId: string;
  onMessageSent?: () => void;
}

export function MessageComposer({
  eventId,
  onMessageSent,
}: MessageComposerProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'announcement' | 'direct'>('announcement');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'attending' | 'custom'>('all');

  // Fetch participants
  useEffect(() => {
    async function fetchParticipants() {
      try {
        const { data, error } = await supabase
          .from('event_participants')
          .select(
            `
            *,
            user:public_user_profiles(*)
          `,
          )
          .eq('event_id', eventId);

        if (error) throw error;
        setParticipants(data || []);
      } catch (err) {
        console.error('Error fetching participants:', err);
        setError('Failed to load participants');
      }
    }

    fetchParticipants();
  }, [eventId]);



  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (messageType === 'direct' && selectedParticipants.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert message into database
      const { error: messageError } = await supabase.from('messages').insert({
        event_id: eventId,
        sender_user_id: user.id,
        content: message.trim(),
        message_type: messageType,
        recipients: messageType === 'direct' ? selectedParticipants : null,
      });

      if (messageError) throw messageError;

      // Reset form
      setMessage('');
      setSelectedParticipants([]);
      setMessageType('announcement');
      setSuccess(true);

      onMessageSent?.();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [message, messageType, selectedParticipants, eventId, onMessageSent]);



  return (
    <CardContainer>
      <SectionTitle className="flex items-center mb-6">
        <span className="mr-3">💬</span>
        Send Message
      </SectionTitle>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-green-800">Message sent successfully!</div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <FieldLabel htmlFor="recipient-filter">
            Send to
          </FieldLabel>
          <div className="flex space-x-2">
            <Button
              onClick={() => setRecipientFilter('all')}
              variant={recipientFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              className={
                recipientFilter === 'all'
                  ? ''
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            >
              All Participants ({participants.length})
            </Button>
            <Button
              onClick={() => setRecipientFilter('attending')}
              variant={recipientFilter === 'attending' ? 'primary' : 'outline'}
              size="sm"
              className={
                recipientFilter === 'attending'
                  ? ''
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            >
              Attending Only ({participants.filter(p => p.rsvp_status === 'attending').length})
            </Button>
          </div>
        </div>

        {recipientFilter === 'custom' && (
          <div>
            <FieldLabel>
              Select Participants
            </FieldLabel>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {participants.map((participant) => (
                <label
                  key={participant.id}
                  className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(participant.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParticipants([...selectedParticipants, participant.id]);
                      } else {
                        setSelectedParticipants(selectedParticipants.filter(id => id !== participant.id));
                      }
                    }}
                    className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {participant.user?.full_name || 'Unnamed Participant'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Role: {participant.role}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <FieldLabel htmlFor="message" required>
            Message
          </FieldLabel>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <MicroCopy className="mt-1">
            {message.length}/500 characters
          </MicroCopy>
        </div>

        <div className="flex justify-end space-x-3">
          <Button onClick={() => {
            setMessage('');
            setSelectedParticipants([]);
            setMessageType('announcement');
            setRecipientFilter('all');
          }} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || loading}
            className="min-w-[120px]"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Send Message'}
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}
