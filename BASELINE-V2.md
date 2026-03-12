# 🎯 Baseline v2.0 - Stable Reference

## Overview

This document describes the v2.0 stable baseline created on March 12, 2026. This baseline represents a production-ready state of the Assessment Center application with async processing capabilities.

## Baseline Information

- **Tag**: `v2.0`
- **Branch**: `stable-v2` (immutable reference)
- **Commit**: `0e4e96c` - "feat: implement singleton storage for shared opportunities data"
- **Date**: March 12, 2026

## Features Included in v2.0

### Core Functionality
- ✅ **Async Job Processing** - Background processing for opportunity analysis
- ✅ **Singleton Storage Pattern** - Shared in-memory storage for opportunities
- ✅ **S3 Lifecycle Policies** - Automatic cleanup of job data after 14 days
- ✅ **API Gateway Timeout Handling** - Proper handling of 30-second timeout limits
- ✅ **Operational Rules** - Documented rules for system modifications

### Protected Modules
- ✅ **Selector Module** (v1.0.0-selector-stable) - Immutable, production-tested
  - Session management
  - Calculation engine
  - Export functionality
  - Configuration management

### Infrastructure
- ✅ Lambda function: `assessment-center-api`
- ✅ S3 bucket with lifecycle policies
- ✅ API Gateway integration
- ✅ AWS Amplify deployment pipeline

## Branch Strategy

### `stable-v2` Branch
- **Purpose**: Immutable stable reference
- **Usage**: Reference point for rollbacks and comparisons
- **Protection**: Should NOT be modified directly
- **Access**: Read-only for all team members

### `main` Branch
- **Purpose**: Active development branch
- **Usage**: All new features and improvements
- **Strategy**: Additive architecture - extend without modifying core
- **Protection**: Protected modules must not be modified

## Development Guidelines

### Adding New Features

When adding new features to the system:

1. **Start from `main` branch**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Follow Additive Architecture**
   - ✅ Add new services, controllers, routes
   - ✅ Extend existing functionality with new endpoints
   - ✅ Create new modules alongside existing ones
   - ❌ Do NOT modify protected modules (Selector)
   - ❌ Do NOT change core working functionality

4. **Test thoroughly**
   - Test new features in isolation
   - Verify existing functionality still works
   - Run property-based tests if applicable

5. **Merge to main**
   ```bash
   git checkout main
   git merge feature/your-feature-name
   git push origin main
   ```

### Protected Modules

The following modules are PROTECTED and must NOT be modified:

#### Selector Module (v1.0.0-selector-stable)
- `backend/src/controllers/selector/`
- `backend/src/services/selector/`
- `backend/src/routes/selector.ts`
- `backend/src/config/selector/`
- `backend/data/selector/`

**Rationale**: This module is production-tested and stable. Any changes risk breaking existing functionality.

### Rollback Strategy

If issues arise with new features:

1. **Identify the problem commit**
   ```bash
   git log --oneline
   ```

2. **Compare with stable baseline**
   ```bash
   git diff v2.0..HEAD
   ```

3. **Revert specific commits** (preferred)
   ```bash
   git revert <commit-hash>
   ```

4. **Hard reset to baseline** (last resort)
   ```bash
   git reset --hard v2.0
   git push origin main --force
   ```

## Verification Checklist

To verify the system is working correctly:

- [ ] Lambda health endpoint responds: `GET /health`
- [ ] Opportunity upload works: `POST /api/opportunities/upload`
- [ ] Job status polling works: `GET /api/opportunities/job/:jobId`
- [ ] Opportunities list works: `GET /api/opportunities/list`
- [ ] Selector module works: All selector endpoints functional
- [ ] S3 lifecycle policy active: Jobs cleaned up after 14 days

## Next Steps

### Immediate Actions
1. Monitor Amplify deployment
2. Verify production functionality
3. Document any issues found

### Future Enhancements
All future features should:
- Extend the system additively
- Not modify protected modules
- Include proper testing
- Follow operational rules in `.kiro/CRITICAL-RULES.md`

## References

- **Critical Rules**: `.kiro/CRITICAL-RULES.md`
- **Selector Module Docs**: `.kiro/specs/selector-module/`
- **Operational Rules**: See commit `a96898e`
- **Previous Baseline**: `v1.0.0-selector-stable`

## Contact

For questions about this baseline or development strategy, refer to:
- `.kiro/CRITICAL-RULES.md` - Operational rules
- `.kiro/specs/selector-module/STABLE-VERSION.md` - Selector protection rules

---

**Created**: March 12, 2026  
**Status**: Active Baseline  
**Next Review**: When creating v3.0
