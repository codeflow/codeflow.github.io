# 🚀 Release Notes - Operating Systems

## 📊 Overview

This release updates the Operating Systems track with a new Threads and Concurrency page focused on threading model design and runtime mapping strategies.

---

## 📚 New Content

### 🟢 Threads and Concurrency (2/5 - 40% Complete)
#### ✅ Threading Models
- [OS] Added "Threading Models" (en) - content/os.md/th959179/en/3cdn2afxb0nq.html
- Covers many-to-one, one-to-one, and many-to-many mapping models.
- Includes practical scheduler mapping example and model selection guidance.

---

## 🔄 Unreleased

### Added
- [OS] Added "Threading Models" (en) - content/os.md/th959179/en/3cdn2afxb0nq.html

### Changed
- Added "Latest Content" carousel to `welcome` page before Content Statistics.
- Carousel now displays the 10 most recent posts with square cards, summaries, and `Read more...` links.
- Carousel navigation updated to right-aligned arrow controls (`◀` / `▶`) with refined BlueSky visual style.
- Updated thread page title icons from `🧵` to `🔀` to better represent parallelism/computing context.

### Fixed
- Fixed welcome carousel layout to render as a horizontal strip when content is loaded dynamically in `index.html`.
- Fixed style precedence issues by moving carousel styles to global BlueSky theme and aligning local overrides.
- Fixed spacing between the last architecture diagram box and caption using a conservative global CSS adjustment in `arch-diagram`.

---

## 📈 Statistics

### Content Progress

| Category | Available Topics | Total Topics | Completion |
|----------|-----------------|-------------|------------|
| **Threads and Concurrency** | 2 | 5 | 🟡 40% |
| **Operating Systems Fundamentals** | 4 | 4 | ✅ 100% |
| **Process Management** | 7 | 7 | ✅ 100% |

### Overall Progress
- **Total Pages Created**: 13
- **Main Scope**: Threads and Concurrency - 2/5 (40%)
- **Secondary Scope**: Operating Systems Fundamentals - 4/4 (100%)
- **Additional Scope**: Process Management - 7/7 (100%)

---

## 🎨 Features

### Content Structure
- ✅ Progressive learning path (Simple -> Intermediate -> Advanced)
- ✅ Practical examples and explanations
- ✅ Reusable components and section patterns
- ✅ Latest content discovery via carousel cards on welcome page

### Components Used
- Info boxes and highlight boxes
- Table component for model comparison
- Code block with detailed code breakdown

### Image Management
- Suggested sections can be indexed for image planning via `/find-image`
- Hash-based naming remains compatible with `summary.json` workflow

---

## 🔧 Technical Improvements

### Rule System Updates
- ✅ `/learn` now includes mandatory `/update-release` as final step
- ✅ `template-release.md` introduced for consistent GitHub release structure
- ✅ `/learn-welcome` rules updated: new content must feed Latest Content cards and keep exactly 10 recent items
- ✅ `/learn` command/rules updated to enforce 10-item limit for timeline + carousel feed (`updates.json`)

### Bug Fixes
- ✅ Release file generation now available at `releases/release.md`
- ✅ Release content standardized to the same template structure
- ✅ Carousel controls restyled to icon-only arrows without button boxes

---

## 📝 Documentation Structure

Each page includes:
- **Metadata**: creation date and author
- **About Section**: topic overview
- **Progressive Content**: simple to advanced path
- **Summary**: key point recap
- **References**: supporting links

---

## 🚀 Next Steps

### Planned Content
- Thread Creation and Management
- Concurrency and Parallelism
- Race Conditions and Thread Safety

---

## 📅 Release Date

**February 21, 2026**

---

## 👥 Contributors

- **@rafaelsantos** - Content creation and development

---

## 🔗 Related Links

- [Codeflow Platform](https://codeflow.com.br)
- [Engineering Repository](https://github.com/codeflow/engineering)
- [Documentation](https://codeflow.com.br/content/en/welcome.html)

---

## 📄 License

This content is part of the Codeflow educational platform.
