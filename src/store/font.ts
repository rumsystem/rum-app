export function createFontStore() {
  return {
    fontSize: localStorage.getItem('font-size') || '14' as string,

    setFontSize(value: string) {
      if (['12', '14', '16', '18'].includes(value)) {
        this.fontSize = value;
        localStorage.setItem('font-size', value);
      }
    },
  };
}
