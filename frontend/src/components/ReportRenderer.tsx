import React, { useState, useEffect } from "react";
import { runReport, ReportResult } from "../services/ai.service";
import ApexCharts from "react-apexcharts";
import ErrorBoundary from "./ErrorBoundary";

interface ReportRendererProps {
  reportId: number;
}

interface ComponentProps {
  data: any[];
  metadata: Record<string, any>;
  React: typeof React;
  ReactApexChart: typeof ApexCharts;
}

const ReportRenderer: React.FC<ReportRendererProps> = ({ reportId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResult | null>(null);
  const [DynamicComponent, setDynamicComponent] =
    useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);

        // Run the report on the backend
        const response = await runReport(reportId);
        setReportData(response);

        // Create a wrapper component that provides the necessary dependencies
        const createComponent = () => {
          // First, create the function that will return our component's render logic
          const code = `
            return function(props) {
              const { data, metadata, React, ReactApexChart } = props;
              ${response.renderCode}
              return ReportComponent({ data, metadata });
            }
          `;

          // Create the component function
          // eslint-disable-next-line no-new-func
          const componentFn = new Function("React", "ReactApexChart", code);

          // Return a wrapper component that provides the dependencies
          return function WrappedReportComponent(props: ComponentProps) {
            return componentFn(
              React,
              ApexCharts
            )({
              ...props,
              React: {
                ...React,
                useState: React.useState,
                useEffect: React.useEffect,
                useRef: React.useRef,
                useMemo: React.useMemo,
                useCallback: React.useCallback,
                createElement: React.createElement,
                Fragment: React.Fragment,
              },
            });
          };
        };

        try {
          const Component = createComponent();
          setDynamicComponent(() => Component);
        } catch (componentError: any) {
          console.error("Error creating component:", componentError);
          setError(`Failed to render report: ${componentError.message}`);
        }
      } catch (err: any) {
        console.error("Error loading report:", err);
        setError(err.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  if (loading) return <div className="p-4">Loading report...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!reportData) return <div className="p-4">No report data available</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-2">{reportData.name}</h2>
      <p className="text-gray-600 mb-4">{reportData.description}</p>

      <div className="bg-white p-4 rounded-lg">
        {DynamicComponent ? (
          <ErrorBoundary>
            <DynamicComponent
              data={reportData.data}
              metadata={reportData.metadata}
              React={React}
              ReactApexChart={ApexCharts}
            />
          </ErrorBoundary>
        ) : (
          <div className="text-red-500">Failed to create report component</div>
        )}
      </div>
    </div>
  );
};

export default ReportRenderer;
