# Branching Strategies Reference

## Overview

Three main branching models dominate modern software development. The right choice depends on team size, release cadence, and CI/CD maturity.

---

## 1. GitFlow

**Origin:** Vincent Driessen, 2010. Widely adopted for products with scheduled releases.

### Full Diagram
```
main ─────────────────────────────────────────────●─── (v2.0.0)
       ╲                                          ╱
        ╲                                        ╱
develop  ●────●────●────●────●────●────●────●────●
              ╲        ╱         ╲        ╱
               ╲      ╱           ╲      ╱
feature/x       ●────●          release/2.0
                                    │
hotfix/1.1.1 ←── branch from main ──●── merges → main + develop
```

### Branch Types

| Branch | Purpose | Branches From | Merges Into |
|--------|---------|---------------|-------------|
| `main` | Production-ready code, tagged releases only | — | — |
| `develop` | Integration branch; always reflects next release state | `main` | — |
| `feature/*` | New features or non-emergency fixes | `develop` | `develop` |
| `release/*` | Release preparation (version bump, final bug fixes) | `develop` | `main` + `develop` |
| `hotfix/*` | Urgent production fixes that cannot wait for develop cycle | `main` | `main` + `develop` |

### Pros
- Clear, structured process everyone can follow
- Parallel release preparation possible
- Hotfixes isolated from in-progress feature work
- Easy to audit what went into each release

### Cons
- Heavy overhead for small teams or continuous delivery
- Long-lived feature branches cause merge conflicts
- `develop` can become a "merge graveyard"
- Release branches create double-merge burden

### When to Use
- Teams of 4–15 developers
- Software with scheduled, versioned releases (mobile apps, SaaS with release windows, libraries)
- Regulated environments where release traceability matters

### Common Mistakes
- Merging feature branches directly to `main` (bypasses `develop`)
- Forgetting to merge `release/*` back into `develop`
- Not deleting branches after merge (creates confusion)
- Creating hotfix branches from `develop` instead of `main`

---

## 2. GitHub Flow

**Origin:** GitHub, 2011. Streamlined for web applications with continuous deployment.

### Full Diagram
```
main  ●──────────────────────────────────────────●──────●
       ╲              ╱         ╲               ╱
        ╲            ╱           ╲             ╱
feature/a ●────●────●           feature/b ●──●
```

### Branch Types

| Branch | Purpose |
|--------|---------|
| `main` | Always deployable. Every commit here can go to production. |
| `feature/*` (or any descriptive branch) | All work. Short-lived. Branch from `main`, PR back to `main`. |

### Workflow Steps
1. Branch from `main`
2. Make commits, push regularly
3. Open a PR when ready for review (or as a draft early)
4. Team reviews and discusses
5. Deploy from the branch to staging/production for verification
6. Merge to `main`
7. Delete branch

### Pros
- Simple — easy to learn, easy to follow
- Forces continuous integration discipline
- Fast feedback loop
- Well-suited for web apps that deploy frequently

### Cons
- No explicit support for maintaining multiple release versions
- Harder to manage hotfixes without a `develop` buffer
- Requires strong CI/CD to be safe

### When to Use
- Small teams (1–10 developers)
- Web apps with continuous deployment
- Projects where only one version is "live" at a time

---

## 3. Trunk-Based Development

**Origin:** Extreme Programming practices. Popularized by Google and large tech companies.

### Full Diagram
```
main  ●──●──●──●──●──●──●──●──●──●──●── (CI runs on every commit)
         ╲   ╱     ╲   ╱
          ╲ ╱       ╲ ╱
    short-lived branches (<2 days)
```

### Core Principles
- All developers commit to `main` (or very short-lived branches < 2 days)
- Feature flags control what users see, not branches
- CI must pass before every merge
- Broken `main` is a team emergency — fix or revert immediately

### Pros
- No merge conflicts (or trivially small ones)
- Forces continuous integration — bugs surface immediately
- Enables true continuous deployment
- Scales to very large teams (Google, Meta use this)

### Cons
- Requires mature CI/CD pipeline
- Requires feature flags infrastructure
- Incomplete features in production (behind flags)
- Needs strong discipline and automated test coverage

### When to Use
- Teams of 15+ developers
- Continuous deployment with automated testing
- Organizations with feature flag infrastructure (LaunchDarkly, etc.)

---

## Comparison Table

| Dimension | GitFlow | GitHub Flow | Trunk-Based |
|-----------|---------|-------------|-------------|
| Complexity | High | Low | Medium |
| Team size fit | 4–15 | 1–10 | 15+ |
| Release cadence | Scheduled | Continuous | Continuous |
| CI/CD requirement | Moderate | Strong | Very Strong |
| Multiple versions | ✅ Yes | ❌ No | ❌ No |
| Hotfix support | ✅ Explicit | ⚠️ Ad-hoc | ⚠️ Via flags |
| Merge conflict risk | High | Medium | Low |
| Onboarding ease | Hard | Easy | Medium |

---

## Migration Guides

### GitFlow → GitHub Flow
1. Merge all open `feature/*` branches into `develop`
2. Merge `develop` into `main`
3. Delete `develop` branch
4. Agree: `main` is now always deployable
5. All new work branches from `main` and PRs target `main`
6. For next release: bump version on `main` directly or via a short-lived `release/vX.Y.Z` branch

### GitHub Flow → Trunk-Based
1. Set up CI that blocks merges on failure
2. Implement feature flags for any in-progress work
3. Enforce branch lifetime limits (< 2 days)
4. Add automated test coverage target (80%+)
5. Train team on "fix forward or revert" culture
