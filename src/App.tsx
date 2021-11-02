import React from 'react';
import { observer } from 'mobx-react-lite';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Button from 'components/Button';
import { StoreProvider } from './store';
import { useStore } from 'store';

const Hello = observer(() => {
  const { userStore } = useStore();

  const login = () => {
    userStore.setUser({
      name: '华',
      avatar:
        'https://static-assets.xue.cn/images/9262114.png?image=&action=resize:w_80',
    });
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {!userStore.isLogin && <Button onClick={login}>登录</Button>}
      {userStore.isLogin && (
        <div className="rounded-md bg-blue-300 p-8 w-64 flex flex-col items-center">
          <img
            src={userStore.user.avatar}
            alt="avatar"
            className="rounded-full"
          />
          <div className="mt-2">
            <div className="font-bold text-15">{userStore.user.name}</div>
          </div>
        </div>
      )}
    </div>
  );
});

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <Switch>
          <Route path="/" component={Hello} />
        </Switch>
      </Router>
    </StoreProvider>
  );
}
