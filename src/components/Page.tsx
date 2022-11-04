import React from 'react';
import Loading from 'components/Loading';

interface IProps {
  title: string
  loading: boolean
  children?: any
}

export default (props: IProps) => (
  <div className="p-8 pb-2 box-border bg-gray-f7 h-screen overflow-y-auto layout-page">
    <div className="w-1000-px">
      {props.loading && (
        <div className="mt-48 pt-20">
          <Loading />
        </div>
      )}
      {!props.loading && (
        <div>
          <div className="-mt-1 text-18 text-gray-700 font-bold">
            {props.title}
          </div>
          <div>
            <div className="mt-4">{props.children}</div>
          </div>
        </div>
      )}
    </div>
  </div>
);
