import { TagScan } from "../models/types";

/**
 * Escape a field for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeCSVField(value: string | undefined): string {
  if (!value) return "";

  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Convert a single scan to a CSV row
 */
function scanToCSVRow(scan: TagScan): string {
  return [
    escapeCSVField(scan.tagId),
    escapeCSVField(scan.operator),
    escapeCSVField(scan.species),
    escapeCSVField(scan.site),
    escapeCSVField(scan.notes),
    scan.timestamp, // ISO 8601 format, no escaping needed
  ].join(",");
}

/**
 * Generate CSV string from array of scans
 */
export function generateCSV(scans: TagScan[]): string {
  // CSV Header
  const header = "Tag ID,Operator,Species,Site,Notes,Timestamp";

  // Convert each scan to a row
  const rows = scans.map(scanToCSVRow);

  // Combine header and rows
  return [header, ...rows].join("\n");
}
