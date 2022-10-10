export default (duration: number) =>
  new Promise((resolve: any) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
