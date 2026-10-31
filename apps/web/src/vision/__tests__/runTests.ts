import { runVisionEngineUnitTests } from './visionEngine.test';

const { passed, failed, results } = runVisionEngineUnitTests();

console.log('\n=======================================');
console.log('    SLIDEX VISION ENGINE UNIT TESTS    ');
console.log('=======================================');
results.forEach((r) => console.log(r));
console.log(`\nTOTAL: ${passed} PASSED, ${failed} FAILED\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
