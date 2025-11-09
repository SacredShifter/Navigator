import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuraChatOptions {
  mode?: 'general' | 'admin' | 'command';
  context?: any;
  command?: {
    kind: string;
    payload: any;
  };
}

export function useAuraChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = async (message: string, options: AuraChatOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('aura-chat', {
        body: {
          message,
          ...options
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to get response');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Request failed');
      }

      return data.response;

    } catch (err: any) {
      const errorMessage = err.message || 'Connection failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const adminChat = async (message: string, context?: any) => {
    return chat(message, { mode: 'admin', context });
  };

  const executeCommand = async (command: { kind: string; payload: any }) => {
    return chat('Execute command', { mode: 'command', command });
  };

  return {
    loading,
    error,
    chat,
    adminChat,
    executeCommand
  };
}
