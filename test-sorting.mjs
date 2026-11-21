import { SORT_ALGORITHMS, generateSortSteps, verifySorted } from './src/lib/sorting.ts';

let seed = 123456789;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function makeArray(size) {
  return Array.from({ length: size }, () => 1 + Math.floor(rnd() * 100));
}

let failures = 0;

function check(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log('FAIL', label, detail ?? '');
  }
}

// 小数组逐帧记录：8 种算法 × 6 种规模 × 8 轮随机对拍
for (const algorithm of SORT_ALGORITHMS) {
  for (const size of [0, 1, 2, 5, 12, 31]) {
    for (let round = 0; round < 8; round += 1) {
      const input = makeArray(size);
      const original = input.slice();
      const result = generateSortSteps(algorithm.id, input);
      const final = result.steps[result.steps.length - 1].array;
      check(
        `${algorithm.id}/${size}`,
        verifySorted(final) && final.length === original.length,
        { original, final },
      );
    }
  }
  console.log('checked', algorithm.id);
}

// 大数组降采样：500 元素仍要正确排序，并把动画帧数限制在 maxFrames 附近
for (const algorithm of SORT_ALGORITHMS) {
  for (const size of [200, 500]) {
    const input = makeArray(size);
    const result = generateSortSteps(algorithm.id, input, { maxFrames: 4000 });
    const final = result.steps[result.steps.length - 1].array;
    check(
      `${algorithm.id}/sampled/${size}`,
      verifySorted(final) && final.length === size,
      { frames: result.steps.length },
    );
    check(
      `${algorithm.id}/sampled/${size}/frames`,
      result.steps.length <= 4002,
      { frames: result.steps.length, frameEvery: result.frameEvery },
    );
    check(
      `${algorithm.id}/sampled/${size}/frameEvery`,
      result.frameEvery >= 1 && Number.isFinite(result.frameEvery),
      { frameEvery: result.frameEvery },
    );
  }
  console.log('checked sampled', algorithm.id);
}

console.log(failures === 0 ? 'ALL SORT TESTS PASSED' : `${failures} FAILURES`);
process.exitCode = failures === 0 ? 0 : 1;
