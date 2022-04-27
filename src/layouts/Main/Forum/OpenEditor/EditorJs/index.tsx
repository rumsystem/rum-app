import React from 'react';
import { observer } from 'mobx-react-lite';
import EditorJS, { LogLevels } from '@editorjs/editorjs';
import sleep from 'utils/sleep';
import i18n from './i18n';
import { lang } from 'utils/lang';

import './index.scss';
import './post-content.scss';

export default observer((props: any) => {
  const editorRef = React.useRef<any>(null);
  const loadingRef = React.useRef<any>(false);

  if (props.data) {
    props.data.blocks = props.data.blocks.filter((block: any) => {
      if (block.type === 'image' && !block.data.url) {
        return false;
      }
      return true;
    });
  }

  React.useEffect(() => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setTimeout(() => {
      editorRef.current = new EditorJS({
        holder: 'editorjs',
        data: props.data,
        tools: {
          paragraph: {
            class: require('editorjs-paragraph-with-alignment'),
            inlineToolbar: true,
          },
          header: {
            class: require('@editorjs/header'),
            inlineToolbar: true,
          },
          list: {
            class: require('@editorjs/list'),
            inlineToolbar: true,
          },
          // image: {
          //   class: require('./Plugins/Image').Image,
          //   config: {
          //     openImgUploadModal: props.openImgUploadModal,
          //   },
          // },
          quote: {
            class: require('./Plugins/Quote').Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: lang.quotePlaceholder,
            },
          },
          delimiter: require('@editorjs/delimiter'),
          table: {
            class: require('@editorjs/table'),
            inlineToolbar: true,
          },
          raw: {
            class: require('@editorjs/raw'),
            config: {
              placeholder: lang.htmlCode,
            },
          },
          marker: require('@editorjs/marker'),
        },
        placeholder: lang.input(lang.content),
        onChange: (_api: any, block: any) => {
          (async () => {
            await sleep(50);
            const outputData = await editorRef.current.save();
            props.onChange(JSON.stringify(outputData));
            await sleep(50);
            if (block.holder.nextElementSibling) {
              block.holder.nextElementSibling.scrollIntoView({
                block: 'center',
                inline: 'nearest',
              });
            }
          })();
        },
        i18n,
        logLevel: 'ERROR' as LogLevels,
      });
    }, 200);

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        loadingRef.current = false;
      }
    };
    // eslint-disable-next-line
  }, []);

  return <div id="editorjs" className="post-content text-16 pt-4" />;
});
