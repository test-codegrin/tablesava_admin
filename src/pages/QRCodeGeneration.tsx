import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseApiError } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTableQrCodes, getTableQrImageUrl } from "@/services/tableService";
import type { TableQrCodeRecord } from "@/types/admin";

export default function QRCodeGeneration() {
  const [records, setRecords] = useState<TableQrCodeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewTableId, setPreviewTableId] = useState<number | null>(null);

  const loadQrCodes = async () => {
    setLoading(true);
    try {
      const response = await getTableQrCodes();
      setRecords(response.records);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">QR Code Generation</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void loadQrCodes();
          }}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="border border-zinc-200 bg-white p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Table ID</TableHead>
              <TableHead>Table Number</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-500">
                  Loading QR codes...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-zinc-500">
                  No QR records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.table_id}>
                  <TableCell>{record.table_id}</TableCell>
                  <TableCell>{record.table_number}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPreviewTableId(record.table_id)}
                    >
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {previewTableId !== null && (
        <div className="max-w-md border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium text-zinc-800">Table {previewTableId} QR Preview</p>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreviewTableId(null)}>
              Close
            </Button>
          </div>
          <img
            src={getTableQrImageUrl(previewTableId)}
            alt={`Table ${previewTableId} QR`}
            className="mx-auto border border-zinc-200 p-2"
          />
        </div>
      )}
    </div>
  );
}

