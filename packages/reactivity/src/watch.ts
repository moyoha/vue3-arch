import { isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

function traverse(source, depth, currentDepth = 0, seen = new Set()) {
  if (!isObject(source)) {
    return source;
  }
  if (depth) {
    if (currentDepth >= depth) {
      return source;
    }
    currentDepth++;
  }
  if (seen.has(source)) {
    return source;
  }
  for (let key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }
  return source;
}

export function doWatch(source, cb, { deep }) {

  const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined);
  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  }
  let oldValue;

  const job = () => {
    const newValue = effect.run();
    cb(newValue, oldValue);
    oldValue = newValue;
  };

  const effect = new ReactiveEffect(getter, job);
  oldValue = effect.run();
}

export function watch(source, cb, options = {} as any) {
  return doWatch(source, cb, options);
}