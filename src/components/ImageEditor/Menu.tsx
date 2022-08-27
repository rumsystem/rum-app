import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from '@material-ui/core/Dialog';
import Button from 'components/Button';
import Loading from 'components/Loading';
import { lang } from 'utils/lang';

interface Props {
  open: boolean
  close: () => unknown
  loading: boolean
  selectMenuItem: (action: 'openPresetImages' | 'upload' | 'openImageLib') => unknown
  showAvatarSelect?: boolean
}

export default observer((props: Props) => {
  const { open, close, loading, selectMenuItem } = props;

  const Main = () => (
    <div className="pt-8 px-12 pb-10 relative">
      <div className="px-12 text-16 text-center font-bold">{lang.selectProvider}</div>
      <div className="mt-5 flex flex-col items-center gap-y-4">
        {([
          props.showAvatarSelect && ['openPresetImages', lang.selectAvatar] as const,
          ['upload', lang.uploadImage],
          ['openImageLib', lang.selectFromImageLib],
        ] as const)
          .filter(<T extends unknown>(v: T | undefined | boolean): v is T => !!v)
          .map((v, i) => (
            <Button
              fullWidth
              onClick={() => selectMenuItem(v[0])}
              key={i}
            >
              {v[1]}
            </Button>
          ))}
      </div>
      {loading && (
        <div className="absolute top-0 right-0 z-10 w-full py-20 bg-white">
          <div className="pt-4">
            <Loading />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onClose={close} maxWidth={false}>
      {Main()}
    </Dialog>
  );
});
