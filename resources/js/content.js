// Funcionalidades de carregamento de conteúdo

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Função para normalizar caminho e remover duplicações
function normalizePath(path) {
    if (!path) return path;
    
    let normalized = path;
    
    // Remove qualquer duplicação de content/java.md/ ou content/golang.md/ (pode haver múltiplas)
    while (normalized.includes('content/java.md/content/java.md/')) {
        normalized = normalized.replace(/content\/java\.md\/content\/java\.md\//g, 'content/java.md/');
    }
    while (normalized.includes('content/golang.md/content/golang.md/')) {
        normalized = normalized.replace(/content\/golang\.md\/content\/golang\.md\//g, 'content/golang.md/');
    }
    
    // Remove duplicação no início (caso especial)
    if (normalized.startsWith('content/java.md/content/java.md/')) {
        normalized = normalized.replace(/^content\/java\.md\/content\/java\.md\//, 'content/java.md/');
    }
    if (normalized.startsWith('content/golang.md/content/golang.md/')) {
        normalized = normalized.replace(/^content\/golang\.md\/content\/golang\.md\//, 'content/golang.md/');
    }
    
    // Verificação adicional: se o caminho tem content/java.md/ ou content/golang.md/ repetido em qualquer lugar
    // Remove todas as ocorrências consecutivas
    normalized = normalized.replace(/(content\/java\.md\/)+/g, 'content/java.md/');
    normalized = normalized.replace(/(content\/golang\.md\/)+/g, 'content/golang.md/');
    
    return normalized;
}

// Função para converter path antigo para novo formato com hash e idioma
function convertToNewPath(oldPath, categoryName) {
    if (!oldPath) return null;
    
    // Normaliza o caminho de entrada para evitar duplicações
    oldPath = normalizePath(oldPath);
    
    // Se já está no novo formato com idioma, apenas atualiza o idioma
    if (oldPath.includes('/br/') || oldPath.includes('/en/')) {
        const result = normalizePath(oldPath.replace(/\/(br|en)\//, `/${currentLanguage}/`));
        return result;
    }
    
    // Se já está no novo formato com hash mas sem idioma (ex: content/hi870208/arquivo.html)
    // Adiciona o idioma
    // Padrão: content/{hash-categoria}/{hash-topico}.html
    const hashPattern = /content\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
    const match = oldPath.match(hashPattern);
    if (match) {
        const categoryHash = match[1];
        const fileName = match[2];
        const result = normalizePath(`content/${categoryHash}/${currentLanguage}/${fileName}`);
        return result;
    }
    
    // Se o path tem formato content/java.md/hi870208/arquivo.html ou content/golang.md/hi111630/arquivo.html
    // Adiciona o idioma no caminho: content/java.md/hi870208/br/arquivo.html ou content/golang.md/hi111630/br/arquivo.html
    const javaMdPattern = /content\/java\.md\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
    const golangMdPattern = /content\/golang\.md\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
    const javaMdMatch = oldPath.match(javaMdPattern);
    const golangMdMatch = oldPath.match(golangMdPattern);
    
    if (javaMdMatch) {
        const hash = javaMdMatch[1];
        const fileName = javaMdMatch[2];
        // Verifica se já tem idioma no caminho (br/ ou en/)
        if (oldPath.includes('/br/') || oldPath.includes('/en/')) {
            // Já tem idioma, apenas atualiza se necessário
            if (oldPath.includes(`/${currentLanguage}/`)) {
                return oldPath;
            } else {
                // Atualiza o idioma
                const result = oldPath.replace(/\/(br|en)\//, `/${currentLanguage}/`);
                return result;
            }
        }
        const result = `content/java.md/${hash}/${currentLanguage}/${fileName}`;
        const normalizedResult = normalizePath(result);
        return normalizedResult;
    }
    
    if (golangMdMatch) {
        const hash = golangMdMatch[1];
        const fileName = golangMdMatch[2];
        // Verifica se já tem idioma no caminho (br/ ou en/)
        if (oldPath.includes('/br/') || oldPath.includes('/en/')) {
            // Já tem idioma, apenas atualiza se necessário
            if (oldPath.includes(`/${currentLanguage}/`)) {
                return oldPath;
            } else {
                // Atualiza o idioma
                const result = oldPath.replace(/\/(br|en)\//, `/${currentLanguage}/`);
                return result;
            }
        }
        const result = `content/golang.md/${hash}/${currentLanguage}/${fileName}`;
        const normalizedResult = normalizePath(result);
        return normalizedResult;
    }
    
    // Se o path tem formato content/java.md/arquivo.html ou content/golang.md/arquivo.html (nós de grupo)
    // Adiciona o idioma no caminho: content/java.md/br/arquivo.html ou content/golang.md/br/arquivo.html
    const javaMdGroupPattern = /content\/java\.md\/([a-z0-9]+\.html)$/;
    const golangMdGroupPattern = /content\/golang\.md\/([a-z0-9]+\.html)$/;
    const javaMdGroupMatch = oldPath.match(javaMdGroupPattern);
    const golangMdGroupMatch = oldPath.match(golangMdGroupPattern);
    
    if (javaMdGroupMatch) {
        const fileName = javaMdGroupMatch[1];
        return `content/java.md/${currentLanguage}/${fileName}`;
    }
    
    if (golangMdGroupMatch) {
        const fileName = golangMdGroupMatch[1];
        return `content/golang.md/${currentLanguage}/${fileName}`;
    }
    
    // Se o path antigo tem formato antigo (content/java.md/arquivo.html ou content/golang.md/arquivo.html sem hash)
    // Gera hash do tópico e usa hash da categoria
    if (oldPath.includes('content/java.md/') && !oldPath.match(/content\/java\.md\/[a-z0-9]+\//)) {
        const oldFileName = oldPath.split('/').pop().replace('.html', '');
        // Tenta encontrar o tópico correspondente no menu
        const topicNode = document.querySelector(`[data-html="${oldPath}"]`);
        if (topicNode) {
            const topicPath = topicNode.getAttribute('data-path');
            const topicName = topicPath.split('/').pop();
            const topicHash = getTopicFileNameHash(topicName);
            const categoryHash = getCategoryHash(categoryName || 'História do Java');
            return `content/java.md/${categoryHash}/${currentLanguage}/${topicHash}.html`;
        }
    }
    
    if (oldPath.includes('content/golang.md/') && !oldPath.match(/content\/golang\.md\/[a-z0-9]+\//)) {
        const oldFileName = oldPath.split('/').pop().replace('.html', '');
        // Tenta encontrar o tópico correspondente no menu
        const topicNode = document.querySelector(`[data-html="${oldPath}"]`);
        if (topicNode) {
            const topicPath = topicNode.getAttribute('data-path');
            const topicName = topicPath.split('/').pop();
            const topicHash = getTopicFileNameHash(topicName);
            const categoryHash = getCategoryHash(categoryName || 'História e Filosofia do Go');
            return `content/golang.md/${categoryHash}/${currentLanguage}/${topicHash}.html`;
        }
    }
    
    // Fallback: extrai o nome do arquivo do path antigo
    const fileName = oldPath.split('/').pop().replace('.html', '');
    
    // Gera hash da categoria
    const hash = getCategoryHash(categoryName || 'História do Java');
    
    // Retorna novo path: {hash}/{lang}/{nome}.html
    return `content/${hash}/${currentLanguage}/${fileName}.html`;
}

// Função para obter categoria do path
function getCategoryFromPath(path) {
    // Extrai categoria do data-path
    const parts = path.split('/');
    if (parts.length >= 2) {
        return parts[1]; // Ex: "História do Java" de "Java/História do Java/..."
    }
    return 'História do Java'; // Padrão
}

async function updateContent(path, label, htmlFile, file, lines) {
    const contentHeader = document.getElementById('contentHeader');
    const contentBody = document.getElementById('contentBody');
    
    // Verifica se estamos em uma página com layout completo (não no index.html)
    // Se o contentBody já tem conteúdo dentro de content-container, significa que a página já tem layout completo
    const currentPath = window.location.pathname;
    const currentFileName = currentPath.split('/').pop();
    const hasContentContainer = contentBody && contentBody.querySelector('.content-container');
    
    // Se estamos em uma página com layout completo (não index.html), sempre navega
    if (currentFileName !== 'index.html' && currentFileName !== 'home.html' && hasContentContainer) {
        // Se existe um arquivo HTML, navega diretamente
        if (htmlFile) {
            const category = getCategoryFromPath(path);
            
            // Normaliza o htmlFile original
            const cleanHtmlFile = normalizePath(htmlFile);
            
            // Converte para o novo formato
            let finalPath = convertToNewPath(cleanHtmlFile, category);
            
            // Se convertToNewPath não retornou um caminho, tenta converter manualmente
            if (!finalPath) {
                // Remove content/java.md/ se existir no início
                let cleanPath = cleanHtmlFile.replace(/^content\/java\.md\//, '');
                // Se o caminho já tem hash (formato hi870208/arquivo.html), adiciona idioma
                if (cleanPath.match(/^[a-z0-9]+\/[a-z0-9]+\.html$/)) {
                    const parts = cleanPath.split('/');
                    finalPath = `content/java.md/${parts[0]}/${currentLanguage}/${parts[1]}`;
                } else {
                    // Caso contrário, usa o hash da categoria
                    const categoryHash = getCategoryHash(category);
                    finalPath = `content/${categoryHash}/${currentLanguage}/${cleanPath}`;
                }
            }
            
            // Normaliza o caminho final para garantir que não há duplicação
            finalPath = normalizePath(finalPath);
            
            // Calcula caminho relativo baseado na URL atual
            // Para file://, precisamos extrair apenas a parte relativa ao diretório do projeto
            let currentUrlPath = window.location.pathname;
            
            // Se for file://, o pathname pode ser o caminho absoluto completo
            // Precisamos extrair apenas a parte relativa (a partir de content/)
            if (currentUrlPath.includes('content/')) {
                // Pega apenas a parte a partir de content/
                const contentIndex = currentUrlPath.indexOf('content/');
                currentUrlPath = currentUrlPath.substring(contentIndex);
            } else if (currentUrlPath.startsWith('/')) {
                // Remove barra inicial para trabalhar com caminhos relativos
                currentUrlPath = currentUrlPath.substring(1);
            }
            
            // Pega o diretório atual (sem o nome do arquivo)
            const currentDir = currentUrlPath.substring(0, currentUrlPath.lastIndexOf('/'));
            const currentDirParts = currentDir ? currentDir.split('/').filter(p => p) : [];
            
            // Pega o diretório do arquivo de destino
            const targetDir = finalPath.substring(0, finalPath.lastIndexOf('/'));
            const targetDirParts = targetDir ? targetDir.split('/').filter(p => p) : [];
            
            // Encontra o ponto comum entre os caminhos
            let commonDepth = 0;
            for (let i = 0; i < Math.min(currentDirParts.length, targetDirParts.length); i++) {
                if (currentDirParts[i] === targetDirParts[i]) {
                    commonDepth++;
                } else {
                    break;
                }
            }
            
            // Calcula quantos níveis voltar
            const levelsToGoUp = currentDirParts.length - commonDepth;
            
            // Monta o caminho relativo
            // IMPORTANTE: Se o finalPath já começa com content/, precisamos construir o caminho relativo corretamente
            // sem adicionar content/ novamente
            if (levelsToGoUp > 0) {
                // Se o finalPath começa com content/, precisamos construir o caminho relativo a partir do diretório comum
                if (finalPath.startsWith('content/')) {
                    // Remove a parte comum do caminho
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
                // Estamos no mesmo diretório, usa apenas o nome do arquivo
                const targetFileName = finalPath.split('/').pop();
                finalPath = './' + targetFileName;
            } else {
                // Precisa adicionar ./ se não começar com ../ ou ./
                if (!finalPath.startsWith('./') && !finalPath.startsWith('../')) {
                    finalPath = './' + finalPath;
                }
            }
            
            // Normaliza novamente após calcular o caminho relativo
            // Mas preserva os ../ no início
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
            
            // VERIFICAÇÃO FINAL: Garante que não há duplicação antes de navegar
            if (finalPath.includes('content/java.md/content/java.md/')) {
                finalPath = normalizePath(finalPath);
            }
            
            window.location.href = finalPath;
            return;
        }
        // Se não tem htmlFile e estamos em página com layout completo, não faz nada
        return;
    }
    
    const translations = i18n[currentLanguage];
    const translatedLabel = translations[label] || label;
    if (contentHeader) {
        contentHeader.textContent = translatedLabel;
    }
    
    // Se existe um arquivo HTML, navega diretamente para a página (todas as páginas agora têm layout completo)
    if (htmlFile) {
        const category = getCategoryFromPath(path);
        
        // Normaliza o htmlFile original
        const cleanHtmlFile = normalizePath(htmlFile);
        
        // Converte para o novo formato
        let finalPath = convertToNewPath(cleanHtmlFile, category);
        
        // Se convertToNewPath não retornou um caminho, tenta converter manualmente
        if (!finalPath) {
            // Remove content/java.md/ se existir no início
            let cleanPath = cleanHtmlFile.replace(/^content\/java\.md\//, '');
            // Se o caminho já tem hash (formato hi870208/arquivo.html), adiciona idioma
            if (cleanPath.match(/^[a-z0-9]+\/[a-z0-9]+\.html$/)) {
                const parts = cleanPath.split('/');
                finalPath = `content/java.md/${parts[0]}/${currentLanguage}/${parts[1]}`;
            } else {
                // Caso contrário, usa o hash da categoria
                const categoryHash = getCategoryHash(category);
                finalPath = `content/${categoryHash}/${currentLanguage}/${cleanPath}`;
            }
        }
        
        // Normaliza o caminho final
        finalPath = normalizePath(finalPath);
        
        // Calcula o caminho relativo correto baseado na localização atual
        const currentPath = window.location.pathname;
        const currentFileName = currentPath.split('/').pop();
        
        // Se estamos na raiz (index.html ou home.html), o caminho é direto
        if (currentFileName === 'index.html' || currentFileName === 'home.html') {
            // Estamos na raiz, não precisa voltar
            // Garante que o caminho seja relativo (não começa com /)
            if (finalPath.startsWith('/')) {
                finalPath = finalPath.substring(1);
            }
            // Adiciona ./ no início para garantir que seja interpretado como relativo
            if (!finalPath.startsWith('./') && !finalPath.startsWith('../')) {
                finalPath = './' + finalPath;
            }
        } else {
            // Estamos em uma subpasta, precisa calcular quantos níveis voltar
            // Exemplo: se estamos em content/java.md/br/arquivo.html
            // e queremos ir para content/java.md/br/outro.html
            // não precisa voltar, são irmãos
            
            // Mas se estamos em content/java.md/br/arquivo.html
            // e queremos ir para content/java.md/outro.html
            // precisamos voltar 1 nível (../)
            
            // Conta quantos níveis temos no caminho atual (excluindo o arquivo)
            const currentDirParts = currentPath.substring(0, currentPath.lastIndexOf('/')).split('/').filter(p => p);
            const targetDirParts = finalPath.substring(0, finalPath.lastIndexOf('/')).split('/').filter(p => p);
            
            // Encontra o ponto comum entre os caminhos
            let commonDepth = 0;
            for (let i = 0; i < Math.min(currentDirParts.length, targetDirParts.length); i++) {
                if (currentDirParts[i] === targetDirParts[i]) {
                    commonDepth++;
                } else {
                    break;
                }
            }
            
            // Calcula quantos níveis voltar
            const levelsToGoUp = currentDirParts.length - commonDepth;
            if (levelsToGoUp > 0) {
                finalPath = '../'.repeat(levelsToGoUp) + finalPath;
            }
        }
        
        // Verifica se já estamos na página correta
        const targetFileName = finalPath.split('/').pop();
        if (currentFileName === targetFileName && currentFileName) {
            // Já estamos na página correta, apenas atualiza o header
            return;
        }
        
        // Navega diretamente para a página HTML (que já tem o layout completo)
        window.location.href = finalPath;
        return;
    }
    
    // Fallback para conteúdo markdown (só funciona no index.html)
    // Se estamos em uma página com layout completo, não insere nada
    if (hasContentContainer && currentFileName !== 'index.html' && currentFileName !== 'home.html') {
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
                
                content += `<h3 class="app-heading">Conteúdo (linhas ${lines}):</h3>`;
                content += `<pre style="white-space: pre-wrap; word-wrap: break-word; background-color: #ECF4FE; border: 1px solid #BED6F8; padding: 0.5rem;"><code>${escapeHtml(selectedLines.join('\n'))}</code></pre>`;
            } else {
                content += `<p style="color: red;">Erro ao carregar o arquivo ${escapeHtml(file)}</p>`;
            }
        } catch (error) {
            content += `<p style="color: red;">Erro ao carregar o arquivo: ${escapeHtml(error.message)}</p>`;
            content += `<p><small>Nota: Se estiver abrindo o arquivo diretamente (file://), use um servidor local (ex: python -m http.server)</small></p>`;
        }
    } else {
        content += `<p>Este é o conteúdo do item selecionado: <strong>${escapeHtml(label)}</strong></p>`;
    }
    
    if (contentBody) {
        contentBody.innerHTML = content;
    }
}

