# Branch & Tag Naming Conventions Reference

## Branch Name Format

```
<type>/<ticket-or-scope>/<short-description>
```

All lowercase. Hyphens only (no underscores, no spaces). Max 50 characters total.

---

## Valid Branch Types

| Type | Use For |
|------|---------|
| `feature/` | New functionality, enhancements |
| `fix/` | Bug fixes in development |
| `hotfix/` | Urgent production fixes (GitFlow) |
| `release/` | Release preparation (GitFlow) |
| `chore/` | Maintenance: deps, tooling, config |
| `docs/` | Documentation changes only |
| `refactor/` | Code restructuring, no behavior change |
| `test/` | Adding or fixing test coverage |
| `experiment/` | Exploratory spike, may be discarded |

---

## Real-World Examples: Good vs Bad

### Feature Branches

| ✅ Good | ❌ Bad | Why Bad |
|---------|--------|---------|
| `feature/PROJ-123/user-authentication` | `feature/auth` | Too vague |
| `feature/ABC-456/dark-mode-toggle` | `feature/DarkModeToggle` | Wrong case, no hyphens |
| `feature/42/export-pdf-reports` | `new-feature` | Missing type prefix |
| `feature/payment-gateway-integration` | `feature/stuff` | Not descriptive |
| `feature/GH-88/onboarding-flow` | `update` | No type, no description |

### Fix Branches

| ✅ Good | ❌ Bad | Why Bad |
|---------|--------|---------|
| `fix/PROJ-789/login-redirect-loop` | `fix/bug` | Generic, meaningless |
| `fix/null-pointer-cart-checkout` | `bugfix/issue` | Wrong type prefix + generic |
| `fix/GH-12/mobile-nav-overflow` | `Fix_NavBug` | Wrong case, underscores |

### Hotfix Branches (GitFlow only)

| ✅ Good | ❌ Bad |
|---------|--------|
| `hotfix/v1.2.4/payment-crash-on-null` | `hotfix/payment-bug` |
| `hotfix/v2.0.1/security-header-missing` | `hotfix/fix` |

### Release Branches (GitFlow only)

| ✅ Good | ❌ Bad |
|---------|--------|
| `release/v2.0.0` | `release/new-version` |
| `release/v1.5.0-rc.1` | `release/march` |

### Chore / Maintenance

| ✅ Good | ❌ Bad |
|---------|--------|
| `chore/upgrade-node-20` | `update/deps` |
| `chore/configure-eslint-flat` | `misc` |
| `chore/PROJ-500/migrate-jest-to-vitest` | `refactor` |

---

## Ticket Number Patterns

### Jira
Format: `PROJ-123` (project key, dash, number)
```
feature/PROJ-123/implement-sso
fix/PROJ-456/correct-tax-calculation
```

### Linear
Format: `ABC-456` (team prefix, dash, number)
```
feature/ENG-78/redesign-dashboard
chore/INF-12/upgrade-terraform
```

### GitHub Issues
Format: `GH-42` or just `42`
```
feature/GH-42/add-dark-mode
fix/42/fix-broken-redirect
```

---

## Tag Naming

### Release Tags
```
v1.0.0          ← first stable release
v1.2.3          ← patch release
v2.0.0          ← major/breaking release
```

### Pre-Release Tags
```
v1.3.0-alpha.1  ← first alpha
v1.3.0-alpha.2  ← second alpha iteration
v1.3.0-beta.1   ← beta
v1.3.0-beta.2
v1.3.0-rc.1     ← release candidate
v1.3.0-rc.2     ← revised release candidate
v1.3.0          ← final release
```

### Rules
- Always prefix with `v`
- Always use annotated tags for releases: `git tag -a v1.2.3 -m "Release v1.2.3"`
- Never use lightweight tags for releases (no message = hard to audit)
- Never reuse or move a tag

---

## Environment Branches

Long-running environment branches (use sparingly):

```
staging         ← mirrors production, used for final QA
sandbox         ← exploratory/demo environment
preview         ← PR preview deployments (auto-created by CI)
```

These should **never** be used for feature development — only for environment deployment targets.

---

## Quick Validation Checklist

Before finalizing a branch name, verify:
- [ ] All lowercase
- [ ] Only hyphens (no underscores, spaces, slashes except type separator)
- [ ] Starts with a valid type prefix
- [ ] Includes a meaningful description (not `bug`, `fix`, `stuff`, `changes`)
- [ ] Under 50 characters total
- [ ] Ticket number included if your team uses one
