---
name: railway-cli
description: Debug and manage Railway production deployments. Use when the user asks to check logs, inspect deployments, view/set environment variables, restart services, or SSH into a Railway service.
allowed-tools: Bash(railway:*)
---

# Railway CLI Debugging

## Logs

```bash
# Stream live logs
railway logs

# Last N lines (default 100)
railway logs -n 50

# Build logs only
railway logs --build

# Target a specific service
railway logs -n 100 --service backend

# Target a specific environment
railway logs -n 100 --environment production
```

## Status & info

```bash
# Project overview and deployment status
railway status

# Who you're authenticated as
railway whoami

# Open project dashboard in browser
railway open
```

## Environment variables

```bash
# List all variables
railway variables

# Set a variable
railway variables --set KEY=value

# Set multiple
railway variables --set KEY1=value1 --set KEY2=value2

# Target a specific service
railway variables --service backend
```

## Deployments

```bash
# Deploy current directory (streams logs)
railway up

# Deploy without streaming
railway up --detach

# Redeploy the latest image
railway redeploy

# Restart service (no rebuild)
railway restart

# Remove deployment
railway down
```

## SSH access

```bash
# Open a shell on the running deployment
railway ssh

# Target specific service
railway ssh --service backend
```

## Database

```bash
# Interactive database shell
railway connect

# Connect to specific DB service
railway connect --service postgres
```

## Environments

```bash
# Switch active environment (interactive)
railway environment

# Create a new environment
railway environment new staging

# Delete an environment
railway environment delete staging
```

## Run a command with Railway env vars

```bash
# Execute a one-off command with all Railway variables injected
railway run node scripts/seed.js
railway run pnpm db:migrate
```

## Global flags (work on any command)

| Flag | Purpose |
|---|---|
| `--service <name>` | Target a specific service |
| `--environment <name>` | Target a specific environment |
| `--json` | Structured JSON output (pipe to `jq`) |
| `-y, --yes` | Skip confirmation prompts |

## Common debugging workflow

```bash
# 1. Check recent errors
railway logs -n 100

# 2. Confirm deployment state
railway status

# 3. Inspect env vars (check for missing secrets)
railway variables --service backend

# 4. SSH in to poke around interactively
railway ssh --service backend

# 5. Restart if needed (e.g. after fixing a variable)
railway restart --service backend
```
