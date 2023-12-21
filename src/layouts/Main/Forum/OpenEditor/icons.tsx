import React from 'react';
import ReactDOM from 'react-dom';
import {
  FaBold,
  FaItalic,
  FaHeading,
  FaQuoteLeft,
  FaListUl,
  FaListOl,
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
  'link',
  'preview',
] as const;

ReactDOM.render((
  <>
    <FaBold />
    <FaItalic />
    <FaHeading />
    <FaQuoteLeft />
    <FaListUl />
    <FaListOl />
    <FaLink />
    <FaEye />
  </>
), div);

icons.forEach((v, i) => {
  iconMap[v] = div.children[i].outerHTML;
});
