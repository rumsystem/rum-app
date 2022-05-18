import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import EasyMDE from 'easymde';
import DOMPurify from 'dompurify';
import { lang } from 'utils/lang';
import { defaultRenderer } from 'utils/markdown';
import { iconMap } from './icons';

interface Props {
  className?: string
  value?: string
  onChange?: (v: string) => unknown
}

export const MDEditor = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    editor: null as null | EasyMDE,
  }));
  const textAeraRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(action(() => {
    if (state.editor) {
      state.editor.toTextArea();
      state.editor = null;
    }
    const editor = new EasyMDE({
      autoDownloadFontAwesome: false,
      element: textAeraRef.current!,
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
      previewRender: (md: string) => DOMPurify.sanitize(defaultRenderer.render(md)),
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
      <textarea className="mdeditor" ref={textAeraRef} />
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
