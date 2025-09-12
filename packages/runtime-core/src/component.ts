import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, ShapeFlags } from "@vue/shared";

export function createComponentInstance(vnode) {
  const instance = {
    data: null,
    vnode: vnode,
    isMounted: false,
    subTree: null,
    update: null,
    props: {},
    attrs: {},
    slots: {},
    propsOptions: vnode.type.props, // 组件上声明的属性
    component: null,
    proxy: null, // 用来代理 props data
    setupState: {},
    exposed: null,
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
    $slots: (instance) => instance.slots,
};
export function setupComponent(instance) {
  const { vnode } = instance;
  initProps(instance, vnode.props);
  initSlots(instance, vnode.children);
  instance.proxy = new Proxy(instance, handler);
  const { data = () => {}, render, setup } = vnode.type;

  if(setup) {
    const setupContext = {
      attrs: instance.attrs,
      slots: instance.slots,
      expose(value) {
        instance.exposed = value;
      },
      emit(event, ...payload) {
        // onMyEvent
        const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
        const handler = instance.vnode.props[eventName];
        handler && handler(...payload);
      },
    }

    setCurrentInstance(instance);
    const setupResult = setup(instance.props, setupContext);
    unsetCurrentInstance();
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

export function initSlots(instance, children) {
  if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    instance.slots = children;
  } else {
    instance.slots = {};
  }
}

export let currentInstance = null;
export const getCurrentInstance = () => {
  return currentInstance;
};
export const setCurrentInstance = (instance) => {
  currentInstance = instance;
};
export const unsetCurrentInstance = () => {
  currentInstance = null;
};