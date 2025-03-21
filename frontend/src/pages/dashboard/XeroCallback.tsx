import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/services/api";

const XeroCallback = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Processing Xero authorization...");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's an error in the URL
        const searchParams = new URLSearchParams(location.search);
        const error = searchParams.get("error");

        if (error) {
          setStatus("error");
          setMessage(`Authorization failed: ${error}`);
          return;
        }

        // The backend will handle the token exchange
        // We don't need to do anything here as the backend already processed the callback
        // when it redirected to this page

        setStatus("success");
        setMessage("Xero connected successfully! Redirecting to dashboard...");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("Error handling Xero callback:", error);
        setStatus("error");
        setMessage("Failed to connect to Xero. Please try again.");
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="text-center">
          {status === "loading" && (
            <div className="mb-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          )}

          {status === "success" && (
            <div className="mb-4 rounded-full h-12 w-12 bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <svg
                className="h-6 w-6"
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
            </div>
          )}

          {status === "error" && (
            <div className="mb-4 rounded-full h-12 w-12 bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          <h2
            className={`text-xl font-semibold ${
              status === "error"
                ? "text-red-600"
                : status === "success"
                ? "text-green-600"
                : "text-gray-800"
            }`}
          >
            {status === "loading"
              ? "Connecting to Xero"
              : status === "success"
              ? "Connection Successful"
              : "Connection Failed"}
          </h2>

          <p className="mt-2 text-gray-600">{message}</p>

          {status === "error" && (
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default XeroCallback;
