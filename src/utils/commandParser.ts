
export interface CommandAnalysis {
  type: string;
  description: string;
  warnings: string[];
  extractedCode?: string;
  urls: string[];
  parameters: Record<string, any>;
}

const downloadContent = async (url: string): Promise<string> => {
  try {
    // Prova prima con un proxy CORS
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.contents) {
      return data.contents;
    }
    
    // Se il proxy fallisce, prova direttamente
    const directResponse = await fetch(url);
    return await directResponse.text();
  } catch (error) {
    throw new Error(`Impossibile scaricare il contenuto da ${url}: ${error}`);
  }
};

export const analyzeCommand = async (command: string): Promise<CommandAnalysis> => {
  const result: CommandAnalysis = {
    type: 'Sconosciuto',
    description: 'Comando non riconosciuto',
    warnings: [],
    urls: [],
    parameters: {}
  };

  const cleanCommand = command.trim();
  
  // Estrai URL dal comando
  const urlRegex = /https?:\/\/[^\s'"]+/g;
  const urls = cleanCommand.match(urlRegex) || [];
  result.urls = urls;

  // Analizza comandi PowerShell (iwr, Invoke-WebRequest)
  if (cleanCommand.includes('iwr') || cleanCommand.includes('Invoke-WebRequest')) {
    result.type = 'PowerShell - Invoke-WebRequest';
    result.description = 'Comando PowerShell per scaricare contenuto web';
    
    // Se c'è un URL, scarica il contenuto
    if (urls.length > 0) {
      try {
        const content = await downloadContent(urls[0]);
        result.extractedCode = content;
        
        // Analizza il tipo di contenuto
        if (content.includes('#!/bin/bash') || content.includes('#!/bin/sh')) {
          result.warnings.push('Il contenuto è uno script bash che verrebbe eseguito');
        } else if (content.includes('function ') || content.includes('$')) {
          result.warnings.push('Il contenuto contiene codice PowerShell');
        } else if (content.includes('python') || content.includes('import ')) {
          result.warnings.push('Il contenuto contiene codice Python');
        }
        
        // Avviso generico per esecuzione automatica
        if (cleanCommand.includes('| iex') || cleanCommand.includes('| Invoke-Expression')) {
          result.warnings.push('ATTENZIONE: Il comando eseguirà automaticamente il codice scaricato!');
        }
        
      } catch (error) {
        result.extractedCode = `Errore nel download: ${error}`;
        result.warnings.push('Impossibile scaricare il contenuto per l\'anteprima');
      }
    }
    
    if (cleanCommand.includes('select -ExpandProperty Content')) {
      result.parameters['espansione'] = 'estrae solo il contenuto testuale';
    }
  }
  
  // Analizza comandi curl
  else if (cleanCommand.startsWith('curl')) {
    result.type = 'cURL - Download HTTP';
    result.description = 'Comando per scaricare contenuto da URL';
    
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

    // Scarica il contenuto se c'è un URL
    if (urls.length > 0) {
      try {
        const content = await downloadContent(urls[0]);
        result.extractedCode = content;
        
        // Controlla se il contenuto verrà eseguito
        if (cleanCommand.includes('| bash') || cleanCommand.includes('| sh')) {
          result.warnings.push('PERICOLO: Il comando eseguirà automaticamente il codice scaricato!');
        }
      } catch (error) {
        result.extractedCode = `Errore nel download: ${error}`;
        result.warnings.push('Impossibile scaricare il contenuto per l\'anteprima');
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
    
    // Scarica il contenuto se c'è un URL
    if (urls.length > 0) {
      try {
        const content = await downloadContent(urls[0]);
        result.extractedCode = content;
        
        if (cleanCommand.includes('| bash') || cleanCommand.includes('| sh')) {
          result.warnings.push('PERICOLO: Il comando eseguirà automaticamente il file scaricato!');
        }
      } catch (error) {
        result.extractedCode = `Errore nel download: ${error}`;
        result.warnings.push('Impossibile scaricare il contenuto per l\'anteprima');
      }
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

  // Controlli di sicurezza generali
  if (cleanCommand.includes('rm -rf') || cleanCommand.includes('del /f') || cleanCommand.includes('format')) {
    result.warnings.push('PERICOLO: Il comando potrebbe eliminare file o formattare dischi!');
  }

  if (cleanCommand.includes('chmod +x') || cleanCommand.includes('sudo')) {
    result.warnings.push('Il comando richiede permessi elevati o modifica i permessi dei file');
  }

  return result;
};
