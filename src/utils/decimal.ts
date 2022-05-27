export default (num: string, n: number) => `${Number(num.slice(0, num.indexOf('.') + 1 + n))}`;
