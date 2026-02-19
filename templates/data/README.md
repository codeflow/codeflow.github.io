# Componentes JSON - Codeflow

Esta pasta contém definições em formato JSON para todos os componentes disponíveis no Codeflow. Cada arquivo JSON descreve a estrutura, propriedades e exemplos de uso de um componente específico.

## 📋 Arquivos Disponíveis

### `components-index.json`
Índice principal com lista de todos os componentes disponíveis e suas categorias.

### Componentes de Layout

#### `timeline.json`
Componente para exibir eventos cronológicos, histórico de versões ou atualizações.

**Exemplo de uso:**
```json
{
  "timeline": {
    "items": [
      {
        "title": "Evento 1 - Janeiro 2025",
        "content": "Descrição do evento"
      }
    ]
  }
}
```

#### `card.json`
Container para agrupar conteúdo relacionado.

**Exemplo de uso:**
```json
{
  "card": {
    "title": "Título do Card",
    "content": "Conteúdo do card aqui"
  }
}
```

#### `icon-section.json`
Seção com ícone grande e conteúdo ao lado.

**Exemplo de uso:**
```json
{
  "iconSection": {
    "icon": "📚",
    "title": "Título da Seção",
    "content": "Conteúdo da seção"
  }
}
```

#### `separator.json`
Separador horizontal (HR) para dividir seções.

**Exemplo de uso:**
```json
{
  "separator": {}
}
```

#### `code-tabs.json`
Código com abas para mostrar diferentes versões, implementações ou comparações.

**Exemplo de uso:**
```json
{
  "codeTabs": {
    "tabs": [
      {
        "id": "java7",
        "label": "Java 7",
        "language": "java",
        "code": "// código Java 7",
        "active": true
      },
      {
        "id": "java8",
        "label": "Java 8",
        "language": "java",
        "code": "// código Java 8",
        "active": false
      }
    ]
  }
}
```

### Componentes de Conteúdo

#### `image.json`
Imagem com legenda e fonte (`figure`/`figcaption`) para inserir em seções de conteúdo. Usada pelo comando `/find-image`.

**Exemplo de uso:**
```json
{
  "image": {
    "IMAGE_URL": "https://upload.wikimedia.org/.../example.png",
    "ALT_TEXT": "Diagrama das camadas do GTK",
    "CAPTION_TEXT": "Camadas principais do GTK.",
    "SOURCE_PAGE_URL": "https://commons.wikimedia.org/wiki/File:Example.png",
    "SOURCE_LABEL": "Wikimedia Commons"
  }
}
```

#### `code-block.json`
Bloco de código com syntax highlighting e botão de copiar.

**Exemplo de uso:**
```json
{
  "codeBlock": {
    "language": "javascript",
    "code": "function exemplo() { return true; }",
    "showCopyButton": true
  }
}
```

#### `table.json`
Tabela com estilos do tema BlueSky.

**Exemplo de uso:**
```json
{
  "table": {
    "headers": ["Nome", "Idade"],
    "rows": [
      ["João", "30"],
      ["Maria", "25"]
    ]
  }
}
```

#### `info-box.json`
Boxes informativos (info, highlight, success).

**Exemplo de uso:**
```json
{
  "infoBox": {
    "type": "info",
    "title": "ℹ️ Informação:",
    "content": "Texto informativo aqui"
  }
}
```

#### `text.json`
Componentes de texto (títulos, parágrafos, listas, links).

**Exemplo de uso:**
```json
{
  "text": {
    "heading": {
      "level": 1,
      "text": "Título Principal"
    },
    "paragraphs": [
      "Primeiro parágrafo",
      "Segundo parágrafo"
    ]
  }
}
```

### Componentes de Formulário

#### `form.json`
Componentes de formulário (inputs, selects, textareas, buttons).

**Exemplo de uso:**
```json
{
  "form": {
    "fields": [
      {
        "type": "input",
        "label": "Nome",
        "name": "nome",
        "type": "text"
      }
    ]
  }
}
```

#### `fieldset.json`
Agrupamento de campos de formulário com legenda.

**Exemplo de uso:**
```json
{
  "fieldset": {
    "legend": "Informações Pessoais",
    "fields": [...]
  }
}
```

## 📖 Estrutura dos Arquivos JSON

Cada arquivo JSON segue uma estrutura padrão:

```json
{
  "component": "nome-do-componente",
  "name": "Nome do Componente",
  "description": "Descrição do componente",
  "version": "1.0.0",
  "cssClasses": {
    "container": "classe-css"
  },
  "structure": {
    "html": "<div>...</div>",
    "required": ["container"],
    "optional": ["elemento1", "elemento2"]
  },
  "properties": {
    "propriedade1": {
      "type": "string",
      "description": "Descrição da propriedade",
      "required": true
    }
  },
  "example": {
    "propriedade1": "valor exemplo"
  },
  "renderedHtml": "<div>HTML renderizado</div>",
  "features": [
    "Feature 1",
    "Feature 2"
  ],
  "notes": "Notas adicionais sobre o componente"
}
```

## 🔧 Como Usar

### 1. Consultar um Componente

Para ver a definição completa de um componente, abra o arquivo JSON correspondente:

```bash
# Exemplo: ver definição da timeline
cat templates/data/timeline.json
```

### 2. Gerar HTML a partir do JSON

Você pode usar os JSONs como base para gerar HTML programaticamente. Cada JSON contém:

- **structure.html**: Estrutura HTML básica
- **renderedHtml**: Exemplo de HTML renderizado
- **properties**: Propriedades aceitas pelo componente
- **example**: Exemplo de dados para o componente

### 3. Validar Estrutura

Use os JSONs como schema para validar se seus dados estão corretos antes de renderizar os componentes.

## 📝 Exemplo Completo

Exemplo de como usar múltiplos componentes juntos:

```json
{
  "page": {
    "title": "Minha Página",
    "content": [
      {
        "type": "heading",
        "level": 1,
        "text": "Título Principal"
      },
      {
        "type": "paragraph",
        "text": "Este é um parágrafo de exemplo."
      },
      {
        "type": "infoBox",
        "type": "info",
        "title": "💡 Dica:",
        "content": "Esta é uma dica importante."
      },
      {
        "type": "timeline",
        "items": [
          {
            "title": "Evento 1",
            "content": "Descrição do evento"
          }
        ]
      },
      {
        "type": "codeBlock",
        "language": "javascript",
        "code": "console.log('Hello World');"
      }
    ]
  }
}
```

## 🎨 Classes CSS

Todos os componentes usam classes CSS do tema BlueSky definidas em `resources/css/themes/bluesky/theme.css`. As classes principais são:

- `.app-card` - Card
- `.app-form` - Formulário
- `.app-button` - Botão
- `.app-input` - Input
- `.app-select` - Select
- `.app-textarea` - Textarea
- `.app-label` - Label
- `.timeline` - Timeline container
- `.timeline-item` - Item da timeline
- `.info-box` - Info box
- `.highlight-box` - Highlight box
- `.success-box` - Success box
- `.code-block-wrapper` - Code block wrapper
- `.code-tabs-container` - Container de abas de código
- `.code-tabs-header` - Cabeçalho com botões das abas
- `.code-tab-button` - Botão de aba individual
- `.code-tab-content` - Conteúdo de cada aba
- `.icon-section` - Icon section

## 📚 Referências

- Templates HTML: `templates/web/`
- CSS do tema: `resources/css/themes/bluesky/theme.css`
- Documentação dos templates: `templates/web/README.md`

## 🔄 Versão

Todos os componentes estão na versão 1.0.0, exceto:
- Timeline: versão 2.0.0 (com o novo design moderno)
- Code Tabs: versão 1.0.0 (novo componente)

---

**Última atualização:** Janeiro 2025
