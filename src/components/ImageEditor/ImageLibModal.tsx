import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Loading from 'components/Loading';
import pixabayApi, { PixiabayImageItem } from 'apis/pixabay';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import BottomLine from 'components/BottomLine';
import { Dialog, Tooltip } from '@mui/material';
import sleep from 'utils/sleep';
import SearchInput from 'components/SearchInput';
import { lang } from 'utils/lang';

interface Props {
  open: boolean
  close: () => unknown
  selectImage: (url: string) => unknown
}

const LIMIT = 24;

const containsChinese = (s: string) => {
  const pattern = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
  if (pattern.exec(s)) {
    return true;
  }
  return false;
};

const ImageLib = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    isFetching: false,
    isFetched: false,
    page: 1,
    searchKeyword: '',
    hasMore: false,
    total: 0,
    images: [] as Array<PixiabayImageItem>,
    tooltipDisableHoverListener: true,
    get ids() {
      return this.images.map((image) => image.id);
    },
  }));
  const RATIO = 16 / 9;

  React.useEffect(() => {
    if (state.isFetching) {
      return;
    }
    state.isFetching = true;
    (async () => {
      try {
        const query: string = state.searchKeyword.split(' ').join('+');
        const res = await pixabayApi.search({
          q: query,
          page: state.page,
          per_page: LIMIT,
          lang: containsChinese(query) ? 'zh' : 'en',
        });
        for (const image of res.hits) {
          if (!state.ids.includes(image.id)) {
            state.images.push(image);
          }
        }
        state.total = res.totalHits;
        state.hasMore = res.hits.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
      if (state.tooltipDisableHoverListener) {
        await sleep(2000);
        state.tooltipDisableHoverListener = false;
      }
    })();
  }, [state, state.page, state.searchKeyword]);

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    rootMargin: '0px 0px 80px 0px',
    onLoadMore: () => {
      state.page += 1;
    },
  });

  const search = (value: string) => {
    state.images = [];
    state.page = 1;
    state.isFetched = false;
    state.searchKeyword = value;
  };

  return (
    <div className="bg-white rounded-0 text-center p-0 md:p-8 md:pt-5">
      <div className="md:w-600-px relative pt-4 md:pt-0">
        <div className="flex justify-center">
          <SearchInput
            className="w-64"
            placeholder={lang.keyword}
            search={search}
          />
        </div>
        <Tooltip
          placement="top"
          arrow
          title={lang.pixabayLicenseTip}
          disableInteractive
        >
          <a
            href="https://pixabay.com/zh"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-0 right-0 w-20 -mr-3 mt-5"
          >
            <img src="https://i-xue-cn.pek3b.qingstor.com/172e1214.png" alt="pixabay" />
          </a>
        </Tooltip>
        <div
          className="mt-3 md:mt-2 overflow-y-auto p-1"
          style={{
            height: 400,
          }}
          ref={rootRef}
        >
          <div className="grid-container">
            {state.images.map((image) => (
              <div key={image.id}>
                <Tooltip
                  placement="left"
                  arrow
                  enterDelay={800}
                  enterNextDelay={800}
                  disableHoverListener={state.tooltipDisableHoverListener}
                  disableTouchListener
                  disableInteractive
                  title={
                    <img
                      className="max-w-none"
                      style={{
                        width: Math.min(image.webformatWidth, 280),
                        height:
                          (Math.min(image.webformatWidth, 280)
                            * image.webformatHeight)
                          / image.webformatWidth,
                      }}
                      src={image.webformatURL.replace('_640', '_340')}
                      alt="image"
                    />
                  }
                >
                  <div
                    className="rounded image cursor-pointer"
                    style={{
                      backgroundImage: `url(${image.webformatURL.replace(
                        '_640',
                        '_180',
                      )})`,
                      width: 132,
                      height: 132 / RATIO,
                    }}
                    onClick={() => props.selectImage(image.webformatURL)}
                  />
                </Tooltip>
              </div>
            ))}
          </div>
          {state.isFetched && state.total === 0 && (
            <div className="py-20 text-center text-gray-500 text-14">
              {lang.emptyImageSearchResult}
              <br />
              <div className="mt-1">{lang.imageSearchTip1}</div>
              <div className="mt-1">{lang.imageSearchTip2}</div>
            </div>
          )}
          {state.isFetched
            && state.total > 0
            && state.total === state.images.length && (
            <div className="pb-5 pt-5">
              <BottomLine />
            </div>
          )}
          {!state.isFetched && (
            <div className="pt-20 mt-2">
              <Loading />
            </div>
          )}
          {state.isFetched && state.hasMore && (
            <div className="py-8 flex items-center justify-center">
              <Loading />
            </div>
          )}
          <div ref={sentryRef} />
        </div>
        <style jsx>
          {`
            .image {
              background-size: cover;
              background-position: center center;
            }
            .grid-container {
              padding: 10px 4px;
              width: 100%;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              grid-auto-rows: minmax(62px, 62px);
              row-gap: 24px;
              column-gap: 0;
              align-items: center;
              justify-items: center;
            }
            .grid-container.sm {
              padding: 10px 12px;
              grid-template-columns: repeat(2, 1fr);
              row-gap: 38px;
            }
          `}
        </style>
      </div>
    </div>
  );
});

export default (props: Props) => {
  const { open, close } = props;

  return (
    <Dialog open={open} onClose={close} maxWidth={false}>
      <ImageLib {...props} />
    </Dialog>
  );
};
