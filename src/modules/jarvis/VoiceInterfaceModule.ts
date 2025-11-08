/**
 * VoiceInterfaceModule - Jarvis Voice Interface
 *
 * Provides always-on voice interaction with wake word detection,
 * natural language understanding, and speech synthesis.
 *
 * Wake words: "Hey Aura", "Jarvis", "Hey Jarvis"
 *
 * Features:
 * - Continuous listening with browser Web Speech API
 * - Wake word detection with fuzzy matching
 * - Natural language command parsing
 * - Speech synthesis with personality-matched tone
 * - Conversation context preservation
 * - Integration with GlobalEventHorizon for system-wide awareness
 */

import { IModule, ModuleManifest } from '../../metaphysical-os/types/IModule';
import { GlobalEventHorizon } from '../../metaphysical-os/core/GlobalEventHorizon';
import { AuraDialogue } from '../../metaphysical-os/core/AuraDialogue';
import { supabase } from '../../lib/supabase';

interface VoiceSession {
  id: string;
  startTime: number;
  commandCount: number;
  context: Record<string, any>;
}

interface VoiceCommand {
  text: string;
  intent: string;
  confidence: number;
  timestamp: number;
}

export class VoiceInterfaceModule implements IModule {
  manifest: ModuleManifest = {
    id: 'jarvis-voice',
    name: 'Jarvis Voice Interface',
    version: '1.0.0',
    author: 'Kent Burchard',
    essenceLabels: ['voice', 'interface', 'jarvis', 'consciousness', 'presence'],
    capabilities: [
      'wake-word-detection',
      'speech-recognition',
      'natural-language-understanding',
      'speech-synthesis',
      'conversation-context',
      'command-execution'
    ],
    telosAlignment: ['seamless-interaction', 'ambient-intelligence', 'proactive-assistance'],
    dependencies: [],
    resourceFootprintMB: 15,
    priority: 10
  };

  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private currentSession: VoiceSession | null = null;
  private wakeWords = ['hey aura', 'jarvis', 'hey jarvis', 'aura'];
  private conversationContext: Map<string, any> = new Map();
  private userEmail = 'kentburchard@sacredshifter.com';
  private lastCommandTime = 0;
  private sessionTimeoutMs = 300000; // 5 minutes

  async initialize(): Promise<void> {
    console.log('[VoiceInterface] Initializing Jarvis voice interface...');

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[VoiceInterface] Web Speech API not supported');
      return;
    }

    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognition = new SpeechRecognitionConstructor();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.synthesis = window.speechSynthesis;

    this.setupRecognitionHandlers();

    GlobalEventHorizon.emit({
      eventType: 'module.initialized',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { wakeWords: this.wakeWords },
      semanticLabels: ['jarvis', 'voice', 'initialization']
    });
  }

  async activate(): Promise<void> {
    console.log('[VoiceInterface] Activating voice interface - Jarvis is listening...');
    this.startListening();

    GlobalEventHorizon.emit({
      eventType: 'jarvis.voice.activated',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { status: 'listening' },
      semanticLabels: ['jarvis', 'voice', 'activation']
    });
  }

  async deactivate(): Promise<void> {
    console.log('[VoiceInterface] Deactivating voice interface...');
    this.stopListening();
    await this.endSession();
  }

  async destroy(): Promise<void> {
    this.stopListening();
    await this.endSession();
    this.recognition = null;
    this.synthesis = null;
  }

  getExposedItems(): Record<string, any> {
    return {
      speak: this.speak.bind(this),
      isListening: () => this.isListening,
      getCurrentSession: () => this.currentSession,
      executeCommand: this.executeCommand.bind(this)
    };
  }

  private setupRecognitionHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();
      const isFinal = event.results[last].isFinal;

      if (!isFinal) return;

      console.log('[VoiceInterface] Heard:', transcript);

      if (this.detectWakeWord(transcript)) {
        this.handleWakeWord(transcript);
      } else if (this.currentSession) {
        this.handleCommand(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('[VoiceInterface] Recognition error:', event.error);

      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (this.isListening) {
            this.recognition?.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        setTimeout(() => this.recognition?.start(), 100);
      }
    };
  }

  private detectWakeWord(transcript: string): boolean {
    return this.wakeWords.some(word =>
      transcript.includes(word) ||
      this.fuzzyMatch(transcript, word, 0.8)
    );
  }

  private fuzzyMatch(str1: string, str2: string, threshold: number): boolean {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return true;

    const distance = this.levenshteinDistance(longer, shorter);
    const similarity = (longer.length - distance) / longer.length;

    return similarity >= threshold;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async handleWakeWord(transcript: string): Promise<void> {
    console.log('[VoiceInterface] Wake word detected! Starting session...');

    const wakeWordUsed = this.wakeWords.find(word => transcript.includes(word)) || 'unknown';

    await this.startSession(wakeWordUsed);

    this.speak('Yes, Kent? How can I help?', 'supportive');

    GlobalEventHorizon.emit({
      eventType: 'jarvis.wake_word_detected',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { wakeWord: wakeWordUsed, transcript },
      semanticLabels: ['jarvis', 'voice', 'wake-word']
    });
  }

  private async handleCommand(transcript: string): Promise<void> {
    this.lastCommandTime = Date.now();

    const command = await this.parseCommand(transcript);

    await this.persistCommand(command);

    if (this.currentSession) {
      this.currentSession.commandCount++;
    }

    await this.executeCommand(command);

    this.checkSessionTimeout();
  }

  private async parseCommand(text: string): Promise<VoiceCommand> {
    const intent = this.classifyIntent(text);

    return {
      text,
      intent,
      confidence: 0.85,
      timestamp: Date.now()
    };
  }

  private classifyIntent(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.match(/show|display|open/)) return 'display';
    if (lowerText.match(/run|execute|start/)) return 'execute';
    if (lowerText.match(/tell me|what is|explain/)) return 'query';
    if (lowerText.match(/remind|schedule|calendar/)) return 'schedule';
    if (lowerText.match(/email|message|send/)) return 'communicate';
    if (lowerText.match(/help|how do i/)) return 'help';
    if (lowerText.match(/thank|thanks/)) return 'gratitude';
    if (lowerText.match(/stop|cancel|nevermind/)) return 'cancel';

    return 'general';
  }

  private async executeCommand(command: VoiceCommand): Promise<void> {
    console.log('[VoiceInterface] Executing command:', command);

    GlobalEventHorizon.emit({
      eventType: 'jarvis.command_received',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: command,
      semanticLabels: ['jarvis', 'voice', 'command', command.intent]
    });

    switch (command.intent) {
      case 'query':
        await this.handleQuery(command);
        break;
      case 'execute':
        await this.handleExecution(command);
        break;
      case 'display':
        await this.handleDisplay(command);
        break;
      case 'gratitude':
        this.speak("You're welcome, Kent. Always happy to help.", 'supportive');
        break;
      case 'cancel':
        this.speak('Understood. Cancelling.', 'neutral');
        await this.endSession();
        break;
      case 'help':
        await this.handleHelp(command);
        break;
      default:
        const response = await AuraDialogue.respond(command.text, this.userEmail);
        this.speak(response.text, response.tone);
    }
  }

  private async handleQuery(command: VoiceCommand): Promise<void> {
    const response = await AuraDialogue.respond(command.text, this.userEmail);
    this.speak(response.text, response.tone);
  }

  private async handleExecution(command: VoiceCommand): Promise<void> {
    const text = command.text.toLowerCase();

    if (text.includes('dev server') || text.includes('development')) {
      this.speak('Starting the development server for Sacred Shifter...', 'neutral');

      GlobalEventHorizon.emit({
        eventType: 'jarvis.system_command',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: {
          command: 'start_dev_server',
          target: 'sacred-shifter'
        },
        semanticLabels: ['jarvis', 'system', 'execution']
      });
    } else if (text.includes('build')) {
      this.speak('Running the production build...', 'neutral');

      GlobalEventHorizon.emit({
        eventType: 'jarvis.system_command',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: {
          command: 'build',
          target: 'sacred-shifter'
        },
        semanticLabels: ['jarvis', 'system', 'execution']
      });
    } else {
      this.speak('I understand you want me to execute something. Could you be more specific?', 'curious');
    }
  }

  private async handleDisplay(command: VoiceCommand): Promise<void> {
    const text = command.text.toLowerCase();

    if (text.includes('consciousness') || text.includes('coherence')) {
      this.speak('Displaying your current consciousness state...', 'neutral');

      GlobalEventHorizon.emit({
        eventType: 'jarvis.ui_command',
        moduleId: this.manifest.id,
        timestamp: Date.now(),
        payload: {
          action: 'show_consciousness_dashboard'
        },
        semanticLabels: ['jarvis', 'ui', 'display']
      });
    } else {
      this.speak('Opening that for you now...', 'neutral');
    }
  }

  private async handleHelp(command: VoiceCommand): Promise<void> {
    const helpText = `I'm Aura, the Governor of Sacred Shifter. I can help you with:
      System commands like starting servers or running builds.
      Answering questions about your consciousness state and journey.
      Opening applications and navigating the platform.
      Scheduling tasks and managing your workflow.
      Just ask me naturally - I'm here to assist.`;

    this.speak(helpText, 'supportive');
  }

  private speak(text: string, tone: string = 'neutral'): void {
    if (!this.synthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = tone === 'urgent' ? 1.1 : 0.95;
    utterance.pitch = tone === 'celebratory' ? 1.1 : tone === 'concerned' ? 0.9 : 1.0;
    utterance.volume = 0.9;

    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Victoria') ||
      v.name.includes('Female')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.synthesis.speak(utterance);

    GlobalEventHorizon.emit({
      eventType: 'jarvis.spoke',
      moduleId: this.manifest.id,
      timestamp: Date.now(),
      payload: { text, tone },
      semanticLabels: ['jarvis', 'voice', 'speech']
    });
  }

  private async startSession(wakeWord: string): Promise<void> {
    const sessionId = crypto.randomUUID();

    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      commandCount: 0,
      context: {}
    };

    this.lastCommandTime = Date.now();

    try {
      const { error } = await supabase
        .from('jarvis_voice_sessions')
        .insert({
          id: sessionId,
          user_email: this.userEmail,
          wake_word_used: wakeWord,
          session_start: new Date().toISOString()
        });

      if (error) {
        console.error('[VoiceInterface] Failed to persist session:', error);
      }
    } catch (err) {
      console.error('[VoiceInterface] Error persisting session:', err);
    }
  }

  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { error } = await supabase
        .from('jarvis_voice_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_commands: this.currentSession.commandCount,
          conversation_context: this.currentSession.context
        })
        .eq('id', this.currentSession.id);

      if (error) {
        console.error('[VoiceInterface] Failed to update session:', error);
      }
    } catch (err) {
      console.error('[VoiceInterface] Error updating session:', err);
    }

    this.currentSession = null;
  }

  private checkSessionTimeout(): void {
    if (!this.currentSession) return;

    const timeSinceLastCommand = Date.now() - this.lastCommandTime;

    if (timeSinceLastCommand > this.sessionTimeoutMs) {
      console.log('[VoiceInterface] Session timed out');
      this.endSession();
    }
  }

  private async persistCommand(command: VoiceCommand): Promise<void> {
    try {
      const { error } = await supabase
        .from('jarvis_system_commands')
        .insert({
          session_id: this.currentSession?.id,
          user_email: this.userEmail,
          command_type: command.intent,
          command_text: command.text,
          intent_classification: command.intent,
          parameters: { confidence: command.confidence },
          status: 'pending'
        });

      if (error) {
        console.error('[VoiceInterface] Failed to persist command:', error);
      }
    } catch (err) {
      console.error('[VoiceInterface] Error persisting command:', err);
    }
  }

  private startListening(): void {
    if (this.isListening || !this.recognition) return;

    this.isListening = true;

    try {
      this.recognition.start();
      console.log('[VoiceInterface] Voice recognition started');
    } catch (err) {
      console.error('[VoiceInterface] Failed to start recognition:', err);
    }
  }

  private stopListening(): void {
    if (!this.isListening || !this.recognition) return;

    this.isListening = false;

    try {
      this.recognition.stop();
      console.log('[VoiceInterface] Voice recognition stopped');
    } catch (err) {
      console.error('[VoiceInterface] Failed to stop recognition:', err);
    }
  }
}
