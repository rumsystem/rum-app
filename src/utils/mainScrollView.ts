export const className = 'main-scroll-element';

export const scrollToTop = () => {
  try {
    document.querySelector('.main-scroll-element')!.scroll(0, 0);
  } catch (_) {}
};

export const scrollTop = () => {
  try {
    return document.querySelector('.main-scroll-element')!.scrollTop || 0;
  } catch (_) {}
  return 0;
};
