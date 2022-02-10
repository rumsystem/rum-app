import SeedIcon from 'assets/seed.svg';
import { shareSeed } from 'standaloneModals/shareGroup';
import BFSReplace from './BFSReplace';

export const replaceSeedAsButton = (box: HTMLElement) => {
  BFSReplace(
    box,
    /(\{[\s\S]*?"genesis_block": ?\{[\s\S]*?\}[\s\S]*?\})/g,
    (text: string) => {
      try {
        const seed = JSON.parse(text);
        if (seed.genesis_block && seed.group_name) {
          const div = document.createElement('div');
          const img = document.createElement('img');
          img.className = 'inline w-[14px]';
          img.src = SeedIcon;
          img.style.margin = '0 5px 2px 0';
          div.append(img);
          div.style.verticalAlign = '6%';
          div.style.maxWidth = 'max-content';
          div.dataset.seed = text;
          div.className = [
            'inline-block content-seed-share-button pl-[6px] pr-[7px] mx-1 rounded',
            'select-none cursor-pointer bg-gray-f2 text-link-blue text-12 break-all whitespace-nowrap',
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
