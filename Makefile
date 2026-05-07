.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-22s %s\n", $$1, $$2}'

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev: ## Run the frontend dev server
	npm run dev

build: ## Build the GitHub Pages artifact into docs/
	npm run build

data: ## Validate static data artifacts
	npm run data:validate

test: ## Run unit tests
	npm run test

test-integration: ## Run integration tests
	@echo "No integration tests are required for Mode A v1."

smoke: ## Build, serve docs/, and run Playwright smoke tests
	npm run smoke

lint: ## Run linters and type checks
	npm run lint
	npm run fmt:check
	npm run typecheck

fmt: ## Autoformat source files
	npm run fmt

pages-preview: ## Serve docs/ locally as GitHub Pages would
	npm run pages:preview

hooks-pre-commit: ## Run pre-commit checks manually
	.githooks/pre-commit

hooks-commit-msg: ## Run commit-msg check manually with MSG=.git/COMMIT_EDITMSG
	.githooks/commit-msg $${MSG:-.git/COMMIT_EDITMSG}

hooks-pre-push: ## Run pre-push checks manually
	.githooks/pre-push

release: ## Tag the current commit as v0.1.0 and push the tag
	git tag v0.1.0
	git push origin v0.1.0

clean: ## Remove local generated outputs
	rm -rf docs/assets docs/index.html docs/404.html docs/manifest.webmanifest docs/sw.js docs/registerSW.js coverage test-results playwright-report

