
const followRedirects = async (url: string): Promise<string> => {
  try {
    // Special handling for known redirects
    if (url.includes('christitus.com/win')) {
      console.log('🔄 CHRISTITUS REDIRECT: Using known final URL');
      return 'https://github.com/ChrisTitusTech/winutil/releases/latest/download/winutil.ps1';
    }
    
    // First try to get the final URL by following redirects
    const response = await fetch(url, { 
      method: 'HEAD', 
      redirect: 'follow',
      mode: 'no-cors' 
    });
    
    // If we can get the response URL, use that
    if (response.url && response.url !== url) {
      console.log(`🔄 REDIRECT DETECTED: ${url} -> ${response.url}`);
      return response.url;
    }
    
    return url;
  } catch (error) {
    // If HEAD request fails, return original URL
    console.log(`❌ REDIRECT DETECTION FAILED for ${url}, using original URL`);
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
    
    for (let i = 0; i < corsProxies.length; i++) {
      const proxyUrl = corsProxies[i];
      try {
        console.log(`🔍 DOWNLOAD DEBUG - Trying proxy ${i + 1}/${corsProxies.length}: ${proxyUrl}`);
        
        let response;
        let content;
        
        if (proxyUrl.includes('allorigins')) {
          // Special handling for allorigins proxy
          const fetchUrl = `${proxyUrl}${encodeURIComponent(finalUrl)}`;
          console.log(`📡 ALLORIGINS REQUEST: ${fetchUrl}`);
          response = await fetch(fetchUrl);
          console.log(`📡 ALLORIGINS RESPONSE: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const data = await response.json();
            content = data.contents;
            console.log(`📡 ALLORIGINS CONTENT LENGTH: ${content?.length || 0}`);
          }
        } else {
          // Standard proxy handling
          const fetchUrl = `${proxyUrl}${finalUrl}`;
          console.log(`📡 PROXY REQUEST: ${fetchUrl}`);
          response = await fetch(fetchUrl);
          console.log(`📡 PROXY RESPONSE: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            content = await response.text();
            console.log(`📡 PROXY CONTENT LENGTH: ${content?.length || 0}`);
          }
        }
        
        if (content && content.trim() && content.length > 100) {
          console.log(`✅ DOWNLOAD SUCCESS using ${proxyUrl}`);
          console.log(`✅ CONTENT LENGTH: ${content.length}`);
          console.log(`✅ CONTENT PREVIEW (first 300 chars):`, content.substring(0, 300));
          console.log(`✅ CONTENT TYPE CHECK: ${content.includes('param(') ? 'PowerShell' : 'Other'}`);
          return content;
        } else {
          console.log(`⚠️ PROXY ${proxyUrl} returned empty or short content:`, content?.substring(0, 100));
        }
        
      } catch (proxyError) {
        console.log(`❌ PROXY FAILED ${proxyUrl}:`, proxyError.message);
        continue; // Try next proxy
      }
    }
    
    // If all proxies fail, throw an error
    console.log(`❌ ALL PROXIES FAILED for URL: ${finalUrl}`);
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
