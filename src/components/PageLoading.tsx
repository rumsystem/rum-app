import React from 'react';
import { observer } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { useStore } from 'store';
import { Fade } from '@mui/material';

export default observer(() => {
  const { modalStore } = useStore();

  if (!modalStore.pageLoading.open) {
    return null;
  }

  return (
    <div
      className="root fixed top-[40px] left-0 right-0 bottom-0 bg-white flex items-center justify-center"
      style={{
        zIndex: 9999,
      }}
    >
      <Fade in={true} timeout={500}>
        <div className="-mt-20">
          <Loading />
        </div>
      </Fade>
    </div>
  );
});
