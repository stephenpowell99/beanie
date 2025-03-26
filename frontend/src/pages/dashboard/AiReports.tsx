import React, { useState, useEffect } from "react";
import { getUserReports } from "../../services/ai.service";
import AiChat from "../../components/AiChat";
import ReportViewer from "../../components/ReportViewer";

interface AiReportsProps {
  userId: number;
}

const AiReports: React.FC<AiReportsProps> = ({ userId }) => {
  const [reportIds, setReportIds] = useState<number[]>([]);
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Load user's reports
    const loadReports = async () => {
      try {
        const reports = await getUserReports(userId);
        setReportIds(reports.map((report) => report.id));
      } catch (error) {
        console.error("Error loading reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadReports();
    }
  }, [userId]);

  const handleReportGenerated = (reportId: number) => {
    setReportIds((prev) => [reportId, ...prev]);
    setActiveReportId(reportId);
    setShowChat(false);
  };

  const handleReportDeleted = () => {
    // Refresh reports after deletion
    setActiveReportId(null);
    getUserReports(userId)
      .then((reports) => setReportIds(reports.map((report) => report.id)))
      .catch((error) => console.error("Error refreshing reports:", error));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Dashboard Reports</h1>
        <button
          onClick={() => {
            setActiveReportId(null);
            setShowChat(!showChat);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showChat ? "Hide Chat" : "Create New Report"}
        </button>
      </div>

      {showChat && (
        <div className="mb-6 h-96">
          <AiChat userId={userId} onReportGenerated={handleReportGenerated} />
        </div>
      )}

      {activeReportId && (
        <div className="mb-6 h-[calc(100vh-200px)]">
          <ReportViewer
            reportId={activeReportId}
            userId={userId}
            onClose={() => setActiveReportId(null)}
            onDelete={handleReportDeleted}
          />
        </div>
      )}

      {!showChat && !activeReportId && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Your Reports</h2>
          </div>
          <div className="p-4">
            {isLoading ? (
              <p className="text-center py-8">Loading reports...</p>
            ) : reportIds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  You don't have any reports yet
                </p>
                <button
                  onClick={() => setShowChat(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Your First Report
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportIds.map((id) => (
                  <ReportCard
                    key={id}
                    reportId={id}
                    onClick={() => setActiveReportId(id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ReportCardProps {
  reportId: number;
  onClick: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ reportId, onClick }) => {
  const [report, setReport] = useState<{
    name: string;
    description: string | null;
  } | null>(null);

  useEffect(() => {
    // This would normally fetch just the report metadata but we'll reuse our existing service
    import("../../services/ai.service").then(({ getReportById }) => {
      getReportById(reportId)
        .then((reportData) => {
          setReport({
            name: reportData.name,
            description: reportData.description,
          });
        })
        .catch((error) =>
          console.error("Error loading report metadata:", error)
        );
    });
  }, [reportId]);

  if (!report) {
    return (
      <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <h3 className="font-semibold text-lg mb-1">{report.name}</h3>
      {report.description && (
        <p className="text-gray-600 text-sm truncate">{report.description}</p>
      )}
      <div className="mt-2 flex justify-end">
        <span className="text-xs text-blue-500">Click to view</span>
      </div>
    </div>
  );
};

export default AiReports;
