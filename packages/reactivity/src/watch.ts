import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";

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
  // 循环引用处理
  if (seen.has(source)) {
    return source;
  }
  for (let key in source) {
    traverse(source[key], depth, currentDepth, seen);
  }
  return source;
}

export function doWatch(source, cb, { deep, immediate }) {
  const reactiveGetter = (source) => traverse(source, deep === false ? 1 : undefined);
  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;

  let cleanup;
  const onCleanup = (fn) => {
    cleanup = () => {
      console.log('cleanup');
      fn();
      cleanup = null;
    };
  };

  const job = () => {
    if (cb) {
      if (cleanup) {
        cleanup();
      }
      const newValue = effect.run();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect.run(); // watchEffect
    }
  };

  const effect = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    effect.run(); // watchEffect
  }
  const unwatch = () => {
    effect.stop();
  };
  return unwatch;
}

export function watch(source, cb, options = {} as any) {
  return doWatch(source, cb, options);
}

export function watchEffect(effect, options = {} as any) {
  return doWatch(effect, null, options);
}