
export interface CommandAnalysis {
  type: string;
  description: string;
  warnings: string[];
  extractedCode?: string;
  urls: string[];
  parameters: Record<string, any>;
  codeLanguage?: string;
}

const downloadContent = async (url: string): Promise<string> => {
  try {
    // Try with CORS proxy first
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.contents) {
      return data.contents;
    }
    
    // If proxy fails, try directly
    const directResponse = await fetch(url);
    return await directResponse.text();
  } catch (error) {
    throw new Error(`Unable to download content from ${url}: ${error}`);
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
  return content.match(urlRegex) || [];
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

  // Analyze PowerShell commands (iwr, Invoke-WebRequest)
  if (cleanCommand.includes('iwr') || cleanCommand.includes('Invoke-WebRequest')) {
    result.type = 'PowerShell - Invoke-WebRequest';
    result.description = 'PowerShell command to download web content';
    
    // If there's a URL, download the content
    if (commandUrls.length > 0) {
      try {
        const content = await downloadContent(commandUrls[0]);
        result.extractedCode = content;
        result.codeLanguage = detectCodeLanguage(content);
        result.urls = extractUrlsFromCode(content);
        
        // Analyze content type
        if (content.includes('#!/bin/bash') || content.includes('#!/bin/sh')) {
          result.warnings.push('Content is a bash script that would be executed');
        } else if (content.includes('function ') || content.includes('$')) {
          result.warnings.push('Content contains PowerShell code');
        } else if (content.includes('python') || content.includes('import ')) {
          result.warnings.push('Content contains Python code');
        }
        
        // Generic warning for automatic execution
        if (cleanCommand.includes('| iex') || cleanCommand.includes('| Invoke-Expression')) {
          result.warnings.push('WARNING: The command will automatically execute the downloaded code!');
        }
        
      } catch (error) {
        result.extractedCode = `Download error: ${error}`;
        result.warnings.push('Unable to download content for preview');
      }
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
