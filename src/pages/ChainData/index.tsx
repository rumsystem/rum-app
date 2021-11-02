import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import Page from 'components/Page';
import Button from 'components/Button';
import Echarts from 'components/Echarts';
import topicApi from 'apis/topic';
import moment from 'moment';
import Loading from 'components/Loading';

interface ApiMap {
  [key: string]: Function;
}

const apiMap: ApiMap = {
  post: topicApi.fetchTopicsPostActivity,
  author: topicApi.fetchTopicsAuthorActivity,
};

const processLineChartOption = (data: any) => {
  let xData: Array<string> = [];
  let yData: Array<string | number> = [];

  if (data.length > 0) {
    let startDate = moment(data[0].data.activity[0].date)
      .add(-1, 'day')
      .format('YYYY-MM-DD');
    xData.push(startDate);
    yData.push(0);
  }

  data.forEach((item: any) => {
    item.data.activity.reduce((a: any, b: any) => {
      let count = a + b.count;
      xData.push(b.date);
      yData.push(count);
      return count;
    }, item.data.base);
  });

  return {
    width: 500,
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        itemStyle: {
          color: '#7F9CF5',
        },
        data: yData,
        type: 'line',
      },
    ],
    dataZoom: [
      {
        type: 'inside',
      },
      {
        type: 'slider',
      },
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  };
};

const processPieChartOption = (data: Array<any>, tab: string) => {
  let datas: any = [];
  let count: number = 0;
  data.forEach((item: any) => {
    if (item.topic === '*') {
      datas.push({
        name: 'others',
        value: item[tab + '_count'],
      });
    } else {
      datas.push({
        name: item.topic,
        value: item[tab + '_count'],
      });
    }
    count += item[tab + '_count'];
  });
  datas = [datas];
  return {
    title: {
      text: `${tab === 'post' ? '文章' : '用户'}数量\n${count}`,
      left: 'center',
      top: 'center',
      textStyle: {
        fontWeight: 'normal',
        fontSize: 14,
        lineHeight: 22,
      },
    },
    series: datas.map(function (data: any) {
      return {
        type: 'pie',
        radius: [42, 62],
        left: 'center',
        width: 300,
        label: {
          alignTo: 'edge',
          formatter: `{name|{b}}\n{time|{c} ${tab === 'post' ? '篇' : '人'}}`,
          minMargin: 48,
          edgeDistance: 1,
          lineHeight: 26,
          fontSize: 16,
          width: 60,
          rich: {
            time: {
              fontSize: 14,
              color: '#999',
            },
          },
        },
        labelLine: {
          length: 15,
          length2: 0,
          maxSurfaceAngle: 80,
        },
        labelLayout: function (params: any) {
          var isLeft = params.labelRect.x < 300;
          var points = params.labelLinePoints;
          // Update the end point.
          points[2][0] = isLeft
            ? params.labelRect.x
            : params.labelRect.x + params.labelRect.width;
          return {
            labelLinePoints: points,
          };
        },
        data: data,
      };
    }),
  };
};

const fetchActivity = (tab: string) => {
  let start: Date = new Date('2020-10-01T00:00:00.000Z');
  let end: Date = new Date(Number(start) + 365 * 24 * 60 * 60 * 1000);
  const now: any = new Date();
  const promises: Array<Promise<any>> = [];
  while (end < now) {
    promises.push(apiMap[tab](start, end));
    start = end;
    end = new Date(Number(end) + 365 * 24 * 60 * 60 * 1000);
  }
  promises.push(apiMap[tab](start, now));
  return Promise.all(promises);
};

export default observer(() => {
  const state = useLocalStore(() => ({
    tab: 'post' as string,
    isFetched: false,
    lineChartOption: {},
    pieChartOption: {},
    waiting: false,
  }));

  React.useEffect(() => {
    (async () => {
      runInAction(() => {
        if (state.isFetched) {
          state.waiting = true;
        }
      });
      const [activity, topics] = await Promise.all([
        fetchActivity(state.tab),
        topicApi.fetchPopularTopics(3),
      ]);
      runInAction(() => {
        state.lineChartOption = processLineChartOption(activity);
        state.pieChartOption = processPieChartOption(topics.data, state.tab);
        state.isFetched = true;
        state.waiting = false;
      });
    })();
  }, [state, state.tab]);

  const changeTab = action((tab: string) => {
    state.tab = tab;
  });

  return (
    <Page title="链上数据" loading={!state.isFetched}>
      <div>
        <div className="pt-4" />
        <Button
          noRound
          className="rounded-l-full"
          onClick={() => changeTab('post')}
          outline={state.tab !== 'post'}
          size="small"
        >
          文章数量
        </Button>
        <Button
          noRound
          className="rounded-r-full"
          onClick={() => changeTab('author')}
          outline={state.tab !== 'author'}
          size="small"
        >
          用户数量
        </Button>
      </div>
      <div className="flex flex-wrap pt-1 items-center relative">
        {state.waiting && (
          <div className="absolute inset-0 flex bg-gray-f7 z-10 justify-center items-center">
            <Loading />
          </div>
        )}
        <Echarts
          id={'activity'}
          option={state.lineChartOption}
          style={{ width: 600, height: 400 }}
        />
        <div className="pr-12 mr-2" />
        <Echarts
          id={'topics'}
          option={state.pieChartOption}
          style={{ width: 300, height: 300 }}
        />
      </div>
    </Page>
  );
});
