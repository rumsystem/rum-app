import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { debounce, sumBy } from 'lodash';
import TextareaAutosize from 'react-textarea-autosize';
import { Tooltip } from '@material-ui/core';
import { BiSmile } from 'react-icons/bi';
import { BsImage } from 'react-icons/bs';
import Uploady from '@rpldy/uploady';
import UploadButton from '@rpldy/upload-button';
import UploadDropZone from '@rpldy/upload-drop-zone';
import withPasteUpload from '@rpldy/upload-paste';
import UploadPreview, { PreviewItem } from '@rpldy/upload-preview';
import { IoMdClose } from 'react-icons/io';

import Button from 'components/Button';
import Loading from 'components/Loading';
import Avatar from 'components/Avatar';
import { EmojiPicker } from 'components/EmojiPicker';
import useGroupStatusCheck from 'hooks/useGroupStatusCheck';
import { lang } from 'utils/lang';
import Base64 from 'utils/base64';
import { useStore } from 'store';
import { IProfile } from 'apis/content';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import { ISubmitObjectPayload, IDraft, IPreviewItem } from 'hooks/useSubmitObject';
import { v4 as uuidV4 } from 'uuid';
import sleep from 'utils/sleep';

interface IProps {
  editorKey: string
  placeholder: string
  submit: (data: ISubmitObjectPayload) => unknown | Promise<unknown>
  profile?: IProfile
  minRows?: number
  classNames?: string
  buttonClassName?: string
  smallSize?: boolean
  autoFocus?: boolean
  hideButtonDefault?: boolean
  enabledImage?: boolean
  imageLimit?: number
  buttonBorder?: () => void
  submitButtonText?: string
  imagesClassName?: string
}

const Images = (props: {
  images: IPreviewItem[]
  removeImage: (id: string) => void
  smallSize?: boolean
}) => {
  if (props.images.length === 0) {
    return null;
  }
  return (
    <div className="flex items-center py-1">
      {props.images.map((image: IPreviewItem, index: number) => (
        <div
          className="relative animate-fade-in"
          key={image.id}
          onClick={() => {
            openPhotoSwipe({
              image: props.images.map((image: IPreviewItem) => image.url),
              index,
            });
          }}
        >
          <div
            className={classNames({
              'w-14 h-14': props.smallSize,
              'w-24 h-24': !props.smallSize,
            }, 'mr-2 rounded-4')}
            style={{
              background: `url(${image.url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
            }}
          />
          <div
            className={classNames({
              'w-6 h-6 right-[12px]': !props.smallSize,
              'w-5 h-5 right-[10px]': props.smallSize,
            }, 'bg-black bg-opacity-70 text-white opacity-80 text-14 top-[3px] absolute cursor-pointer rounded-full flex items-center justify-center')}
            onClick={(e: any) => {
              e.stopPropagation();
              props.removeImage(image.id);
            }}
          >
            <IoMdClose />
          </div>
        </div>
      ))}
    </div>
  );
};

const extensions = ['jpg', 'jpeg', 'png', 'gif'];
const ACCEPT = extensions.map((v) => `.${v}`).join(', ');

export default (props: IProps) => {
  const PasteUploadDropZone = withPasteUpload(UploadDropZone);
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
  const draftKey = `${props.editorKey.toUpperCase()}_DRAFT_${activeGroupStore.id}`;
  const state = useLocalObservable(() => ({
    content: '',
    loading: false,
    clickedEditor: false,
    emoji: false,
    cacheImageIdSet: new Set(''),
    imageMap: {} as Record<string, IPreviewItem>,
  }));
  const emojiButton = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isPastingFileRef = React.useRef<boolean>(false);
  const imageCount = Object.keys(state.imageMap).length;
  const imageIdSet = React.useMemo(() => new Set(Object.keys(state.imageMap)), [imageCount]);
  const groupStatusCheck = useGroupStatusCheck();
  const readyToSubmit = (state.content.trim() || imageCount > 0) && !state.loading;
  const imageLImit = props.imageLimit || 4;

  React.useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (!draft) {
      return;
    }
    const draftObj = JSON.parse(draft);
    if (!draftObj.content && (draftObj.images || []).length === 0) {
      return;
    }
    state.content = draftObj.content || '';
    if (props.enabledImage) {
      for (const image of draftObj.images as IPreviewItem[]) {
        state.imageMap[image.id] = image;
      }
    }
  }, []);

  React.useEffect(() => {
    saveDraft({
      content: state.content,
      images: Object.values(state.imageMap),
    });
  }, [state.content, imageIdSet]);

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
    }, 500),
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
    if (!readyToSubmit) {
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
    const payload: ISubmitObjectPayload = {
      content: state.content.trim(),
    };
    if (props.enabledImage && imageIdSet.size > 0) {
      const image = Object.values(state.imageMap).map((image: IPreviewItem) => ({
        mediaType: Base64.getMimeType(image.url),
        content: Base64.getContent(image.url),
        name: image.name,
      }));
      payload.image = image;
    }
    try {
      localStorage.removeItem(draftKey);
      await props.submit(payload);
      state.content = '';
      if (props.enabledImage) {
        for (const prop of Object.keys(state.imageMap)) {
          delete state.imageMap[prop];
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
            className="block mr-[14px] mt-[1px]"
            url={props.profile.avatar}
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
                if (isPastingFileRef.current) {
                  return;
                }
                state.content = e.target.value;
              }}
              onPaste={(e: any) => {
                const items = e.clipboardData.items;
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
      {props.enabledImage && (
        <div className={classNames({
          'opacity-50': state.loading,
        }, props.imagesClassName || '')}
        >
          <Images
            images={Object.values(state.imageMap)}
            removeImage={(id: string) => {
              delete state.imageMap[id];
            }}
            smallSize={props.smallSize}
          />
          <UploadPreview
            PreviewComponent={() => null}
            onPreviewsChanged={async (previews: PreviewItem[]) => {
              const newPreviews = previews.filter((preview: PreviewItem) => {
                const ext = (preview.name || '').split('.').pop()?.toLowerCase();
                return !state.cacheImageIdSet.has(preview.id) && (!ext || extensions.includes(ext));
              });
              if (newPreviews.length + imageIdSet.size > imageLImit) {
                for (const preview of newPreviews) {
                  preview.id = uuidV4();
                  state.cacheImageIdSet.add(preview.id);
                }
                snackbarStore.show({
                  message: lang.maxImageCount(imageLImit),
                  type: 'error',
                });
                return;
              }
              if (newPreviews.length > 0) {
                const images = await Promise.all(newPreviews.map(async (preview: PreviewItem) => {
                  const imageData = (await Base64.getFromBlobUrl(preview.url, {
                    count: newPreviews.length + imageIdSet.size,
                  })) as { url: string, kbSize: number };
                  return {
                    ...preview,
                    name: `${uuidV4()}_${preview.name}`,
                    url: imageData.url,
                    kbSize: imageData.kbSize,
                  };
                }));
                const curKbSize = sumBy(Object.values(state.imageMap), (image: IPreviewItem) => image.kbSize);
                const newKbSize = sumBy(images, (image: IPreviewItem) => image.kbSize);
                const totalKbSize = curKbSize + newKbSize;
                images.forEach((image) => {
                  state.cacheImageIdSet.add(image.id);
                });
                if (totalKbSize > 200) {
                  snackbarStore.show({
                    message: lang.maxByteLength,
                    type: 'error',
                    duration: 3500,
                  });
                  return;
                }
                images.forEach((image, index) => {
                  state.imageMap[images[index].id] = image;
                });
              }
            }}
          />
        </div>
      )}
      {(state.clickedEditor
        || imageCount > 0
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
              interactive
            >
              <div className={props.buttonClassName || ''}>
                <Button
                  size="small"
                  className={classNames({
                    'opacity-30': !readyToSubmit,
                  })}
                  onClick={submit}
                >
                  {props.submitButtonText || lang.publish}
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
