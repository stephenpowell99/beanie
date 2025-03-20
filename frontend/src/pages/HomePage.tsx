import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Sparkles,
  BarChart3,
  LineChart,
  ArrowRight,
  FileText,
  Brain,
} from "lucide-react";

const HomePage = () => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 md:py-32 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                <Sparkles size={14} className="mr-1.5" />
                AI-Powered Financial Reporting
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
                Transform your Xero data into
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-orange-500">
                  {" "}
                  actionable insights
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
                Build custom financial dashboards and reports using simple
                conversational prompts — no coding or complex setup required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-6 rounded-lg text-lg font-medium"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <span className="flex items-center">
                    Get Started
                    <ArrowRight
                      size={18}
                      className={`ml-2 transition-transform duration-300 ${
                        isHovering ? "translate-x-1" : ""
                      }`}
                    />
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-6 rounded-lg text-lg font-medium"
                >
                  See Demos
                </Button>
              </div>
            </div>
            <div className="flex-1 mt-8 md:mt-0">
              <div className="relative bg-white p-1 rounded-xl shadow-2xl border border-gray-200">
                <div className="absolute -top-3 -left-3 w-24 h-2 bg-blue-500 rounded-full"></div>
                <div className="absolute -top-3 left-20 w-16 h-2 bg-orange-500 rounded-full"></div>
                <div className="absolute -top-3 left-36 w-8 h-2 bg-blue-300 rounded-full"></div>
                <img
                  src="/dashboard-preview.svg"
                  alt="AI Dashboard Preview"
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/600x400/f8fafc/475569?text=AI+Dashboard+Preview";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Simplify Financial Reporting with AI
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Connect your Xero account and start building powerful dashboards
              with natural language prompts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <Brain className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                AI-Powered Prompts
              </h3>
              <p className="text-gray-600">
                Simply describe what you want to see, and our AI will build the
                perfect dashboard for your needs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-5">
                <BarChart3 className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Custom Dashboards
              </h3>
              <p className="text-gray-600">
                Create tailored financial dashboards that answer your specific
                business questions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 transition-all duration-300 hover:shadow-md">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-5">
                <FileText className="text-blue-600" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Seamless Xero Integration
              </h3>
              <p className="text-gray-600">
                Connect securely to your Xero account with just a few clicks. No
                complex setup required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Get from raw data to actionable insights in minutes, not days
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-gray-700/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Connect Your Xero Account
              </h3>
              <p className="text-gray-300">
                Authorize access to your Xero data with our secure OAuth
                integration. Your credentials are never stored.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-700/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Describe What You Need
              </h3>
              <p className="text-gray-300">
                Use natural language to describe the financial reports or
                visualizations you want to create.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-700/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Get Instant Insights
              </h3>
              <p className="text-gray-300">
                Our AI builds your custom dashboard in seconds. Refine with
                follow-up prompts or save for future reference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-12 relative overflow-hidden border border-gray-200">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-bl from-blue-500/10 to-orange-500/10 backdrop-blur-sm"></div>

            <div className="max-w-2xl relative">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Ready to transform your financial reporting?
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Join hundreds of businesses using beanie.ai to build better
                financial dashboards and make data-driven decisions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-6 rounded-lg text-lg font-medium">
                  Start Free Trial
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-6 rounded-lg text-lg font-medium"
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 bg-gray-100 mt-auto">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img
                src="/beanie-logo.svg"
                alt="beanie.ai logo"
                className="h-8 w-auto mr-3"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://placehold.co/120x40/f8fafc/475569?text=beanie.ai";
                }}
              />
              <span className="text-gray-600 text-sm">
                © 2023 beanie.ai All rights reserved.
              </span>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Privacy
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Terms
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
