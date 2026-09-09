# Codeflow

Technology articles and references, with a clear focus on Artificial Intelligence.
Live at [codeflow.com.br](https://codeflow.com.br).

## Stack

- Jekyll (the `github-pages` gem, built by GitHub Pages from `main`)
- Oracle ADF Faces "Fusion" look (`assets/css/adf-fusion.css` + project overrides)
- Vanilla JavaScript; search runs client-side over `search.json`
- Comments with [giscus](https://giscus.app) (one GitHub Discussion per post)

## Layout

| Path | Purpose |
|------|---------|
| `_layouts/` | `default.html` (site chassis) and `post.html` (article page) |
| `_includes/` | sidebar, drawers, home, comments, language dialog and sheet |
| `_posts/` | articles; translations share the same `key` and use `lang` + `permalink` |
| `_data/i18n/` | one dictionary per language (chrome, months, category labels) |
| `<lang>/index.html` | home page of each additional language |
| `_templates/` | post skeleton and example post (not built) |
| `scripts/validate_post.py` | checks a post (tree, search, tags, archive, list, figures, language) |

## Run locally

Requires Docker. The container uses the same `jekyll/jekyll:pages` image versions as GitHub Pages.

```bash
./serve.sh          # http://localhost:4000 with live reload
./serve.sh build    # one-off build into _site/
./serve.sh stop
```
