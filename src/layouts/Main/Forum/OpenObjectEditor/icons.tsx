import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FaBold,
  FaItalic,
  FaHeading,
  FaQuoteLeft,
  FaListUl,
  FaListOl,
  FaImage,
  FaLink,
  FaEye,
} from 'react-icons/fa';

const div = document.createElement('div');

export const iconMap = {} as Record<typeof icons[number], string>;

const icons = [
  'bold',
  'italic',
  'heading',
  'quote',
  'ul',
  'ol',
  'image',
  'link',
  'preview',
] as const;

const root = createRoot(div);

const Component = () => {
  useEffect(() => {
    icons.forEach((v, i) => {
      iconMap[v] = div.children[i].outerHTML;
    });
  }, []);
  return (<>
    <FaBold />
    <FaItalic />
    <FaHeading />
    <FaQuoteLeft />
    <FaListUl />
    <FaListOl />
    <FaImage />
    <FaLink />
    <FaEye />
  </>);
};

root.render(<Component />);
