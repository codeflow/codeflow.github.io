/**
 * Giscus Comments Integration
 * 
 * Giscus configuration for comments on pages.
 * 
 * IMPORTANT: Before using, you need to:
 * 1. Install the Giscus app on GitHub: https://github.com/apps/giscus
 * 2. Authorize the app in your repository
 * 3. Configure the variables below with your repository data
 */

(function() {
    'use strict';

    // ============================================
    // CONFIGURATION - ADJUST HERE
    // ============================================
    const GISCUS_CONFIG = {
        // Replace with your GitHub user/organization
        repo: 'codeflow/codeflow.github.io',
        
        // Repository ID (find at: https://giscus.app)
        repoId: 'MDEwOlJlcG9zaXRvcnkxNzUwOTMxNjk=', // Will be filled after configuration at giscus.app
        
        // Repository category (usually 'Announcements' or 'General')
        category: 'Announcements',
        
        // Category ID (find at: https://giscus.app)
        categoryId: 'DIC_kwDOCm-1sc4CyEBv', // Will be filled after configuration at giscus.app
        
        // Language mapping
        mapping: {
            'br': 'pt',
            'en': 'en'
        },
        
        // Theme (can be 'light', 'dark', 'preferred_color_scheme', or a custom theme)
        theme: 'light',
        
        // Comments position ('top' or 'bottom')
        reactionsEnabled: true,
        
        // Enable reactions
        emitMetadata: true,
        
        // Emit metadata
        inputPosition: 'bottom',
        
        // Input position ('top' or 'bottom')
        lang: 'pt'
    };

    /**
     * Gets the current page language
     */
    function getCurrentLanguage() {
        // Try to get from localStorage
        const storedLang = localStorage.getItem('codeflow-language');
        if (storedLang) {
            return GISCUS_CONFIG.mapping[storedLang] || 'pt';
        }
        
        // Try to get from HTML lang attribute
        const htmlLang = document.documentElement.lang;
        if (htmlLang) {
            if (htmlLang.startsWith('en')) return 'en';
            if (htmlLang.startsWith('pt')) return 'pt';
        }
        
        // Try to get from URL path
        const path = window.location.pathname;
        // Detects any 2-letter language code in the path
        const langMatch = path.match(/\/([a-z]{2})(-[A-Z]{2})?\//);
        if (langMatch) {
            const langCode = langMatch[1];
            // Maps language codes to Giscus codes
            const giscusLangMap = {
                'br': 'pt',
                'pt': 'pt',
                'en': 'en',
                'es': 'es',
                'fr': 'fr',
                'de': 'de',
                'it': 'it',
                'ja': 'ja',
                'ko': 'ko',
                'zh': 'zh-CN',
                'ru': 'ru',
                'ar': 'ar',
                'hi': 'hi'
            };
            return giscusLangMap[langCode] || 'pt';
        }
        
        // Default
        return 'pt';
    }

    /**
     * Generates a unique identifier for the page based on the path
     */
    function getPageIdentifier() {
        const path = window.location.pathname;
        // Removes .html extension and normalizes the path
        const cleanPath = path.replace(/\.html$/, '').replace(/\/$/, '');
        // Removes protocol and domain if present
        const relativePath = cleanPath.replace(/^https?:\/\/[^\/]+/, '');
        // Uses the relative path as identifier
        return relativePath || 'index';
    }

    /**
     * Initializes Giscus
     */
    function initGiscus(forceReinit = false) {
        // Checks if container already exists
        const container = document.getElementById('giscus-container');
        if (!container) {
            console.warn('Giscus: Container not found');
            return;
        }

        // If forcing reinitialization, removes old script
        if (forceReinit) {
            const oldScript = container.querySelector('script[src*="giscus.app"]');
            if (oldScript) {
                oldScript.remove();
            }
            if (window.giscus) {
                delete window.giscus;
            }
        }

        // Checks if Giscus is already loaded (unless forced)
        if (window.giscus && !forceReinit) {
            console.warn('Giscus: Already initialized');
            return;
        }

        // Checks if repoId and categoryId are configured
        if (!GISCUS_CONFIG.repoId || !GISCUS_CONFIG.categoryId) {
            console.warn('Giscus: repoId and categoryId need to be configured. Visit https://giscus.app to get these values.');
            container.innerHTML = '<div style="padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404;">' +
                '<strong>⚠️ Giscus not configured:</strong> Please configure repoId and categoryId in resources/js/giscus.js. ' +
                'Visit <a href="https://giscus.app" target="_blank">https://giscus.app</a> to get these values.</div>';
            return;
        }

        // Creates Giscus script
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', GISCUS_CONFIG.repo);
        script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
        script.setAttribute('data-category', GISCUS_CONFIG.category);
        script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
        script.setAttribute('data-mapping', 'pathname'); // Uses pathname as identifier
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
     * Updates Giscus language when page language changes
     */
    function updateGiscusLanguage() {
        if (window.giscus && window.giscus.setConfig) {
            const lang = getCurrentLanguage();
            window.giscus.setConfig({
                lang: lang
            });
        }
    }

    // Initializes when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGiscus);
    } else {
        initGiscus();
    }

    // Listens for language changes
    window.addEventListener('languageChanged', updateGiscusLanguage);

    // Exposes global functions for external use
    window.GiscusComments = {
        init: function(forceReinit) {
            return initGiscus(forceReinit || false);
        },
        updateLanguage: updateGiscusLanguage,
        config: GISCUS_CONFIG
    };
})();

