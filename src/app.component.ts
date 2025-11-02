import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService, PromptFramework, frameworkOptions } from './services/ai.service';

interface StructuredPrompt {
  role: string;
  task: string;
  format: string;
  example: string;
  input: string;
  context: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class AppComponent {
  private readonly aiService = inject(AiService);

  viewMode = signal<'simple' | 'structured'>('simple');
  outputFormat = signal<'markdown' | 'json' | 'xml' | 'text'>('markdown');
  simplePrompt = signal('');
  structuredPrompt = signal<StructuredPrompt>({
    role: '',
    task: '',
    format: '',
    example: '',
    input: '',
    context: ''
  });
  
  promptFramework = signal<PromptFramework>('standard');
  readonly frameworkOptions = frameworkOptions;

  readonly selectedFrameworkDescription = computed(() => {
    return this.frameworkOptions.find(f => f.id === this.promptFramework())?.description ?? '';
  });

  generatedPrompt = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);
  copied = signal(false);
  theme = signal<'light' | 'dark'>('dark');

  constructor() {
    // A more robust solution could check localStorage or prefers-color-scheme
    if (typeof document !== 'undefined' && !document.documentElement.classList.contains('dark')) {
       document.documentElement.classList.add('dark');
    }
  }

  toggleTheme(): void {
    this.theme.update(current => {
      const newTheme = current === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return newTheme;
    });
  }

  generatePrompt(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.generatedPrompt.set('');

    let userInput = '';
    if (this.viewMode() === 'simple') {
      userInput = this.simplePrompt();
    } else {
      const sp = this.structuredPrompt();
      userInput = `
        Role: ${sp.role}
        Task: ${sp.task}
        Format: ${sp.format}
        Example: ${sp.example}
        Input: ${sp.input}
        Context: ${sp.context}
      `.trim();
    }
    
    if (!userInput.trim()) {
        this.error.set("Please provide some input to generate a prompt.");
        this.isLoading.set(false);
        return;
    }

    this.aiService.generateStructuredPrompt(userInput, this.outputFormat(), this.promptFramework())
      .then(result => {
        this.generatedPrompt.set(result);
      })
      .catch(e => {
        console.error(e);
        this.error.set('Failed to generate prompt. Please check the console for details.');
      })
      .finally(() => {
        this.isLoading.set(false);
      });
  }

  copyToClipboard(): void {
    if (!this.generatedPrompt()) return;
    navigator.clipboard.writeText(this.generatedPrompt()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  updateStructuredPrompt(field: keyof StructuredPrompt, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.structuredPrompt.update(current => ({...current, [field]: value}));
  }
}