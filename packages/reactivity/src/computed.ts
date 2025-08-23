// 原理
// 1.计算属性维护了一个dirty属性，默认为 true，运行过一次会将dirty变为false，并且依赖的值变化后，会将dirty重新设置为true
// 2.计算属性也是一个effect, 依赖的属性会收集这个计算属性，当前值变化后，会让computedEffect里面dirty变为true
// 3,计算属性具备收集能力的，可以收集对应的effect，依赖的值变化后会触发effect重新执行

import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

class ComputedRefImpl {
  public _vaule;
  public effect;
  public dep;

  constructor(getter, public setter) {
    // 该 effect 是 getter 中响应式数据的副作用
    this.effect = new ReactiveEffect(
      () => getter(this._vaule),
      () => {
        // 计算属性的值变化了，需要触发依赖的effect重新执行
        triggerRefValue(this);
      }
    );
  }
  get value() {
    if (this.effect.dirty) {
      this._vaule = this.effect.run();
      trackRefValue(this);
    }
    return this._vaule;
  }
  set value(newVal) {
    this.setter(newVal);
  }
}

export function computed(getterOrOptions) {
  let onlyGetter = isFunction(getterOrOptions);

  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}