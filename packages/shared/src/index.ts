export function isEmptyObject(value: any): boolean {
  return value !== null && typeof value === 'object';
}