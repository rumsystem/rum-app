import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { AiFillCheckCircle } from 'react-icons/ai';

interface IItem {
  value: string
  RadioContentComponent: any
  descComponent: any
}

interface IProps {
  value: string
  items: IItem[]
  onChange: (value: string) => void
}

interface ItemProps {
  value: string
  item: IItem
  onChange: (value: string) => void
}

const Item = (props: ItemProps) => {
  const { item, value: cur } = props;
  const { value, RadioContentComponent } = item;
  return (
    <div
      className={classNames({
        'border-gray-d8': value !== cur,
        'border-black text-gray-1e': value === cur,
      }, 'border-2 flex items-center justify-center relative rounded-4 cursor-pointer')}
      onClick={() => {
        props.onChange(value);
      }}
    >
      <RadioContentComponent />
      {value === cur && (
        <AiFillCheckCircle className="text-24 absolute top-0 right-0 m-1 text-black" />
      )}
    </div>
  );
};


export default observer((props: IProps) => (
  <div>
    <div className={classNames({
      'grid grid-cols-3 gap-5': props.items.length === 3,
      'flex flex-center': props.items.length !== 3,
    }, 'text-gray-6d')}
    >
      {props.items.map((item) => (
        <div
          key={item.value}
          className={classNames({
            'mx-4': props.items.length !== 3,
          })}
        >
          <Item item={item} value={props.value} onChange={props.onChange} />
        </div>
      ))}
    </div>
    <div className="mt-6 px-10">
      {props.items.map((item) => {
        if (item.value === props.value) {
          return (
            <div key={item.value} className="animate-fade-in text-gray-9b text-13">
              {item.descComponent()}
            </div>
          );
        }
        return null;
      })}
    </div>
  </div>
));
