import type { SortAlgorithmId } from '@/types';

export interface SortStep {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
  line: number;
  comparisons: number;
  swaps: number;
  depth: number;
  done: boolean;
}

export interface SortResult {
  steps: SortStep[];
  comparisons: number;
  swaps: number;
  depth: number;
  /** 生成动画时使用的抽样间隔；1 表示逐帧记录，>1 表示大数组降采样。 */
  frameEvery: number;
}

export interface SortOptions {
  /** 最多保留多少帧动画；超过后自动按固定间隔抽样，避免 500 元素时内存爆炸。 */
  maxFrames?: number;
}

export interface SortAlgorithm {
  id: SortAlgorithmId;
  name: string;
  en: string;
  complexity: string;
  space: string;
  stable: boolean;
  summary: string;
  code: string[];
  pseudo: string[];
  color: string;
}

export const SORT_ALGORITHMS: SortAlgorithm[] = [
  {
    id: 'bubble',
    name: '冒泡排序',
    en: 'Bubble Sort',
    complexity: 'O(n²)',
    space: 'O(1)',
    stable: true,
    summary: '相邻两个比较，大的往后换；每一轮把当前最大值送到末尾。',
    color: '#4d8dff',
    code: [
      'for i in range(n - 1):',
      '    for j in range(n - 1 - i):',
      '        if a[j] > a[j + 1]:',
      '            swap(a[j], a[j + 1])',
      '    # 第 i 轮结束，末尾就位',
    ],
    pseudo: ['重复扫描未排序区', '相邻逆序就交换', '每轮缩小右边界'],
  },
  {
    id: 'selection',
    name: '选择排序',
    en: 'Selection Sort',
    complexity: 'O(n²)',
    space: 'O(1)',
    stable: false,
    summary: '每轮从未排序区找最小值，放到已排序区末尾。交换次数最少。',
    color: '#7dacff',
    code: [
      'for i in range(n - 1):',
      '    min_idx = i',
      '    for j in range(i + 1, n):',
      '        if a[j] < a[min_idx]:',
      '            min_idx = j',
      '    swap(a[i], a[min_idx])',
    ],
    pseudo: ['扫描未排序区找最小', '与当前位置交换', '已排序区右移一格'],
  },
  {
    id: 'insertion',
    name: '插入排序',
    en: 'Insertion Sort',
    complexity: 'O(n²)',
    space: 'O(1)',
    stable: true,
    summary: '像整理手牌：把当前元素插入左边已经有序的序列。近乎有序时很快。',
    color: '#3ddc97',
    code: [
      'for i in range(1, n):',
      '    key = a[i]',
      '    j = i - 1',
      '    while j >= 0 and a[j] > key:',
      '        a[j + 1] = a[j]',
      '        j -= 1',
      '    a[j + 1] = key',
    ],
    pseudo: ['取当前元素作为 key', '左边比 key 大的都右移', '把 key 放回空位'],
  },
  {
    id: 'shell',
    name: '希尔排序',
    en: 'Shell Sort',
    complexity: 'O(n^1.3)',
    space: 'O(1)',
    stable: false,
    summary: '按间隔做插入排序，逐步缩小间隔；让元素先大体归位，减少后期移动。',
    color: '#ffc44d',
    code: [
      'gap = n // 2',
      'while gap > 0:',
      '    for i in range(gap, n):',
      '        key = a[i]',
      '        j = i',
      '        while j >= gap and a[j - gap] > key:',
      '            a[j] = a[j - gap]',
      '            j -= gap',
      '        a[j] = key',
      '    gap //= 2',
    ],
    pseudo: ['取一个间隔 gap', '对每个间隔做插入排序', 'gap 减半直到 1'],
  },
  {
    id: 'merge',
    name: '归并排序',
    en: 'Merge Sort',
    complexity: 'O(n log n)',
    space: 'O(n)',
    stable: true,
    summary: '把数组不断二分，再两两合并；合并时按顺序取较小值。',
    color: '#a78bfa',
    code: [
      'def merge_sort(a, l, r):',
      '    if l >= r: return',
      '    mid = (l + r) // 2',
      '    merge_sort(a, l, mid)',
      '    merge_sort(a, mid + 1, r)',
      '    merge(a, l, mid, r)',
    ],
    pseudo: ['二分到只剩一个元素', '合并两个有序段', '谁小先取谁'],
  },
  {
    id: 'quick',
    name: '快速排序',
    en: 'Quick Sort',
    complexity: 'O(n log n)',
    space: 'O(log n)',
    stable: false,
    summary: '选一个基准，把小的放左边、大的放右边，再递归处理两边。',
    color: '#ff8fb3',
    code: [
      'def quick_sort(a, l, r):',
      '    if l >= r: return',
      '    p = partition(a, l, r)',
      '    quick_sort(a, l, p - 1)',
      '    quick_sort(a, p + 1, r)',
      '',
      'def partition(a, l, r):',
      '    pivot = a[r]',
      '    i = l',
      '    for j in range(l, r):',
      '        if a[j] < pivot:',
      '            swap(a[i], a[j]); i += 1',
      '    swap(a[i], a[r])',
      '    return i',
    ],
    pseudo: ['选最右元素为基准', '小于基准的换到左边', '基准归位后递归两边'],
  },
  {
    id: 'heap',
    name: '堆排序',
    en: 'Heap Sort',
    complexity: 'O(n log n)',
    space: 'O(1)',
    stable: false,
    summary: '先建大顶堆，再不断把堆顶换到末尾，重新调整堆。',
    color: '#ffb86b',
    code: [
      'build_max_heap(a)',
      'for end in range(n - 1, 0, -1):',
      '    swap(a[0], a[end])',
      '    sift_down(a, 0, end)',
    ],
    pseudo: ['从最后一个父节点向前建堆', '堆顶与末尾交换', '对剩余部分下沉调整'],
  },
  {
    id: 'radix',
    name: '基数排序',
    en: 'Radix Sort',
    complexity: 'O(d·n)',
    space: 'O(n)',
    stable: true,
    summary: '按个位、十位、百位依次稳定分配到 10 个桶，再按桶回收。',
    color: '#6ee7f9',
    code: [
      'exp = 1',
      'while max(a) // exp > 0:',
      '    buckets = [[] for _ in range(10)]',
      '    for value in a:',
      '        buckets[value // exp % 10].append(value)',
      '    a = flatten(buckets)',
      '    exp *= 10',
    ],
    pseudo: ['从最低位开始', '按当前位分桶', '按桶顺序回收'],
  },
];

export function algorithmById(id: SortAlgorithmId): SortAlgorithm {
  return SORT_ALGORITHMS.find((item) => item.id === id) ?? SORT_ALGORITHMS[0];
}

function snapshot(
  array: number[],
  comparing: number[],
  swapping: number[],
  sorted: Set<number>,
  line: number,
  comparisons: number,
  swaps: number,
  depth: number,
  pivot?: number,
  done = false,
): SortStep {
  return {
    array: array.slice(),
    comparing: [...comparing],
    swapping: [...swapping],
    sorted: [...sorted],
    pivot,
    line,
    comparisons,
    swaps,
    depth,
    done,
  };
}

function estimateSteps(id: SortAlgorithmId, n: number): number {
  const nlogn = Math.max(1, n * Math.log2(Math.max(2, n)));
  switch (id) {
    case 'bubble':
    case 'selection':
    case 'insertion':
      return n * n * 2;
    case 'shell':
      return n * n;
    case 'heap':
      return nlogn * 3;
    case 'quick':
      return nlogn * 2.5;
    case 'merge':
      return nlogn * 3;
    case 'radix':
      return n * 4;
    default:
      return nlogn * 2;
  }
}

export function generateSortSteps(
  id: SortAlgorithmId,
  input: number[],
  options: SortOptions = {},
): SortResult {
  const a = input.slice();
  const n = a.length;
  const steps: SortStep[] = [];
  const sorted = new Set<number>();
  let comparisons = 0;
  let swaps = 0;
  let depth = 0;
  let maxDepth = 0;

  // 小数组逐帧记录；大数组按估算步数抽样到 maxFrames 以内，保证 500 元素也能流畅预览。
  const maxFrames = Math.max(200, options.maxFrames ?? 4000);
  const frameEvery = n <= 120 ? 1 : Math.max(1, Math.ceil(estimateSteps(id, n) / maxFrames));
  let pushed = 0;

  function push(
    comparing: number[] = [],
    swapping: number[] = [],
    line = 1,
    pivot?: number,
    done = false,
  ) {
    pushed += 1;
    // 抽样时仍然统计 comparisons/swaps，只丢弃中间帧；最后一帧永远保留。
    if (!done && frameEvery > 1 && pushed % frameEvery !== 0) return;
    steps.push(
      snapshot(a, comparing, swapping, sorted, line, comparisons, swaps, maxDepth, pivot, done),
    );
  }

  function swap(i: number, j: number) {
    if (i === j) return;
    const temp = a[i];
    a[i] = a[j];
    a[j] = temp;
    swaps += 1;
  }

  push([], [], 1);

  if (n <= 1) {
    for (let i = 0; i < n; i += 1) sorted.add(i);
    push([], [], 1, undefined, true);
    return { steps, comparisons, swaps, depth: maxDepth, frameEvery };
  }

  switch (id) {
    case 'bubble': {
      for (let i = 0; i < n - 1; i += 1) {
        push([], [], 1);
        let swapped = false;
        for (let j = 0; j < n - 1 - i; j += 1) {
          comparisons += 1;
          push([j, j + 1], [], 2);
          if (a[j] > a[j + 1]) {
            push([j, j + 1], [j, j + 1], 3);
            swap(j, j + 1);
            swapped = true;
            push([j, j + 1], [j, j + 1], 4);
          }
        }
        sorted.add(n - 1 - i);
        push([], [], 5);
        if (!swapped) {
          for (let k = 0; k < n - 1 - i; k += 1) sorted.add(k);
          break;
        }
      }
      for (let i = 0; i < n; i += 1) sorted.add(i);
      push([], [], 5, undefined, true);
      break;
    }
    case 'selection': {
      for (let i = 0; i < n - 1; i += 1) {
        let minIndex = i;
        push([i], [], 1);
        for (let j = i + 1; j < n; j += 1) {
          comparisons += 1;
          push([j, minIndex], [], 3);
          if (a[j] < a[minIndex]) {
            minIndex = j;
            push([j], [], 4);
          }
        }
        if (minIndex !== i) {
          push([i, minIndex], [i, minIndex], 5);
          swap(i, minIndex);
          push([i, minIndex], [i, minIndex], 6);
        }
        sorted.add(i);
        push([], [], 6);
      }
      sorted.add(n - 1);
      push([], [], 6, undefined, true);
      break;
    }
    case 'insertion': {
      sorted.add(0);
      for (let i = 1; i < n; i += 1) {
        const key = a[i];
        let j = i - 1;
        push([i], [], 1);
        while (j >= 0 && a[j] > key) {
          comparisons += 1;
          push([j, j + 1], [], 4);
          a[j + 1] = a[j];
          swaps += 1;
          push([j, j + 1], [j + 1], 5);
          j -= 1;
        }
        a[j + 1] = key;
        if (j + 1 !== i) {
          swaps += 1;
          push([j + 1], [j + 1], 6);
        }
        for (let k = 0; k <= i; k += 1) sorted.add(k);
        push([], [], 7);
      }
      for (let i = 0; i < n; i += 1) sorted.add(i);
      push([], [], 7, undefined, true);
      break;
    }
    case 'shell': {
      let gap = Math.floor(n / 2);
      while (gap > 0) {
        push([], [], 2);
        for (let i = gap; i < n; i += 1) {
          const key = a[i];
          let j = i;
          push([i], [], 3);
          while (j >= gap && a[j - gap] > key) {
            comparisons += 1;
            push([j - gap, j], [], 6);
            a[j] = a[j - gap];
            swaps += 1;
            push([j], [j], 7);
            j -= gap;
          }
          a[j] = key;
          if (j !== i) {
            swaps += 1;
            push([j], [j], 9);
          }
        }
        gap = Math.floor(gap / 2);
      }
      for (let i = 0; i < n; i += 1) sorted.add(i);
      push([], [], 9, undefined, true);
      break;
    }
    case 'merge': {
      const merge = (left: number, mid: number, right: number, level: number) => {
        maxDepth = Math.max(maxDepth, level);
        const leftPart = a.slice(left, mid + 1);
        const rightPart = a.slice(mid + 1, right + 1);
        let i = 0;
        let j = 0;
        let k = left;
        while (i < leftPart.length && j < rightPart.length) {
          comparisons += 1;
          push([left + i, mid + 1 + j], [], 5);
          if (leftPart[i] <= rightPart[j]) {
            a[k] = leftPart[i];
            i += 1;
          } else {
            a[k] = rightPart[j];
            j += 1;
          }
          swaps += 1;
          push([k], [k], 5);
          k += 1;
        }
        while (i < leftPart.length) {
          a[k] = leftPart[i];
          i += 1;
          swaps += 1;
          push([k], [k], 5);
          k += 1;
        }
        while (j < rightPart.length) {
          a[k] = rightPart[j];
          j += 1;
          swaps += 1;
          push([k], [k], 5);
          k += 1;
        }
      };
      const mergeSort = (left: number, right: number, level: number) => {
        if (left >= right) return;
        maxDepth = Math.max(maxDepth, level);
        const mid = Math.floor((left + right) / 2);
        push([left, right], [], 3);
        mergeSort(left, mid, level + 1);
        mergeSort(mid + 1, right, level + 1);
        merge(left, mid, right, level);
      };
      mergeSort(0, n - 1, 1);
      for (let i = 0; i < n; i += 1) sorted.add(i);
      push([], [], 6, undefined, true);
      break;
    }
    case 'quick': {
      const partition = (left: number, right: number): number => {
        const pivot = a[right];
        let i = left;
        push([right], [], 7, right);
        for (let j = left; j < right; j += 1) {
          comparisons += 1;
          push([j, right], [], 9, right);
          if (a[j] < pivot) {
            if (i !== j) {
              push([i, j], [i, j], 10, right);
              swap(i, j);
            }
            i += 1;
          }
        }
        if (i !== right) {
          push([i, right], [i, right], 11, right);
          swap(i, right);
        }
        sorted.add(i);
        push([i], [], 12, i);
        return i;
      };
      const quick = (left: number, right: number, level: number) => {
        if (left >= right) {
          if (left === right) sorted.add(left);
          return;
        }
        maxDepth = Math.max(maxDepth, level);
        const p = partition(left, right);
        quick(left, p - 1, level + 1);
        quick(p + 1, right, level + 1);
      };
      quick(0, n - 1, 1);
      for (let i = 0; i < n; i += 1) sorted.add(i);
      push([], [], 13, undefined, true);
      break;
    }
    case 'heap': {
      const siftDown = (start: number, end: number) => {
        let root = start;
        while (root * 2 + 1 <= end) {
          let child = root * 2 + 1;
          if (child + 1 <= end) {
            comparisons += 1;
            push([child, child + 1], [], 3);
            if (a[child] < a[child + 1]) child += 1;
          }
          comparisons += 1;
          push([root, child], [], 3);
          if (a[root] < a[child]) {
            push([root, child], [root, child], 3);
            swap(root, child);
            root = child;
          } else {
            return;
          }
        }
      };
      for (let start = Math.floor((n - 2) / 2); start >= 0; start -= 1) {
        siftDown(start, n - 1);
      }
      push([], [], 1);
      for (let end = n - 1; end > 0; end -= 1) {
        push([0, end], [0, end], 2);
        swap(0, end);
        sorted.add(end);
        push([], [], 3);
        siftDown(0, end - 1);
      }
      sorted.add(0);
      push([], [], 3, undefined, true);
      break;
    }
    case 'radix': {
      const max = Math.max(...a);
      let exp = 1;
      while (Math.floor(max / exp) > 0) {
        const buckets: number[][] = Array.from({ length: 10 }, () => []);
        for (let i = 0; i < n; i += 1) {
          const digit = Math.floor(a[i] / exp) % 10;
          buckets[digit].push(a[i]);
          push([i], [], 3);
        }
        let index = 0;
        for (let digit = 0; digit < 10; digit += 1) {
          for (const value of buckets[digit]) {
            a[index] = value;
            swaps += 1;
            push([index], [index], 5);
            index += 1;
          }
        }
        exp *= 10;
      }
      for (let i = 0; i < n; i += 1) sorted.add(i);
      push([], [], 6, undefined, true);
      break;
    }
    default:
      break;
  }

  return { steps, comparisons, swaps, depth: maxDepth, frameEvery };
}

export function makeRandomArray(size: number, distribution: 'random' | 'reversed' | 'nearly' | 'few'): number[] {
  const base = Array.from({ length: size }, (_, i) => 5 + i * 2);
  if (distribution === 'reversed') return base.slice().reverse();
  if (distribution === 'nearly') {
    const arr = base.slice();
    for (let k = 0; k < Math.max(1, Math.floor(size / 10)); k += 1) {
      const i = Math.floor(Math.random() * size);
      const j = Math.min(size - 1, i + 1);
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }
  if (distribution === 'few') {
    const values = [10, 30, 55, 80];
    return Array.from({ length: size }, () => values[Math.floor(Math.random() * values.length)]);
  }
  const arr = base.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function verifySorted(values: number[]): boolean {
  for (let i = 1; i < values.length; i += 1) {
    if (values[i - 1] > values[i]) return false;
  }
  return true;
}
