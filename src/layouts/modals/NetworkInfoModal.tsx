import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';

interface IProps {
  open: boolean
  onClose: () => void
}

const NetworkInfo = observer(() => {
  const { nodeStore } = useStore();
  const peerMap = nodeStore.info.peers;

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="bg-white rounded-0 p-8 px-10">
        <div className="w-[455px]">
          <div className="text-18 font-bold text-gray-700 text-center">
            网络状态
          </div>
          <div className="mt-6 pb-2">
            <div className="text-gray-500 font-bold">状态</div>
            <div className="mt-2 flex items-center justify-center text-12 text-gray-500 bg-gray-100 rounded-10 p-2 tracking-wider font-bold">
              {nodeStore.network.node.nat_type === 'Public' && (
                <div className="flex items-center text-green-500">
                  <div className="w-2 h-2 bg-green-300 rounded-full mr-2" />
                  Public
                </div>
              )}
              {nodeStore.network.node.nat_type !== 'Public' && (
                <div className="flex items-center text-red-400">
                  <div className="w-2 h-2 bg-red-300 rounded-full mr-2" />
                  {nodeStore.network.node.nat_type}
                </div>
              )}
              <div className="px-5">|</div>
              {nodeStore.info.node_status === 'NODE_ONLINE' && (
                <div className="flex items-center text-green-500">
                  <div className="w-2 h-2 bg-green-300 rounded-full mr-2" />
                  {nodeStore.info.node_status
                    .toLowerCase()
                    .replace('node_', '')
                    .replace('o', 'O')}
                </div>
              )}
              {nodeStore.info.node_status !== 'NODE_ONLINE' && (
                <div className="flex items-center text-red-400">
                  <div className="w-2 h-2 bg-red-300 rounded-full mr-2" />
                  {nodeStore.info.node_status
                    .toLowerCase()
                    .replace('node_', '')
                    .replace('o', 'O')}
                </div>
              )}
            </div>
            {Object.keys(peerMap).map((type: string) => (
              <div className="mt-8" key={type}>
                <div className="flex">
                  <div className="text-gray-500 font-bold bg-gray-100 rounded-10 pt-2 pb-3 px-4">
                    {type}
                  </div>
                </div>
                <div className="-mt-3 justify-center text-12 text-gray-99 bg-gray-100 rounded-10 pt-3 px-6 pb-3 leading-7 tracking-wide">
                  {peerMap[type].map((peer, i) => (
                    <div key={i}>{peer}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <NetworkInfo />
  </Dialog>
));
