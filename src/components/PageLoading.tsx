import React from 'react';
import { observer } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';

export default observer(() => {
  const { modalStore } = useStore();

  if (!modalStore.pageLoading.open) {
    return null;
  }

  return (
    <div className="root fixed top-0 left-0 w-screen h-screen bg-white flex items-center justify-center">
      <Fade in={true} timeout={500}>
        <div className="-mt-20">
          <Loading />
        </div>
      </Fade>
      <style jsx>{`
        .root {
          z-index: 9999;
        }
      `}</style>
    </div>
  );
});
