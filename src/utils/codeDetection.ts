
export const detectCodeLanguage = (content: string): string => {
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

export const extractUrlsFromCode = (content: string): string[] => {
  const urlRegex = /https?:\/\/[^\s'"<>()]+/g;
  const urls = content.match(urlRegex) || [];
  // Remove duplicates using Set
  return [...new Set(urls)];
};
