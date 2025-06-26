
export const followRedirects = async (url: string): Promise<string> => {
  try {
    console.log(`🔍 REDIRECT CHECK - Testing: ${url}`);
    
    // First try to get the final URL by following redirects
    const response = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow',
      mode: 'no-cors' 
    });
    
    // If we can get the response URL, use that
    if (response.url && response.url !== url) {
      console.log(`✅ REDIRECT DETECTED: ${url} -> ${response.url}`);
      return response.url;
    }
    
    console.log(`ℹ️  NO REDIRECT: ${url} stays the same`);
    return url;
  } catch (error) {
    // If HEAD request fails, return original URL
    console.log(`❌ REDIRECT CHECK FAILED for ${url}, using original URL:`, error);
    return url;
  }
};

export const downloadContent = async (url: string): Promise<string> => {
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
