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
import { IProfile } from 'store/group';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import { ISubmitObjectPayload, IDraft, IPreviewItem } from 'hooks/useSubmitObject';
import { v4 as uuidV4 } from 'uuid';

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
  buttonBorder?: () => void
}

const Images = (props: {
  images: IPreviewItem[]
  removeImage: (id: string) => void
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
            className="w-24 h-24 mr-2 rounded-4"
            style={{
              background: `url(${image.url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
            }}
          />
          <div
            className="bg-black bg-opacity-70 text-white opacity-80 text-14 top-[3px] right-[12px] absolute cursor-pointer rounded-full w-6 h-6 flex items-center justify-center"
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

const ACCEPT = '.jpg, .jpeg, .png, .gif';

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
  const draft = localStorage.getItem(draftKey);
  const state = useLocalObservable(() => ({
    content: '',
    loading: false,
    clickedEditor: false,
    emoji: false,
    cacheImageIdSet: new Set(''),
    imageMap: {} as Record<string, IPreviewItem>,
    hasRestored: false,
  }));
  const emojiButton = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isPastingFileRef = React.useRef<boolean>(false);
  const imageCount = Object.keys(state.imageMap).length;
  const imageIdSet = React.useMemo(() => new Set(Object.keys(state.imageMap)), [imageCount]);
  const groupStatusCheck = useGroupStatusCheck();
  const readyToSubmit = (state.content.trim() || imageCount > 0) && !state.loading;

  React.useEffect(() => {
    if (!draft || state.hasRestored) {
      return;
    }
    const draftObj = JSON.parse(draft);
    state.content = draftObj.content || '';
    if (props.enabledImage) {
      for (const image of draftObj.images as IPreviewItem[]) {
        state.imageMap[image.id] = image;
      }
    }
    state.hasRestored = true;
  }, [props.enabledImage, draft, state.hasRestored]);

  React.useEffect(() => {
    saveDraft({
      content: state.content,
      images: Object.values(state.imageMap),
    });
  }, [state.content, imageIdSet]);

  const saveDraft = React.useCallback(
    debounce((draft: IDraft) => {
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
      console.log({ image });
      payload.image = image;
    }
    try {
      await props.submit(payload);
      state.content = '';
      if (props.enabledImage) {
        for (const prop of Object.keys(state.imageMap)) {
          delete state.imageMap[prop];
        }
      }
      localStorage.removeItem(draftKey);
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
        })}
        >
          <Images
            images={Object.values(state.imageMap)}
            removeImage={(id: string) => {
              delete state.imageMap[id];
            }}
          />
          <UploadPreview
            PreviewComponent={() => null}
            onPreviewsChanged={async (previews: PreviewItem[]) => {
              const newPreviews = previews.filter((preview: PreviewItem) => {
                const ext = (preview.name || '').split('.').pop();
                return !state.cacheImageIdSet.has(preview.id) && (!ext || ACCEPT.includes(ext));
              });
              if (newPreviews.length + imageIdSet.size > 4) {
                for (const preview of newPreviews) {
                  preview.id = uuidV4();
                  state.cacheImageIdSet.add(preview.id);
                }
                snackbarStore.show({
                  message: lang.maxImageCount(4),
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
