import { allProgramPresets, programPlanShape } from '../src/features/program/domain/programCatalogue.ts';
for (const p of allProgramPresets()) {
  const s = programPlanShape(p);
  console.log(p.planId, JSON.stringify(s));
  console.log('  phases', p.phases.map(f=>`${f.name} ${f.startDay}-${f.endDay}`).join(' | '));
}
