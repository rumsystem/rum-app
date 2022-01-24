import SeedIcon from 'assets/seed.svg';
import { shareSeed } from 'standaloneModals/shareGroup';
import BFSReplace from './BFSReplace';

export const replaceSeedAsButton = (box: HTMLElement) => {
  BFSReplace(
    box,
    /(\{[\s\S]+?"group_name": "[\s\S]+?"[\s\S]+?\})/g,
    (text: string) => {
      try {
        const seed = JSON.parse(text);
        if (seed.genesis_block && seed.group_name) {
          const div = document.createElement('div');
          const img = document.createElement('img');
          img.className = 'inline';
          img.src = SeedIcon;
          img.style.margin = '0 8px 0 0';
          div.append(img);
          div.style.verticalAlign = '-15%';
          div.style.maxWidth = 'max-content';
          div.dataset.seed = text;
          div.className = [
            'content-seed-share-button flex items-center py-1 px-3 m-1 rounded',
            'leading-loose select-none cursor-pointer bg-gray-f2 text-link-blue',
          ].join(' ');
          const span = document.createElement('span');
          span.style.overflow = 'hidden';
          span.style.textOverflow = 'ellipsis';
          span.style.whiteSpace = 'nowrap';
          span.textContent = seed.group_name;
          div.append(span);
          return div;
        }
      } catch (e) {}
      return document.createTextNode(text);
    },
  );
};

window.addEventListener('click', (e: MouseEvent) => {
  let target = e.target as HTMLElement | null;
  while (target && !target.classList.contains('content-seed-share-button')) {
    target = target.parentElement;
  }
  if (!target) {
    return;
  }
  const seed = target.dataset.seed ?? '';
  shareSeed(seed);
});
