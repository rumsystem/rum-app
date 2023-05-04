import { useEffect, ComponentProps } from 'react';
import Axios from 'axios';
import classNames from 'classnames';
import { observable, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { BiLinkAlt } from 'react-icons/bi';
import { Button } from '@mui/material';
import { shell } from '@electron/remote';
import { WebsiteMetadataModel } from 'hooks/useDatabase/models';
import useDatabase from 'hooks/useDatabase';

type ButtonProps = ComponentProps<typeof Button>;
export interface Props extends ButtonProps {
  url: string
}
const axios = Axios.create({ adapter: 'http' });

export const ExternalLink = observer((props: Props) => {
  const state = useLocalObservable(() => observable({
    title: '',
    description: '',
    site: '',
    image: '',
    favicon: '',
    imageBase64: '',
  }, {}, { deep: false }));
  const db = useDatabase();

  const parseLink = async (url: string) => {
    const existedItem = await WebsiteMetadataModel.get(db, props.url);
    if (existedItem) {
      runInAction(() => {
        state.title = existedItem.title;
        state.description = existedItem.description;
        state.site = existedItem.site;
        state.image = existedItem.image;
        state.imageBase64 = existedItem.imageBase64;
      });
      if (Date.now() < existedItem.timestamp + 86400000 * 7) {
        return;
      }
    }

    try {
      const head = await axios.request({
        method: 'head',
        url,
      });
      if (!head.headers['content-type'].startsWith('text/html')) {
        return;
      }
      const size = Number(head.headers['content-length']);
      if (!Number.isNaN(size) && size > 1024 ** 2) {
        return;
      }
      const content = await axios.request({
        method: 'get',
        url,
      });
      const parser = new DOMParser();
      const doc = parser.parseFromString(content.data, 'text/html');
      const title = doc.head.querySelector('meta[property="og:title"]')?.getAttribute('content')
        || doc.head.querySelector('meta[property="twitter:title"]')?.getAttribute('content')
        || doc.head.querySelector('meta[name="title"]')?.getAttribute('content')
        || doc.head.querySelector('title')?.innerHTML
        || '';

      const description = doc.head.querySelector('meta[property="og:description"]')?.getAttribute('content')
        || doc.head.querySelector('meta[property="twitter:description"]')?.getAttribute('content')
        || doc.head.querySelector('meta[name="description"]')?.getAttribute('content')
        || '';

      const site = doc.head.querySelector('meta[property="og:site_name"]')?.getAttribute('content')
        || doc.head.querySelector('meta[property="twitter:site"]')?.getAttribute('content')
        || '';

      const image = doc.head.querySelector('meta[property="og:image"]')?.getAttribute('content')
        || doc.head.querySelector('meta[property="twitter:image"]')?.getAttribute('content')
        || '';
      const imageUrl = image && new URL(image, props.url).toString();

      const favicon = doc.head.querySelector('link[rel="shortcut icon"]')?.getAttribute('href')
        || doc.head.querySelector('link[rel="icon"]')?.getAttribute('href')
        || '/favicon.ico';
      const faviconUrl = new URL(favicon, props.url).toString();

      runInAction(() => {
        state.title = title;
        state.description = description;
        state.site = site;
        state.image = imageUrl;
        state.favicon = faviconUrl;
      });
      WebsiteMetadataModel.put(db, {
        url: props.url,
        title,
        description,
        site,
        image: imageUrl,
        favicon: faviconUrl,
        imageBase64: '',
        timestamp: Date.now(),
      });

      if (imageUrl) {
        const imageRes = await axios.request<ArrayBuffer>({
          url: imageUrl,
          responseType: 'arraybuffer',
        });
        const mineType = imageRes.headers['content-type'];
        const buffer = Buffer.from(imageRes.data);
        const imageBase64 = `data:${mineType};base64,${buffer.toString('base64')}`;
        runInAction(() => {
          state.imageBase64 = imageBase64;
        });
        WebsiteMetadataModel.put(db, {
          url: props.url,
          title,
          description,
          site,
          image: imageUrl,
          imageBase64,
          favicon: faviconUrl,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      // console.error(e);
    }
  };

  useEffect(() => {
    parseLink(props.url);
  }, [props.url]);

  const { className, url, ...rest } = props;
  return (
    <Button
      className={classNames(
        'flex items-stretch gap-4 w-full',
        'border border-solid border-black/10 rounded-12 p-0',
        'font-normal !font-default normal-case tracking-normal text-start leading-normal break-all',
        'overflow-hidden',
        props.className,
      )}
      {...rest}
      onClick={() => shell.openExternal(props.url)}
    >
      <div
        className={classNames(
          'flex flex-center bg-[#888]/5 h-[82px] w-[82px] bg-center bg-no-repeat',
          !!state.imageBase64 && 'bg-cover',
          !state.imageBase64 && 'bg-[length:32px_32px]',
        )}
        style={{
          backgroundImage: `url("${state.imageBase64 || state.favicon}")`,
        }}
      >
        {!state.imageBase64 && !state.favicon && (
          <BiLinkAlt className="text-black/60 text-30" />
        )}
      </div>
      <div className="flex-col justify-center items-stretch flex-1 w-0 mr-4">
        {(!!state.title || !!state.site) && (
          <div className="font-bold truncate">
            {[state.title, state.site].filter((v) => v).join(' - ')}
          </div>
        )}
        {!state.description && (
          <div className="mt-[2px] text-black/50 truncate-2">
            {props.url}
          </div>
        )}
        {!!state.description && (
          <div className="mt-[2px] text-black/50 truncate-2">
            {state.description}
          </div>
        )}
      </div>
    </Button>
  );
});
