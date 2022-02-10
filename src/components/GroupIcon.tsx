import React from 'react';

interface IProps {
  width: number
  height: number
  fontSize: number
  name: string
  icon: string
}

export default (props: IProps) => {
  if (!props.icon) {
    return (<div>
      <div
        className="flex flex-center group-letter text-white font-bold uppercase bg-gray-c4"
        style={{
          width: props.width,
          height: props.height,
          fontSize: props.fontSize,
        }}
      >
        {props.name.substring(0, 1)}
      </div>
      <style jsx>{`
      .group-letter {
        font-family: Nunito Sans, PingFang SC, Hiragino Sans GB, Heiti SC, Varela Round, '幼圆', '圆体-简', sans-serif;
      }
    `}</style>
    </div>);
  }

  return <img src={props.icon} width={props.width} height={props.height} alt='icon' />;
};
