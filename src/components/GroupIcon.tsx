import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { GROUP_CONFIG_KEY } from 'utils/constant';

interface IProps {
  groupId: string
  width: number
  height: number
  fontSize: number
  groupIcon?: string
  className?: string
  colorClassName?: string
}

export default observer((props: IProps) => {
  const { groupStore } = useStore();
  const group = groupStore.map[props.groupId];
  const groupName = group?.group_name || '';
  const groupIcon = props.groupIcon || (groupStore.configMap.get(props.groupId)?.[GROUP_CONFIG_KEY.GROUP_ICON] ?? '') as string;

  if (!groupIcon) {
    return (<div>
      <div
        className={`flex flex-center group-letter font-bold uppercase bg-gray-af leading-none ${props.colorClassName || 'text-white'} ${props.className || ''}`}
        style={{
          width: props.width,
          height: props.height,
          fontSize: props.fontSize,
        }}
      >
        {groupName.substring(0, 1)}
      </div>
      <style jsx>{`
      .group-letter {
        font-family: Nunito Sans, PingFang SC, Hiragino Sans GB, Heiti SC, Varela Round, '幼圆', '圆体-简', sans-serif;
      }
    `}</style>
    </div>);
  }

  return <img className={props.className || ''} src={groupIcon} width={props.width} height={props.height} alt='icon' />;
});
