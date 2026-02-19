// Content loading functionality

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Function to normalize path and remove duplications
function normalizePath(path) {
    if (!path) return path;
    
    let normalized = path;
    
    // Removes any duplication of content/java.md/ or content/golang.md/ (may have multiple)
    while (normalized.includes('content/java.md/content/java.md/')) {
        normalized = normalized.replace(/content\/java\.md\/content\/java\.md\//g, 'content/java.md/');
    }
    while (normalized.includes('content/golang.md/content/golang.md/')) {
        normalized = normalized.replace(/content\/golang\.md\/content\/golang\.md\//g, 'content/golang.md/');
    }
    
    // Removes duplication at start (special case)
    if (normalized.startsWith('content/java.md/content/java.md/')) {
        normalized = normalized.replace(/^content\/java\.md\/content\/java\.md\//, 'content/java.md/');
    }
    if (normalized.startsWith('content/golang.md/content/golang.md/')) {
        normalized = normalized.replace(/^content\/golang\.md\/content\/golang\.md\//, 'content/golang.md/');
    }
    
    // Additional check: if path has content/java.md/ or content/golang.md/ repeated anywhere
    // Removes all consecutive occurrences
    normalized = normalized.replace(/(content\/java\.md\/)+/g, 'content/java.md/');
    normalized = normalized.replace(/(content\/golang\.md\/)+/g, 'content/golang.md/');
    
    return normalized;
}

// Function to convert old path to new format with hash and language
function convertToNewPath(oldPath, categoryName) {
    if (!oldPath) return null;
    
    // Normalizes input path to avoid duplications
    oldPath = normalizePath(oldPath);
    
    // If already in new format with language, just updates language
    // Detects any 2-letter language code (br, en, es, fr, etc.)
    const languagePattern = /\/([a-z]{2})(-[A-Z]{2})?\//;
    if (languagePattern.test(oldPath)) {
        const result = normalizePath(oldPath.replace(/\/([a-z]{2})(-[A-Z]{2})?\//, `/${currentLanguage}/`));
        return result;
    }
    
    // If already in new format with hash but without language (ex: content/hi870208/file.html)
    // Adds language
    // Pattern: content/{category-hash}/{topic-hash}.html
    const hashPattern = /content\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
    const match = oldPath.match(hashPattern);
    if (match) {
        const categoryHash = match[1];
        const fileName = match[2];
        const result = normalizePath(`content/${categoryHash}/${currentLanguage}/${fileName}`);
        return result;
    }
    
    // Generic pattern for any technology: content/{technology}.md/{hash}/{file}.html
    // Examples: content/java.md/hi870208/file.html, content/golang.md/hi111630/file.html, content/gtk.md/fu153936/file.html
    // Adds language no caminho: content/{tecnologia}.md/{hash}/{idioma}/{arquivo}.html
    const techMdPattern = /content\/([a-z0-9]+)\.md\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
    const techMdMatch = oldPath.match(techMdPattern);
    
    if (techMdMatch) {
        const technology = techMdMatch[1]; // java, golang, gtk, etc.
        const hash = techMdMatch[2];
        const fileName = techMdMatch[3];
        // Checks if path already has language (any 2-letter language code)
        const hasLanguage = /\/([a-z]{2})(-[A-Z]{2})?\//.test(oldPath);
        if (hasLanguage) {
            // Already has language, just updates if necessary
            if (oldPath.includes(`/${currentLanguage}/`)) {
                return oldPath;
            } else {
                // Updates language
                const result = oldPath.replace(/\/([a-z]{2})(-[A-Z]{2})?\//, `/${currentLanguage}/`);
                return result;
            }
        }
        const result = `content/${technology}.md/${hash}/${currentLanguage}/${fileName}`;
        const normalizedResult = normalizePath(result);
        return normalizedResult;
    }
    
    // Generic pattern for group nodes: content/{technology}.md/{file}.html
    // Adds language no caminho: content/{tecnologia}.md/{idioma}/{arquivo}.html
    const techMdGroupPattern = /content\/([a-z0-9]+)\.md\/([a-z0-9]+\.html)$/;
    const techMdGroupMatch = oldPath.match(techMdGroupPattern);
    
    if (techMdGroupMatch) {
        const technology = techMdGroupMatch[1]; // java, golang, gtk, etc.
        const fileName = techMdGroupMatch[2];
        return `content/${technology}.md/${currentLanguage}/${fileName}`;
    }
    
    // If old path has old format (content/{technology}.md/file.html without hash)
    // Generates topic hash and uses category hash
    const techMdOldPattern = /content\/([a-z0-9]+)\.md\/([a-z0-9]+\.html)$/;
    const techMdOldMatch = oldPath.match(techMdOldPattern);
    if (techMdOldMatch) {
        const technology = techMdOldMatch[1];
        const oldFileName = oldPath.split('/').pop().replace('.html', '');
        // Tries to find corresponding topic in menu
        const topicNode = document.querySelector(`[data-html="${oldPath}"]`);
        if (topicNode) {
            const topicPath = topicNode.getAttribute('data-path');
            const topicName = topicPath.split('/').pop();
            const topicHash = getTopicFileNameHash(topicName);
            // Tries to get category name from path or uses a default
            const defaultCategoryNames = {
                'java': 'História do Java',
                'golang': 'História e Filosofia do Go',
                'gtk': 'Fundamentos do GTK'
            };
            const defaultCategory = defaultCategoryNames[technology] || categoryName || 'Categoria';
            const categoryHash = getCategoryHash(categoryName || defaultCategory);
            return `content/${technology}.md/${categoryHash}/${currentLanguage}/${topicHash}.html`;
        }
    }
    
    // Fallback: extracts file name from old path
    const fileName = oldPath.split('/').pop().replace('.html', '');
    
    // Generates category hash
    const hash = getCategoryHash(categoryName || 'História do Java');
    
    // Returns new path: {hash}/{lang}/{name}.html
    return `content/${hash}/${currentLanguage}/${fileName}.html`;
}

// Function to get category from path
function getCategoryFromPath(path) {
    // Extracts category from data-path
    const parts = path.split('/');
    if (parts.length >= 2) {
        return parts[1]; // Ex: "Java History" from "Java/Java History/..."
    }
    return 'Java History'; // Default
}

// Function to check if a page exists
async function checkPageExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
        return response.ok;
    } catch (error) {
        // In case of error (e.g., CORS, file://), tries with GET
        try {
            const response = await fetch(url, { method: 'GET', cache: 'no-store' });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
}

// Function to get language name in English
function getLanguageName(langCode) {
    const languageNames = {
        'br': 'Portuguese (Brazil)',
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'pt-BR': 'Portuguese (Brazil)',
        'en-US': 'English (US)',
        'es-ES': 'Spanish (Spain)'
    };
    return languageNames[langCode] || langCode;
}

async function updateContent(path, label, htmlFile, file, lines) {
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    
    // Checks if we are on a page with full layout (not on index.html)
    // If contentBody already has content inside content-container, means page already has full layout
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop();
    const hasContentContainer = contentBody && contentBody.querySelector('.content-container');
    
    // If we are on a page with full layout (not index.html), always navigates
    if (currentFileName !== 'index.html' && hasContentContainer) {
        // If HTML file exists, navigates directly
        if (htmlFile) {
            const category = getCategoryFromPath(path);
            
            // Normalizes original htmlFile
            const cleanHtmlFile = normalizePath(htmlFile);
            
            // Converts to new format
            let finalPath = convertToNewPath(cleanHtmlFile, category);
            
            // If convertToNewPath did not return a path, tries to convert manually
            if (!finalPath) {
                // Removes content/java.md/ if exists at start
                let cleanPath = cleanHtmlFile.replace(/^content\/java\.md\//, '');
                // If path already has hash (format hi870208/file.html), adds language
                if (cleanPath.match(/^[a-z0-9]+\/[a-z0-9]+\.html$/)) {
                    const parts = cleanPath.split('/');
                    finalPath = `content/java.md/${parts[0]}/${currentLanguage}/${parts[1]}`;
                } else {
                    // Otherwise, uses category hash
                    const categoryHash = getCategoryHash(category);
                    finalPath = `content/${categoryHash}/${currentLanguage}/${cleanPath}`;
                }
            }
            
            // Normalizes final path to ensure there is no duplication
            finalPath = normalizePath(finalPath);
            
            // Calculates relative path based on current URL
            // For file://, we need to extract only the part relative to project directory
            let currentUrlPath = window.location.pathname;
            
            // If file://, pathname may be the complete absolute path
            // We need to extract only the relative part (from content/)
            if (currentUrlPath.includes('content/')) {
                // Gets only the part from content/
                const contentIndex = currentUrlPath.indexOf('content/');
                currentUrlPath = currentUrlPath.substring(contentIndex);
            } else if (currentUrlPath.startsWith('/')) {
                // Removes initial slash to work with relative paths
                currentUrlPath = currentUrlPath.substring(1);
            }
            
            // Gets current directory (without file name)
            const currentDir = currentUrlPath.substring(0, currentUrlPath.lastIndexOf('/'));
            const currentDirParts = currentDir ? currentDir.split('/').filter(p => p) : [];
            
            // Gets target file directory
            const targetDir = finalPath.substring(0, finalPath.lastIndexOf('/'));
            const targetDirParts = targetDir ? targetDir.split('/').filter(p => p) : [];
            
            // Finds common point between paths
            let commonDepth = 0;
            for (let i = 0; i < Math.min(currentDirParts.length, targetDirParts.length); i++) {
                if (currentDirParts[i] === targetDirParts[i]) {
                    commonDepth++;
                } else {
                    break;
                }
            }
            
            // Calculates how many levels to go back
            const levelsToGoUp = currentDirParts.length - commonDepth;
            
            // Builds relative path
            // IMPORTANT: If finalPath already starts with content/, we need to build relative path correctly
            // without adding content/ again
            if (levelsToGoUp > 0) {
                // If finalPath starts with content/, we need to build relative path from common directory
                if (finalPath.startsWith('content/')) {
                    // Removes common part of path
                    const commonPath = targetDirParts.slice(0, commonDepth).join('/');
                    const remainingPath = targetDirParts.slice(commonDepth).join('/');
                    const fileName = finalPath.split('/').pop();
                    
                    if (remainingPath) {
                        finalPath = '../'.repeat(levelsToGoUp) + remainingPath + '/' + fileName;
                    } else {
                        finalPath = '../'.repeat(levelsToGoUp) + fileName;
                    }
                } else {
                    finalPath = '../'.repeat(levelsToGoUp) + finalPath;
                }
            } else if (commonDepth === currentDirParts.length && commonDepth === targetDirParts.length) {
                // We are in same directory, uses only file name
                const targetFileName = finalPath.split('/').pop();
                finalPath = './' + targetFileName;
            } else {
                // Needs to add ./ if it does not start with ../ or ./
                if (!finalPath.startsWith('./') && !finalPath.startsWith('../')) {
                    finalPath = './' + finalPath;
                }
            }
            
            // Normalizes again after calculating relative path
            // But preserves ../ at start
            if (finalPath.startsWith('../')) {
                const relativePart = finalPath.match(/^(\.\.\/)+/)[0];
                const pathPart = finalPath.substring(relativePart.length);
                finalPath = relativePart + normalizePath(pathPart);
            } else {
                finalPath = normalizePath(finalPath);
            }
            
            const targetFileName = finalPath.split('/').pop();
            if (currentFileName === targetFileName && currentDirParts.length === targetDirParts.length && commonDepth === currentDirParts.length) {
                return;
            }
            
            // FINAL CHECK: Ensures there is no duplication before navigating
            if (finalPath.includes('content/java.md/content/java.md/')) {
                finalPath = normalizePath(finalPath);
            }
            
            // Checks if page exists before navigating
            const pageExists = await checkPageExists(finalPath);
            if (!pageExists) {
                // Page does not exist in selected language, redirects to warning page
                // Calculates relative path to warning page
                // Extracts only relative part of current path (without file name)
                let currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
                // Removes initial slash if exists
                if (currentDir.startsWith('/')) {
                    currentDir = currentDir.substring(1);
                }
                const currentDirParts = currentDir ? currentDir.split('/').filter(p => p) : [];
                
                // The target path is content/{language}/not-translated.html
                const targetDir = `content/${currentLanguage}`;
                const targetDirParts = targetDir.split('/').filter(p => p);
                
                // Finds common point between paths
                let commonDepth = 0;
                for (let i = 0; i < Math.min(currentDirParts.length, targetDirParts.length); i++) {
                    if (currentDirParts[i] === targetDirParts[i]) {
                        commonDepth++;
                    } else {
                        break;
                    }
                }
                
                // Calculates how many levels to go back
                const levelsToGoUp = currentDirParts.length - commonDepth;
                
                // Builds relative path
                let relativeNotTranslatedPath;
                if (levelsToGoUp > 0) {
                    // Needs to go back some levels to common directory
                    // Then, adds remaining path to file
                    const remainingPath = targetDirParts.slice(commonDepth).join('/');
                    const fileName = 'not-translated.html';
                    if (remainingPath) {
                        relativeNotTranslatedPath = '../'.repeat(levelsToGoUp) + remainingPath + '/' + fileName;
                    } else {
                        relativeNotTranslatedPath = '../'.repeat(levelsToGoUp) + fileName;
                    }
                } else {
                    // We are at same level or closer
                    const remainingPath = targetDirParts.slice(commonDepth).join('/');
                    const fileName = 'not-translated.html';
                    if (remainingPath) {
                        relativeNotTranslatedPath = remainingPath + '/' + fileName;
                    } else {
                        relativeNotTranslatedPath = fileName;
                    }
                    // Adds ./ if necessary
                    if (!relativeNotTranslatedPath.startsWith('./') && !relativeNotTranslatedPath.startsWith('../')) {
                        relativeNotTranslatedPath = './' + relativeNotTranslatedPath;
                    }
                }
                
                window.location.href = relativeNotTranslatedPath;
                return;
            }
            
            window.location.href = finalPath;
            return;
        }
        // If no htmlFile and we are on page with full layout, does nothing
        return;
    }
    
    const translations = i18n[currentLanguage];
    const translatedLabel = translations[label] || label;
    if (contentHeader) {
        contentHeader.textContent = translatedLabel;
    }
    
    // If we are on index.html, does not navigate - index.html loads dynamically
    if (currentFileName === 'index.html' && htmlFile) {
        // index.html has its own dynamic loading logic
        // The loadContentFromMenu function will be called by override in index.html
        return;
    }
    
    // If HTML file exists, navigates directly to page (all pages now have full layout)
    if (htmlFile) {
        const category = getCategoryFromPath(path);
        
        // Normalizes original htmlFile
        const cleanHtmlFile = normalizePath(htmlFile);
        
        // Converts to new format
        let finalPath = convertToNewPath(cleanHtmlFile, category);
        
        // If convertToNewPath did not return a path, tries to convert manually
        if (!finalPath) {
            // Removes content/java.md/ if exists at start
            let cleanPath = cleanHtmlFile.replace(/^content\/java\.md\//, '');
            // If path already has hash (format hi870208/file.html), adds language
            if (cleanPath.match(/^[a-z0-9]+\/[a-z0-9]+\.html$/)) {
                const parts = cleanPath.split('/');
                finalPath = `content/java.md/${parts[0]}/${currentLanguage}/${parts[1]}`;
            } else {
                // Otherwise, uses category hash
                const categoryHash = getCategoryHash(category);
                finalPath = `content/${categoryHash}/${currentLanguage}/${cleanPath}`;
            }
        }
        
        // Normalizes final path
        finalPath = normalizePath(finalPath);
        
        // Calculates correct relative path based on current location
        const currentPath2 = window.location.pathname;
        const currentFileName2 = currentPath2.split('/').pop();
        
        // If we are at root (index.html), path is direct
        if (currentFileName2 === 'index.html') {
            // We are at root, no need to go back
            // Ensures path is relative (does not start with /)
            if (finalPath.startsWith('/')) {
                finalPath = finalPath.substring(1);
            }
            // Adds ./ at start to ensure it is interpreted as relative
            if (!finalPath.startsWith('./') && !finalPath.startsWith('../')) {
                finalPath = './' + finalPath;
            }
        } else {
            // We are in a subfolder, needs to calculate how many levels to go back
            // Example: if we are in content/java.md/br/file.html
            // and we want to go to content/java.md/br/other.html
            // no need to go back, they are siblings
            
            // But if we are in content/java.md/br/file.html
            // and we want to go to content/java.md/other.html
            // we need to go back 1 level (../)
            
            // Counts how many levels we have in current path (excluding file)
            const currentDirParts = currentPath2.substring(0, currentPath2.lastIndexOf('/')).split('/').filter(p => p);
            const targetDirParts = finalPath.substring(0, finalPath.lastIndexOf('/')).split('/').filter(p => p);
            
            // Finds common point between paths
            let commonDepth = 0;
            for (let i = 0; i < Math.min(currentDirParts.length, targetDirParts.length); i++) {
                if (currentDirParts[i] === targetDirParts[i]) {
                    commonDepth++;
                } else {
                    break;
                }
            }
            
            // Calculates how many levels to go back
            const levelsToGoUp = currentDirParts.length - commonDepth;
            if (levelsToGoUp > 0) {
                finalPath = '../'.repeat(levelsToGoUp) + finalPath;
            }
        }
        
        // Checks if we are already on correct page
        const targetFileName = finalPath.split('/').pop();
        if (currentFileName2 === targetFileName && currentFileName2) {
            // We are already on correct page, just updates header
            return;
        }
        
        // Checks if page exists before navigating
        const pageExists = await checkPageExists(finalPath);
        if (!pageExists) {
            // Page does not exist in selected language, redirects to warning page
            // Calculates relative path to warning page
            let relativeNotTranslatedPath;
            
            if (currentFileName2 === 'index.html') {
                // We are at root, direct path
                relativeNotTranslatedPath = './content/' + currentLanguage + '/not-translated.html';
            } else {
                // Extracts only relative part of current path (without file name)
                let currentDir = currentPath2.substring(0, currentPath2.lastIndexOf('/'));
                // Removes initial slash if exists
                if (currentDir.startsWith('/')) {
                    currentDir = currentDir.substring(1);
                }
                const currentDirParts = currentDir ? currentDir.split('/').filter(p => p) : [];
                
                // The target path is content/{language}/not-translated.html
                const targetDir = `content/${currentLanguage}`;
                const targetDirParts = targetDir.split('/').filter(p => p);
                
                // Finds common point between paths
                let commonDepth = 0;
                for (let i = 0; i < Math.min(currentDirParts.length, targetDirParts.length); i++) {
                    if (currentDirParts[i] === targetDirParts[i]) {
                        commonDepth++;
                    } else {
                        break;
                    }
                }
                
                // Calculates how many levels to go back
                const levelsToGoUp = currentDirParts.length - commonDepth;
                
                // Builds relative path
                if (levelsToGoUp > 0) {
                    // Needs to go back some levels to common directory
                    // Then, adds remaining path to file
                    const remainingPath = targetDirParts.slice(commonDepth).join('/');
                    const fileName = 'not-translated.html';
                    if (remainingPath) {
                        relativeNotTranslatedPath = '../'.repeat(levelsToGoUp) + remainingPath + '/' + fileName;
                    } else {
                        relativeNotTranslatedPath = '../'.repeat(levelsToGoUp) + fileName;
                    }
                } else {
                    // We are at same level or closer
                    const remainingPath = targetDirParts.slice(commonDepth).join('/');
                    const fileName = 'not-translated.html';
                    if (remainingPath) {
                        relativeNotTranslatedPath = remainingPath + '/' + fileName;
                    } else {
                        relativeNotTranslatedPath = fileName;
                    }
                    // Adds ./ if necessary
                    if (!relativeNotTranslatedPath.startsWith('./') && !relativeNotTranslatedPath.startsWith('../')) {
                        relativeNotTranslatedPath = './' + relativeNotTranslatedPath;
                    }
                }
            }
            
            window.location.href = relativeNotTranslatedPath;
            return;
        }
        
        // Navigates directly to HTML page (which already has full layout)
        window.location.href = finalPath;
        return;
    }
    
    // Fallback for markdown content (only works on index.html)
    // If we are on a page with full layout, does not insert anything
    if (hasContentContainer && currentFileName !== 'index.html') {
        return;
    }
    
    let content = `<h2 class="app-heading">${escapeHtml(label)}</h2>`;
    content += `<p><strong>Caminho:</strong> <code>${escapeHtml(path)}</code></p>`;
    
    if (file && lines) {
        try {
            const response = await fetch(file);
            if (response.ok) {
                const markdown = await response.text();
                const allLines = markdown.split('\n');
                const [startLine, endLine] = lines.split('-').map(n => parseInt(n.trim()) - 1);
                const selectedLines = allLines.slice(startLine, endLine + 1);
                
                content += `<h3 class="app-heading">Content (lines ${lines}):</h3>`;
                content += `<pre style="white-space: pre-wrap; word-wrap: break-word; background-color: #ECF4FE; border: 1px solid #BED6F8; padding: 0.5rem;"><code>${escapeHtml(selectedLines.join('\n'))}</code></pre>`;
            } else {
                content += `<p style="color: red;">Error loading file ${escapeHtml(file)}</p>`;
            }
        } catch (error) {
            content += `<p style="color: red;">Error loading file: ${escapeHtml(error.message)}</p>`;
            content += `<p><small>Note: If opening the file directly (file://), use a local server (e.g., python -m http.server)</small></p>`;
        }
    } else {
        content += `<p>This is the content of the selected item: <strong>${escapeHtml(label)}</strong></p>`;
    }
    
    if (contentBody) {
        contentBody.innerHTML = content;
    }
}

