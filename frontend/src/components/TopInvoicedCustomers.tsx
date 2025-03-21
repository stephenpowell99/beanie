import { useState, useEffect } from "react";
import { getTopInvoicedCustomers } from "@/services/xero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Loader2 } from "lucide-react";
import { formatter } from "@/lib/utils";

interface TopCustomer {
  contactID: string;
  name: string;
  email?: string;
  phone?: string;
  totalAmount: number;
  invoiceCount: number;
}

const TopInvoicedCustomers = () => {
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTopInvoicedCustomers();
        setTopCustomers(data.customers || []);
      } catch (err) {
        console.error("Error fetching top customers:", err);
        setError("Failed to load top customers data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopCustomers();
  }, []);

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Top Invoiced Customers
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading customer data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Top Invoiced Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (topCustomers.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Top Invoiced Customers
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center mb-2">
            No invoice data found for your customers
          </p>
          <p className="text-gray-500 text-sm text-center">
            Create invoices in Xero to see your top customers here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-green-600" />
          Top Invoiced Customers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                  Customer
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                  Invoices
                </th>
                <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((customer) => (
                <tr
                  key={customer.contactID}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="py-3 px-2">
                    <div className="font-medium">{customer.name}</div>
                    {customer.email && (
                      <div className="text-sm text-gray-500">
                        {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {customer.invoiceCount}
                  </td>
                  <td className="py-3 px-2 text-right font-medium">
                    {formatter.format(customer.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopInvoicedCustomers;
