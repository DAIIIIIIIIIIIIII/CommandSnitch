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

// Package managers and their configurations
const PACKAGE_MANAGERS = {
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

// Programming languages and tools
const PROGRAMMING_TOOLS = {
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

const followRedirects = async (url: string): Promise<string> => {
  try {
    // First try to get the final URL by following redirects
    const response = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow',
      mode: 'no-cors' 
    });
    
    // If we can get the response URL, use that
    if (response.url && response.url !== url) {
      console.log(`Redirect detected: ${url} -> ${response.url}`);
      return response.url;
    }
    
    return url;
  } catch (error) {
    // If HEAD request fails, return original URL
    console.log(`Redirect detection failed for ${url}, using original URL`);
    return url;
  }
};

const downloadContent = async (url: string): Promise<string> => {
  try {
    // Step 1: Try to follow redirects to get the final URL
    const finalUrl = await followRedirects(url);
    console.log(`🔍 DOWNLOAD DEBUG - Original: ${url}`);
    console.log(`🔍 DOWNLOAD DEBUG - Final URL: ${finalUrl}`);
    
    // Step 2: Try multiple CORS proxies in order of reliability
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://api.allorigins.win/get?url=',
      'https://cors-anywhere.herokuapp.com/'
    ];
    
    for (const proxyUrl of corsProxies) {
      try {
        console.log(`🔍 DOWNLOAD DEBUG - Trying proxy: ${proxyUrl}`);
        
        let response;
        let content;
        
        if (proxyUrl.includes('allorigins')) {
          // Special handling for allorigins proxy
          response = await fetch(`${proxyUrl}${encodeURIComponent(finalUrl)}`);
          if (response.ok) {
            const data = await response.json();
            content = data.contents;
          }
        } else {
          // Standard proxy handling
          response = await fetch(`${proxyUrl}${finalUrl}`);
          if (response.ok) {
            content = await response.text();
          }
        }
        
        if (content && content.trim()) {
          console.log(`✅ DOWNLOAD SUCCESS using ${proxyUrl}`);
          console.log(`✅ CONTENT LENGTH: ${content.length}`);
          console.log(`✅ CONTENT PREVIEW:`, content.substring(0, 300) + (content.length > 300 ? '...' : ''));
          return content;
        }
        
      } catch (proxyError) {
        console.log(`❌ PROXY FAILED ${proxyUrl}:`, proxyError);
        continue; // Try next proxy
      }
    }
    
    // If all proxies fail, throw an error
    throw new Error('All CORS proxies failed');
    
  } catch (error) {
    console.error('❌ DOWNLOAD COMPLETELY FAILED:', error);
    
    // Return a more informative error message based on the URL
    if (url.includes('christitus.com/win')) {
      return `# ChrisTitus Windows Utility Script
# This script typically contains PowerShell commands for Windows optimization

# Original URL: ${url}
# Expected to redirect to: https://github.com/ChrisTitusTech/winutil/releases/latest/download/winutil.ps1

# ⚠️  WARNING: Unable to download the actual script content
# This command would download and execute a PowerShell script for Windows system optimization

# Common features of this script include:
# - Windows debloating tools
# - System optimization settings  
# - Software installation utilities
# - Registry modifications

# SECURITY NOTICE:
# This script makes significant system changes
# Always review scripts before running with 'iex' (Invoke-Expression)

Write-Host "ChrisTitus Windows Utility - Content not available for preview"`;
    }
    
    // Generic fallback message
    return `# Script Download Failed
# Original URL: ${url}

# ⚠️  Unable to download script content for preview
# This PowerShell command would download and execute code from the internet

# The command structure:
# irm "${url}" | iex
# 
# - irm (Invoke-RestMethod) downloads the content
# - | (pipe) passes it to the next command  
# - iex (Invoke-Expression) executes the downloaded code

# SECURITY WARNING:
# Only run this command if you completely trust the source
# Consider downloading and reviewing the script manually first

Write-Host "Script content not available for preview - download failed"`;
  }
};

const detectCodeLanguage = (content: string): string => {
  if (content.includes('#!/bin/bash') || content.includes('#!/bin/sh')) {
    return 'bash';
  } else if (content.includes('function ') || content.includes('$') || content.includes('param(')) {
    return 'powershell';
  } else if (content.includes('import ') || content.includes('def ') || content.includes('python')) {
    return 'python';
  } else if (content.includes('const ') || content.includes('let ') || content.includes('var ')) {
    return 'javascript';
  } else if (content.includes('#include') || content.includes('int main')) {
    return 'c';
  } else if (content.includes('public class') || content.includes('import java')) {
    return 'java';
  }
  return 'text';
};

const extractUrlsFromCode = (content: string): string[] => {
  const urlRegex = /https?:\/\/[^\s'"<>()]+/g;
  const urls = content.match(urlRegex) || [];
  // Remove duplicates using Set
  return [...new Set(urls)];
};

export const analyzeCommand = async (command: string): Promise<CommandAnalysis> => {
  const result: CommandAnalysis = {
    type: 'Unknown',
    description: 'Unrecognized command',
    warnings: [],
    urls: [],
    parameters: {},
    codeLanguage: 'text'
  };

  const cleanCommand = command.trim();
  
  // Extract URLs from command
  const commandUrlRegex = /https?:\/\/[^\s'"]+/g;
  const commandUrls = cleanCommand.match(commandUrlRegex) || [];

  // Check for package managers first
  for (const [key, manager] of Object.entries(PACKAGE_MANAGERS)) {
    if (cleanCommand.startsWith(key + ' ') || cleanCommand.includes(' ' + key + ' ')) {
      result.type = `${manager.name} - Package Manager`;
      result.description = manager.description;
      result.extractedCode = cleanCommand;
      result.codeLanguage = 'bash';
      
      // Extract package name
      const match = cleanCommand.match(manager.installPattern);
      if (match) {
        const packageName = match[1] || match[2]; // Some patterns have multiple groups
        if (packageName) {
          result.packageInfo = {
            packageName: packageName,
            packageManager: manager.name,
            description: `Installing package: ${packageName}`,
            searchUrl: manager.searchUrlTemplate.replace('{package}', packageName)
          };
        }
      }
      
      if (cleanCommand.includes('install') || cleanCommand.includes('add')) {
        result.warnings.push('This command will install software on your system');
      }
      
      return result;
    }
  }

  // Check for programming tools
  for (const [key, tool] of Object.entries(PROGRAMMING_TOOLS)) {
    if (cleanCommand.startsWith(key + ' ') || cleanCommand === key) {
      result.type = `${tool.name} - Programming Tool`;
      result.description = tool.description;
      result.extractedCode = cleanCommand;
      result.codeLanguage = key === 'python' || key === 'python3' ? 'python' : 'bash';
      
      if (cleanCommand.includes('-c')) {
        result.warnings.push('This command executes inline code');
      }
      
      return result;
    }
  }

  // Analyze PowerShell commands (iwr, Invoke-WebRequest, irm, Invoke-RestMethod)
  if (cleanCommand.includes('iwr') || cleanCommand.includes('Invoke-WebRequest') || 
      cleanCommand.includes('irm') || cleanCommand.includes('Invoke-RestMethod')) {
    result.type = 'PowerShell - Web Request';
    result.description = 'PowerShell command to download web content';
    
    // If there's a URL, download the content
    if (commandUrls.length > 0) {
      try {
        console.log(`Analyzing PowerShell command with URL: ${commandUrls[0]}`);
        const content = await downloadContent(commandUrls[0]);
        result.extractedCode = content;
        result.codeLanguage = detectCodeLanguage(content);
        result.urls = [...new Set(extractUrlsFromCode(content))]; // Deduplicate URLs
        
        // Analyze content type
        if (content.includes('#!/bin/bash') || content.includes('#!/bin/sh')) {
          result.warnings.push('Content is a bash script that would be executed');
        } else if (content.includes('function ') || content.includes('$') || content.includes('param(')) {
          result.warnings.push('Content contains PowerShell code');
        } else if (content.includes('python') || content.includes('import ')) {
          result.warnings.push('Content contains Python code');
        }
        
        // Generic warning for automatic execution
        if (cleanCommand.includes('| iex') || cleanCommand.includes('| Invoke-Expression')) {
          result.warnings.push('WARNING: The command will automatically execute the downloaded code!');
        }
        
      } catch (error) {
        console.error('PowerShell download error:', error);
        result.extractedCode = cleanCommand; // Show original command as fallback
        result.codeLanguage = 'powershell';
        result.warnings.push('Unable to download content for preview');
        result.warnings.push('Command would download and execute remote code - exercise extreme caution!');
      }
    } else {
      result.extractedCode = cleanCommand;
      result.codeLanguage = 'powershell';
    }
    
    if (cleanCommand.includes('select -ExpandProperty Content')) {
      result.parameters['expansion'] = 'extracts only text content';
    }
  }
  
  // Analyze curl commands
  else if (cleanCommand.startsWith('curl')) {
    result.type = 'cURL - HTTP Download';
    result.description = 'Command to download content from URL';
    
    const curlParams: Record<string, any> = {};
    
    if (cleanCommand.includes('-s') || cleanCommand.includes('--silent')) {
      curlParams['mode'] = 'silent';
    }
    if (cleanCommand.includes('-L') || cleanCommand.includes('--location')) {
      curlParams['redirect'] = 'follow redirects';
    }
    if (cleanCommand.includes('-k') || cleanCommand.includes('--insecure')) {
      curlParams['SSL'] = 'ignore certificates';
      result.warnings.push('Command ignores SSL certificate verification');
    }
    
    result.parameters = curlParams;

    // Download content if there's a URL
    if (commandUrls.length > 0) {
      try {
        const content = await downloadContent(commandUrls[0]);
        result.extractedCode = content;
        result.codeLanguage = detectCodeLanguage(content);
        result.urls = extractUrlsFromCode(content);
        
        // Check if content will be executed
        if (cleanCommand.includes('| bash') || cleanCommand.includes('| sh')) {
          result.warnings.push('DANGER: Command will automatically execute the downloaded code!');
        }
      } catch (error) {
        result.extractedCode = `Download error: ${error}`;
        result.warnings.push('Unable to download content for preview');
      }
    }
  }
  
  // Analyze wget commands
  else if (cleanCommand.startsWith('wget')) {
    result.type = 'wget - File Download';
    result.description = 'Command to download files from internet';
    
    if (cleanCommand.includes('-O-') || cleanCommand.includes('--output-document=-')) {
      result.parameters['output'] = 'stdout (direct output)';
    }
    
    // Download content if there's a URL
    if (commandUrls.length > 0) {
      try {
        const content = await downloadContent(commandUrls[0]);
        result.extractedCode = content;
        result.codeLanguage = detectCodeLanguage(content);
        result.urls = extractUrlsFromCode(content);
        
        if (cleanCommand.includes('| bash') || cleanCommand.includes('| sh')) {
          result.warnings.push('DANGER: Command will automatically execute the downloaded file!');
        }
      } catch (error) {
        result.extractedCode = `Download error: ${error}`;
        result.warnings.push('Unable to download content for preview');
      }
    }
  }
  
  // Analyze Python commands
  else if (cleanCommand.includes('python') && cleanCommand.includes('-c')) {
    result.type = 'Python - Inline Execution';
    result.description = 'Inline Python code execution';
    result.codeLanguage = 'python';
    
    const pythonCodeMatch = cleanCommand.match(/-c\s+["']([^"']+)["']/);
    if (pythonCodeMatch) {
      result.extractedCode = pythonCodeMatch[1];
      result.urls = extractUrlsFromCode(result.extractedCode);
    }
    
    if (cleanCommand.includes('urllib') || cleanCommand.includes('requests')) {
      result.warnings.push('Python code makes network requests');
    }
  }
  
  // Analyze npm/npx
  else if (cleanCommand.startsWith('npm ') || cleanCommand.startsWith('npx ')) {
    result.type = cleanCommand.startsWith('npm ') ? 'npm - Node Package Manager' : 'npx - Node Package Execute';
    result.description = 'Command to manage or execute Node.js packages';
    
    if (cleanCommand.includes('install') && cleanCommand.includes('-g')) {
      result.warnings.push('Global package installation');
    }
  }

  // General security checks
  if (cleanCommand.includes('rm -rf') || cleanCommand.includes('del /f') || cleanCommand.includes('format')) {
    result.warnings.push('DANGER: Command might delete files or format disks!');
  }

  if (cleanCommand.includes('chmod +x') || cleanCommand.includes('sudo')) {
    result.warnings.push('Command requires elevated permissions or modifies file permissions');
  }

  return result;
};
