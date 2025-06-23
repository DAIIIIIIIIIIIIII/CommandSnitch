
export interface CommandAnalysis {
  type: string;
  description: string;
  warnings: string[];
  extractedCode?: string;
  urls: string[];
  parameters: Record<string, any>;
}

export const analyzeCommand = async (command: string): Promise<CommandAnalysis> => {
  const result: CommandAnalysis = {
    type: 'Sconosciuto',
    description: 'Comando non riconosciuto',
    warnings: [],
    urls: [],
    parameters: {}
  };

  // Rimuovi spazi extra
  const cleanCommand = command.trim();
  
  // Estrai URL dal comando
  const urlRegex = /https?:\/\/[^\s'"]+/g;
  const urls = cleanCommand.match(urlRegex) || [];
  result.urls = urls;

  // Analizza comandi curl
  if (cleanCommand.startsWith('curl')) {
    result.type = 'cURL - Download HTTP';
    result.description = 'Comando per scaricare contenuto da URL';
    
    // Estrai parametri curl comuni
    const curlParams: Record<string, any> = {};
    
    if (cleanCommand.includes('-s') || cleanCommand.includes('--silent')) {
      curlParams['modalità'] = 'silenzioso';
    }
    if (cleanCommand.includes('-L') || cleanCommand.includes('--location')) {
      curlParams['redirect'] = 'segui i redirect';
    }
    if (cleanCommand.includes('-k') || cleanCommand.includes('--insecure')) {
      curlParams['SSL'] = 'ignora certificati';
      result.warnings.push('Il comando ignora la verifica dei certificati SSL');
    }
    
    result.parameters = curlParams;

    // Se c'è una pipe verso bash/sh
    if (cleanCommand.includes('| bash') || cleanCommand.includes('| sh')) {
      result.warnings.push('Il comando eseguirà automaticamente il codice scaricato');
      result.warnings.push('ATTENZIONE: Questo può essere pericoloso!');
    }

    // Tenta di scaricare il contenuto se è sicuro
    if (urls.length > 0 && !cleanCommand.includes('| bash') && !cleanCommand.includes('| sh')) {
      try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(urls[0])}`);
        const data = await response.json();
        if (data.contents) {
          result.extractedCode = data.contents.substring(0, 2000) + (data.contents.length > 2000 ? '...\n[Codice troncato - mostra solo i primi 2000 caratteri]' : '');
        }
      } catch (error) {
        result.extractedCode = 'Impossibile scaricare il contenuto per l\'anteprima';
      }
    }
  }
  
  // Analizza comandi wget
  else if (cleanCommand.startsWith('wget')) {
    result.type = 'wget - Download file';
    result.description = 'Comando per scaricare file da internet';
    
    if (cleanCommand.includes('-O-') || cleanCommand.includes('--output-document=-')) {
      result.parameters['output'] = 'stdout (output diretto)';
    }
    
    if (cleanCommand.includes('| bash') || cleanCommand.includes('| sh')) {
      result.warnings.push('Il comando eseguirà automaticamente il file scaricato');
      result.warnings.push('ATTENZIONE: Questo può essere pericoloso!');
    }
  }
  
  // Analizza PowerShell
  else if (cleanCommand.includes('powershell') || cleanCommand.includes('pwsh')) {
    result.type = 'PowerShell';
    result.description = 'Comando PowerShell';
    
    if (cleanCommand.includes('Invoke-WebRequest') || cleanCommand.includes('iwr')) {
      result.parameters['azione'] = 'download web';
      urls.forEach(url => {
        if (!result.urls.includes(url)) result.urls.push(url);
      });
    }
    
    if (cleanCommand.includes('Invoke-Expression') || cleanCommand.includes('iex')) {
      result.warnings.push('Il comando eseguirà codice dinamicamente');
      result.warnings.push('ATTENZIONE: Verifica sempre il codice prima dell\'esecuzione!');
    }

    if (cleanCommand.includes('-ExpandProperty Content')) {
      result.parameters['espansione'] = 'estrae il contenuto della proprietà';
    }
  }
  
  // Analizza comandi Python
  else if (cleanCommand.includes('python') && cleanCommand.includes('-c')) {
    result.type = 'Python - Esecuzione inline';
    result.description = 'Esecuzione di codice Python inline';
    
    const pythonCodeMatch = cleanCommand.match(/-c\s+["']([^"']+)["']/);
    if (pythonCodeMatch) {
      result.extractedCode = pythonCodeMatch[1];
    }
    
    if (cleanCommand.includes('urllib') || cleanCommand.includes('requests')) {
      result.warnings.push('Il codice Python effettua richieste di rete');
    }
  }
  
  // Analizza npm/npx
  else if (cleanCommand.startsWith('npm ') || cleanCommand.startsWith('npx ')) {
    result.type = cleanCommand.startsWith('npm ') ? 'npm - Node Package Manager' : 'npx - Node Package Execute';
    result.description = 'Comando per gestire o eseguire pacchetti Node.js';
    
    if (cleanCommand.includes('install') && cleanCommand.includes('-g')) {
      result.warnings.push('Installazione globale di un pacchetto');
    }
  }

  // Se contiene caratteri sospetti
  if (cleanCommand.includes('rm -rf') || cleanCommand.includes('del /f') || cleanCommand.includes('format')) {
    result.warnings.push('PERICOLO: Il comando potrebbe eliminare file o formattare dischi!');
  }

  if (cleanCommand.includes('chmod +x') || cleanCommand.includes('sudo')) {
    result.warnings.push('Il comando richiede permessi elevati o modifica i permessi dei file');
  }

  return result;
};
