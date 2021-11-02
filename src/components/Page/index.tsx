import React from 'react';
import Loading from 'components/Loading';

interface IProps {
  title: string;
  loading: boolean;
  children?: any;
}

export default (props: IProps) => {
  return (
    <div className="p-8 box-border h-screen overflow-y-auto">
      {props.loading && (
        <div className="mt-48 pt-20">
          <Loading />
        </div>
      )}
      {!props.loading && (
        <div>
          <div className="pt-2 text-18 text-gray-700 font-bold">
            {props.title}
          </div>
          <div>
            <div className="mt-4">{props.children}</div>
          </div>
        </div>
      )}
    </div>
  );
};
