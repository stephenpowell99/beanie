import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getXeroMonthlyFinancials } from "@/services/xero";
import { Loader2, DollarSign } from "lucide-react";

// Add this to silence TypeScript errors for ApexCharts
declare global {
  interface Window {
    ApexCharts: any;
  }
}

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

  // Use proper useRef hooks instead of useState for DOM references
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<any>(null);

  // Clean up chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getXeroMonthlyFinancials();
        console.log("Received financial data:", data);

        if (!data || typeof data !== "object") {
          console.error("Invalid data format received:", data);
          setError("Invalid data format received from API");
          setLoading(false);
          return;
        }

        // Check if we have valid data
        if (
          !data.months ||
          !data.revenue ||
          !data.expenses ||
          !data.grossProfit
        ) {
          console.error("Missing required data properties:", data);
          setError("Incomplete financial data received");
          setLoading(false);
          return;
        }

        if (data.months.length === 0) {
          console.log("No financial data available");
          setError("No financial data available");
          setLoading(false);
          return;
        }

        setFinancialData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        setError("Failed to load financial data from Xero.");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Initialize chart after data is loaded
  useEffect(() => {
    if (
      !loading &&
      financialData &&
      chartRef.current &&
      typeof window !== "undefined" &&
      window.ApexCharts
    ) {
      console.log("Initializing chart with data:", financialData);

      // Define chart options
      const options = {
        chart: {
          type: "bar",
          height: 400,
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
          categories: financialData.months,
          title: {
            text: "Month",
          },
        },
        yaxis: {
          title: {
            text: "Amount ($)",
          },
          labels: {
            formatter: function (value: any) {
              // Format large numbers with k, M, B suffixes
              if (value >= 1000000000)
                return (value / 1000000000).toFixed(1) + "B";
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
            formatter: function (val: any) {
              return (
                "$" +
                val.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              );
            },
          },
        },
        legend: {
          position: "top",
        },
        colors: ["#4ade80", "#f87171", "#60a5fa"], // green, red, blue
        series: [
          {
            name: "Revenue",
            data: financialData.revenue,
          },
          {
            name: "Expenses",
            data: financialData.expenses,
          },
          {
            name: "Gross Profit",
            data: financialData.grossProfit,
          },
        ],
      };

      // Destroy existing chart if any
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Create new chart
      try {
        chartInstance.current = new window.ApexCharts(
          chartRef.current,
          options
        );
        chartInstance.current.render();
      } catch (error) {
        console.error("Error rendering ApexCharts:", error);
        setError("Failed to render chart");
      }
    }
  }, [loading, financialData]);

  if (loading) {
    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Monthly Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">
              Loading financial data...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Monthly Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!financialData || financialData.months.length === 0) {
    return (
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Monthly Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-gray-500">
            No financial data available. Make sure you have transactions in your
            Xero account.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Monthly Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={chartRef}
          className="w-full"
          style={{ height: "400px" }}
        ></div>
      </CardContent>
    </Card>
  );
};

export default XeroFinancialChart;
