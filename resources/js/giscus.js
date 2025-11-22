/**
 * Giscus Comments Integration
 * 
 * Configuração do Giscus para comentários nas páginas.
 * 
 * IMPORTANTE: Antes de usar, você precisa:
 * 1. Instalar o app Giscus no GitHub: https://github.com/apps/giscus
 * 2. Autorizar o app no seu repositório
 * 3. Configurar as variáveis abaixo com os dados do seu repositório
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURAÇÃO - AJUSTE AQUI
    // ============================================
    const GISCUS_CONFIG = {
        // Substitua pelo seu usuário/organização do GitHub
        repo: 'codeflow/codeflow.github.io',
        
        // ID do repositório (encontre em: https://giscus.app)
        repoId: 'MDEwOlJlcG9zaXRvcnkxNzUwOTMxNjk=', // Será preenchido após configuração no giscus.app
        
        // Categoria do repositório (geralmente 'Announcements' ou 'General')
        category: 'Announcements',
        
        // ID da categoria (encontre em: https://giscus.app)
        categoryId: 'DIC_kwDOCm-1sc4CyEBv', // Será preenchido após configuração no giscus.app
        
        // Mapeamento de idiomas
        mapping: {
            'br': 'pt',
            'en': 'en'
        },
        
        // Tema (pode ser 'light', 'dark', 'preferred_color_scheme', ou um tema customizado)
        theme: 'light',
        
        // Posição dos comentários ('top' ou 'bottom')
        reactionsEnabled: true,
        
        // Habilitar reações
        emitMetadata: true,
        
        // Emitir metadados
        inputPosition: 'bottom',
        
        // Posição do input ('top' ou 'bottom')
        lang: 'pt'
    };

    /**
     * Obtém o idioma atual da página
     */
    function getCurrentLanguage() {
        // Tenta obter do localStorage
        const storedLang = localStorage.getItem('codeflow-language');
        if (storedLang) {
            return GISCUS_CONFIG.mapping[storedLang] || 'pt';
        }
        
        // Tenta obter do HTML lang attribute
        const htmlLang = document.documentElement.lang;
        if (htmlLang) {
            if (htmlLang.startsWith('en')) return 'en';
            if (htmlLang.startsWith('pt')) return 'pt';
        }
        
        // Tenta obter do path da URL
        const path = window.location.pathname;
        if (path.includes('/en/')) return 'en';
        if (path.includes('/br/')) return 'pt';
        
        // Default
        return 'pt';
    }

    /**
     * Gera um identificador único para a página baseado no path
     */
    function getPageIdentifier() {
        const path = window.location.pathname;
        // Remove a extensão .html e normaliza o path
        const cleanPath = path.replace(/\.html$/, '').replace(/\/$/, '');
        // Remove o protocolo e domínio se presente
        const relativePath = cleanPath.replace(/^https?:\/\/[^\/]+/, '');
        // Usa o path relativo como identificador
        return relativePath || 'index';
    }

    /**
     * Inicializa o Giscus
     */
    function initGiscus() {
        // Verifica se já existe um container
        const container = document.getElementById('giscus-container');
        if (!container) {
            console.warn('Giscus: Container não encontrado');
            return;
        }

        // Verifica se o Giscus já foi carregado
        if (window.giscus) {
            console.warn('Giscus: Já inicializado');
            return;
        }

        // Verifica se repoId e categoryId estão configurados
        if (!GISCUS_CONFIG.repoId || !GISCUS_CONFIG.categoryId) {
            console.warn('Giscus: repoId e categoryId precisam ser configurados. Visite https://giscus.app para obter esses valores.');
            container.innerHTML = '<div style="padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404;">' +
                '<strong>⚠️ Giscus não configurado:</strong> Por favor, configure o repoId e categoryId em resources/js/giscus.js. ' +
                'Visite <a href="https://giscus.app" target="_blank">https://giscus.app</a> para obter esses valores.</div>';
            return;
        }

        // Cria o script do Giscus
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', GISCUS_CONFIG.repo);
        script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
        script.setAttribute('data-category', GISCUS_CONFIG.category);
        script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
        script.setAttribute('data-mapping', 'pathname'); // Usa o pathname como identificador
        script.setAttribute('data-strict', '0');
        script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled ? '1' : '0');
        script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata ? '1' : '0');
        script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition);
        script.setAttribute('data-theme', GISCUS_CONFIG.theme);
        script.setAttribute('data-lang', getCurrentLanguage());
        script.setAttribute('data-loading', 'lazy');
        script.crossOrigin = 'anonymous';
        script.async = true;

        container.appendChild(script);
    }

    /**
     * Atualiza o idioma do Giscus quando o idioma da página muda
     */
    function updateGiscusLanguage() {
        if (window.giscus && window.giscus.setConfig) {
            const lang = getCurrentLanguage();
            window.giscus.setConfig({
                lang: lang
            });
        }
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGiscus);
    } else {
        initGiscus();
    }

    // Escuta mudanças de idioma
    window.addEventListener('languageChanged', updateGiscusLanguage);

    // Expõe funções globais para uso externo
    window.GiscusComments = {
        init: initGiscus,
        updateLanguage: updateGiscusLanguage,
        config: GISCUS_CONFIG
    };
})();

