# Spec: Módulo Selector de Herramientas de Migración

## 📋 Overview

Este spec define la implementación completa del módulo "Selector" para el MAP Center, un sistema automatizado de selección de herramientas de assessment para migraciones AWS.

## 📁 Spec Files

1. **design.md** - Documento de diseño técnico (Design-First approach)
   - Arquitectura del sistema
   - Modelos de datos
   - Lógica de negocio
   - Estructura de componentes

2. **requirements.md** - Requisitos funcionales y no funcionales
   - Business requirements
   - Functional requirements
   - Non-functional requirements
   - Acceptance criteria

3. **tasks.md** - Plan de implementación detallado
   - 19 tareas principales
   - ~150 sub-tareas
   - Estimación: 3 semanas
   - Organizado en 4 fases

## 🎯 Quick Start

### Para Implementadores:
1. Leer `design.md` para entender la arquitectura
2. Revisar `requirements.md` para entender qué construir
3. Seguir `tasks.md` en orden secuencial

### Para Revisores:
1. Validar que `design.md` cumple con restricciones de aislamiento
2. Verificar que `requirements.md` cubre todos los casos de uso
3. Confirmar que `tasks.md` es realista y completo

## 🚀 Implementation Phases

### Phase 1: Backend Infrastructure (Week 1)
- Setup & configuration
- Backend services (5 services)
- API routes & controllers
- Integration points
- Testing

### Phase 2: Frontend Components (Week 2)
- Component structure
- Questionnaire flow
- Results display
- Export functionality
- History & analytics
- Frontend integration
- Styling & UX

### Phase 3: Export & History Polish (Days 15-17)
- PDF generation enhancement
- History enhancements

### Phase 4: Testing & Deployment (Days 18-20)
- End-to-end testing
- Cross-browser testing
- Documentation
- Deployment
- Final validation

## ⚠️ Critical Constraints

### MUST NOT:
- Modify existing MAP Center logic
- Alter existing Lambdas
- Modify existing API routes
- Reuse existing services
- Change core configurations

### MAY (with approval):
- Modify `backend/src/index.ts` (add 2 lines)
- Modify `frontend/src/App.tsx` (add Selector phase)
- Modify `frontend/src/types/assessment.ts` (add types)

## 📊 Key Metrics

- **Time Reduction:** 10 minutes → 3 minutes
- **Accuracy:** 100% match with Excel
- **Auto-save:** Every answer (500ms debounce)
- **History:** 5 assessments per page
- **Export:** PDF + CSV formats

## 🔗 Integration Points

1. **Backend Route:** Add `/api/selector` to Express
2. **Frontend Phase:** Add "Selector" tab to navigation
3. **TypeScript Types:** Add Selector interfaces

## 📦 Deliverables

### Backend:
- 5 new services
- 1 new router
- 1 new controller
- 2 config files (JSON)

### Frontend:
- 10 new components
- 1 new phase component
- Integration with App.tsx

### Infrastructure:
- S3 prefix structure: `/selector/`
- API routes: `/api/selector/*`

## ✅ Success Criteria

- [ ] All 28 questions implemented
- [ ] Auto-save works reliably
- [ ] Score calculation matches Excel
- [ ] PDF/CSV exports work
- [ ] History pagination works
- [ ] No conflicts with existing code
- [ ] Performance meets requirements
- [ ] All tests pass

## 📚 References

- Base documentation: `/base_docs_selector/`
- Scoring matrix: `Matriz_Seleccion_MAP_Extendida 1.xlsx`
- Decision diagram: `Diagrama de decision de herramienta-v2.png`

## 🤝 Collaboration

This is a collaborative project. Multiple team members may work on different sections simultaneously. The module is designed to be completely isolated to prevent conflicts.

## 📞 Questions?

For questions or clarifications:
1. Review the design.md for technical details
2. Check requirements.md for functional specs
3. Consult tasks.md for implementation steps

---

**Status:** Ready for Implementation
**Branch:** tool-selector-karla-dev
**Owner:** karla-dev
**Created:** 2024-02-24
