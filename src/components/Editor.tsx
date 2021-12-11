import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { debounce } from 'lodash';
import TextareaAutosize from 'react-textarea-autosize';
import { Tooltip } from '@material-ui/core';
import { BiSmile } from 'react-icons/bi';

import Button from 'components/Button';
import Loading from 'components/Loading';
import Avatar from 'components/Avatar';
import { EmojiPicker } from 'components/EmojiPicker';
import useGroupStatusCheck from 'hooks/useGroupStatusCheck';
import { lang } from 'utils/lang';
import { useStore } from 'store';
import { IProfile } from 'store/group';

interface IProps {
  value: string
  placeholder: string
  submit: (content: string) => unknown | Promise<unknown>
  saveDraft?: (content: string) => void
  profile?: IProfile
  minRows?: number
  classNames?: string
  buttonClassName?: string
  smallSize?: boolean
  autoFocus?: boolean
  hideButtonDefault?: boolean
  buttonBorder?: () => void
}

export default observer((props: IProps) => {
  const { snackbarStore, activeGroupStore } = useStore();
  const state = useLocalObservable(() => ({
    content: props.value || '',
    loading: false,
    clickedEditor: false,
    emoji: false,
  }));
  const emojiButton = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const groupStatusCheck = useGroupStatusCheck();

  const saveDraft = React.useCallback(
    debounce((content: string) => {
      props.saveDraft?.(content.trim());
    }, 500),
    [],
  );

  const handleInsertEmoji = action((e: string) => {
    state.emoji = false;
    if (!textareaRef.current) {
      return;
    }
    const start = textareaRef.current.selectionStart;

    state.content = state.content.slice(0, start)
      + e
      + state.content.slice(textareaRef.current.selectionEnd);
    saveDraft(state.content);
    setTimeout(() => {
      textareaRef.current!.setSelectionRange(start + e.length, start + e.length);
      textareaRef.current!.focus();
    });
  });

  const submit = async () => {
    if (!state.content.trim() || state.loading) {
      return;
    }
    if (!groupStatusCheck(activeGroupStore.id)) {
      return;
    }
    if (state.content.length > 5000) {
      snackbarStore.show({
        message: lang.requireMaxLength(lang.object, 5000),
        type: 'error',
        duration: 2500,
      });
      return;
    }
    state.loading = true;
    try {
      await props.submit(state.content.trim());
      state.content = '';
    } catch (err) {
      state.loading = false;
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.loading = false;
  };

  return (
    <div className="w-full">
      <div className="flex items-start">
        {props.profile && (
          <Avatar
            className="block mr-[14px] mt-[1px]"
            profile={props.profile}
            size={36}
          />
        )}
        <div className="w-full">
          <div
            className="relative"
            onClick={() => {
              state.clickedEditor = true;
            }}
          >
            <TextareaAutosize
              className={classNames(
                {
                  sm: props.smallSize,
                },
                `w-full textarea-autosize rounded-[8px] min-rows-${props.minRows || 2}`,
                props.classNames,
              )}
              ref={textareaRef}
              placeholder={props.placeholder}
              minRows={props.minRows || 2}
              value={state.content}
              autoFocus={props.autoFocus || false}
              onChange={(e) => {
                state.content = e.target.value;
                saveDraft(e.target.value);
              }}
              onKeyDown={(e: any) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  submit();
                }
              }}
            />
            {state.loading && (
              <div className="absolute top-0 left-0 w-full z-10 bg-white opacity-70 flex items-center justify-center h-full">
                <div className="mt-[-6px]">
                  <Loading
                    size={props.minRows && props.minRows > 1 ? 22 : 16}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {(state.clickedEditor
        || props.autoFocus
        || !props.hideButtonDefault
        || (props.minRows && props.minRows > 1)) && (
        <div>
          <div className="mt-1 flex justify-between">
            <div
              className={classNames(
                !props.profile && 'ml-1',
                !!props.profile && 'ml-12',
              )}
              ref={emojiButton}
            >
              <BiSmile
                className="text-22 cursor-pointer text-gray-af"
                onClick={action(() => { state.emoji = true; })}
              />
            </div>
            <EmojiPicker
              open={state.emoji}
              anchorEl={emojiButton.current}
              onSelectEmoji={handleInsertEmoji}
              onClose={action(() => { state.emoji = false; })}
            />
            <Tooltip
              enterDelay={1500}
              enterNextDelay={1500}
              placement="left"
              title="快捷键：Ctrl + Enter 或 Cmd + Enter"
              arrow
              interactive
            >
              <div className={props.buttonClassName || ''}>
                <Button
                  size="small"
                  className={classNames({
                    'opacity-30': !state.content.trim() || state.loading,
                  })}
                  onClick={submit}
                >
                  {lang.publish}
                </Button>
              </div>
            </Tooltip>
          </div>
          {props.buttonBorder?.()}
        </div>
      )}
      <style jsx global>{`
        .textarea-autosize {
          color: rgba(0, 0, 0, 0.87);
          font-size: 14px;
          padding: 14px;
          font-weight: normal;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          resize: none;
        }
        .textarea-autosize.sm {
          font-size: 13px;
          padding: 10px 14px;
        }
        .textarea-autosize:focus {
          border-color: #333 !important;
          outline: none;
        }
        .textarea-autosize.min-rows-1 {
          min-height: 41px !important;
        }
        .textarea-autosize.min-rows-2 {
          min-height: 72px !important;
        }
      `}</style>
    </div>
  );
});
