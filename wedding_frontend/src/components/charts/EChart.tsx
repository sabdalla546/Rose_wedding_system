import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import type { EChartsOption } from "echarts";

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

type EChartProps = {
  option: EChartsOption;
  height?: number | string;
  className?: string;
};

export function EChart({ option, height = 320, className }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current);
    chart.setOption(option);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    resizeObserver.observe(containerRef.current);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [option]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height }}
    />
  );
}
