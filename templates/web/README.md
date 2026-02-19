# HTML Templates - Codeflow

This folder contains HTML reference templates for creating new pages in Codeflow. All templates follow the BlueSky theme and include the complete structure necessary for correct operation.

## 📋 Available Templates

### 1. `template-basico.html`
Basic template with the minimum structure needed to create a new HTML page in Codeflow.

**Includes:**
- Complete HTML structure (head, body, layout)
- Sidebar menu
- Header with language selector
- Content area
- Required scripts
- SEO metadata

**When to use:** Use this template when you need to create a simple page from scratch.

---

### 2. `template-formularios.html`
Complete template with all available form components.

**Includes:**
- Text fields (input, textarea)
- Selectors (select)
- Checkboxes and radio buttons
- Date and time fields
- Numeric fields
- Disabled and read-only fields
- Button states
- HTML code examples

**When to use:** Use this template as a reference when creating forms or pages with user interaction.

---

### 3. `template-textos.html`
Template with all available text types and formatting.

**Includes:**
- Titles (h1, h2, h3)
- Paragraphs
- Bold and italic text
- Links
- Lists (ul, ol, dl)
- Inline code and code blocks
- Quotes
- Pre-formatted text
- Text with highlights (mark, small, del, ins, sub, sup)
- Separators (hr)

**When to use:** Use this template as a reference for text formatting and content structuring.

---

### 4. `template-timeline.html`
Template demonstrating the timeline component.

**Includes:**
- Basic timeline
- Timeline with version history
- Updates timeline
- Timeline with links and formatting
- Timeline with multiple paragraphs
- HTML code examples

**When to use:** Use this template when creating pages that need to display chronological events, version history or updates.

---

### 5. `template-componentes.html`
Template with all available visual components.

**Includes:**
- Tables (basic, with header/footer, with colspan/rowspan)
- Cards (.app-card)
- Informative boxes (.info-box, .highlight-box, .success-box)
- Code blocks with header
- Sections with icons (.icon-section)
- Fieldset and legend
- Separators (hr)
- Image placeholders

**When to use:** Use this template as a reference for visual components and content structuring.

---

### 6. `template-code-tabs.html`
Template demonstrating the code component with tabs to show different versions.

**Includes:**
- Code with tabs (Java 7, 8, 9, 11)
- Framework comparison
- Language comparison
- Independent syntax highlighting per tab
- Copy code button in each tab
- JavaScript to switch between tabs

**When to use:** Use this template when you need to show different versions of the same code, framework comparisons, or implementation evolution.

---

### 7. `template-completo.html`
Complete template combining all components in a single page.

**Includes:**
- All text types
- Complete forms
- Tables
- Cards
- Informative boxes
- Code (simple and with tabs)
- Timeline
- Sections with icons
- Fieldset and separators
- Complete metadata
- Giscus comments

**When to use:** Use this template as a complete reference or starting point for pages that need multiple components.

---

### 8. `template-architecture-diagram.html`
Template demonstrating an architecture diagram with layered boxes connected by arrows and a caption aligned to the bottom-right of the outer container.

**Includes:**
- `.arch-diagram` component (CSS in `resources/css/themes/bluesky/theme.css`)
- Layer boxes + arrows between layers
- Caption aligned near the right margin at the bottom

**When to use:** Use this template when creating pages that need to visually represent layered architectures (e.g., toolkits, stacks, frameworks).

---

## 🎨 Main CSS Classes

### Layout
- `.app-page` - Main page class
- `.app-layout` - Main layout container
- `.app-sidebar` - Sidebar menu
- `.app-content` - Content area
- `.content-container` - Content container (max-width: 900px)

### Forms
- `.app-form` - Form container
- `.app-label` - Field label
- `.app-input` - Input field
- `.app-select` - Select field
- `.app-textarea` - Text area
- `.app-button` - Button

### Components
- `.app-card` - Card to group content
- `.info-box` - Informative box (light blue)
- `.highlight-box` - Highlight box (yellow)
- `.success-box` - Success box (green)
- `.timeline` - Timeline container
- `.timeline-item` - Timeline item
- `.icon-section` - Section with icon
- `.code-block-wrapper` - Code block wrapper
- `.copy-code-btn` - Copy code button

### Text
- `h1`, `h2`, `h3` - Titles (automatically styled)
- `p` - Paragraphs
- `code` - Inline code
- `pre code` - Code block

---

## 📝 How to Use the Templates

1. **Choose the appropriate template** based on the content you need to create.

2. **Copy the template** to the desired location in the project folder structure.

3. **Adjust relative paths** of resources (CSS, JS, images) according to folder depth:
   - Root: `../../resources/...`
   - 1 level: `../../../resources/...`
   - 2 levels: `../../../../resources/...`
   - And so on...

4. **Update metadata:**
   - Page title (`<title>`)
   - Meta description
   - Meta keywords
   - Open Graph tags
   - Twitter Card tags
   - JSON-LD (Schema.org)

5. **Add your content** inside the `.content-container` div.

6. **Maintain the layout structure** (sidebar, header, content) to ensure the menu and other functionalities work correctly.

---

## 🔧 Basic Structure

All pages should follow this basic structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Metadata, CSS, scripts -->
</head>
<body class="app-page">
    <div class="app-layout">
        <aside class="app-sidebar" id="sidebar">
            <!-- Sidebar menu -->
        </aside>
        <main class="app-content">
            <div class="app-content__header">
                <!-- Header -->
            </div>
            <div class="app-content__body" id="contentBody">
                <div class="content-container">
                    <!-- YOUR CONTENT HERE -->
                </div>
            </div>
        </main>
    </div>
    <!-- JavaScript scripts -->
</body>
</html>
```

---

## 📚 Additional Resources

- **CSS:** `resources/css/themes/bluesky/theme.css`
- **JavaScript:** `resources/js/` (hash.js, i18n.js, menu.js, sidebar.js, content.js, tree.js, main.js, search.js, giscus.js)
- **Images:** `resources/img/` (codeflow.png, document.png, folder.png)
- **Highlight.js:** Included via CDN for code syntax highlighting

---

## 💡 Tips

1. **Always maintain the layout structure** - Do not remove the sidebar, header or layout structure, as this breaks the menu functionality and other features.

2. **Use appropriate CSS classes** - BlueSky theme classes are applied automatically when you use the correct classes.

3. **Test on different devices** - The layout is responsive, but always test on mobile and desktop.

4. **Maintain consistency** - Use the same formatting and structure patterns on all pages.

5. **Update metadata** - Always update SEO metadata (title, description, etc.) for each page.

---

## 🐛 Troubleshooting

### Menu doesn't appear
- Check if the `menu.js` script is included
- Check if the `#treeView` element exists in the HTML
- Check if the `resources/db/menu.json` file is accessible

### Styles not applied
- Check if the CSS path is correct
- Check if the `.app-page` class is on the body
- Check if the `theme.css` file is being loaded

### Scripts don't work
- Check if all scripts are included in the correct order
- Check if script paths are correct
- Open the browser console to see JavaScript errors

---

## 📞 Support

For questions or issues, consult:
- BlueSky theme documentation in the CSS file
- Examples in existing pages in `content/`
- Reference templates in this folder

---

**Last update:** January 2025
