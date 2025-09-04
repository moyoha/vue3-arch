export function getSequence(arr) {
  const result = [0];
  const p = result.slice(0);// 用于存放索引
  let start;
  let end;
  let middle;
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        p[i] = result[result.length - 1]; // 正常放入的时候
        result.push(i);//直接将当前的索引放入到结果集即可
        continue;
      }
      start = 0;
      end = result.length - 1;
      while (start < end) {
        middle = ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arrI < arr[result[start]]) {
        p[i] = result[start - 1]; // 找到那个节点的前一个节点
        result[start] = i;
      }
    }
  }
  let i = result.length;
  let last = result[i - 1];
  // 追溯
  while (i-- > 0) {
    result[i] = last;
    last = p[last];
  }
  return result;
}