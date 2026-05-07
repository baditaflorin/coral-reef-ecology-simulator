# Deployment

Live URL:

https://baditaflorin.github.io/coral-reef-ecology-simulator/

Repository:

https://github.com/baditaflorin/coral-reef-ecology-simulator

## Publish

GitHub Pages serves the `main` branch `/docs` directory.

To publish manually:

```sh
npm install
make build
git add docs
git commit -m "chore: publish pages build"
git push
```

## Rollback

Revert the publishing commit and push:

```sh
git revert <commit_sha>
git push
```

## Custom Domain

No custom domain is configured in v1. To add one, create `docs/CNAME`, configure DNS with the domain provider, then enable HTTPS in the GitHub Pages settings.

## GitHub Pages Notes

GitHub Pages does not support `_headers` or `_redirects`. The app uses `404.html` as an SPA fallback. The service worker scope and Vite base path are both tied to `/coral-reef-ecology-simulator/`.

