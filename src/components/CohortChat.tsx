/**
 * Cohort Chat - Anonymous, Moderated Community Support
 *
 * Real-time chat for cohort members with:
 * - Anonymized identities
 * - Message type categorization
 * - Moderation flags
 * - Supportive UI
 * - Safety guidelines
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Heart, Lightbulb, Trophy, AlertTriangle, Flag } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'insight' | 'milestone' | 'support';
  flagged: boolean;
  created_at: string;
  anonymized_name?: string;
}

interface CohortChatProps {
  cohortId: string;
  userId: string;
  anonymizedName: string;
  className?: string;
}

export function CohortChat({
  cohortId,
  userId,
  anonymizedName,
  className = ''
}: CohortChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<Message['message_type']>('text');
  const [loading, setLoading] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [cohortId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('cohort_messages')
        .select(`
          *,
          cohort_members!cohort_messages_user_id_fkey (anonymized_name)
        `)
        .eq('cohort_id', cohortId)
        .eq('flagged', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const messagesWithNames = data?.map(msg => ({
        ...msg,
        anonymized_name: (msg.cohort_members as any)?.anonymized_name || 'Anonymous'
      })) || [];

      setMessages(messagesWithNames);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function setupRealtimeSubscription() {
    channelRef.current = supabase
      .channel(`cohort_chat:${cohortId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cohort_messages',
          filter: `cohort_id=eq.${cohortId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          // Fetch anonymized name
          const { data: member } = await supabase
            .from('cohort_members')
            .select('anonymized_name')
            .eq('user_id', newMsg.user_id)
            .eq('cohort_id', cohortId)
            .maybeSingle();

          setMessages(prev => [...prev, {
            ...newMsg,
            anonymized_name: member?.anonymized_name || 'Anonymous'
          }]);
        }
      )
      .subscribe();
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('cohort_messages').insert({
        cohort_id: cohortId,
        user_id: userId,
        message: newMessage.trim(),
        message_type: messageType
      });

      if (error) throw error;

      setNewMessage('');
      setMessageType('text');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    }
  }

  async function flagMessage(messageId: string) {
    if (!confirm('Flag this message for moderation review?')) return;

    try {
      const { error } = await supabase
        .from('cohort_messages')
        .update({ flagged: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to flag message:', error);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function getMessageIcon(type: string) {
    switch (type) {
      case 'support':
        return <Heart className="w-4 h-4 text-red-400" />;
      case 'insight':
        return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'milestone':
        return <Trophy className="w-4 h-4 text-green-400" />;
      default:
        return null;
    }
  }

  function getMessageBorder(type: string) {
    switch (type) {
      case 'support':
        return 'border-l-4 border-red-500';
      case 'insight':
        return 'border-l-4 border-yellow-500';
      case 'milestone':
        return 'border-l-4 border-green-500';
      default:
        return '';
    }
  }

  if (loading) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Cohort Chat</h3>
            <p className="text-sm text-slate-400">
              You appear as <span className="text-blue-400">{anonymizedName}</span>
            </p>
          </div>
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Guidelines
          </button>
        </div>
      </div>

      {/* Guidelines */}
      {showGuidelines && (
        <div className="p-4 bg-blue-900/20 border-b border-blue-500/50">
          <h4 className="text-sm font-semibold text-white mb-2">Community Guidelines</h4>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• Be supportive and compassionate</li>
            <li>• Respect anonymity - no personal details</li>
            <li>• No medical/crisis advice - share resources instead</li>
            <li>• Flag concerning messages for review</li>
            <li>• This is peer support, not professional therapy</li>
          </ul>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 h-96">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <p>No messages yet. Be the first to share!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwnMessage = msg.user_id === userId;

            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {!isOwnMessage && (
                    <div className="text-xs text-slate-400 mb-1">{msg.anonymized_name}</div>
                  )}
                  <div
                    className={`
                      p-3 rounded-lg ${getMessageBorder(msg.message_type)}
                      ${isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      {getMessageIcon(msg.message_type)}
                      <p className="text-sm flex-1">{msg.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {!isOwnMessage && (
                      <button
                        onClick={() => flagMessage(msg.id)}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                        title="Flag message"
                      >
                        <Flag className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMessageType('text')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              messageType === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Message
          </button>
          <button
            onClick={() => setMessageType('support')}
            className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              messageType === 'support'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Heart className="w-3 h-3" />
            Support
          </button>
          <button
            onClick={() => setMessageType('insight')}
            className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              messageType === 'insight'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Lightbulb className="w-3 h-3" />
            Insight
          </button>
          <button
            onClick={() => setMessageType('milestone')}
            className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
              messageType === 'milestone'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Trophy className="w-3 h-3" />
            Milestone
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Share with the cohort..."
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
