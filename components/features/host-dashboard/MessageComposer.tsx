'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Database } from '@/app/reference/supabase.types';

type Participant = Database['public']['Tables']['event_participants']['Row'] & {
  user: Database['public']['Views']['public_user_profiles']['Row'];
};

interface MessageComposerProps {
  eventId: string;
  onMessageSent?: () => void;
}

interface MessagePreview {
  recipientCount: number;
  recipients: string[];
}

export function MessageComposer({
  eventId,
  onMessageSent,
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'announcement' | 'direct'>(
    'announcement',
  );
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MessagePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Update preview when selections change
  useEffect(() => {
    let recipientCount = 0;
    let recipients: string[] = [];

    if (messageType === 'announcement') {
      recipientCount = participants.length;
      recipients = participants
        .map((p) => p.user?.full_name || 'Unknown')
        .slice(0, 5);
    } else {
      const selectedParticipantData = participants.filter((p) =>
        selectedParticipants.includes(p.id),
      );
      recipientCount = selectedParticipantData.length;
      recipients = selectedParticipantData
        .map((p) => p.user?.full_name || 'Unknown')
        .slice(0, 5);
    }

    setPreview({ recipientCount, recipients });
  }, [messageType, selectedParticipants, participants]);

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

      onMessageSent?.();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [message, messageType, selectedParticipants, eventId, onMessageSent]);

  const handleParticipantToggle = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId],
    );
  };

  const handleSelectAll = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(participants.map((p) => p.id));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
      <h2 className="text-xl font-semibold text-stone-800 flex items-center mb-6">
        <span className="text-2xl mr-2">💬</span>
        Send Message
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="space-y-6">
        {/* Message Type Selection */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">
            Message Type
          </label>
          <div className="flex space-x-4">
            <button
              onClick={() => setMessageType('announcement')}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                messageType === 'announcement'
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-lg mr-2">📢</span>
              Announcement (All Participants)
            </button>
            <button
              onClick={() => setMessageType('direct')}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                messageType === 'direct'
                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span className="text-lg mr-2">👥</span>
              Direct Message (Select Recipients)
            </button>
          </div>
        </div>

        {/* Recipient Selection for Direct Messages */}
        {messageType === 'direct' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-stone-700">
                Select Recipients ({selectedParticipants.length} selected)
              </label>
              <Button onClick={handleSelectAll} variant="outline" size="sm">
                {selectedParticipants.length === participants.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center p-3 hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    id={`participant-${participant.id}`}
                    checked={selectedParticipants.includes(participant.id)}
                    onChange={() => handleParticipantToggle(participant.id)}
                    className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-stone-300 rounded"
                  />
                  <label
                    htmlFor={`participant-${participant.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="text-sm font-medium text-stone-900">
                      {participant.user?.full_name || 'Unnamed Participant'}
                    </div>
                    <div className="text-xs text-stone-500">
                      Role: {participant.role}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-stone-700 mb-2"
          >
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            rows={4}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          />
          <div className="text-xs text-stone-500 mt-1">
            {message.length}/500 characters
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800 mb-2">
              Message Preview
            </h3>
            <div className="text-sm text-purple-700">
              <div className="mb-1">
                <strong>Recipients:</strong> {preview.recipientCount}{' '}
                participant{preview.recipientCount !== 1 ? 's' : ''}
              </div>
              {preview.recipients.length > 0 && (
                <div className="mb-1">
                  <strong>To:</strong> {preview.recipients.join(', ')}
                  {preview.recipientCount > preview.recipients.length && (
                    <span className="text-purple-600">
                      {' '}
                      (+{preview.recipientCount -
                        preview.recipients.length}{' '}
                      more)
                    </span>
                  )}
                </div>
              )}
              <div>
                <strong>Type:</strong>{' '}
                {messageType === 'announcement'
                  ? 'Announcement'
                  : 'Direct Message'}
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSendMessage}
            disabled={
              loading ||
              !message.trim() ||
              (messageType === 'direct' && selectedParticipants.length === 0)
            }
            className="min-w-32"
          >
            {loading ? (
              <>
                <LoadingSpinner className="mr-2" />
                Sending...
              </>
            ) : (
              <>
                <span className="mr-2">📤</span>
                Send Message
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
