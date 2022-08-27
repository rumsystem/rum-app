import React from 'react';
import { observer } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { unmountComponentAtNode, render } from 'react-dom';
import { ThemeRoot } from 'utils/theme';
import PhotoSwipe from 'photoswipe';
import PhotoSwipeUIDefault from 'photoswipe/dist/photoswipe-ui-default';

import 'photoswipe/dist/photoswipe.css';
import 'photoswipe/dist/default-skin/default-skin.css';

interface IProps {
  image: string | Array<string>
  index?: number
}

export default async (props: IProps) => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <PhotoSwipeComponent
            {...props}
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface IPhotoSwipeProps extends IProps {
  rs: () => unknown
}

const PhotoSwipeComponent = observer((props: IPhotoSwipeProps) => {
  React.useEffect(() => {
    const { image, index = 0 } = props;
    const images: Array<any> = [];
    if (typeof image === 'string') {
      images.push({ src: image, w: 0, h: 0 });
    } else if (image instanceof Array) {
      image.forEach((item: any) => images.push({ src: item, w: 0, h: 0 }));
    } else {
      return;
    }
    const options = {
      index,
      history: false,
      zoomEl: true,
      shareEl: false,
      counterEl: true,
      fullscreenEl: false,
      bgOpacity: 0.85,
      closeOnScroll: false,
      arrowEl: true,
    };
    const pswpElement = document.getElementById('pswp');
    if (pswpElement) {
      const gallery = new PhotoSwipe(pswpElement, PhotoSwipeUIDefault, images, options);
      gallery.listen('gettingData', (_index, item) => {
        if (!item.w || !item.h) {
          const img = new Image();
          img.onload = () => {
            item.w = img.width;
            item.h = img.height;
            gallery.invalidateCurrItems();
            gallery.updateSize(true);
          };
          img.src = item.src!;
        }
      });
      gallery.listen('destroy', () => {
        props.rs();
      });
      gallery.init();
    }
  }, []);

  return (
    <div id="pswp" className="pswp" tabIndex={-1} role="dialog" aria-hidden="true">
      <div className="pswp__bg" />
      <div className="pswp__scroll-wrap">
        <div className="pswp__container">
          <div className="pswp__item" />
          <div className="pswp__item" />
          <div className="pswp__item" />
        </div>
        <div className="pswp__ui pswp__ui--hidden">
          <div className="pswp__top-bar">
            <div className="pswp__counter" />
            <button className="pswp__button pswp__button--close" />
            <button className="pswp__button pswp__button--share" />
            <button className="pswp__button pswp__button--fs" />
            <button className="pswp__button pswp__button--zoom" />
            <div className="pswp__preloader">
              <div className="pswp__preloader__icn">
                <div className="pswp__preloader__cut">
                  <div className="pswp__preloader__donut" />
                </div>
              </div>
            </div>
          </div>
          <div className="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
            <div className="pswp__share-tooltip" />
          </div>
          <button className="pswp__button pswp__button--arrow--left" />
          <button className="pswp__button pswp__button--arrow--right" />
          <div className="pswp__caption">
            <div className="pswp__caption__center" />
          </div>
        </div>
      </div>
    </div>
  );
});
