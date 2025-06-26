
export interface CommandAnalysis {
  type: string;
  description: string;
  warnings: string[];
  extractedCode?: string;
  urls: string[];
  parameters: Record<string, any>;
  codeLanguage?: string;
  packageInfo?: {
    packageName: string;
    packageManager: string;
    description: string;
    searchUrl?: string;
  };
}
