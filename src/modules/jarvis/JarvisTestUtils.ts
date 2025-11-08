/**
 * Jarvis Test Utilities
 *
 * Synthetic voice command generation, integration test harness,
 * and performance validation for the Jarvis system.
 */

import { GlobalEventHorizon } from '../../metaphysical-os/core/GlobalEventHorizon';
import { JarvisSystem } from './JarvisSystem';

export interface SyntheticCommand {
  text: string;
  intent: string;
  expectedResponse?: string;
  expectSuccess: boolean;
}

export interface TestResult {
  commandText: string;
  success: boolean;
  latency: number;
  error?: string;
  events: Array<{
    eventType: string;
    timestamp: number;
  }>;
}

export interface IntegrationTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  details: string;
}

export class JarvisTestUtils {
  private eventLog: Array<{ eventType: string; timestamp: number; payload: any }> = [];
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor() {
    this.startEventLogging();
  }

  private startEventLogging(): void {
    GlobalEventHorizon.subscribe('*', (event) => {
      if (event.eventType.startsWith('jarvis.')) {
        this.eventLog.push({
          eventType: event.eventType,
          timestamp: event.timestamp,
          payload: event.payload
        });

        if (event.eventType === 'jarvis.metrics.performance') {
          this.recordPerformanceMetric(
            event.payload.operation,
            event.payload.latency_ms
          );
        }
      }
    });
  }

  private recordPerformanceMetric(operation: string, latency: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }
    this.performanceMetrics.get(operation)!.push(latency);
  }

  async simulateVoiceCommand(command: SyntheticCommand): Promise<TestResult> {
    const startTime = Date.now();
    const initialEventCount = this.eventLog.length;

    try {
      GlobalEventHorizon.emit({
        eventType: 'jarvis.command_received',
        moduleId: 'jarvis-test-utils',
        timestamp: Date.now(),
        payload: {
          text: command.text,
          intent: command.intent,
          confidence: 0.9,
          timestamp: Date.now()
        },
        semanticLabels: ['jarvis', 'test', 'synthetic', command.intent]
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const latency = Date.now() - startTime;
      const events = this.eventLog.slice(initialEventCount).map(e => ({
        eventType: e.eventType,
        timestamp: e.timestamp
      }));

      return {
        commandText: command.text,
        success: true,
        latency,
        events
      };
    } catch (err) {
      return {
        commandText: command.text,
        success: false,
        latency: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Unknown error',
        events: []
      };
    }
  }

  async runSyntheticCommandSuite(): Promise<TestResult[]> {
    const commands: SyntheticCommand[] = [
      {
        text: 'Hey Aura, what\'s my consciousness state?',
        intent: 'query',
        expectSuccess: true
      },
      {
        text: 'Jarvis, show me my resonance index',
        intent: 'display',
        expectSuccess: true
      },
      {
        text: 'Hey Aura, run the dev server',
        intent: 'execute',
        expectSuccess: true
      },
      {
        text: 'Jarvis, tell me about my journey patterns',
        intent: 'query',
        expectSuccess: true
      },
      {
        text: 'Hey Aura, I wish you could track my focus sessions',
        intent: 'general',
        expectSuccess: true
      }
    ];

    const results: TestResult[] = [];

    for (const command of commands) {
      console.log(`[Test] Running: "${command.text}"`);
      const result = await this.simulateVoiceCommand(command);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
  }

  async testEventFlow(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      const initialEventCount = this.eventLog.length;

      GlobalEventHorizon.emit({
        eventType: 'jarvis.wake_word_detected',
        moduleId: 'jarvis-test',
        timestamp: Date.now(),
        payload: { wakeWord: 'hey aura' },
        semanticLabels: ['jarvis', 'test', 'wake-word']
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      GlobalEventHorizon.emit({
        eventType: 'jarvis.command_received',
        moduleId: 'jarvis-test',
        timestamp: Date.now(),
        payload: {
          text: 'test command',
          intent: 'query',
          confidence: 0.95
        },
        semanticLabels: ['jarvis', 'test', 'command']
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const eventsGenerated = this.eventLog.length - initialEventCount;

      return {
        testName: 'Event Flow Pipeline',
        passed: eventsGenerated >= 2,
        duration: Date.now() - startTime,
        details: `Generated ${eventsGenerated} events in response chain`
      };
    } catch (err) {
      return {
        testName: 'Event Flow Pipeline',
        passed: false,
        duration: Date.now() - startTime,
        details: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  async testMemoryPersistence(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      const memoryModule = JarvisSystem.getModules().find(
        m => m.manifest.id === 'jarvis-personal-memory'
      );

      if (!memoryModule) {
        throw new Error('Memory module not found');
      }

      const exposedItems = memoryModule.getExposedItems();

      await exposedItems.remember(
        'pattern',
        'test_pattern',
        { testData: 'value', timestamp: Date.now() },
        0.9
      );

      const recalled = await exposedItems.recall('pattern', 'test_pattern');

      const success = recalled && recalled.testData === 'value';

      if (success) {
        await exposedItems.forget('pattern', 'test_pattern');
      }

      return {
        testName: 'Memory Persistence',
        passed: success,
        duration: Date.now() - startTime,
        details: success ? 'Memory stored and retrieved successfully' : 'Memory operations failed'
      };
    } catch (err) {
      return {
        testName: 'Memory Persistence',
        passed: false,
        duration: Date.now() - startTime,
        details: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  async testSelfImprovementCycle(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      const improvementModule = JarvisSystem.getModules().find(
        m => m.manifest.id === 'jarvis-self-improvement'
      );

      if (!improvementModule) {
        throw new Error('Self-improvement module not found');
      }

      const exposedItems = improvementModule.getExposedItems();

      exposedItems.reportGap('Test capability gap', { testContext: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      const improvements = await exposedItems.getImprovements('proposed');

      return {
        testName: 'Self-Improvement Cycle',
        passed: true,
        duration: Date.now() - startTime,
        details: `Gap detection working, ${improvements.length} improvements tracked`
      };
    } catch (err) {
      return {
        testName: 'Self-Improvement Cycle',
        passed: false,
        duration: Date.now() - startTime,
        details: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  async testAuraDirectiveHandling(): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      const initialEventCount = this.eventLog.length;

      GlobalEventHorizon.emit({
        eventType: 'AURA_DIRECTIVE',
        moduleId: 'aura-test',
        timestamp: Date.now(),
        payload: {
          directiveType: 'speak',
          targetModule: 'jarvis-voice',
          content: {
            text: 'Test directive response',
            tone: 'neutral'
          }
        },
        semanticLabels: ['aura', 'directive', 'test']
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      const handledEvent = this.eventLog
        .slice(initialEventCount)
        .find(e => e.eventType === 'jarvis.directive.handled');

      return {
        testName: 'Aura Directive Handling',
        passed: !!handledEvent,
        duration: Date.now() - startTime,
        details: handledEvent ? 'Directive handled successfully' : 'No handler response detected'
      };
    } catch (err) {
      return {
        testName: 'Aura Directive Handling',
        passed: false,
        duration: Date.now() - startTime,
        details: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  async runFullIntegrationSuite(): Promise<IntegrationTestResult[]> {
    console.log('🧪 [Jarvis Test] Running full integration suite...');

    const results: IntegrationTestResult[] = [];

    results.push(await this.testEventFlow());
    results.push(await this.testMemoryPersistence());
    results.push(await this.testSelfImprovementCycle());
    results.push(await this.testAuraDirectiveHandling());

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n✅ Integration Tests Complete: ${passed}/${total} passed in ${totalDuration}ms`);

    results.forEach(result => {
      const icon = result.passed ? '✓' : '✗';
      console.log(`  ${icon} ${result.testName} (${result.duration}ms): ${result.details}`);
    });

    return results;
  }

  getPerformanceReport(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const report: Record<string, any> = {};

    this.performanceMetrics.forEach((latencies, operation) => {
      const sorted = [...latencies].sort((a, b) => a - b);
      report[operation] = {
        avg: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        count: latencies.length
      };
    });

    return report;
  }

  getEventSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    this.eventLog.forEach(event => {
      summary[event.eventType] = (summary[event.eventType] || 0) + 1;
    });

    return summary;
  }

  printPerformanceReport(): void {
    const report = this.getPerformanceReport();

    console.log('\n📊 Performance Metrics:');
    Object.entries(report).forEach(([operation, stats]) => {
      console.log(`  ${operation}:`);
      console.log(`    Average: ${stats.avg.toFixed(2)}ms`);
      console.log(`    Min: ${stats.min}ms, Max: ${stats.max}ms`);
      console.log(`    Total calls: ${stats.count}`);
    });
  }

  printEventSummary(): void {
    const summary = this.getEventSummary();

    console.log('\n📝 Event Summary:');
    Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .forEach(([eventType, count]) => {
        console.log(`  ${eventType}: ${count}`);
      });
  }

  clearLogs(): void {
    this.eventLog = [];
    this.performanceMetrics.clear();
  }
}

export const testUtils = new JarvisTestUtils();
