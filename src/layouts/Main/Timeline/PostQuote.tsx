import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { BiSolidQuoteAltLeft, BiSolidQuoteAltRight } from 'react-icons/bi';
import type { IDBPost } from 'hooks/useDatabase/models/posts';
import { AiOutlineLink } from 'react-icons/ai';
import { shell } from 'electron';

interface IProps {
  className?: string
  quote: IDBPost['quote']
}

export const PostQuote = observer((props: IProps) => {
  const quote = props.quote;

  if (!quote) { return null; }

  return (
    <div
      className={classNames(
        'relative bg-slate-500/10 py-4 px-10 rounded-[12px]',
        props.className,
      )}
    >
      <BiSolidQuoteAltLeft className="absolute top-[10px] left-2 text-24 text-black/15" />
      <BiSolidQuoteAltRight className="absolute bottom-[10px] right-2 text-24 text-black/15" />
      <div className="text-black/65 leading-relaxed tracking-wide">
        {quote.content}
      </div>
      {!!quote.book && (
        <div className="text-black/45 text-13 mt-2 line-clamp-2">
          / {quote.author} 《{quote.book}》
        </div>
      )}
      {!!quote.url && (
        <div className="text-black/45 text-13 mt-2 line-clamp-2">
          <AiOutlineLink className="inline-block text-16 -mt-[2px] mr-[2px]" />
          <a
            className="hover:underline"
            href={quote.url}
            onClick={(e) => {
              e.preventDefault();
              if (quote.url) {
                shell.openExternal(quote.url);
              }
            }}
          >
            {quote.name || quote.url}
          </a>
        </div>
      )}
    </div>
  );
});
