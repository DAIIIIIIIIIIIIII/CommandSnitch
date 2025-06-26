
export interface PackageManager {
  name: string;
  description: string;
  searchUrlTemplate: string;
  installPattern: RegExp;
}

export const PACKAGE_MANAGERS: Record<string, PackageManager> = {
  pip: {
    name: 'pip',
    description: 'Python package installer, the standard package manager for Python',
    searchUrlTemplate: 'https://pypi.org/project/{package}/',
    installPattern: /pip\s+install\s+([^\s]+)/,
  },
  uv: {
    name: 'uv',
    description: 'Ultra-fast Python package installer and resolver',
    searchUrlTemplate: 'https://pypi.org/project/{package}/',
    installPattern: /uv\s+add\s+([^\s]+)|uv\s+pip\s+install\s+([^\s]+)/,
  },
  npm: {
    name: 'npm',
    description: 'Node Package Manager, the default package manager for Node.js',
    searchUrlTemplate: 'https://www.npmjs.com/package/{package}',
    installPattern: /npm\s+install\s+([^\s]+)|npm\s+i\s+([^\s]+)/,
  },
  yarn: {
    name: 'yarn',
    description: 'Fast, reliable, and secure dependency management for JavaScript',
    searchUrlTemplate: 'https://www.npmjs.com/package/{package}',
    installPattern: /yarn\s+add\s+([^\s]+)/,
  },
  pnpm: {
    name: 'pnpm',
    description: 'Fast, disk space efficient package manager for Node.js',
    searchUrlTemplate: 'https://www.npmjs.com/package/{package}',
    installPattern: /pnpm\s+add\s+([^\s]+)|pnpm\s+install\s+([^\s]+)/,
  },
  choco: {
    name: 'Chocolatey',
    description: 'Package manager for Windows, automates software installation',
    searchUrlTemplate: 'https://chocolatey.org/packages/{package}',
    installPattern: /choco\s+install\s+([^\s]+)/,
  },
  winget: {
    name: 'winget',
    description: 'Windows Package Manager, native package manager for Windows 10/11',
    searchUrlTemplate: 'https://winget.run/pkg/{package}',
    installPattern: /winget\s+install\s+(?:--id\s+)?([^\s-]+(?:\.[^\s-]+)*)/,
  },
  scoop: {
    name: 'Scoop',
    description: 'Command-line installer for Windows, focuses on open-source software',
    searchUrlTemplate: 'https://scoop.sh/#/apps?q={package}',
    installPattern: /scoop\s+install\s+([^\s]+)/,
  },
  conda: {
    name: 'Conda',
    description: 'Package manager for Python and other languages, part of Anaconda',
    searchUrlTemplate: 'https://anaconda.org/search?q={package}',
    installPattern: /conda\s+install\s+([^\s]+)/,
  },
  mamba: {
    name: 'Mamba',
    description: 'Fast, robust, and cross-platform package manager (conda alternative)',
    searchUrlTemplate: 'https://anaconda.org/search?q={package}',
    installPattern: /mamba\s+install\s+([^\s]+)/,
  },
  cargo: {
    name: 'Cargo',
    description: 'Rust package manager and build tool',
    searchUrlTemplate: 'https://crates.io/crates/{package}',
    installPattern: /cargo\s+install\s+([^\s]+)/,
  },
  gem: {
    name: 'RubyGems',
    description: 'Package manager for Ruby programming language',
    searchUrlTemplate: 'https://rubygems.org/gems/{package}',
    installPattern: /gem\s+install\s+([^\s]+)/,
  },
  go: {
    name: 'Go Modules',
    description: 'Go programming language module system',
    searchUrlTemplate: 'https://pkg.go.dev/{package}',
    installPattern: /go\s+install\s+([^\s@]+)/,
  },
};
