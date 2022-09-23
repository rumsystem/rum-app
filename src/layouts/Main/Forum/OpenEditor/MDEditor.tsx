import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import EasyMDE from 'easymde';
import DOMPurify from 'dompurify';
import { lang } from 'utils/lang';
import { defaultRenderer } from 'utils/markdown';

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
      toolbar: [
        {
          name: 'bold',
          action: EasyMDE.toggleBold,
          className: 'fa fa-bold',
          title: lang.easymde.bold,
        },
        {
          name: 'italic',
          action: EasyMDE.toggleItalic,
          className: 'fa fa-italic',
          title: lang.easymde.italic,
        },
        {
          name: 'heading',
          action: EasyMDE.toggleHeadingSmaller,
          className: 'fa fa-header fa-heading',
          title: lang.easymde.heading,
        },
        '|',
        {
          name: 'quote',
          action: EasyMDE.toggleBlockquote,
          className: 'fa fa-quote-left',
          title: lang.easymde.quote,
        },
        {
          name: 'unordered-list',
          action: EasyMDE.toggleUnorderedList,
          className: 'fa fa-list-ul',
          title: lang.easymde.ul,
        },
        {
          name: 'ordered-list',
          action: EasyMDE.toggleOrderedList,
          className: 'fa fa-list-ol',
          title: lang.easymde.ol,
        },
        '|',
        {
          name: 'link',
          action: EasyMDE.drawLink,
          className: 'fa fa-link',
          title: lang.easymde.link,
        },
        {
          name: 'preview',
          action: EasyMDE.togglePreview,
          className: 'fa fa-eye',
          noDisable: true,
          title: lang.easymde.preview,
        },
      ],
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
    `}</style>
    </div>
  );
});
