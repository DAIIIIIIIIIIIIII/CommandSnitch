
import { CommandAnalysis } from '../types/commandAnalysis';
import { PACKAGE_MANAGERS } from './packageManagers';
import { PROGRAMMING_TOOLS } from './programmingTools';
import { downloadContent, detectCodeLanguage, extractUrlsFromCode } from './codeDetection';

export const analyzePackageManager = (command: string): CommandAnalysis | null => {
  for (const [key, manager] of Object.entries(PACKAGE_MANAGERS)) {
    if (command.startsWith(key + ' ') || command.includes(' ' + key + ' ')) {
      const result: CommandAnalysis = {
        type: `${manager.name} - Package Manager`,
        description: manager.description,
        extractedCode: command,
        codeLanguage: 'bash',
        warnings: [],
        urls: [],
        parameters: {},
      };
      
      // Extract package name
      const match = command.match(manager.installPattern);
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
      
      if (command.includes('install') || command.includes('add')) {
        result.warnings.push('This command will install software on your system');
      }
      
      return result;
    }
  }
  return null;
};

export const analyzeProgrammingTool = (command: string): CommandAnalysis | null => {
  for (const [key, tool] of Object.entries(PROGRAMMING_TOOLS)) {
    if (command.startsWith(key + ' ') || command === key) {
      const result: CommandAnalysis = {
        type: `${tool.name} - Programming Tool`,
        description: tool.description,
        extractedCode: command,
        codeLanguage: key === 'python' || key === 'python3' ? 'python' : 'bash',
        warnings: [],
        urls: [],
        parameters: {},
      };
      
      if (command.includes('-c')) {
        result.warnings.push('This command executes inline code');
      }
      
      return result;
    }
  }
  return null;
};

export const analyzePowerShellCommand = async (command: string): Promise<CommandAnalysis | null> => {
  if (!command.includes('iwr') && !command.includes('Invoke-WebRequest') && 
      !command.includes('irm') && !command.includes('Invoke-RestMethod')) {
    return null;
  }

  const result: CommandAnalysis = {
    type: 'PowerShell - Web Request',
    description: 'PowerShell command to download web content',
    warnings: [],
    urls: [],
    parameters: {},
    codeLanguage: 'powershell'
  };

  // Extract URLs from command
  const commandUrlRegex = /https?:\/\/[^\s'"]+/g;
  const commandUrls = command.match(commandUrlRegex) || [];

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
      if (command.includes('| iex') || command.includes('| Invoke-Expression')) {
        result.warnings.push('WARNING: The command will automatically execute the downloaded code!');
      }
      
    } catch (error) {
      console.error('PowerShell download error:', error);
      result.extractedCode = command; // Show original command as fallback
      result.codeLanguage = 'powershell';
      result.warnings.push('Unable to download content for preview');
      result.warnings.push('Command would download and execute remote code - exercise extreme caution!');
    }
  } else {
    result.extractedCode = command;
    result.codeLanguage = 'powershell';
  }
  
  if (command.includes('select -ExpandProperty Content')) {
    result.parameters['expansion'] = 'extracts only text content';
  }

  return result;
};

export const analyzeCurlCommand = async (command: string): Promise<CommandAnalysis | null> => {
  if (!command.startsWith('curl')) {
    return null;
  }

  const result: CommandAnalysis = {
    type: 'cURL - HTTP Download',
    description: 'Command to download content from URL',
    warnings: [],
    urls: [],
    parameters: {},
    codeLanguage: 'bash'
  };
  
  const curlParams: Record<string, any> = {};
  
  if (command.includes('-s') || command.includes('--silent')) {
    curlParams['mode'] = 'silent';
  }
  if (command.includes('-L') || command.includes('--location')) {
    curlParams['redirect'] = 'follow redirects';
  }
  if (command.includes('-k') || command.includes('--insecure')) {
    curlParams['SSL'] = 'ignore certificates';
    result.warnings.push('Command ignores SSL certificate verification');
  }
  
  result.parameters = curlParams;

  // Extract URLs from command
  const commandUrlRegex = /https?:\/\/[^\s'"]+/g;
  const commandUrls = command.match(commandUrlRegex) || [];

  // Download content if there's a URL
  if (commandUrls.length > 0) {
    try {
      const content = await downloadContent(commandUrls[0]);
      result.extractedCode = content;
      result.codeLanguage = detectCodeLanguage(content);
      result.urls = extractUrlsFromCode(content);
      
      // Check if content will be executed
      if (command.includes('| bash') || command.includes('| sh')) {
        result.warnings.push('DANGER: Command will automatically execute the downloaded code!');
      }
    } catch (error) {
      result.extractedCode = `Download error: ${error}`;
      result.warnings.push('Unable to download content for preview');
    }
  }

  return result;
};

export const analyzeWgetCommand = async (command: string): Promise<CommandAnalysis | null> => {
  if (!command.startsWith('wget')) {
    return null;
  }

  const result: CommandAnalysis = {
    type: 'wget - File Download',
    description: 'Command to download files from internet',
    warnings: [],
    urls: [],
    parameters: {},
    codeLanguage: 'bash'
  };
  
  if (command.includes('-O-') || command.includes('--output-document=-')) {
    result.parameters['output'] = 'stdout (direct output)';
  }

  // Extract URLs from command
  const commandUrlRegex = /https?:\/\/[^\s'"]+/g;
  const commandUrls = command.match(commandUrlRegex) || [];
  
  // Download content if there's a URL
  if (commandUrls.length > 0) {
    try {
      const content = await downloadContent(commandUrls[0]);
      result.extractedCode = content;
      result.codeLanguage = detectCodeLanguage(content);
      result.urls = extractUrlsFromCode(content);
      
      if (command.includes('| bash') || command.includes('| sh')) {
        result.warnings.push('DANGER: Command will automatically execute the downloaded file!');
      }
    } catch (error) {
      result.extractedCode = `Download error: ${error}`;
      result.warnings.push('Unable to download content for preview');
    }
  }

  return result;
};

export const analyzePythonCommand = (command: string): CommandAnalysis | null => {
  if (!command.includes('python') || !command.includes('-c')) {
    return null;
  }

  const result: CommandAnalysis = {
    type: 'Python - Inline Execution',
    description: 'Inline Python code execution',
    codeLanguage: 'python',
    warnings: [],
    urls: [],
    parameters: {},
  };
  
  const pythonCodeMatch = command.match(/-c\s+["']([^"']+)["']/);
  if (pythonCodeMatch) {
    result.extractedCode = pythonCodeMatch[1];
    result.urls = extractUrlsFromCode(result.extractedCode);
  }
  
  if (command.includes('urllib') || command.includes('requests')) {
    result.warnings.push('Python code makes network requests');
  }

  return result;
};

export const analyzeNpmCommand = (command: string): CommandAnalysis | null => {
  if (!command.startsWith('npm ') && !command.startsWith('npx ')) {
    return null;
  }

  const result: CommandAnalysis = {
    type: command.startsWith('npm ') ? 'npm - Node Package Manager' : 'npx - Node Package Execute',
    description: 'Command to manage or execute Node.js packages',
    warnings: [],
    urls: [],
    parameters: {},
    codeLanguage: 'bash'
  };
  
  if (command.includes('install') && command.includes('-g')) {
    result.warnings.push('Global package installation');
  }

  return result;
};
