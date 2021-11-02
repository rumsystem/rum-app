import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import Page from 'components/Page';
import Button from 'components/Button';
import Echarts from 'components/Echarts';
import topicApi from 'apis/topic';

const apiMap: any = {
  'post': topicApi.fetchTopicsPostactivity,
  'author': topicApi.fetchTopicsAuthoractivity,
}

const processPieChartOption = (data: Array<any>) => {
  console.log(data);
  const datas = [
    [
      { name: 'PRS Digg', value: 3916 },
      { name: '新作', value: 8628 },
      { name: 'PRS', value: 888 },
      { name: '定投群', value: 4812 },
      { name: 'XUE', value: 1020 }
    ],
  ];
  return {
    series: datas.map(function (data, idx) {
      var top = idx * 33.3;
        return {
          type: 'pie',
            radius: [55, 90],
            top: top + '%',
            left: 'center',
            width: 400,
            label: {
              alignTo: 'edge',
              formatter: '{name|{b}}\n{time|{c} 个}',
              minMargin: 28,
              edgeDistance: 14,
              lineHeight: 26,
              fontSize: 16,
              rich: {
                time: {
                  fontSize: 14,
                    color: '#999'
                  }
                }
              },
              labelLine: {
                length: 15,
                length2: 0,
                maxSurfaceAngle: 80
              },
              labelLayout: function (params) {
                var isLeft = params.labelRect.x < chart.getWidth() / 2;
                var points = params.labelLinePoints;
                // Update the end point.
                points[2][0] = isLeft
                  ? params.labelRect.x
                  : params.labelRect.x + params.labelRect.width;

                  return {
                      labelLinePoints: points
                  };
              },
              data: data
          }
      })
  };
}

const processLineChartOption = (data: Array<any>) => {
  return {
    xAxis: {
      type: 'category',
      data: [
        '2021-02-01',
        '2021-02-02',
        '2021-02-03',
        '2021-02-04',
        '2021-02-05',
        '2021-02-06',
        '2021-02-07',
        '2021-02-08',
        '2021-02-09',
        '2021-02-10',
        '2021-02-12',
        '2021-02-13',
        '2021-02-14',
        '2021-02-15',
        '2021-02-16',
        '2021-02-17',
        '2021-02-18',
        '2021-02-19',
        '2021-02-20',
        '2021-02-21',
        '2021-02-22',
        '2021-02-23',
        '2021-02-24',
        '2021-02-26',
      ]
    },
    yAxis: {
        type: 'value'
    },
    series: [{
      itemStyle: {
        color: '#7F9CF5'
      },
      data: [
        80,
        192,
        217,
        300,
        419,
        451,
        490,
        519,
        565,
        593,
        600,
        644,
        658,
        690,
        743,
        791,
        824,
        921,
        1021,
        1241,
        1331,
        1424,
        1629,
        1794,
      ],
      type: 'line'
    }],
    dataZoom: [{
        type: 'inside'
    }, {
        type: 'slider'
    }],
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.8)'
    }
  };
}

export default observer(() => {
  const state = useLocalStore(() => ({
    tab: 'post',
    isFetched: false,
    lineChartOption: {},
    pieChartOption: {},
  }));

  React.useEffect(() => {
    (async () => {
      const now: any = new Date();
      const aMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const [topics, activity] = await Promise.all([topicApi.fetchPopularTopics(5), apiMap[state.tab](aMonthAgo)]);
      console.log(topics, activity);
      runInAction(() => {
        state.lineChartOption = processLineChartOption(activity);
        state.pieChartOption = processPieChartOption(topics);
        state.isFetched = true;
      })
    })();
  }, [state, state.tab]);

  const changeTab = action((tab: string) => {
    state.tab = tab;
  });

  return (
    <Page title="链上数据" loading={!state.isFetched}>
      <div>
        <Button
          notRounded
          className="rounded-l-full"
          color={state.tab !== 'post' ? 'gray' : 'primary'}
          onClick={() => changeTab('post')}
        >
          文章数量
        </Button>
        <Button
          notRounded
          className="rounded-r-full"
          color={state.tab !== 'author' ? 'gray' : 'primary'}
          onClick={() => changeTab('author')}
        >
          用户数量
        </Button>
      </div>
      <div className="flex">
        <Echarts id={'activity'} option={state.lineChartOption} />
        <Echarts id={'topics'} option={state.pieChartOption} />
      </div>
    </Page>
  );
});
