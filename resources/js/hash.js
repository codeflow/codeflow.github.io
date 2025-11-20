// Sistema de Hash para Categorias e Tópicos

// Função para gerar hash de categoria
function getCategoryHashCode(categoryName) {
    // Normaliza: remove espaços, acentos, converte para minúsculas
    const normalized = categoryName.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/[&]/g, 'e'); // & vira 'e'
    const prefix = normalized.substring(0, 2);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return prefix + Math.abs(hash).toString().substring(0, 6);
}

// Mapeamento de categorias para hash (para manter consistência)
const categoryHashes = {
    'História do Java': getCategoryHashCode('História do Java'),
    'Sintaxe & Estruturas Básicas': getCategoryHashCode('Sintaxe & Estruturas Básicas'),
    'POO em Java': getCategoryHashCode('POO em Java'),
    'Recursos Avançados': getCategoryHashCode('Recursos Avançados'),
    'JVM Internals': getCategoryHashCode('JVM Internals'),
    'Garbage Collection': getCategoryHashCode('Garbage Collection'),
    'Bibliotecas Centrais': getCategoryHashCode('Bibliotecas Centrais'),
    'Evolução do Java': getCategoryHashCode('Evolução do Java')
};

function getCategoryHash(categoryName) {
    return categoryHashes[categoryName] || getCategoryHashCode(categoryName);
}

// Função para gerar hash do nome do arquivo baseado no tópico
function getTopicFileNameHash(topicName) {
    // Normaliza o nome do tópico
    const normalized = topicName.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/[&]/g, 'e')
        .replace(/[^a-z0-9]/g, '');
    
    // Gera hash numérico
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Converte para string alfanumérica (base36)
    const hashNum = Math.abs(hash);
    const hashStr = hashNum.toString(36);
    
    // Gera hash adicional baseado em posição dos caracteres para mais aleatoriedade
    let additionalHash = 0;
    for (let i = 0; i < normalized.length; i++) {
        additionalHash = ((additionalHash << 3) - additionalHash) + (normalized.charCodeAt(i) * (i + 1));
        additionalHash = additionalHash & additionalHash;
    }
    const additionalStr = Math.abs(additionalHash).toString(36);
    
    // Combina os dois hashes e pega os primeiros 20 caracteres
    const combined = (hashStr + additionalStr).replace(/[^a-z0-9]/g, '').substring(0, 20);
    
    // Garante que tenha pelo menos 10 caracteres
    return combined.length >= 10 ? combined : combined + Math.abs(hash).toString(36).substring(0, 10 - combined.length);
}

