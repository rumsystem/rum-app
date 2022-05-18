import React from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { BiChevronRight } from 'react-icons/bi';
import Button from 'components/Button';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import { IApiConfig } from 'store/apiConfigHistory';
import { IoMdClose } from 'react-icons/io';

interface Props {
  onConfirm: (r: IApiConfig) => unknown
}

export const SelectApiConfigFromHistory = observer((props: Props) => {
  const { apiConfigHistoryStore } = useStore();
  const { apiConfigHistory } = apiConfigHistoryStore;

  const select = action((apiConfig: IApiConfig) => {
    props.onConfirm(apiConfig);
  });

  return (
    <div className="bg-white rounded-0 text-center py-8 px-8">
      <div className="w-60">
        <div className="px-4">
          <div className="text-18 font-bold text-gray-700">节点配置</div>
          <div
            className="mt-6"
            onClick={() => select({
              host: '',
              port: '',
              jwt: '',
              cert: '',
            })}
          >
            <Button fullWidth>使用新的配置</Button>
          </div>
          {apiConfigHistory.length > 0 && (
            <div className="pt-2">
              <div className="text-center text-gray-500">
                {lang.or}
              </div>
              <div className="mt-2 text-gray-700 opacity-80">
                选择最近使用过的配置
              </div>
            </div>
          )}
        </div>
        {apiConfigHistory.length === 0 && (
          <div className="pt-4" />
        )}
        <div className="max-h-[228px] overflow-y-auto px-4 -mt-1">
          {apiConfigHistory.map((apiConfig) => (
            <div
              key={apiConfig.id}
              className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer text-left relative group"
              onClick={() => select(apiConfig)}
            >
              <div className="text-gray-af font-bold">{apiConfig.host}:{apiConfig.port}</div>
              <BiChevronRight className="text-gray-bd text-20" />
              <div
                className="bg-black bg-opacity-70 text-white opacity-60 text-14 top-[-12px] right-[-10px] absolute cursor-pointer rounded-full w-6 h-6 items-center justify-center hidden group-hover:flex"
                onClick={(e: any) => {
                  e.stopPropagation();
                  apiConfigHistoryStore.remove(apiConfig.id);
                }}
              >
                <IoMdClose />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
