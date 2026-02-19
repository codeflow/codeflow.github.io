// Hash System for Categories and Topics

// Function to generate category hash
function getCategoryHashCode(categoryName) {
    // Normalizes: removes spaces, accents, converts to lowercase
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

// Category to hash mapping (to maintain consistency)
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

// Function to generate file name hash based on topic
function getTopicFileNameHash(topicName) {
    // Normalizes topic name
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
    
    // Generates numeric hash
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Converts to alphanumeric string (base36)
    const hashNum = Math.abs(hash);
    const hashStr = hashNum.toString(36);
    
    // Generates additional hash based on character position for more randomness
    let additionalHash = 0;
    for (let i = 0; i < normalized.length; i++) {
        additionalHash = ((additionalHash << 3) - additionalHash) + (normalized.charCodeAt(i) * (i + 1));
        additionalHash = additionalHash & additionalHash;
    }
    const additionalStr = Math.abs(additionalHash).toString(36);
    
    // Combines both hashes and takes first 20 characters
    const combined = (hashStr + additionalStr).replace(/[^a-z0-9]/g, '').substring(0, 20);
    
    // Ensures it has at least 10 characters
    return combined.length >= 10 ? combined : combined + Math.abs(hash).toString(36).substring(0, 10 - combined.length);
}

