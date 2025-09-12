import { proxyRefs, reactive } from "@vue/reactivity";
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
    setupState: {},
  };

  return instance;
}

const handler = {
  get(target, key) {
    const { props, data, setupState } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    } else if (setupState && hasOwn(setupState, key)) {
      return setupState[key];
    }
    const getter = publicProperties[key];
    if (getter) {
      return getter(target);
    }
  },
  set(target, key, value) {
    const { props, data, setupState } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
    } else if (props && hasOwn(props, key)) {
      console.warn('props is readonly');
      props[key] = value;
    } else if (setupState && hasOwn(setupState, key)) {
      setupState[key] = value;
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
  const { data = () => {}, render, setup } = vnode.type;

  if(setup) {
    const setupContext = {}
    const setupResult = setup(instance.props, setupContext);
    if(isFunction(setupResult)) {
      instance.render = setupResult;
    } else {
      instance.setupState = proxyRefs(setupResult);
    }
  }

  if(!isFunction(data)) {
    console.warn('data must be a function');
    return;
  }
  // data 中可以拿到 props
  instance.data = reactive(data.call(instance.proxy));
  if(!instance.render) {
    instance.render = render;
  }
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