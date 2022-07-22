export default (num: string, n: number) => num.slice(0, num.indexOf('.') + 1 + n).replace(/\.*0+$/, '');
