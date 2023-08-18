import LinkifyIt from 'linkify-it';

const linkifyIt = new LinkifyIt(
  {
    'mailto:': { validate: () => 0 },
    'ftp:': { validate: () => 0 },
  }, {
    fuzzyLink: false,
    fuzzyEmail: false,
  },
);

export interface MatchItemPost { type: 'post', url: string, id: string }
export interface MatchItemLink { type: 'link', url: string }
export type MatchItem = MatchItemPost | MatchItemLink;

export const matchContent = (content: string, skipForward = false): { item: MatchItem | null, content: string } => {
  const match = linkifyIt.match(content);
  if (!match) { return { item: null, content }; }
  const lastItem = match.at(-1);

  if (!lastItem) {
    return { item: null, content };
  }

  let url: null | URL = null;
  try {
    url = new URL(lastItem.url);
  } catch (e) {
    return { item: null, content };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { item: null, content };
  }

  if (!skipForward && url.hostname.endsWith('feed.base.one')) {
    const postMatch = /^\/\/?posts\/([a-zA-Z0-9-]+)\/?$/i.exec(url.pathname);
    if (postMatch) {
      return {
        item: {
          type: 'post',
          id: postMatch[1]!,
          url: lastItem.url,
        },
        content: content.replace(lastItem.url, '').trim(),
      };
    }
  }

  return {
    item: {
      type: 'link',
      url: lastItem.url,
    },
    content,
  };
};
