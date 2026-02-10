# Git Conventions

## Branch Strategy
- **main**: Primary development branch
- Feature branches as needed

## Commit Message Format
Based on git log analysis:
```
<type>: <description in Chinese or English>
```

### Types
- `refactor`: Code restructuring without behavior change
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation updates
- `chore`: Maintenance tasks

### Examples (from recent commits)
```
refactor: centralize validation helpers and refactor form handling
refactor: migrate form data parsing to Zod schemas
refactor: centralize theme definitions, improve toast handling
```

## Quality Checks
Run before committing:
```bash
npm -C apps/web run check
# Runs: lint (max-warnings=0) + test + build
```
