import React from 'react';
//import classNames from 'classnames';
import * as echarts from 'echarts/core';
import {
  LineChart,
  PieChart,
} from 'echarts/charts';
import {
  CanvasRenderer
} from 'echarts/renderers';
import {
    TitleComponent,
    TooltipComponent,
    GridComponent
} from 'echarts/components';

echarts.use([LineChart, PieChart, CanvasRenderer, TitleComponent, TooltipComponent, GridComponent]);

export interface Props {
  id: string;
  option: any;
}

export default (props: Props) => {
  const {
    id,
    option
  } = props;
  
  React.useEffect(() => {
    const target = id && document.getElementById(id);
    if(target) {
      const chart = echarts.init(target);
      chart.setOption(option);
      //window.addEventListener("resize",function(){
        //console.log(111);
        //chart.resize();
      //});
    }
  }, [id]);

  return (
    <div id={id} style={{ width: 400, height: 400 }}></div>
  );
};
