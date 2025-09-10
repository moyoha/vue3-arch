import { reactive } from "@vue/reactivity";
import { render } from "@vue/runtime-dom";
import { hasOwn, isFunction } from "@vue/shared";

export function createComponent(vnode) {
  const instance = {
    data: null,
    vnode: vnode,
    isMounted: false,
    subTree: null,
    update: null,
    props: {},
    attrs: {},
    propsOptions: vnode.type.props, // 组件上声明的属性
    component: null,
    proxy: null, // 用来代理 props data
  };

  return instance;
}

const handler = {
  get(target, key) {
    const { props, data } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    const getter = publicProperties[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { props, data } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      console.warn('props is readonly');
      props[key] = value;
    }
    return true;
  }
}
const publicProperties = {
    $attrs: (instance) => instance.attrs,
};
export function setupComponent(instance) {
  const { vnode } = instance;
  initProps(instance, vnode.props);
  instance.proxy = new Proxy(instance, handler);
  const { data, render } = vnode.type;
  if(!isFunction(data)) {
    console.warn('data must be a function');
    return;
  }
  // data 中可以拿到 props
  instance.data = reactive(data.call(instance.proxy));
  instance.render = render;
}

const initProps = (instance, rawProps) => {
  // rawProps 为组件上声明的属性
  const props = {};
  const attrs = {};
  const propOptions = instance.propsOptions || {};
  if (rawProps) {
    for (const key in rawProps) {
      // props 属性校验就放在这个地方
      if (propOptions[key]) {
        props[key] = rawProps[key];
      } else {
        attrs[key] = rawProps[key];
      }
    }
  }
  instance.props = reactive(props); // 应该使用 shallowReactive，因为在组件中不应该修改 props
  instance.attrs = attrs;
};