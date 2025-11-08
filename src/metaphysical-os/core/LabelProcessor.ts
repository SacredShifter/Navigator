export interface LabelContext {
  userProfile?: string;
  chemicalState?: string;
  regulationLevel?: string;
  [key: string]: any;
}

class LabelProcessorSingleton {
  private labelRegistry: Map<string, string[]> = new Map();

  registerLabels(entityId: string, labels: string[]): void {
    this.labelRegistry.set(entityId, labels);
  }

  getLabels(entityId: string): string[] {
    return this.labelRegistry.get(entityId) || [];
  }

  hasLabel(entityId: string, label: string): boolean {
    const labels = this.getLabels(entityId);
    return labels.includes(label);
  }

  matchLabels(entityId: string, targetLabels: string[]): number {
    const entityLabels = this.getLabels(entityId);
    const matches = entityLabels.filter(label => targetLabels.includes(label));
    return matches.length / Math.max(targetLabels.length, 1);
  }

  renderMessage(template: string, context: LabelContext): string {
    let rendered = template;

    Object.entries(context).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return rendered;
  }

  detectDissonance(labels1: string[], labels2: string[]): number {
    const opposites: Record<string, string[]> = {
      'grounding': ['expansion', 'psychedelic'],
      'safety': ['risk', 'danger'],
      'containment': ['liberation', 'freedom'],
      'structure': ['chaos', 'flow'],
      'mind': ['body', 'somatic'],
      'control': ['surrender', 'release']
    };

    let dissonanceScore = 0;
    labels1.forEach(label1 => {
      labels2.forEach(label2 => {
        if (opposites[label1]?.includes(label2) || opposites[label2]?.includes(label1)) {
          dissonanceScore += 1;
        }
      });
    });

    return dissonanceScore;
  }

  findSemanticMatches(targetLabels: string[], candidateIds: string[]): string[] {
    const scored = candidateIds.map(id => ({
      id,
      score: this.matchLabels(id, targetLabels)
    }));

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.id);
  }
}

export const LabelProcessor = new LabelProcessorSingleton();
