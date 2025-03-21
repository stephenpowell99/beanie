import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getXeroMonthlyFinancials } from "@/services/xero";
import { Loader2, DollarSign } from "lucide-react";

// Lazy load ApexCharts component
const ReactApexChart = lazy(() => import("react-apexcharts"));

interface MonthlyFinancials {
  months: string[];
  revenue: number[];
  expenses: number[];
  grossProfit: number[];
}

const XeroFinancialChart = () => {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<MonthlyFinancials | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        const data = await getXeroMonthlyFinancials();
        setFinancialData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching financial data:", err);
        setError("Failed to load financial data from Xero.");
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const chartOptions = {
    chart: {
      type: "bar" as const,
      height: 350,
      stacked: false,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: financialData?.months || [],
      title: {
        text: "Month",
      },
    },
    yaxis: {
      title: {
        text: "Amount ($)",
      },
      labels: {
        formatter: (value: number) => {
          // Format large numbers with k, M, B suffixes
          if (value >= 1000000000) return (value / 1000000000).toFixed(1) + "B";
          if (value >= 1000000) return (value / 1000000).toFixed(1) + "M";
          if (value >= 1000) return (value / 1000).toFixed(1) + "k";
          return value.toFixed(0);
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => {
          return `$${val.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        },
      },
    },
    legend: {
      position: "top" as const,
    },
    colors: ["#4ade80", "#f87171", "#60a5fa"], // green, red, blue
  };

  const chartSeries = [
    {
      name: "Revenue",
      data: financialData?.revenue || [],
    },
    {
      name: "Expenses",
      data: financialData?.expenses || [],
    },
    {
      name: "Gross Profit",
      data: financialData?.grossProfit || [],
    },
  ];

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Monthly Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">
              Loading financial data...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : financialData && financialData.months.length > 0 ? (
          <div className="w-full" style={{ height: "400px" }}>
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Loading chart...</span>
                </div>
              }
            >
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={400}
              />
            </Suspense>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            No financial data available. Make sure you have transactions in your
            Xero account.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default XeroFinancialChart;
