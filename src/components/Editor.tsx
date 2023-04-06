import React from 'react';
import classNames from 'classnames';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { debounce } from 'lodash';
import TextareaAutosize from 'react-textarea-autosize';
import { Tooltip } from '@mui/material';
import { BiSmile } from 'react-icons/bi';
import { BsImage } from 'react-icons/bs';
import Uploady, { useBatchAddListener } from '@rpldy/uploady';
import UploadButton from '@rpldy/upload-button';
import UploadDropZone from '@rpldy/upload-drop-zone';
import withPasteUpload from '@rpldy/upload-paste';
import { IoMdClose } from 'react-icons/io';

import Button from 'components/Button';
import Loading from 'components/Loading';
import Avatar from 'components/Avatar';
import { EmojiPicker } from 'components/EmojiPicker';
import { lang } from 'utils/lang';
import Base64 from 'utils/base64';
import { useStore } from 'store';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import { ISubmitObjectPayload, IDraft, ImageItem } from 'hooks/useSubmitPost';
import sleep from 'utils/sleep';
import { IDBProfile } from 'hooks/useDatabase/models/profile';
import { IDBPost } from 'hooks/useDatabase/models/posts';

const extensions = ['jpg', 'jpeg', 'png', 'gif'];
const ACCEPT = extensions.map((v) => `.${v}`).join(', ');

interface IProps {
  object?: IDBPost
  editorKey: string
  placeholder: string
  submit: (data: ISubmitObjectPayload) => unknown
  profile?: IDBProfile
  minRows?: number
  classNames?: string
  buttonClassName?: string
  smallSize?: boolean
  autoFocus?: boolean
  autoFocusDisabled?: boolean
  hideButtonDefault?: boolean
  enabledImage?: boolean
  imageLimit?: number
  buttonBorder?: () => React.ReactNode
  submitButtonText?: string
  imagesClassName?: string
}

const PasteUploadDropZone = withPasteUpload(UploadDropZone);

export default (props: IProps) => {
  if (props.enabledImage) {
    return (
      <Uploady multiple accept={ACCEPT}>
        <PasteUploadDropZone>
          <Editor {...props} />
        </PasteUploadDropZone>
      </Uploady>
    );
  }
  return <Editor {...props} />;
};

const Editor = observer((props: IProps) => {
  const { snackbarStore, activeGroupStore } = useStore();
  const draftKey = `${props.editorKey.toUpperCase()}_DRAFT_v2_${activeGroupStore.id}`;
  const state = useLocalObservable(() => ({
    content: props.object ? props.object.content : '',
    loading: false,
    clickedEditor: false,
    emoji: false,
    images: [] as Array<ImageItem>,
  }));
  const emojiButton = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isPastingFileRef = React.useRef<boolean>(false);
  const readyToSubmit = (state.content.trim() || state.images.length > 0)
    && !state.loading
    && state.images.every((v) => v.optimizedSize);
  const imageLImit = props.imageLimit || 4;
  const isUpdating = !!props.object;

  const caculateOptimizedImages = async () => {
    await Promise.all(state.images.map(async (v) => {
      const optimized = await Base64.compressImage(v.url, { count: state.images.length });
      runInAction(() => {
        v.optimizedSize = optimized.kbSize;
        v.optimizedUrl = optimized.url;
      });
    }));
  };

  useBatchAddListener((batch) => {
    const newSize = batch.items.length + state.images.length;
    if (newSize > imageLImit) {
      snackbarStore.show({
        message: lang.maxImageCount(imageLImit),
        type: 'error',
      });
      return;
    }
    const run = async () => {
      await Promise.all(batch.items.map(async (item) => {
        const url = await new Promise<string>((rs) => {
          const reader = new FileReader();
          reader.readAsDataURL(item.file as File);
          reader.addEventListener('load', () => rs(reader.result as string));
        });
        state.images.push({
          url,
          optimizedSize: 0,
          optimizedUrl: '',
        });
      }));
      caculateOptimizedImages();
    };
    run();
  });

  React.useEffect(() => {
    if (props.object && props.object.images) {
      state.images = props.object.images.map((v) => ({
        url: Base64.getUrl(v),
        optimizedUrl: '',
        optimizedSize: 0,
      }));
      caculateOptimizedImages();
    }
  }, [isUpdating]);

  React.useEffect(() => {
    if (props.autoFocusDisabled) {
      return;
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 300);
  }, [isUpdating]);

  React.useEffect(() => {
    if (isUpdating) { return; }
    const draft = localStorage.getItem(draftKey);
    if (!draft) { return; }
    const draftObj = JSON.parse(draft);
    if (!draftObj.content && (draftObj.images || []).length === 0) {
      return;
    }
    state.content = draftObj.content || '';
    if (props.enabledImage) {
      if (draftObj.images.every((v: any) => 'url' in v)) {
        state.images = draftObj.images;
        caculateOptimizedImages();
      }
    }
  }, []);

  React.useEffect(() => {
    if (isUpdating) { return; }
    saveDraft({
      content: state.content,
      images: Object.values(state.images),
    });
  }, [state.content, state.images.map((v) => v.url).join('-')]);

  React.useEffect(() => {
    (async () => {
      await sleep(50);
      if ((props.minRows || 0) > 1 && textareaRef.current) {
        textareaRef.current.click();
      }
    })();
  }, []);

  const saveDraft = React.useCallback(
    debounce((draft: IDraft) => {
      if (state.loading) {
        return;
      }
      if (!draft.content && (draft.images || []).length === 0 && !localStorage.getItem(draftKey)) {
        return;
      }
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }, 300),
    [],
  );

  const handleInsertEmoji = action((e: string) => {
    if (!textareaRef.current) {
      return;
    }
    const start = textareaRef.current.selectionStart;

    state.content = state.content.slice(0, start)
      + e
      + state.content.slice(textareaRef.current.selectionEnd);
    setTimeout(() => {
      textareaRef.current!.setSelectionRange(start + e.length, start + e.length);
      textareaRef.current!.focus();
    });
  });

  const submit = async () => {
    if (!readyToSubmit) { return; }
    if (state.content.length > 5000) {
      snackbarStore.show({
        message: lang.requireMaxLength(lang.object, 5000),
        type: 'error',
        duration: 2500,
      });
      return;
    }
    state.loading = true;
    const payload: ISubmitObjectPayload = {
      content: state.content.trim(),
    };
    if (props.enabledImage && state.images.length > 0) {
      const image = state.images.map((image) => ({
        mediaType: Base64.getMimeType(image.optimizedUrl),
        content: Base64.getContent(image.optimizedUrl),
        name: '',
      }));
      payload.image = image;
    }
    try {
      if (!isUpdating) {
        localStorage.removeItem(draftKey);
      }
      const isSuccess = await props.submit(payload);
      if (isSuccess) {
        state.content = '';
        if (props.enabledImage) {
          state.images.length = 0;
        }
      }
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
            className="block mr-[14px] mt-[1px] flex-none"
            avatar={props.profile.avatar}
            size={36}
          />
        )}
        <div className="w-full">
          <div
            className="relative"
            onClick={() => {
              state.clickedEditor = true;
            }}
            data-test-id="editor-click-to-show-post-button"
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
              autoFocus={!isUpdating && (props.autoFocus || false)}
              onChange={(e) => {
                if (isPastingFileRef.current) {
                  return;
                }
                state.content = e.target.value;
              }}
              onPaste={(e) => {
                const items = Array.from(e.clipboardData.items);
                for (const item of items) {
                  if (item.kind === 'file') {
                    isPastingFileRef.current = true;
                    setTimeout(() => {
                      isPastingFileRef.current = false;
                    }, 500);
                    return;
                  }
                }
              }}
              onKeyDown={(e) => {
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
      {props.enabledImage && (
        <div
          className={classNames(
            state.loading && 'opacity-50',
            props.imagesClassName,
          )}
        >
          <Images
            images={state.images}
            removeImage={action((index) => {
              state.images.splice(index, 1);
              caculateOptimizedImages();
            })}
            smallSize={props.smallSize}
          />
        </div>
      )}
      {(state.clickedEditor
        || state.images.length > 0
        || props.autoFocus
        || !props.hideButtonDefault
        || (props.minRows && props.minRows > 1)) && (
        <div>
          <div className="mt-1 flex justify-between">
            <div className="flex items-center">
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
              {props.enabledImage && (
                <div className="ml-4 flex items-center">
                  <UploadButton>
                    <BsImage
                      className="text-18 cursor-pointer text-gray-af"
                    />
                  </UploadButton>
                </div>
              )}
              <EmojiPicker
                open={state.emoji}
                anchorEl={emojiButton.current}
                onSelectEmoji={handleInsertEmoji}
                onClose={action(() => { state.emoji = false; })}
              />
            </div>
            <Tooltip
              enterDelay={1500}
              enterNextDelay={1500}
              placement="left"
              title="快捷键：Ctrl + Enter 或 Cmd + Enter"
              arrow
            >
              <div className={props.buttonClassName || ''}>
                <Button
                  size="small"
                  className={classNames({
                    'opacity-30': !readyToSubmit,
                  })}
                  onClick={submit}
                  data-test-id="editor-submit-button"
                >
                  {props.submitButtonText || (isUpdating ? lang.update : lang.publish)}
                </Button>
              </div>
            </Tooltip>
          </div>
          {props.buttonBorder?.()}
        </div>
      )}
      <style>{`
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

interface ImagesProps {
  images: ImageItem[]
  removeImage: (index: number) => void
  smallSize?: boolean
}
const Images = observer((props: ImagesProps) => {
  if (props.images.length === 0) { return null; }
  return (
    <div className="flex items-center py-1">
      {props.images.map((image, index) => (
        <div
          className="relative animate-fade-in"
          key={index}
          onClick={() => {
            openPhotoSwipe({
              image: props.images.map((image) => image.optimizedUrl || image.url),
              index,
            });
          }}
        >
          <div
            className={classNames(
              'mr-2 rounded-4',
              props.smallSize && 'w-14 h-14',
              !props.smallSize && 'w-24 h-24',
            )}
            style={{
              background: `url(${image.optimizedUrl || image.url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
            }}
          />
          <div
            className={classNames(
              'bg-black bg-opacity-70 text-white opacity-80 text-14 top-[3px]',
              'absolute cursor-pointer rounded-full flex items-center justify-center',
              !props.smallSize && 'w-6 h-6 right-[12px]',
              props.smallSize && 'w-5 h-5 right-[10px]',
            )}
            onClick={(e) => {
              e.stopPropagation();
              props.removeImage(index);
            }}
          >
            <IoMdClose />
          </div>
        </div>
      ))}
    </div>
  );
});
