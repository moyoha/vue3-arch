export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object';

export const isFunction = (val: unknown): val is Function => typeof val === 'function';

export const isString = (val: unknown): val is string => typeof val === 'string';

export const isArray = Array.isArray;

const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (val: object, key: string | symbol) => hasOwnProperty.call(val, key);

export * from "./shapeFlags";