import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { action, runInAction } from 'mobx';
import Page from 'components/Page';
import Button from 'components/Button';
import Echarts from 'components/Echarts';
import topicApi from 'apis/topic';

interface ApiMap {
  [key: string]: Function
}

const apiMap: ApiMap = {
  'post': topicApi.fetchTopicsPostactivity,
  'author': topicApi.fetchTopicsAuthoractivity,
}

const processLineChartOption = (data: any) => {
  let xData: Array<string> = [];
  let yData: Array<string> = [];
  data.activity.reduce((a: any, b: any) => {
    let count = a + b.count;
    xData.push(b.date);
    yData.push(count);
    return count;
  }, data.base);

  return {
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
        type: 'value'
    },
    series: [{
      itemStyle: {
        color: '#7F9CF5'
      },
      data: yData,
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

const processPieChartOption = (data: Array<any>) => {
  let datas: any = [];
  let count: number = 0;
  data.forEach((item: any) => {
    if (item.topic === '*') {
      datas.push({
        name: 'others',
        value: item.post_count,
      })
    } else {
      datas.push({
        name: item.topic,
        value: item.post_count,
      })
    }
    count += item.post_count;
  })
  datas = [datas];
  return {
    title: {
      text: `文章数量\n${count}`,
      left: "center",
      top: "center",
      textStyle: {
        fontWeight: 'normal',
        fontSize: 16,
        lineHeight: 24,
      },
    },
    series: datas.map(function (data: any) {
      return {
        type: 'pie',
        radius: [55, 90],
        left: 'center',
        width: 400,
        label: {
          alignTo: 'edge',
          formatter: '{name|{b}}\n{time|{c} 篇}',
          minMargin: 25,
          edgeDistance: 14,
          lineHeight: 26,
          fontSize: 16,
          width: 80,
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
          maxSurfaceAngle: 80,
        },
        labelLayout: function (params: any) {
          var isLeft = params.labelRect.x < 400;
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

export default observer(() => {
  const state = useLocalStore(() => ({
    tab: 'post' as string,
    isFetched: false,
    lineChartOption: {},
    pieChartOption: {},
  }));

  React.useEffect(() => {
    (async () => {
      const now: any = new Date();
      const aMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const [topics, activity] = await Promise.all([topicApi.fetchPopularTopics(3), apiMap[state.tab](aMonthAgo)]);
      runInAction(() => {
        state.lineChartOption = processLineChartOption(activity.data);
        state.pieChartOption = processPieChartOption(topics.data);
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
      <div className="flex flex-wrap">
        <Echarts id={'activity'} option={state.lineChartOption} style={{ width: 400, height: 400}} />
        <Echarts id={'topics'} option={state.pieChartOption} style={{ width: 400, height: 400}} />
      </div>
    </Page>
  );
});
