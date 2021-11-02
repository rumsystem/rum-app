import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import { useStore } from 'store';
import { MdSearch, MdClose } from 'react-icons/md';
import { sleep } from 'utils';

interface IProps {
  size?: string;
  defaultValue?: string;
  required?: boolean;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
  search: (value: string) => void;
  onBlur?: () => void;
}

export default observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    value: '',
  }));

  React.useEffect(() => {
    if (props.defaultValue && !state.value) {
      state.value = props.defaultValue;
    }
  }, [state, props]);

  const onChange = (e: any) => {
    state.value = e.target.value;
  };

  const onKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      e.target.blur();
      if (props.required && !state.value) {
        snackbarStore.show({
          message: '请输入要搜索的内容',
          type: 'error',
        });
        return;
      }
      props.search(state.value);
    }
  };

  const onBlur = () => {
    if (props.onBlur) {
      props.onBlur();
    }
  };

  return (
    <div className="relative">
      <div className="text-20 text-gray-af flex items-center absolute top-0 left-0 z-10 mt-7-px ml-10-px">
        <MdSearch />
      </div>
      {state.value && (
        <div className="flex items-center absolute top-0 right-0 z-10 mr-10-px mt-7-px cursor-pointer">
          <div
            className="flex items-center h-5 w-5 justify-center bg-gray-f7 text-indigo-400 rounded-full text-12 md:text-16"
            onClick={async () => {
              state.value = '';
              await sleep(200);
              props.search('');
            }}
          >
            <MdClose />
          </div>
        </div>
      )}
      <form action="/">
        <TextField
          className={`search-input ${props.className || 'w-72'} ${
            props.size || ''
          }`}
          placeholder={props.placeholder || '搜索'}
          size="small"
          autoFocus={props.autoFocus || false}
          value={state.value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          margin="none"
          variant="outlined"
          type="search"
        />
      </form>
      <style jsx global>{`
        .search-input .MuiOutlinedInput-root {
          border-radius: 30px !important;
        }
        .search-input .MuiOutlinedInput-input {
          color: #888888 !important;
          padding: 10px 10px 9px 34px;
        }
        .search-input.small .MuiOutlinedInput-input {
          padding: 8px 11px 7px 36px;
        }
      `}</style>
    </div>
  );
});
