import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  checkXeroConnection,
  initiateXeroAuth,
  getXeroCustomers,
  disconnectXero,
} from "@/services/xero";
import {
  BarChart3,
  Home,
  Settings,
  User,
  FileText,
  LogOut,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Users,
  Loader2,
  Unlink,
} from "lucide-react";

const Dashboard = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [xeroConnected, setXeroConnected] = useState(false);
  const [xeroLoading, setXeroLoading] = useState(true);
  const [xeroCustomers, setXeroCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [disconnectingXero, setDisconnectingXero] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth/login");
    }
  }, [user, isLoading, navigate]);

  // Check Xero connection and load customers if connected
  useEffect(() => {
    const checkXero = async () => {
      if (!user) return;

      try {
        setXeroLoading(true);
        const { connected } = await checkXeroConnection();
        setXeroConnected(connected);

        if (connected) {
          setIsLoadingCustomers(true);
          try {
            const customersData = await getXeroCustomers();
            if (customersData && customersData.Contacts) {
              setXeroCustomers(customersData.Contacts);
            }
          } catch (error) {
            console.error("Error fetching Xero customers:", error);
          } finally {
            setIsLoadingCustomers(false);
          }
        }
      } catch (error) {
        console.error("Error checking Xero connection:", error);
      } finally {
        setXeroLoading(false);
      }
    };

    checkXero();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleConnectXero = async () => {
    try {
      const { authUrl } = await initiateXeroAuth();
      if (authUrl) {
        // Redirect to Xero authorization page
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error("Error connecting to Xero:", error);
    }
  };

  const handleDisconnectXero = async () => {
    try {
      setDisconnectingXero(true);
      await disconnectXero();
      setXeroConnected(false);
      setXeroCustomers([]);
    } catch (error) {
      console.error("Error disconnecting from Xero:", error);
    } finally {
      setDisconnectingXero(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-200">
        <div className="flex h-14 items-center px-4 border-b border-gray-200">
          <a href="/" className="flex items-center">
            <img
              src="/images/logo.jpg"
              alt="beanie.ai"
              className="h-8 w-auto"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/120x40/f8fafc/475569?text=beanie.ai";
              }}
            />
          </a>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            <li>
              <a
                href="/dashboard"
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium bg-gray-100 text-gray-900"
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="/dashboard/reports"
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <BarChart3 className="mr-3 h-5 w-5" />
                Reports
              </a>
            </li>
            <li>
              <a
                href="/dashboard/documents"
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <FileText className="mr-3 h-5 w-5" />
                Documents
              </a>
            </li>
            <li>
              <a
                href="/dashboard/settings"
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
        {/* Top Navigation */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
          {/* Mobile Menu Button + Logo */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mr-3 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
            <a href="/" className="flex items-center md:hidden">
              <img
                src="/images/logo.jpg"
                alt="beanie.ai"
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/120x40/f8fafc/475569?text=beanie.ai";
                }}
              />
            </a>
          </div>

          {/* Page Title - Desktop */}
          <h1 className="hidden md:block text-lg font-semibold">Dashboard</h1>

          {/* Spacer for mobile */}
          <div className="md:hidden"></div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="relative h-8 w-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <User size={16} className="text-gray-600" />
                )}
              </div>
              <span className="hidden md:block font-medium">
                {user?.name || user?.email}
              </span>
              <ChevronDown size={16} className="ml-2" />
            </Button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <a
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User size={16} className="mr-3" />
                  Profile
                </a>
                <a
                  href="/dashboard/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings size={16} className="mr-3" />
                  Settings
                </a>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut size={16} className="mr-3" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-gray-200 bg-white">
            <nav className="px-4 py-2">
              <ul className="space-y-1">
                <li>
                  <a
                    href="/dashboard"
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium bg-gray-100 text-gray-900"
                  >
                    <Home className="mr-3 h-5 w-5" />
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/reports"
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <BarChart3 className="mr-3 h-5 w-5" />
                    Reports
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/documents"
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <FileText className="mr-3 h-5 w-5" />
                    Documents
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/settings"
                    className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Welcome, {user?.name || "User"}!
              </h2>
              <p className="text-gray-600 mb-4">
                This is your Beanie dashboard where you can manage your
                financial data and reporting.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-all duration-200">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                    <FileText size={18} className="mr-2 text-blue-600" />
                    Recent Reports
                  </h3>
                  <p className="text-blue-600 text-sm">
                    No reports created yet. Create your first report!
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full text-blue-700 border-blue-200 hover:bg-blue-100"
                  >
                    <FileText size={16} className="mr-2" />
                    Create Report
                  </Button>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100 hover:shadow-md transition-all duration-200">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-green-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M19.2 4.8H4.8C3.26 4.8 2 6.06 2 7.6V16.4C2 17.94 3.26 19.2 4.8 19.2H19.2C20.74 19.2 22 17.94 22 16.4V7.6C22 6.06 20.74 4.8 19.2 4.8Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 12m-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Data Sources
                  </h3>
                  {xeroLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-600"></div>
                      <span className="ml-2 text-green-600 text-sm">
                        Checking connection...
                      </span>
                    </div>
                  ) : xeroConnected ? (
                    <div>
                      <p className="text-green-600 text-sm flex items-center">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Connected to Xero
                      </p>
                      <div className="flex flex-col space-y-2 mt-3">
                        <Button
                          variant="outline"
                          className="w-full text-green-700 border-green-200 hover:bg-green-100"
                          onClick={() => navigate("/dashboard/reports")}
                        >
                          <FileText size={16} className="mr-2" />
                          View Financial Reports
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full text-red-700 border-red-200 hover:bg-red-100"
                          onClick={handleDisconnectXero}
                          disabled={disconnectingXero}
                        >
                          {disconnectingXero ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Unlink size={16} className="mr-2" />
                          )}
                          {disconnectingXero
                            ? "Disconnecting..."
                            : "Disconnect Xero"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-green-600 text-sm">
                        Connect Xero to import your financial data.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-3 w-full text-green-700 border-green-200 hover:bg-green-100"
                        onClick={handleConnectXero}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19.2 4.8H4.8C3.26 4.8 2 6.06 2 7.6V16.4C2 17.94 3.26 19.2 4.8 19.2H19.2C20.74 19.2 22 17.94 22 16.4V7.6C22 6.06 20.74 4.8 19.2 4.8Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 12m-2.4 0a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0 -4.8 0"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Connect Xero
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100 hover:shadow-md transition-all duration-200">
                  <h3 className="font-medium text-purple-800 mb-2 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-purple-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 6V2M12 22v-4M6 12H2m20 0h-4m1.07-6.36L17 7.71m-10 8.58L5 18.29m12-10.58L19.07 5.64M5 5.64L7.07 7.71"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Insights
                  </h3>
                  <p className="text-purple-600 text-sm">
                    Get AI-powered insights about your finances.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full text-purple-700 border-purple-200 hover:bg-purple-100"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 6V2M12 22v-4M6 12H2m20 0h-4m1.07-6.36L17 7.71m-10 8.58L5 18.29m12-10.58L19.07 5.64M5 5.64L7.07 7.71"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Generate Insights
                  </Button>
                </div>
              </div>

              {/* Xero Customers Section - Only shown when connected to Xero */}
              {xeroConnected && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Your Xero Customers
                    </h2>
                  </div>

                  {isLoadingCustomers ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                      <span className="ml-2 text-gray-500">
                        Loading customers...
                      </span>
                    </div>
                  ) : xeroCustomers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {xeroCustomers.slice(0, 6).map((customer: any) => (
                        <Card
                          key={customer.ContactID}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center">
                              <Users className="h-5 w-5 mr-2 text-blue-600" />
                              {customer.Name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-500">
                              {customer.EmailAddress && (
                                <div className="mb-1">
                                  Email: {customer.EmailAddress}
                                </div>
                              )}
                              {customer.Phones &&
                                customer.Phones.length > 0 &&
                                customer.Phones[0].PhoneNumber && (
                                  <div className="mb-1">
                                    Phone: {customer.Phones[0].PhoneNumber}
                                  </div>
                                )}
                              {customer.Addresses &&
                                customer.Addresses.length > 0 && (
                                  <div className="mb-1">
                                    {customer.Addresses[0].City}
                                    {customer.Addresses[0].Region
                                      ? `, ${customer.Addresses[0].Region}`
                                      : ""}
                                  </div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-gray-50">
                      <CardContent className="flex flex-col items-center justify-center py-10">
                        <Users className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 text-center mb-2">
                          No customers found in your Xero account
                        </p>
                        <p className="text-gray-500 text-sm text-center">
                          Add customers in Xero to see them here
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
