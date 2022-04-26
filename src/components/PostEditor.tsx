import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
import TextareaAutosize from 'react-textarea-autosize';
import classNames from 'classnames';
import Loading from 'components/Loading';
import Tooltip from '@material-ui/core/Tooltip';
import { debounce } from 'lodash';
import { IProfile } from 'store/group';
import Avatar from 'components/Avatar';

interface IProps {
  value: string
  placeholder: string
  submit: (content: string) => unknown | Promise<unknown>
  saveDraft?: (content: string) => void
  profile?: IProfile
  minRows?: number
  buttonClassName?: string
  smallSize?: boolean
  autoFocus?: boolean
}

export default observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    content: props.value || '',
    loading: false,
  }));

  const saveDraft = React.useCallback(
    debounce((content: string) => {
      props.saveDraft?.(content.trim());
    }, 500),
    [],
  );

  const submit = async () => {
    if (!state.content.trim() || state.loading) {
      return;
    }
    if (state.content.length > 5000) {
      snackbarStore.show({
        message: '内容不能多余 5000 字',
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
        message: '貌似出错了',
        type: 'error',
      });
    }
    state.loading = false;
  };

  return (
    <div className="w-full border-t-[10px] border-t-gray-f7 bg-white pt-5 pl-10 pr-8 pb-2.5">
      <div className="w-full">
        <div
          className="relative"
        >
          <TextareaAutosize
            className={classNames(
              {
                sm: props.smallSize,
              },
              `bg-gray-f2 w-full post-textarea-autosize min-rows-${props.minRows || 2}`,
            )}
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
      <div className="flex justify-between mt-3 w-full">
        {props.profile && (
          <div className="flex items-center overflow-hidden">
            <Avatar
              className="block mr-[14px] mt-[1px] flex-shrink-0"
              profile={props.profile}
              size={36}
            />
            {props.profile?.name && (
              <span className="text-14 text-gray-64 truncate">{props.profile?.name}</span>
            )}
          </div>
        )}
        <div className="flex justify-end flex-shrink-0">
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
                noRound
              >
                Post Comment
              </Button>
            </div>
          </Tooltip>
        </div>
      </div>
      <style jsx global>{`
        .post-textarea-autosize {
          color: rgba(0, 0, 0, 0.87);
          font-size: 14px;
          padding: 14px;
          font-weight: normal;
          border: 0px solid #f2f2f2 !important;
          border-radius: 4px;
          resize: none;
        }
        .post-textarea-autosize.sm {
          font-size: 13px;
          padding: 10px 14px;
        }
        .post-textarea-autosize:focus {
          border-color: #333 !important;
          outline: none;
        }
        .post-textarea-autosize.min-rows-1 {
          min-height: 41px !important;
        }
        .post-textarea-autosize.min-rows-2 {
          min-height: 72px !important;
        }
      `}</style>
    </div>
  );
});
