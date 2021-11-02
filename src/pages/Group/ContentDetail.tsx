import React from 'react';
import { observer } from 'mobx-react-lite';
import Content from './Content';

export default observer(() => {
  const content: any = {
    author: '浩然',
    avatar:
      'https://mixin-images.zeromesh.net/XN5OIg7Jb50JCwskfVKgWIzxt8XSIlXQ_oyVx9lWcopGQe7uM_ZQjSl1JX4sZ_8ORGZIBXUcPSplisFKt_fZnEg=s256?image=&action=resize:w_80',
    content:
      '想要记录一下今天早上那莫名想哭的情绪，打开电脑先在自己写过的文字中搜了一下「情绪」二字，发现自己有超过几十篇文章都在围绕这「情绪」写来写去……',
    createdAt: '2021-04-28T08:11:03.863Z',
  };

  return (
    <div>
      <Content content={content} />
    </div>
  );
});
