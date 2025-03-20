import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          const errorMessage = searchParams.get("error");
          throw new Error(errorMessage || "Authentication failed");
        }

        // Store token
        localStorage.setItem("token", token);

        // Verify the token by making a request to the backend
        try {
          await api.get("/api/auth/me");
          // Redirect to dashboard
          navigate("/dashboard");
        } catch (verifyError) {
          console.error("Token verification failed:", verifyError);
          throw new Error("Authentication verification failed");
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Authentication failed");
      }
    };

    if (!isLoading) {
      handleCallback();
    }
  }, [searchParams, navigate, isLoading]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-sm mb-4">
            <p className="text-lg font-medium">Authentication Failed</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate("/auth/login")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-16 w-16 mb-4 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700">
            Completing authentication...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we log you in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
