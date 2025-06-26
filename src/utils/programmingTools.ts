
export interface ProgrammingTool {
  name: string;
  description: string;
}

export const PROGRAMMING_TOOLS: Record<string, ProgrammingTool> = {
  python: {
    name: 'Python',
    description: 'High-level programming language for general-purpose programming',
  },
  python3: {
    name: 'Python 3',
    description: 'Python 3.x interpreter for running Python scripts',
  },
  flutter: {
    name: 'Flutter',
    description: 'Google\'s UI toolkit for building cross-platform applications',
  },
  dart: {
    name: 'Dart',
    description: 'Programming language optimized for building mobile, desktop, server, and web applications',
  },
};
