import React from 'react';
import classNames from 'classnames';
import Dialog from '@material-ui/core/Dialog';
import { assetsBasePath } from 'utils/env';
import { Tooltip } from '@material-ui/core';

interface Props {
  open: boolean
  close: () => unknown
  onSelect: (base64Img: string) => unknown
}

export default (props: Props) => {
  const handleSelectImg = async (src: string) => {
    const buf = await (await fetch(src)).arrayBuffer();
    const uint8arr = new Uint8Array(buf);
    const data = window.btoa(String.fromCharCode(...Array.from(uint8arr)));
    const base64 = `data:image/png;base64,${data}`;
    props.onSelect(base64);
  };

  return (
    <>
      <Dialog open={props.open} onClose={props.close} maxWidth={false}>
        <div className="bg-white rounded-0 text-center">
          <div className="text-18 font-bold mt-8 mb-4">选择头像</div>
          <div className="img-box overflow-y-auto pt-2 pb-3 px-8 mb-8">
            <div className="img-grid-box grid gap-x-2 gap-y-3">
              {IMAGES.map((url: string) => (
                <Tooltip
                  enterDelay={500}
                  enterNextDelay={500}
                  classes={{
                    tooltip: 'p-0 bg-white shadow-6 rounded-lg overflow-hidden',
                  }}
                  placement="top"
                  title={
                    <div className="p-2">
                      <img className="w-40 h-40" src={url} alt="" />
                    </div>
                  }
                  key={url}
                >
                  <div
                    className={classNames(
                      'group w-20 h-20 p-1 rounded overflow-hidden cursor-pointer relative',
                      'hover:shadow-6 hover:z-10',
                    )}
                    onClick={() => handleSelectImg(url)}
                  >
                    <img className="w-full h-full" src={url} alt="" />
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <style jsx>
        {`
          .img-box {
            width: 90vw;
            max-width: ${80 * 6 + 8 * 5 + 32 * 2}px;
            max-height: 400px;
          }
          .img-grid-box {
            grid-template-columns: repeat(auto-fill, 80px);
          }
        `}
      </style>
    </>
  );
};

const IMAGES = Array(54)
  .fill(0)
  .map((_, i) => `${assetsBasePath}/avatar/${i + 1}.png`);
