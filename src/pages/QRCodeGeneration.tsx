import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@/api/apiClient";
import {
  generateTableQr,
  getTableQrCodes,
  getTableQrImageUrl,
  getTables,
} from "@/services/tableService";
import type { TableQrCodeRecord } from "@/types/admin";

// ── icons (inline SVGs to avoid extra deps) ──────────────────────────────────
const QrIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── area filter options ────────────────────────────────────────────────────────
const AREA_OPTIONS = [
  { value: "all", label: "All Areas" },
  { value: "main_hall", label: "Main Hall" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "vip", label: "VIP" },
  { value: "bar_area", label: "Bar Area" },
  { value: "terrace", label: "Terrace" },
];

const normalizeAreaKey = (value?: string | null) => {
  const normalized = (value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "bar") {
    return "bar_area";
  }

  return normalized;
};

// ── helper: get display label for a record ───────────────────────────────────
const getTableLabel = (record: TableQrCodeRecord): string => {
  if (record.table_name) {
    return String(record.table_name);
  }

  const tableNumber = String(record.table_number ?? "").trim();
  if (tableNumber) {
    return !isNaN(Number(tableNumber))
      ? `T-${tableNumber.padStart(2, "0")}`
      : tableNumber;
  }

  return `T-${record.table_id}`;
};

export default function QRCodeGeneration() {
  const [records, setRecords] = useState<TableQrCodeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState("all");
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectAll, setSelectAll] = useState(false);
  const [previewTableId, setPreviewTableId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedQrs, setGeneratedQrs] = useState<
    Record<number, TableQrCodeRecord>
  >({});

  const loadQrCodes = async () => {
    setLoading(true);
    try {
      const [qrResponse, tableResponse] = await Promise.all([
        getTableQrCodes(),
        getTables(),
      ]);
      const tableAreas = new Map(
        tableResponse.tables.map((table) => [table.table_id, table.area_type]),
      );

      setRecords(
        qrResponse.records.map((record) => ({
          ...record,
          area_type: record.area_type || tableAreas.get(record.table_id),
        })),
      );
    } catch (error) {
      toast.error("Failed to load QR codes", {
        description: parseApiError(error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQrCodes();
  }, []);

  const selectedAreaLabel =
    AREA_OPTIONS.find((area) => area.value === selectedArea)?.label ||
    "All Areas";

  const filteredRecords = useMemo(
    () =>
      selectedArea === "all"
        ? records
        : records.filter(
            (record) => normalizeAreaKey(record.area_type) === selectedArea,
          ),
    [records, selectedArea],
  );

  useEffect(() => {
    setSelectedTableIds((prev) => {
      const visibleIds = new Set(filteredRecords.map((record) => record.table_id));
      const next = new Set(
        Array.from(prev).filter((tableId) => visibleIds.has(tableId)),
      );

      if (
        next.size === prev.size &&
        Array.from(next).every((tableId) => prev.has(tableId))
      ) {
        return prev;
      }

      return next;
    });
    setSelectAll(
      filteredRecords.length > 0 &&
        filteredRecords.every((record) => selectedTableIds.has(record.table_id)),
    );
  }, [filteredRecords, selectedTableIds]);

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedTableIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedTableIds(new Set(filteredRecords.map((r) => r.table_id)));
      setSelectAll(true);
    }
  };

  const toggleTable = (tableId: number) => {
    setSelectedTableIds((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  const downloadQr = async (tableId: number, label?: string) => {
    try {
      const anchor = document.createElement("a");
      const dataUrl =
        generatedQrs[tableId]?.qr_code_data_url ||
        records.find((record) => record.table_id === tableId)?.qr_code_data_url;
      const objectUrl = dataUrl
        ? null
        : URL.createObjectURL(
            await (async () => {
              const response = await fetch(getTableQrImageUrl(tableId));
              if (!response.ok) throw new Error("Failed to fetch QR image.");
              return response.blob();
            })(),
          );

      anchor.href = dataUrl || objectUrl || "";
      anchor.download = `${label ?? `table-${tableId}`}-qr.png`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      toast.error("QR download failed", {
        description: parseApiError(error).message,
      });
    }
  };

  const handleGenerateAndPreview = async () => {
    if (selectedTableIds.size === 0) {
      toast.error("No tables selected", {
        description: "Please select at least one table.",
      });
      return;
    }
    setGenerating(true);
    try {
      const ids = Array.from(selectedTableIds);
      const generated = await Promise.all(ids.map((tableId) => generateTableQr(tableId)));
      setGeneratedQrs((prev) => ({
        ...prev,
        ...Object.fromEntries(
          generated.map(({ qr }) => [
            qr.table_id,
            {
              ...records.find((record) => record.table_id === qr.table_id),
              ...qr,
            },
          ]),
        ),
      }));
      setRecords((prev) =>
        prev.map((record) => {
          const generatedRecord = generated.find(
            ({ qr }) => qr.table_id === record.table_id,
          )?.qr;

          return generatedRecord ? { ...record, ...generatedRecord } : record;
        }),
      );
      const firstId = ids[0];
      setPreviewTableId(firstId);
      toast.success(`Generated QR for ${selectedTableIds.size} table(s)`);
    } catch (error) {
      toast.error("QR generation failed", {
        description: parseApiError(error).message,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className="flex flex-col max-h-[300] h-full"
      style={{
        backgroundColor: "#FFF8F6",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Breadcrumb ── */}
      <div className="px-6 pt-5 pb-1">
        <p
          style={{
            fontSize: 12,
            color: "#b85c00",
            letterSpacing: "0.08em",
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          SYSTEM / OPERATIONS
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#1a0a00",
            marginTop: 2,
          }}
        >
          Generate QR Codes
        </h1>
      </div>

      {/* ── Main card ── */}
      <div
        className="mx-6 mt-4 mb-6 flex-1"
        style={{ borderBottom: "2px solid #EA580C", backgroundColor: "#fff" }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 py-3">
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "#8F4D27",
              textTransform: "uppercase",
            }}
          >
            TABLE SELECTION
          </span>
          <button
            onClick={() => void loadQrCodes()}
            disabled={loading}
            className="flex items-center gap-1"
            style={{
              fontSize: 12,
              color: "#c85a00",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <RefreshIcon />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div
          className="max-w-305 mx-auto"
          style={{ borderBottom: "1px solid #f0d5c4" }}
        ></div>

        <div className="px-5 py-4 space-y-4">
          {/* ── Area Filter dropdown ── */}
          <div>
            <label
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#7a3a00",
                display: "block",
                marginBottom: 6,
              }}
            >
              Area Filter
            </label>
            <div className="relative">
              <button
                onClick={() => setAreaDropdownOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2"
                style={{
                  border: "1px solid #FDA77A",
                  borderRadius: 3,
                  backgroundColor: "#fff8f4",
                  fontSize: 14,
                  color: "#1a0a00",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{selectedAreaLabel}</span>
                <ChevronDownIcon />
              </button>
              {areaDropdownOpen && (
                <div
                  className="absolute z-10 w-full mt-1"
                  style={{
                    border: "1px solid #f0d5c4",
                    borderRadius: 3,
                    backgroundColor: "#fff",
                    boxShadow: "0 4px 12px rgba(200,90,0,0.1)",
                  }}
                >
                  {AREA_OPTIONS.map((area) => (
                    <button
                      key={area.value}
                      onClick={() => {
                        setSelectedArea(area.value);
                        setAreaDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2"
                      style={{
                        fontSize: 14,
                        color:
                          area.value === selectedArea ? "#c85a00" : "#1a0a00",
                        backgroundColor:
                          area.value === selectedArea
                            ? "#fff8f4"
                            : "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: area.value === selectedArea ? 600 : 400,
                      }}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Select All toggle ── */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              border: "1px solid #f5cbb0",
              borderLeft: "3px solid #F97316",
              backgroundColor: "#fff8f4",
              borderRadius: 2,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1a0a00" }}>
              Select All Tables ({filteredRecords.length})
            </span>
            {/* Toggle switch */}
            <button
              onClick={toggleSelectAll}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                backgroundColor: selectAll ? "#e85c00" : "#ddd",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background-color 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: selectAll ? 20 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>

          {/* ── Table grid ── */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div
                style={{
                  width: 28,
                  height: 28,
                  border: "3px solid #f0d5c4",
                  borderTopColor: "#e85c00",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10"
              style={{ color: "#c8a090", fontSize: 13 }}
            >
              <p style={{ fontWeight: 600 }}>No tables found</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Try refreshing or changing the area filter.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
              }}
            >
              {filteredRecords.map((record) => {
                const isSelected = selectedTableIds.has(record.table_id);
                const label = getTableLabel(record);
                return (
                  <button
                    key={record.table_id}
                    onClick={() => toggleTable(record.table_id)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 3,
                      border: isSelected
                        ? "2px solid #F97316"
                        : "1px solid #FDA77A",
                      backgroundColor: isSelected ? "#F97316" : "#fff",
                      color: isSelected ? "#fff" : "#1a0a00",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* ── QR Preview panel ── */}
          {previewTableId !== null && (
            <div
              style={{
                border: "1px solid #f0d5c4",
                borderRadius: 4,
                backgroundColor: "#fff8f4",
                padding: 16,
                marginTop: 8,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <p style={{ fontWeight: 600, color: "#1a0a00", fontSize: 14 }}>
                  {getTableLabel(
                    records.find((r) => r.table_id === previewTableId) ?? {
                      table_id: previewTableId,
                      table_number: previewTableId,
                      table_name: undefined,
                      qr_code_url: null,
                    },
                  )}{" "}
                  — QR Preview
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const rec = records.find(
                        (r) => r.table_id === previewTableId,
                      );
                      void downloadQr(
                        previewTableId,
                        rec ? getTableLabel(rec) : undefined,
                      );
                    }}
                    className="flex items-center gap-1 px-3 py-1"
                    style={{
                      border: "1px solid #e85c00",
                      borderRadius: 3,
                      backgroundColor: "#fff",
                      color: "#e85c00",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <DownloadIcon />
                    Download
                  </button>
                  <button
                    onClick={() => setPreviewTableId(null)}
                    className="flex items-center gap-1 px-3 py-1"
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: 3,
                      backgroundColor: "#fff",
                      color: "#555",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <CloseIcon />
                    Close
                  </button>
                </div>
              </div>
              <img
                src={
                  generatedQrs[previewTableId]?.qr_code_data_url ||
                  records.find((r) => r.table_id === previewTableId)
                    ?.qr_code_data_url ||
                  getTableQrImageUrl(previewTableId)
                }
                alt={`QR for ${getTableLabel(records.find((r) => r.table_id === previewTableId) ?? { table_id: previewTableId, table_number: previewTableId, table_name: undefined, qr_code_url: null })}`}
                style={{
                  display: "block",
                  margin: "0 auto",
                  border: "1px solid #f0d5c4",
                  padding: 8,
                  backgroundColor: "#fff",
                  maxWidth: 200,
                }}
              />

              {/* Download all selected */}
              {selectedTableIds.size > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from(selectedTableIds).map((tid) => {
                    const rec = records.find((r) => r.table_id === tid);
                    const label = rec ? getTableLabel(rec) : `T-${tid}`;
                    return (
                      <button
                        key={tid}
                        onClick={() => void downloadQr(tid, label)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 3,
                          border: "1px solid #e85c00",
                          backgroundColor: "#fff",
                          color: "#e85c00",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {label} ↓
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky footer actions ── */}
      <div
        className="max-w-317 w-full mx-auto"
        style={{
          position: "sticky",
          bottom: 0,
          // backgroundColor: "#fff",
          // borderTop: "1px solid #f0d5c4",
          marginTop: 16,
        }}
      >
        <button
          onClick={() => void handleGenerateAndPreview()}
          disabled={generating || selectedTableIds.size === 0}
          className="w-full max-w-317 mx-auto flex items-center justify-center gap-2 py-4"
          style={{
            backgroundColor:
              selectedTableIds.size === 0 ? "#f5cbb0" : "#f97316",
            color: "#fff",
            borderBottom: "4px solid #9A3412",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: selectedTableIds.size === 0 ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
        >
          <QrIcon />
          {generating
            ? "Generating..."
            : `Generate & Preview${selectedTableIds.size > 0 ? ` (${selectedTableIds.size})` : ""}`}
        </button>
        <button
          onClick={() => {
            setSelectedTableIds(new Set());
            setSelectAll(false);
            setPreviewTableId(null);
          }}
          className="w-full max-w-317 mt-3 mx-auto py-3"
          style={{
            backgroundColor: "#fff",
            color: "#f97316",
            border: "1px solid #FED7AA",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
