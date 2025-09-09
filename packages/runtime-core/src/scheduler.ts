const queue = [];
let isFlushing = false;
const resolvePromise = Promise.resolve();

// 批处理，此处不考虑父子组件更新顺序，以及子组件修改父组件的情况
export function queueJob(job: () => void) {
  if (!queue.includes(job)) {
    queue.push(job);
  }
  if (!isFlushing) {
    isFlushing = true;
    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0);
      queue.length = 0;
      copy.forEach(job => job());
      queue.length = 0;
    });
  }
}
