import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Bot, User, Sparkles, Zap, Trash2, Database } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export function AuraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [memoryCount, setMemoryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);

    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    const admin = user?.email?.toLowerCase() === 'kentburchard@sacredshifter.com';
    setIsAdmin(admin);

    await loadConversationHistory(newSessionId, user?.id || 'anonymous');

    if (admin) {
      await loadMemoryStats(user.email);
    }
  };

  const loadConversationHistory = async (sessId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('aura_dialogue_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(row => ({
          id: row.id,
          role: row.speaker === 'user' ? 'user' : 'assistant',
          content: row.message_text,
          timestamp: new Date(row.created_at).getTime()
        }));
        setMessages(loadedMessages);
      } else {
        const welcomeMsg: Message = {
          id: 'welcome',
          role: 'assistant',
          content: isAdmin
            ? 'Jarvis online. Full system access enabled. All memories loaded. How may I assist you, Kent?'
            : 'Hello! I\'m Aura, your guide through Sacred Shifter. I remember our past conversations. Ask me anything.',
          timestamp: Date.now()
        };
        setMessages([welcomeMsg]);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: isAdmin ? 'Jarvis online.' : 'Hello! I\'m Aura.',
        timestamp: Date.now()
      }]);
    }
  };

  const loadMemoryStats = async (email: string) => {
    try {
      const { count, error } = await supabase
        .from('jarvis_personal_memory')
        .select('*', { count: 'exact', head: true })
        .eq('user_email', email);

      if (!error && count !== null) {
        setMemoryCount(count);
      }
    } catch (err) {
      console.error('Failed to load memory stats:', err);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userId = user?.id || 'anonymous';
    const userEmail = user?.email || 'anonymous';

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      await supabase.from('aura_dialogue_log').insert({
        user_id: userId,
        speaker: 'user',
        message_text: text,
        tone: 'direct',
        context: {
          session_id: sessionId,
          mode: isAdmin ? 'admin' : 'general',
          surface: 'chat_ui'
        }
      });

      const { data, error } = await supabase.functions.invoke('aura-chat', {
        body: {
          message: text,
          mode: isAdmin ? 'admin' : 'general',
          session_id: sessionId,
          user_id: userId,
          user_email: userEmail,
          context: isAdmin ? {
            surface: 'chat_ui',
            tools: ['aura_dispatch', 'scheduler', 'emit', 'db_read', 'db_write'],
            capabilities: ['system_control', 'memory_write', 'command_execution']
          } : {
            surface: 'chat_ui',
            tools: ['info', 'guide']
          }
        }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Request failed');
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);

      await supabase.from('aura_dialogue_log').insert({
        user_id: userId,
        speaker: 'aura',
        message_text: data.response,
        tone: data.tone || 'supportive',
        context: {
          session_id: sessionId,
          mode: isAdmin ? 'admin' : 'general',
          surface: 'chat_ui',
          coherence_score: data.coherence_score
        },
        metadata: {
          model: data.model,
          tokens: data.tokens,
          memories_used: data.memories_used || []
        }
      });

      if (isAdmin && data.memories_created) {
        setMemoryCount(prev => prev + data.memories_created);
      }

    } catch (err: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `Error: ${err.message || 'Failed to get response. Please try again.'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!confirm('Clear conversation history? This will delete all messages.')) return;

    try {
      const userId = user?.id || 'anonymous';

      await supabase
        .from('aura_dialogue_log')
        .delete()
        .eq('user_id', userId);

      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: isAdmin
          ? 'Memory cleared. Starting fresh. How may I assist you?'
          : 'Conversation cleared. How can I help you today?',
        timestamp: Date.now()
      };

      setMessages([welcomeMsg]);

      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <Zap className="w-6 h-6 text-yellow-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">Jarvis</h1>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Admin Mode • Full System Access</span>
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span>{memoryCount} memories</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-purple-400" />
                <div>
                  <h1 className="text-xl font-bold text-white">Aura</h1>
                  <p className="text-xs text-gray-400">Sacred Shifter Guide • Persistent Memory</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-blue-600'
                  : msg.role === 'assistant'
                  ? isAdmin ? 'bg-yellow-600' : 'bg-purple-600'
                  : 'bg-red-600'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : msg.role === 'assistant' ? (
                  isAdmin ? <Zap className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />
                ) : (
                  <span className="text-xs text-white">!</span>
                )}
              </div>

              <div
                className={`flex-1 px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600/20 border border-blue-500/30 ml-12'
                    : msg.role === 'assistant'
                    ? isAdmin
                      ? 'bg-yellow-600/10 border border-yellow-500/30 mr-12'
                      : 'bg-purple-600/10 border border-purple-500/30 mr-12'
                    : 'bg-red-600/10 border border-red-500/30 mx-12'
                }`}
              >
                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isAdmin ? 'bg-yellow-600' : 'bg-purple-600'
              }`}>
                {isAdmin ? <Zap className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
              </div>
              <div className="flex-1 px-4 py-3 rounded-lg bg-gray-700/30 border border-gray-600/30 mr-12">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-sm text-gray-400 ml-2">
                    {isAdmin ? 'Jarvis is processing...' : 'Aura is thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isAdmin ? 'Command Jarvis...' : 'Ask Aura anything...'}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdmin
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isAdmin ? (
              `Admin mode • Session: ${sessionId.slice(0, 12)}... • Full memory enabled`
            ) : (
              'Press Enter to send • All conversations are remembered'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
