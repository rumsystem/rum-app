import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Button from 'components/Button';
import { useStore, StoreProvider } from 'store';
import { ipcRenderer } from 'electron';

const Hello = observer(() => {
  const state = useLocalStore(() => ({
    message: '',
  }));
  const { userStore } = useStore();

  React.useEffect(() => {
    ipcRenderer.on('asynchronous-reply', (_event, arg) => {
      state.message = `asynchronous-reply: ${arg}`;
    });
  }, [state]);

  const login = () => {
    userStore.setUser({
      name: '华',
      avatar:
        'https://static-assets.xue.cn/images/9262114.png?image=&action=resize:w_80',
    });
  };

  const ping = () => {
    console.log(
      ` ------------- ping send:asynchronous-message ---------------`
    );
    ipcRenderer.send('asynchronous-message', 'ping');
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
            <div className="font-bold text-15">{userStore.user.name}v3</div>
          </div>
          <div className="mt-5">
            <Button onClick={ping}>ping</Button>
            {state.message && (
              <div className="mt-2 text-orange-600">{state.message}</div>
            )}
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
