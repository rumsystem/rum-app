import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import EasyMDE from 'easymde';
import { lang } from 'utils/lang';
import { iconMap } from './OpenEditor/icons';
import ImageEditor from 'components/ImageEditor';
import useSubmitAttributedTo from 'hooks/useSubmitAttributedTo';
import Base64 from 'utils/base64';
import Schema from 'utils/schema';
import useParseMarkdown from 'hooks/useParseMarkdown';

interface Props {
  className?: string
  value?: string
  onChange?: (v: string) => unknown
  minHeight?: string
}

export const MDEditor = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    editor: null as null | EasyMDE,
  }));
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const imageEditorOpenerRef = React.useRef<HTMLDivElement>(null);

  const submitAttributedTo = useSubmitAttributedTo();
  const parseMarkdown = useParseMarkdown();

  React.useEffect(action(() => {
    if (state.editor) {
      state.editor.toTextArea();
      state.editor = null;
    }
    const editor = new EasyMDE({
      minHeight: props.minHeight,
      autoDownloadFontAwesome: false,
      element: textAreaRef.current!,
      indentWithTabs: false,
      initialValue: props.value ?? '',
      placeholder: lang.require(lang.content),
      spellChecker: false,
      autosave: { enabled: false, uniqueId: '' },
      previewClass: 'editor-preview rendered-markdown',
      status: false,
      shortcuts: {
        togglePreview: null,
        toggleSideBySide: null,
        toggleFullScreen: null,
        drawImage: null,
      },
      previewRender: (md, previewElement) => {
        (async () => {
          previewElement.innerHTML = await parseMarkdown(md);
        })();
        return '';
      },
      toolbar: ([
        {
          name: 'bold',
          icon: iconMap.bold,
          action: EasyMDE.toggleBold,
          title: lang.easymde.bold,
        },
        {
          name: 'italic',
          icon: iconMap.italic,
          action: EasyMDE.toggleItalic,
          title: lang.easymde.italic,
        },
        {
          name: 'heading',
          icon: iconMap.heading,
          action: EasyMDE.toggleHeadingSmaller,
          title: lang.easymde.heading,
        },
        '|',
        {
          name: 'quote',
          icon: iconMap.quote,
          action: EasyMDE.toggleBlockquote,
          title: lang.easymde.quote,
        },
        {
          name: 'unordered-list',
          icon: iconMap.ul,
          action: EasyMDE.toggleUnorderedList,
          title: lang.easymde.ul,
        },
        {
          name: 'ordered-list',
          icon: iconMap.ol,
          action: EasyMDE.toggleOrderedList,
          title: lang.easymde.ol,
        },
        '|',
        {
          name: 'image',
          icon: iconMap.image,
          action: () => {
            imageEditorOpenerRef.current!.click();
          },
          title: lang.easymde.image,
        },
        {
          name: 'link',
          icon: iconMap.link,
          action: EasyMDE.drawLink,
          title: lang.easymde.link,
        },
        {
          name: 'preview',
          icon: iconMap.preview,
          action: EasyMDE.togglePreview,
          noDisable: true,
          title: lang.easymde.preview,
        },
      ] as const).map((v) => (typeof v === 'string' ? v : { ...v, className: 'mde-toolbar-button' })),
    });
    editor.codemirror.on('change', () => {
      props.onChange?.(editor.value());
    });
    state.editor = editor;
  }), []);

  React.useEffect(() => {
    if (state.editor && props.value && state.editor.value() !== props.value) {
      state.editor.codemirror.setValue(props.value);
    }
  }, [props.value]);

  return (
    <div
      className={classNames(
        props.className,
        'flex flex-col',
      )}
    >
      <textarea className="mdeditor" ref={textAreaRef} />
      <ImageEditor
        className="hidden"
        openerRef={imageEditorOpenerRef}
        width={200}
        placeholderWidth={90}
        editorPlaceholderWidth={200}
        imageUrl=""
        useOriginImage
        getImageUrl={async (url: string) => {
          if (!state.editor) {
            return;
          }
          const attributedTo = await submitAttributedTo({
            name: '插图',
            content: '此版本暂不支持插图，更新版本即可支持',
            image: [{
              mediaType: Base64.getMimeType(url),
              content: Base64.getContent(url),
              name: `${Date.now()}`,
            }],
            attributedTo: [
              {
                type: 'Note',
              },
            ],
          });
          if (!attributedTo) {
            return;
          }
          const { codemirror } = state.editor;
          const pos = codemirror.getCursor();
          codemirror.setSelection(pos, pos);
          const breakLinePrefix = pos.line > 1 || pos.ch > 0 ? '\n' : '';
          codemirror.replaceSelection(breakLinePrefix + `![](${Schema.getSchemaPrefix()}${attributedTo.TrxId})\n`);
        }}
      />
      <style jsx>{`
        .mdeditor {
          flex: 1;
        }
        .mdeditor + :global(.EasyMDEContainer) {
          flex: 1;
          height: 0;
          display: flex;
          flex-flow: column;
        }
        .mdeditor + :global(.EasyMDEContainer) :global(.CodeMirror) {
          flex: 1;
        }
        .mdeditor + :global(.EasyMDEContainer) :global(.editor-toolbar) {
          display: flex;
          border-color: #ddd;
        }
        .mdeditor + :global(.EasyMDEContainer) :global(.editor-toolbar) > :global(button) {
          display: flex;
          justify-content: center;
          align-items: center;
          color: #333;
        }
    `}</style>
    </div>
  );
});
