import { ReactiveFlags } from "./constans";

export const mutableHandlers: ProxyHandler<any> = {
  get(target: any, key: string, receiver: any) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    return Reflect.get(target, key, receiver);
  },
  set(target: any, key: string, value: any, receiver: any) {
    return Reflect.set(target, key, value, receiver);
  }
};