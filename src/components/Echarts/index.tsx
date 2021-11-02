import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import * as echarts from 'echarts/core';
import {
  LineChart,
  PieChart,
} from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import {
  CanvasRenderer
} from 'echarts/renderers';

echarts.use([LineChart, PieChart, TitleComponent, TooltipComponent, GridComponent, DataZoomComponent, CanvasRenderer]);

interface Props {
  id: string;
  option: any;
  className?: string;
  style?: object;
}

export default observer((props: Props) => {
  const {
    id,
    option,
    className,
    style,
  } = props;

  const state: any = useLocalStore(() => ({
    chart: null,
  }));
  
  React.useEffect(() => {
    const target = id && document.getElementById(id);
    if(!target) {
      return;
    }
    state.chart = echarts.init(target);
    state.chart.setOption(option);
    const resizeListener = () => {
      state.chart.resize();
    }
    window.addEventListener("resize", resizeListener);
    return () => {
      window.removeEventListener("resize", resizeListener);
      state.chart.dispose();
    }
  }, [id]);

  React.useEffect(() => {
    if(!state.chart) {
      return;
    }
    state.chart.setOption(option);
  }, [option]);

  return (
    <div id={id} style={style} className={className || ''}></div>
  );
});
