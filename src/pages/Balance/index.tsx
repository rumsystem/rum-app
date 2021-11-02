import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';

export default observer(() => {
  const state = useLocalStore(() => ({
    isFetched: true,
  }));

  return (
    <Page title="我的余额" loading={!state.isFetched}>
      <div />
    </Page>
  );
});
