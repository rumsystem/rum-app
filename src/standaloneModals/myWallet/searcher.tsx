import React from 'react';
import classNames from 'classnames';

import { lang } from 'utils/lang';
import { TextField } from '@material-ui/core';
import { IoSearch } from 'react-icons/io5';

interface Props {
  width?: string
  keyword: string
  placeholder?: string
  onChange: (value: string) => void
}

export default (props: Props) => (
  <div className="flex-grow flex items-center flex-row-reverse">
    <div className={classNames(
      'relative',
      props.width ? `w-[${props.width}]` : 'max-w-70',
    )}
    >
      <TextField
        className="w-full opacity-80 search-field"
        size="small"
        value={props.keyword}
        onChange={(e) => {
          props.onChange(e.target.value.trim().slice(0, 40));
        }}
        margin="none"
        variant="outlined"
        placeholder={props.placeholder || lang.search}
      />
      <div className="text-16 flex items-center justify-center absolute right-2 top-0 bottom-0">
        <IoSearch
          className="cursor-pointer"
        />
      </div>
    </div>
    <style jsx>{`
      div :global(.search-field > div) {
        border-color: #e3e3e3;
        border-radius: 40px;
        background-color: white;
        height: 24px;
      }
      div :global(.search-field input) {
        padding: 2px 32px 2px 13px !important;
        font-size: 14px;
        color: #333333;
      }
    `}</style>
  </div>
);
