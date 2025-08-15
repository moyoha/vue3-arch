import { activeEffect, trackEffect, triggerEffects } from "./effect";

const targetMap = new WeakMap();

export function createDep(cleanup, name) {
  const dep = new Map() as any;
  dep.cleanup = cleanup;
  dep.name = name;
  return dep;
}

export function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = createDep(() => {
        dep.delete(key); // 清理不需要的属性
      }, key));
    }
    trackEffect(activeEffect, dep);
    console.log(targetMap);
  }
}

export function trigger(target, key, value, oldValue) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    // 修改的属性对应了 effect
    triggerEffects(dep);
  }
}