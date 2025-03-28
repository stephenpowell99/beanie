import React, { useState, useEffect } from "react";
import {
  Report,
  getReportById,
  deleteReport,
  modifyReport,
  NeedsMoreInfoResponse,
  askQuestionAboutReport,
  AskQuestionResponse,
  saveReportCode,
  runReport,
} from "../services/ai.service";
import ReportRenderer from "./ReportRenderer";
import { Copy, Check, Save, Maximize, Minimize } from "lucide-react";

interface ReportViewerProps {
  reportId: number;
  userId: number;
  onClose: () => void;
  onDelete: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

// Define type for active tab
type ActiveTab = "ask" | "modify";

const ReportViewer: React.FC<ReportViewerProps> = ({
  reportId,
  userId,
  onClose,
  onDelete,
}) => {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<
    "originalQuery" | "apiCode" | "renderCode"
  >("originalQuery");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportData, setReportData] = useState<any | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // State for modifications
  const [modificationRequest, setModificationRequest] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [modificationError, setModificationError] = useState<string | null>(
    null
  );
  const [modificationNeedsInfo, setModificationNeedsInfo] = useState<
    string[] | null
  >(null);
  const [selectedModel, setSelectedModel] = useState<"gemini" | "claude">(
    "gemini"
  );

  // State for asking questions
  const [questionText, setQuestionText] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // State for active tab in the right panel
  const [activeTab, setActiveTab] = useState<ActiveTab>("ask"); // Default to 'ask'

  const [copyFeedback, setCopyFeedback] = useState<{
    originalQuery?: boolean;
    apiCode?: boolean;
    renderCode?: boolean;
  }>({});

  const [isEditing, setIsEditing] = useState<{
    apiCode: boolean;
    renderCode: boolean;
  }>({
    apiCode: false,
    renderCode: false,
  });
  const [editedCode, setEditedCode] = useState<{
    apiCode: string;
    renderCode: string;
  }>({
    apiCode: "",
    renderCode: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [fullscreenPanel, setFullscreenPanel] = useState<{
    type: "apiCode" | "renderCode" | null;
    content: string;
  }>({
    type: null,
    content: "",
  });

  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true); // Ensure loading state is true at the start
        setError(null);
        setReportData(null); // Clear previous data
        setExecutionError(null);
        const data = await getReportById(reportId);
        setReport(data);
        // Automatically execute the report after loading
        await executeReport();
      } catch (err) {
        setError("Failed to load or execute report");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportId]);

  useEffect(() => {
    if (report) {
      setEditedCode({
        apiCode: report.apiCode,
        renderCode: report.renderCode,
      });
    }
  }, [report]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await deleteReport(reportId, userId);
        onDelete();
      } catch (err) {
        console.error("Failed to delete report:", err);
        setError("Failed to delete report");
      }
    }
  };

  const executeReport = async () => {
    try {
      setIsExecuting(true);
      setExecutionError(null);
      setShowCode(false);

      // Run the report using the service
      const result = await runReport(reportId);
      setReportData(result);
    } catch (err: any) {
      console.error("Error executing report:", err);
      setExecutionError(err.message || "Failed to execute report");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleModifyReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modificationRequest.trim() || isModifying || !report) return;

    setIsModifying(true);
    setModificationError(null);
    setModificationNeedsInfo(null);
    setExecutionError(null); // Clear previous execution errors
    setReportData(null);

    try {
      const response = await modifyReport(
        report.id,
        modificationRequest,
        userId,
        selectedModel
      );

      if ("needsMoreInfo" in response && response.needsMoreInfo) {
        // Handle AI needing more info for modification
        setModificationNeedsInfo(response.requiredInfo);
        setModificationError(
          response.description ||
            "More information needed to modify the report."
        );
      } else {
        // Modification successful, update the report state
        setReport(response as Report);
        setModificationRequest(""); // Clear input field
        setShowCode(true); // Optionally show the updated code
        console.log("Report modified successfully:", response);
        // Clear report data as the code has changed
        setReportData(null);
        setExecutionError(null);
        // Automatically execute the report after successful modification
        await executeReport();
      }
    } catch (err: any) {
      console.error("Error modifying report:", err);
      setModificationError(err.message || "Failed to modify report");
    } finally {
      setIsModifying(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || isAsking || !report) return;

    setIsAsking(true);
    setQuestionError(null);
    setAnswer(null);
    setShowAnswer(false);

    try {
      const response = await askQuestionAboutReport(
        report.id,
        questionText,
        userId
      );
      setAnswer(response.answer);
      setShowAnswer(true);
      setQuestionText("");
    } catch (err: any) {
      console.error("Error asking question:", err);
      setQuestionError(err.message || "Failed to get answer");
      setShowAnswer(false);
    } finally {
      setIsAsking(false);
    }
  };

  const copyToClipboard = async (
    text: string,
    type: "originalQuery" | "apiCode" | "renderCode"
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback({ [type]: true });
      setTimeout(() => setCopyFeedback({ [type]: false }), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleSaveCode = async (type: "apiCode" | "renderCode") => {
    if (!report) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const updatedReport = await saveReportCode(
        report.id,
        type === "apiCode" ? editedCode.apiCode : report.apiCode,
        type === "renderCode" ? editedCode.renderCode : report.renderCode,
        userId
      );

      setReport(updatedReport);
      setIsEditing({ ...isEditing, [type]: false });
      setReportData(null); // Clear report data to trigger re-render
      await executeReport(); // Re-run the report with new code
    } catch (err: any) {
      setSaveError(err.message || "Failed to save code changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-lg">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 mb-4">{error || "Report not found"}</div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    // Main container with two columns
    <div className="flex h-full overflow-hidden">
      {/* Left Column: Report Details, Code, Output */}
      <div className="flex-1 flex flex-col overflow-hidden border-r">
        {" "}
        {/* Added border */}
        {/* Header Section */}
        <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold">{report!.name}</h2>
            {report!.description && (
              <p className="text-sm text-gray-500">{report!.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCode(!showCode)}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              {showCode ? "Hide Code" : "View Code"}
            </button>
            <button
              onClick={executeReport}
              disabled={isExecuting || isModifying} // Disable run when modifying too
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:bg-green-300 disabled:opacity-70"
            >
              {isExecuting ? "Running..." : "Run Report"}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              Close
            </button>
          </div>
        </div>
        {/* Code View Section (Stays in left column) */}
        {showCode && (
          <div className="p-4 border-b bg-gray-50 overflow-y-auto max-h-96">
            {/* Tab Navigation */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveCodeTab("originalQuery")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeCodeTab === "originalQuery"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Original Query
              </button>
              <button
                onClick={() => setActiveCodeTab("apiCode")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeCodeTab === "apiCode"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                API Code
              </button>
              <button
                onClick={() => setActiveCodeTab("renderCode")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeCodeTab === "renderCode"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Render Code
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {/* Original Query Tab */}
              {activeCodeTab === "originalQuery" && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Original Query
                    </h3>
                    <button
                      onClick={() =>
                        copyToClipboard(report.query, "originalQuery")
                      }
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy query"
                    >
                      {copyFeedback.originalQuery ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
                    {report.query}
                  </pre>
                </div>
              )}

              {/* API Code Tab */}
              {activeCodeTab === "apiCode" && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      API Code
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setFullscreenPanel({
                            type: "apiCode",
                            content: isEditing.apiCode
                              ? editedCode.apiCode
                              : report.apiCode,
                          })
                        }
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="h-4 w-4 text-gray-500" />
                      </button>
                      {isEditing.apiCode ? (
                        <button
                          onClick={() => handleSaveCode("apiCode")}
                          disabled={isSaving}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4 text-green-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setIsEditing({ ...isEditing, apiCode: true })
                          }
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Edit code"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-500"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() =>
                          copyToClipboard(report.apiCode, "apiCode")
                        }
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Copy API code"
                      >
                        {copyFeedback.apiCode ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  {isEditing.apiCode ? (
                    <textarea
                      value={editedCode.apiCode}
                      onChange={(e) =>
                        setEditedCode({
                          ...editedCode,
                          apiCode: e.target.value,
                        })
                      }
                      className="w-full h-48 p-3 bg-white rounded border text-sm font-mono"
                    />
                  ) : (
                    <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
                      {report.apiCode}
                    </pre>
                  )}
                </div>
              )}

              {/* Render Code Tab */}
              {activeCodeTab === "renderCode" && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      Render Code
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setFullscreenPanel({
                            type: "renderCode",
                            content: isEditing.renderCode
                              ? editedCode.renderCode
                              : report.renderCode,
                          })
                        }
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize className="h-4 w-4 text-gray-500" />
                      </button>
                      {isEditing.renderCode ? (
                        <button
                          onClick={() => handleSaveCode("renderCode")}
                          disabled={isSaving}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4 text-green-500" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setIsEditing({ ...isEditing, renderCode: true })
                          }
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Edit code"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-500"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() =>
                          copyToClipboard(report.renderCode, "renderCode")
                        }
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Copy render code"
                      >
                        {copyFeedback.renderCode ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  {isEditing.renderCode ? (
                    <textarea
                      value={editedCode.renderCode}
                      onChange={(e) =>
                        setEditedCode({
                          ...editedCode,
                          renderCode: e.target.value,
                        })
                      }
                      className="w-full h-48 p-3 bg-white rounded border text-sm font-mono"
                    />
                  ) : (
                    <pre className="bg-white p-3 rounded border text-sm overflow-x-auto">
                      {report.renderCode}
                    </pre>
                  )}
                </div>
              )}

              {saveError && (
                <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {saveError}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Report Output/Execution Section (Stays in left column) */}
        <div className="flex-1 p-4 overflow-auto relative">
          {" "}
          {/* Added relative positioning */}
          {/* Spinner overlay during modification */}
          {isModifying && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10">
              <div className="text-lg font-semibold text-blue-600">
                Generating updated report...
              </div>
              {/* You could add a spinner SVG here */}
            </div>
          )}
          {/* Existing content */}
          {executionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error</p>
              <p>{executionError}</p>
            </div>
          )}
          {isExecuting &&
            !isModifying && ( // Don't show if modifying
              <div className="flex justify-center items-center h-full">
                <div className="text-lg">Executing report...</div>
              </div>
            )}
          {reportData &&
            !isExecuting &&
            !isModifying && ( // Don't show if modifying
              <div className="mt-6 bg-white rounded-lg p-4 border">
                <h3 className="text-lg font-semibold mb-4">Report Output</h3>
                <ReportRenderer reportId={report!.id} />
              </div>
            )}
          {!reportData &&
            !isExecuting &&
            !isModifying && ( // Don't show if modifying
              <div className="flex justify-center items-center h-full text-gray-500">
                <div className="text-center">
                  <p className="mb-4">
                    Click "Run Report" to execute this report and see the
                    results
                  </p>
                  <button
                    onClick={executeReport}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Run Report
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Right Column: Tabs for Ask/Modify */}
      <div className="w-1/3 min-w-[350px] max-w-[500px] flex flex-col border-l overflow-hidden bg-gray-50">
        {" "}
        {/* Adjust width as needed */}
        {/* Tab Buttons */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("ask")}
            className={`flex-1 p-3 text-center font-medium ${
              activeTab === "ask"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Ask Question
          </button>
          <button
            onClick={() => setActiveTab("modify")}
            className={`flex-1 p-3 text-center font-medium ${
              activeTab === "modify"
                ? "bg-white text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            Request Changes
          </button>
        </div>
        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Ask Question Tab Content */}
          {activeTab === "ask" && report && (
            <div>
              {/* Moved Ask Question content here */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold">Ask About This Report</h3>
                {answer && (
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {showAnswer ? "Hide Answer" : "Show Answer"}
                  </button>
                )}
              </div>
              {questionError && (
                <div className="mb-4 p-3 rounded bg-red-100 border border-red-400 text-red-700">
                  ...
                </div>
              )}
              {answer && showAnswer && (
                <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-blue-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {answer}
                </div>
              )}
              {isAsking && (
                <div className="mb-4 text-gray-600">Asking Gemini...</div>
              )}
              <form onSubmit={handleAskQuestion}>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="e.g., How is 'total revenue' calculated?"
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isAsking}
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !questionText.trim()}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAsking ? "Asking..." : "Ask"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modify Report Tab Content */}
          {activeTab === "modify" && report && (
            <div>
              <h3 className="text-md font-semibold mb-2">Request Changes</h3>
              {modificationError && (
                <div
                  className={`mb-4 p-3 rounded ${
                    modificationNeedsInfo
                      ? "bg-yellow-100 border border-yellow-400 text-yellow-700"
                      : "bg-red-100 border border-red-400 text-red-700"
                  }`}
                >
                  {modificationError}
                  {modificationNeedsInfo && (
                    <ul className="mt-2 list-disc list-inside">
                      {modificationNeedsInfo.map((info, index) => (
                        <li key={index}>{info}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <form onSubmit={handleModifyReport}>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">
                      AI Model:
                    </label>
                    <select
                      value={selectedModel}
                      onChange={(e) =>
                        setSelectedModel(e.target.value as "gemini" | "claude")
                      }
                      className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      disabled={isModifying}
                    >
                      <option value="gemini">Gemini</option>
                      <option value="claude">Claude</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={modificationRequest}
                      onChange={(e) => setModificationRequest(e.target.value)}
                      placeholder="e.g., Change to a bar chart"
                      className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isModifying}
                    />
                    <button
                      type="submit"
                      disabled={isModifying || !modificationRequest.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isModifying ? "Modifying..." : "Request"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportViewer;
