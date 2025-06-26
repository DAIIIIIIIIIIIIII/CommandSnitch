
import { CommandAnalysis } from '../types/commandAnalysis';
import { 
  analyzePackageManager, 
  analyzeProgrammingTool, 
  analyzePowerShellCommand, 
  analyzeCurlCommand,
  analyzeWgetCommand,
  analyzePythonCommand,
  analyzeNpmCommand
} from './commandAnalyzers';

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

  // Check for package managers first
  const packageManagerResult = analyzePackageManager(cleanCommand);
  if (packageManagerResult) {
    return packageManagerResult;
  }

  // Check for programming tools
  const programmingToolResult = analyzeProgrammingTool(cleanCommand);
  if (programmingToolResult) {
    return programmingToolResult;
  }

  // Analyze PowerShell commands
  const powershellResult = await analyzePowerShellCommand(cleanCommand);
  if (powershellResult) {
    return powershellResult;
  }

  // Analyze curl commands
  const curlResult = await analyzeCurlCommand(cleanCommand);
  if (curlResult) {
    return curlResult;
  }

  // Analyze wget commands
  const wgetResult = await analyzeWgetCommand(cleanCommand);
  if (wgetResult) {
    return wgetResult;
  }

  // Analyze Python commands
  const pythonResult = analyzePythonCommand(cleanCommand);
  if (pythonResult) {
    return pythonResult;
  }

  // Analyze npm/npx
  const npmResult = analyzeNpmCommand(cleanCommand);
  if (npmResult) {
    return npmResult;
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

// Re-export types for backward compatibility
export type { CommandAnalysis };
