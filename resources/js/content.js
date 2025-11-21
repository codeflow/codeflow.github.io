// Funcionalidades de carregamento de conteúdo

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Função para converter path antigo para novo formato com hash e idioma
function convertToNewPath(oldPath, categoryName) {
    if (!oldPath) return null;
    
    // Se já está no novo formato com idioma, apenas atualiza o idioma
    if (oldPath.includes('/br/') || oldPath.includes('/en/')) {
        return oldPath.replace(/\/(br|en)\//, `/${currentLanguage}/`);
    }
    
    // Se já está no novo formato com hash mas sem idioma (ex: content/hi870208/arquivo.html)
    // Adiciona o idioma
    // Padrão: content/{hash-categoria}/{hash-topico}.html
    const hashPattern = /content\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
    const match = oldPath.match(hashPattern);
    if (match) {
        const categoryHash = match[1];
        const fileName = match[2];
        return `content/${categoryHash}/${currentLanguage}/${fileName}`;
    }
    
    // Se o path tem formato content/java.md/hi870208/arquivo.html
    // Adiciona o idioma no caminho: content/java.md/hi870208/br/arquivo.html
    const javaMdPattern = /content\/java\.md\/([a-z0-9]+)\/([a-z0-9]+\.html)$/;
    const javaMdMatch = oldPath.match(javaMdPattern);
    if (javaMdMatch) {
        const hash = javaMdMatch[1];
        const fileName = javaMdMatch[2];
        return `content/java.md/${hash}/${currentLanguage}/${fileName}`;
    }
    
    // Se o path tem formato content/java.md/arquivo.html (nós de grupo)
    // Adiciona o idioma no caminho: content/java.md/br/arquivo.html
    const javaMdGroupPattern = /content\/java\.md\/([a-z0-9]+\.html)$/;
    const javaMdGroupMatch = oldPath.match(javaMdGroupPattern);
    if (javaMdGroupMatch) {
        const fileName = javaMdGroupMatch[1];
        return `content/java.md/${currentLanguage}/${fileName}`;
    }
    
    // Se o path antigo tem formato antigo (content/java.md/arquivo.html sem hash)
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
            return `content/${categoryHash}/${currentLanguage}/${topicHash}.html`;
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
    
    const translations = i18n[currentLanguage];
    const translatedLabel = translations[label] || label;
    contentHeader.textContent = translatedLabel;
    
    // Se existe um arquivo HTML, converte para novo formato e carrega
    if (htmlFile) {
        const category = getCategoryFromPath(path);
        const newPath = convertToNewPath(htmlFile, category);
        const finalPath = newPath || htmlFile.replace('content/java.md/', `content/${getCategoryHash(category)}/${currentLanguage}/`);
        
        // Debug: verificar se o path está correto
        console.log('Carregando conteúdo:', {
            htmlFile: htmlFile,
            currentLanguage: currentLanguage,
            finalPath: finalPath
        });
        
        // Remove iframe existente se houver
        const existingIframe = contentBody.querySelector('iframe');
        if (existingIframe) {
            existingIframe.remove();
        }
        
        // Limpa o conteúdo anterior completamente
        contentBody.innerHTML = '';
        
        // Adiciona timestamp para evitar cache ao mudar idioma
        const cacheBuster = `?lang=${currentLanguage}&t=${Date.now()}`;
        const finalPathWithCache = finalPath + cacheBuster;
        
        console.log('Criando iframe com path:', finalPathWithCache);
        
        // Cria novo iframe
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width: 100%; height: 100%; border: none; min-height: 600px;';
        iframe.onload = function() {
            try {
                this.style.height = this.contentWindow.document.body.scrollHeight + 'px';
                console.log('Iframe carregado com sucesso:', finalPathWithCache);
            } catch (e) {
                // Ignora erros de CORS
                console.warn('Erro ao ajustar altura do iframe (CORS):', e);
            }
        };
        iframe.onerror = function() {
            console.error('Erro ao carregar iframe:', finalPathWithCache);
        };
        
        // Adiciona o iframe ao DOM primeiro
        contentBody.appendChild(iframe);
        
        // Define o src depois para forçar o carregamento
        iframe.src = finalPathWithCache;
        return;
    }
    
    // Fallback para conteúdo markdown
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
    
    contentBody.innerHTML = content;
}

