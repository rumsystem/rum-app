import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import { useStore } from 'store';

export default observer(() => {
  const { accountStore } = useStore();
  const { isLogin } = accountStore;
  const history = useHistory();
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname === '/') {
      history.replace(isLogin ? '/account' : '/producer');
    }
  }, [isLogin]);

  return <div />;
});
