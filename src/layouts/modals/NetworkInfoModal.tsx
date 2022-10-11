import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import MetricsApi, { IMetrics } from 'apis/metrics';

interface IProps {
  open: boolean
  onClose: () => void
}

const formatTraffic = (num: number) => {
  if (num > 1024 ** 4) {
    return Math.floor(num / 1024 ** 4) + 'T';
  }
  if (num > 1024 ** 3) {
    return Math.floor(num / 1024 ** 3) + 'G';
  }
  if (num > 1024 ** 2) {
    return Math.floor(num / 1024 ** 2) + 'M';
  }
  if (num > 1024) {
    return Math.floor(num / 1024) + 'K';
  }
  return num + 'B';
};

const countTraffic = (metrics: IMetrics) => {
  let reatime = 0;
  let total = 0;
  metrics.forEach((metric) => {
    if ((metric?.name === 'quorum_in_bytes_total' || metric?.name === 'quorum_out_bytes_total') && metric.metrics) {
      metric.metrics.forEach((item: any) => { total += +item?.value || 0; });
    }
    if ((metric?.name === 'quorum_in_bytes' || metric?.name === 'quorum_out_bytes') && metric.metrics) {
      metric.metrics.forEach((item: any) => { reatime += +item?.value || 0; });
    }
  });
  return [formatTraffic(reatime), formatTraffic(total)];
};

const NetworkInfo = observer(() => {
  const { nodeStore } = useStore();
  const peerMap = nodeStore.info.peers;
  const { network } = nodeStore;

  const state = useLocalObservable(() => ({
    reatime: '0B',
    total: '0B',
  }));


  React.useEffect(() => {
    if (process.env.IS_ELECTRON) {
      const fetchMetrics = async () => {
        const metrics = await MetricsApi.fetchMetrics();
        const [reatime, total] = countTraffic(metrics);
        state.reatime = reatime || '0B';
        state.total = total || '0B';
      };
      fetchMetrics();
      const timer = setInterval(fetchMetrics, 1000);
      return () => {
        clearInterval(timer);
      };
    }
    return () => {};
  }, []);

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="bg-white rounded-0 p-8 px-10">
        <div className="w-[455px]">
          <div className="text-18 font-bold text-gray-700 text-center">
            {lang.networkStatus}
          </div>
          <div className="mt-6 pb-2">
            <div className="text-gray-500 font-bold">{lang.status}</div>
            <div className="mt-2 flex items-center justify-center text-12 text-gray-500 bg-gray-100 rounded-0 p-2 tracking-wider font-bold">
              {network.nat_type === 'Public' && (
                <div className="flex items-center text-emerald-500">
                  <div className="w-2 h-2 bg-emerald-300 rounded-full mr-2" />
                  Public
                </div>
              )}
              {network.nat_type !== 'Public' && (
                <div className="flex items-center text-red-400">
                  <div className="w-2 h-2 bg-red-300 rounded-full mr-2" />
                  {network.nat_type}
                </div>
              )}
            </div>
            {
              !!process.env.IS_ELECTRON && (
                <div className="mt-8">
                  <div className="flex">
                    <div className="text-gray-500 font-bold bg-gray-100 rounded-0 pt-2 pb-3 px-4">
                      {lang.traffic}
                    </div>
                  </div>
                  <div className="-mt-3 justify-center text-12 text-gray-99 bg-gray-100 rounded-0 pt-3 px-6 pb-3 leading-7 tracking-wide">
                    <div>{lang.currentTraffic}: <span className="text-red-400">{state.reatime}</span></div>
                    <div>{lang.currentTotalTraffic}: <span className="text-red-400">{state.total}</span></div>
                  </div>
                </div>
              )
            }
            <div className="mt-8">
              <div className="flex">
                <div className="text-gray-500 font-bold bg-gray-100 rounded-0 pt-2 pb-3 px-4">
                  addrs
                </div>
              </div>
              <div className="-mt-3 justify-center text-12 text-gray-99 bg-gray-100 rounded-0 pt-3 px-6 pb-3 leading-7 tracking-wide">
                {network.addrs.map((addr, i) => (
                  <div key={i}>{addr}</div>
                ))}
              </div>
            </div>
            {Object.keys(peerMap).map((type: string) => (
              <div className="mt-8" key={type}>
                <div className="flex">
                  <div className="text-gray-500 font-bold bg-gray-100 rounded-0 pt-2 pb-3 px-4">
                    {type}
                  </div>
                </div>
                <div className="-mt-3 justify-center text-12 text-gray-99 bg-gray-100 rounded-0 pt-3 px-6 pb-3 leading-7 tracking-wide">
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
    className="network-info-modal"
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <NetworkInfo />
  </Dialog>
));
