import React from 'react';
import { observer } from 'mobx-react-lite';
import { AuthType } from 'apis/auth';
import classNames from 'classnames';
import { AiFillCheckCircle } from 'react-icons/ai';
import Tooltip from '@material-ui/core/Tooltip';

interface IProps {
  authType: AuthType
  onChange: (authType: AuthType) => void
}

interface ItemProps extends IProps {
  cur: AuthType
}

const Item = (props: ItemProps) => {
  const { authType, cur } = props;
  return (
    <div
      className={classNames({
        'border-gray-af': authType !== cur,
        'border-black text-gray-1e': authType === cur,
      }, 'mr-6 border h-32 w-42 flex items-center justify-center relative rounded-4 cursor-pointer')}
      onClick={() => {
        props.onChange(authType);
      }}
    >
      {authType === 'FOLLOW_DNY_LIST' && '新成员默认可写'}
      {authType === 'FOLLOW_ALW_LIST' && '新成员默认只读'}
      {authType === cur && (
        <AiFillCheckCircle className="text-22 absolute top-0 right-0 m-1 text-black" />
      )}
    </div>
  );
};

export default observer((props: IProps) => (
  <div>
    <div className="flex justify-center text-gray-6d">
      <div>
        <Item authType='FOLLOW_DNY_LIST' cur={props.authType} onChange={props.onChange} />
      </div>
      <div className="mx-5" />
      <div>
        <Item authType='FOLLOW_ALW_LIST' cur={props.authType} onChange={props.onChange} />
      </div>
    </div>
    <div className="text-14 mt-8 px-8">
      {props.authType === 'FOLLOW_DNY_LIST' && (
        <div className="animate-fade-in">
          新加入成员默认拥有可写权限，包括发表主帖，评论主贴，回复评论，点赞等操作。管理员可以对某一成员作禁言处理。种子网络建立后，你仍可以修改此项权限设置。
          <div className="mt-2" />
          新加入成员默认可写的权限设置，适用于时间线呈现的微博客类社交应用。
        </div>
      )}
      {props.authType === 'FOLLOW_ALW_LIST' && (
        <div className="animate-fade-in">
          新加入成员默认只读，没有权限进行发表主帖、评论主贴、回复评论、点赞等操作
          <Tooltip
            placement="top"
            title="限制成员发帖，但是允许成员评论、回复、点赞的权限管理功能即将开放"
            arrow
          >
            <span className="text-blue-400">(?)</span>
          </Tooltip>
          。管理员可以对某一成员开放权限。种子网络建立后，你仍可以修改此项权限设置。
          <div className="mt-2" />
          新加入成员默认只读的权限设置，适用于个人博客、内容订阅、知识分享等内容发布应用。
        </div>
      )}
    </div>
  </div>
));
