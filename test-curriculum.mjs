import { CURRICULUM, ALL_LEVELS } from './src/data/curriculum.ts';

let errors = [];
if (CURRICULUM.length !== 10) errors.push(`chapters: ${CURRICULUM.length}`);
const ids = new Set();
for (const chapter of CURRICULUM) {
  if (chapter.levels.length !== 5) errors.push(`${chapter.id} levels: ${chapter.levels.length}`);
  for (const level of chapter.levels) {
    if (ids.has(level.id)) errors.push(`duplicate level id ${level.id}`);
    ids.add(level.id);
    if (level.tasks.length !== 5) errors.push(`${level.id} tasks: ${level.tasks.length}`);
    for (const task of level.tasks) {
      if (task.kind === 'choice' && (task.answer < 0 || task.answer >= task.options.length)) {
        errors.push(`${task.id} choice answer out of range`);
      }
      if (task.kind === 'fill' && !task.answer.trim()) errors.push(`${task.id} empty fill answer`);
      if (task.kind === 'order' && task.lines.length < 2) errors.push(`${task.id} too few order lines`);
      if (task.kind === 'challenge') {
        if (!task.solution.trim()) errors.push(`${task.id} empty solution`);
        if (!task.checks.length) errors.push(`${task.id} no checks`);
      }
    }
  }
}
console.log('chapters', CURRICULUM.length, 'levels', ALL_LEVELS.length, 'tasks', ALL_LEVELS.reduce((sum, level) => sum + level.tasks.length, 0));
if (errors.length) {
  console.log(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('CURRICULUM OK');
}
