---
name: sisma-legacy-to-modern-migration-analyst
description: Compare codebases, UX, and plan database migration.
---

# Legacy to Modern Migration Analyst

## Use when
- User wants to compare two codebases (Legacy vs Modern) for feature parity.
- Analyzing UX/Behavior consistency between old and new systems.
- Planning database migration strategies between different schemas/tech stacks.
- Identifying risks in migrating user data from an old system to a new one.

## Behavior
1. **Feature Parity Analysis:**
   - Clone/Inspect both repos.
   - List all endpoints/Controllers in Legacy.
   - List all features/routes in Modern.
   - Create a matrix: Feature | Legacy Status | Modern Status | Gap.

2. **UX/Behavior Analysis:**
   - Compare key user flows (Login, Dashboard, Form Submission).
   - Identify differences in input validation, error handling, and navigation.
   - Highlight "Breaking Changes" in user behavior.

3. **Database Migration Analysis:**
   - Inspect `models` or schema files in both repos.
   - Map Legacy Tables/Columns to Modern Tables/Columns.
   - Identify data transformation needs (e.g., JSONB conversion, enum changes).
   - Flag potential data loss risks.

4. **Output Deliverables:**
   - `PARITY_REPORT.md`: Table of features (Implemented/Partial/Missing).
   - `UX_COMPARISON.md`: Key user flow differences.
   - `MIGRATION_PLAN.md`: Step-by-step guide for data migration (SQL scripts or Python scripts).

## Pitfalls
- **Assumption Bias:** Don't assume "Same Name = Same Logic". Check the implementation code.
- **Hidden Dependencies:** Legacy systems often have business logic in stored procedures or frontend JS that isn't obvious from the DB schema.
- **Data Integrity:** Always verify if legacy data is clean. If legacy has bad data, migration will fail or propagate errors.

## References
- `https://github.com/ipangpangeran/sisma.git` (Legacy)
- `https://github.com/ipangpangeran/new_sisma.git` (Modern)