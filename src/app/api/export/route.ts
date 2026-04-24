import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Employee, MonthSchedule, isMonthSchedule } from "@/types/schedule";
import { getShift } from "@/config/shifts";
import { makeError, fromUnknown, AppError, ERROR_LABELS } from "@/lib/errors";
import {
  getDatesInWeek,
  formatDate,
  formatDisplayDate,
  getMonthLabel,
  parseLocalDate,
  isWeekend,
} from "@/lib/dateUtils";
import { calculateStats } from "@/lib/scheduleRules";

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  brand:       "FF0F172A", // slate-950  — main title bg
  weekHdr:     "FF1E3A5F", // deep navy  — week block header
  colHdr:      "FF334155", // slate-700  — column headers
  nameCol:     "FFF8FAFC", // slate-50   — employee name column
  altRow:      "FFF1F5F9", // slate-100  — alternate row tint
  white:       "FFFFFFFF",
  guardLabel:  "FFFBCFE8", // pink-200
  guardCell:   "FFFCE7F3", // pink-100
  accentBar:   "FF4F46E5", // indigo-600 — decorative stripe
  border:      "FFE2E8F0", // slate-200  — inner grid lines
  borderMid:   "FFB0BEC5", // slate-350  — section separators
  borderOuter: "FF64748B", // slate-500  — outer frame
  textWhite:   "FFFFFFFF",
  textDark:    "FF0F172A", // slate-950
  textMed:     "FF334155", // slate-700
  textMuted:   "FF64748B", // slate-500
  textPink:    "FF881337", // rose-800
  // Summary accent rows
  rowHigh:     "FFD1FAE5", // emerald-100 — highest hours
  rowLow:      "FFFEF3C7", // amber-100   — lowest hours
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function b(style: ExcelJS.BorderStyle, argb: string): ExcelJS.Border {
  return { style, color: { argb } };
}

const THIN   = (c = C.border)      => b("thin",   c);
const MEDIUM = (c = C.borderOuter) => b("medium", c);

function applyGrid(cell: ExcelJS.Cell, argb = C.border) {
  const t = THIN(argb);
  cell.border = { top: t, left: t, bottom: t, right: t };
}

// Apply a specific side's border without resetting others
function setSide(
  cell: ExcelJS.Cell,
  side: keyof ExcelJS.Borders,
  bdr: ExcelJS.Border
) {
  cell.border = { ...cell.border, [side]: bdr };
}

function styleTitle(cell: ExcelJS.Cell, opts: {
  text: string; size?: number; bold?: boolean;
  bg?: string; color?: string; align?: ExcelJS.Alignment["horizontal"];
}) {
  cell.value = opts.text;
  cell.font  = { bold: opts.bold ?? true, size: opts.size ?? 11, color: { argb: opts.color ?? C.textWhite }, name: "Calibri" };
  cell.fill  = fill(opts.bg ?? C.brand);
  cell.alignment = { horizontal: opts.align ?? "center", vertical: "middle", wrapText: false };
}

function styleHeader(cell: ExcelJS.Cell, text: string, opts: {
  bg?: string; color?: string; size?: number; align?: ExcelJS.Alignment["horizontal"];
} = {}) {
  cell.value = text;
  cell.font  = { bold: true, size: opts.size ?? 9, color: { argb: opts.color ?? C.textWhite }, name: "Calibri" };
  cell.fill  = fill(opts.bg ?? C.colHdr);
  cell.alignment = { horizontal: opts.align ?? "center", vertical: "middle", wrapText: true };
  applyGrid(cell, C.borderMid);
}

function styleData(cell: ExcelJS.Cell, value: ExcelJS.CellValue, opts: {
  bg?: string; color?: string; size?: number; bold?: boolean;
  align?: ExcelJS.Alignment["horizontal"]; wrap?: boolean;
} = {}) {
  cell.value = value;
  cell.font  = { bold: opts.bold ?? false, size: opts.size ?? 9, color: { argb: opts.color ?? C.textDark }, name: "Calibri" };
  cell.fill  = fill(opts.bg ?? C.white);
  cell.alignment = { horizontal: opts.align ?? "center", vertical: "middle", wrapText: opts.wrap ?? false };
  applyGrid(cell);
}

function styleGuard(cell: ExcelJS.Cell, value: ExcelJS.CellValue, isLabel = false) {
  cell.value = value;
  cell.font  = { bold: true, size: 9, color: { argb: C.textPink }, name: "Calibri" };
  cell.fill  = fill(isLabel ? C.guardLabel : C.guardCell);
  cell.alignment = { horizontal: isLabel ? "left" : "center", vertical: "middle", wrapText: true };
  applyGrid(cell, C.border);
  setSide(cell, "top", MEDIUM(C.borderMid));
}

function mergeFill(ws: ExcelJS.Worksheet, range: string, bg: string) {
  ws.mergeCells(range);
  const [startRef] = range.split(":");
  ws.getCell(startRef).fill = fill(bg);
}

function today(): string {
  return formatDisplayDate(formatDate(new Date()));
}

// Apply outer frame to a row range [colStart, colEnd] at a given row
function frameRow(ws: ExcelJS.Worksheet, row: number, colStart: number, colEnd: number, top = false, bottom = false) {
  for (let c = colStart; c <= colEnd; c++) {
    const cell = ws.getCell(row, c);
    if (top)    setSide(cell, "top",    MEDIUM());
    if (bottom) setSide(cell, "bottom", MEDIUM());
    if (c === colStart) setSide(cell, "left",  MEDIUM());
    if (c === colEnd)   setSide(cell, "right", MEDIUM());
  }
}

const NCOLS = 8; // Integrante + 7 days

// ─── Sheet 1: Cronograma ────────────────────────────────────────────────────
function buildCronograma(
  wb: ExcelJS.Workbook,
  schedule: MonthSchedule,
  employees: Employee[]
) {
  const ws = wb.addWorksheet("Cronograma", {
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: `&L&"Calibri,Regular"&8Tech Support — Cronograma Mensual&R&8Página &P de &N`,
    },
  });
  ws.properties.tabColor = { argb: "FF4F46E5" };

  // Column widths
  ws.getColumn(1).width = 18;
  for (let c = 2; c <= NCOLS; c++) ws.getColumn(c).width = 14;

  // Freeze first column
  ws.views = [{ state: "frozen", xSplit: 1, ySplit: 0, showGridLines: false }];

  let R = 1; // current row pointer

  // ── Title block ──────────────────────────────────────────────────────────
  // Accent stripe (row 1)
  ws.mergeCells(`A${R}:H${R}`);
  const accentCell = ws.getCell(`A${R}`);
  accentCell.value = "";
  accentCell.fill = fill(C.accentBar);
  ws.getRow(R).height = 5;
  R++;

  // Main title row (row 2)
  ws.mergeCells(`A${R}:H${R}`);
  styleTitle(ws.getCell(`A${R}`), {
    text: `CRONOGRAMA MENSUAL  —  ${getMonthLabel(schedule.month, schedule.year).toUpperCase()}`,
    size: 15, bg: C.brand,
  });
  ws.getRow(R).height = 34;
  R++;

  // Subtitle (row 3)
  ws.mergeCells(`A${R}:H${R}`);
  styleTitle(ws.getCell(`A${R}`), {
    text: `Tech Support  ·  Generado: ${today()}`,
    size: 9, bold: false, bg: C.brand, color: "FF94A3B8",
  });
  ws.getRow(R).height = 18;
  R++;

  // Spacer
  ws.mergeCells(`A${R}:H${R}`);
  ws.getCell(`A${R}`).fill = fill(C.brand);
  ws.getRow(R).height = 4;
  R++;

  // ── Weeks ────────────────────────────────────────────────────────────────
  const COL_NAMES = ["Integrante", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  schedule.weeks.forEach((week, wi) => {
    const weekStart = parseLocalDate(week.startDate);
    const dates     = getDatesInWeek(weekStart);
    const blockStart = R;

    // — Week header —
    ws.mergeCells(`A${R}:H${R}`);
    const wkCell = ws.getCell(`A${R}`);
    wkCell.value = `  Semana ${wi + 1}     ${formatDisplayDate(week.startDate)} – ${formatDisplayDate(week.endDate)}`;
    wkCell.font  = { bold: true, size: 10, color: { argb: C.textWhite }, name: "Calibri" };
    wkCell.fill  = fill(C.weekHdr);
    wkCell.alignment = { horizontal: "left", vertical: "middle" };
    ws.getRow(R).height = 22;
    R++;

    // — Column headers —
    COL_NAMES.forEach((name, i) => {
      const cell = ws.getCell(R, i + 1);
      const date = dates[i - 1];
      const isWknd = date && (date.getDay() === 0 || date.getDay() === 6);
      if (i === 0) {
        styleHeader(cell, name, { bg: C.colHdr, align: "left" });
      } else {
        styleHeader(cell, `${name}\n${date.getDate()}/${date.getMonth() + 1}`, {
          bg: isWknd ? "FF3B4B6E" : C.colHdr,
        });
      }
    });
    ws.getRow(R).height = 28;
    R++;

    // — Employee rows —
    employees.forEach((emp, empIdx) => {
      const row = week.rows.find((r) => r.employeeId === emp.id);
      const rowBg = empIdx % 2 === 0 ? C.white : C.altRow;

      // Name cell
      const nameCell = ws.getCell(R, 1);
      styleData(nameCell, emp.name, {
        bg: C.nameCol, bold: true, align: "left",
        color: C.textMed, size: 9,
      });
      setSide(nameCell, "left",  MEDIUM());
      setSide(nameCell, "right", MEDIUM());

      // Day cells
      dates.forEach((date, i) => {
        const dateStr    = formatDate(date);
        const assignment = row?.days[dateStr] ?? { shift: "FRANCO" };
        const shiftDef   = getShift(assignment.shift);
        const cell       = ws.getCell(R, i + 2);
        const isWknd     = date.getDay() === 0 || date.getDay() === 6;
        const isOutside  = date.getMonth() + 1 !== schedule.month;

        const cellBg = isOutside
          ? "FFF1F5F9"
          : assignment.shift === "FRANCO" && isWknd
          ? "FFF1F5F9"
          : shiftDef.exportColor;

        const cellText = assignment.note
          ? `${shiftDef.label}\n${assignment.note}`
          : shiftDef.label;

        cell.value = cellText;
        cell.font  = {
          bold: !isOutside && assignment.shift !== "FRANCO",
          size: 9,
          italic: !!assignment.note,
          color: { argb: isOutside ? C.textMuted : C.textDark },
          name: "Calibri",
        };
        cell.fill      = fill(cellBg);
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: !!assignment.note };
        applyGrid(cell);

        if (i === 6) setSide(cell, "right", MEDIUM()); // last col
      });

      ws.getRow(R).height = assignment_note_in_row(row, dates) ? 28 : 22;
      R++;
    });

    // — Guard row —
    const guardLabelCell = ws.getCell(R, 1);
    styleGuard(guardLabelCell, "⬤  Guardia", true);
    setSide(guardLabelCell, "left", MEDIUM());

    dates.forEach((date, i) => {
      const dateStr = formatDate(date);
      const guard   = week.guards.find((g) => g.date === dateStr);
      const emp     = guard?.employeeId ? employees.find((e) => e.id === guard.employeeId) : null;
      const wknd    = isWeekend(date);
      const cell    = ws.getCell(R, i + 2);
      styleGuard(cell, emp ? `${emp.name}\n${wknd ? "20:00-08:00" : "22:00-06:00"}` : "—");
      if (i === 6) setSide(cell, "right", MEDIUM());
    });

    ws.getRow(R).height = 26;
    const blockEnd = R;

    // Apply outer frame top/bottom
    frameRow(ws, blockStart, 1, NCOLS, true, false);
    frameRow(ws, blockEnd,   1, NCOLS, false, true);

    R++;

    // — Spacer between weeks —
    ws.mergeCells(`A${R}:H${R}`);
    ws.getCell(`A${R}`).fill = fill("FFF8FAFC");
    ws.getRow(R).height = 8;
    R++;
  });

  // ── Legend ───────────────────────────────────────────────────────────────
  R++; // extra gap
  ws.mergeCells(`A${R}:H${R}`);
  const legTitle = ws.getCell(`A${R}`);
  legTitle.value = "REFERENCIA DE TURNOS";
  legTitle.font  = { bold: true, size: 8, color: { argb: C.textMuted }, name: "Calibri" };
  legTitle.fill  = fill(C.white);
  legTitle.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(R).height = 16;
  R++;

  const legendItems = [
    { label: "FRANCO",      color: "FFE2E8F0" },
    { label: "06:00-16:00", color: "FFD1FAE5" },
    { label: "14:00-22:00", color: "FFFED7AA" },
    { label: "08:00-20:00", color: "FFBFDBFE" },
    { label: "13:00-22:00", color: "FFFDE68A" },
    { label: "06:00-14:00", color: "FFECFDF5" },
    { label: "GUARDIA",     color: "FFFCE7F3" },
    { label: "FERIADO",     color: "FFFECACA" },
  ];

  legendItems.forEach((item, i) => {
    const cell = ws.getCell(R, i + 1);
    cell.value = item.label;
    cell.font  = { size: 8, bold: true, color: { argb: C.textMed }, name: "Calibri" };
    cell.fill  = fill(item.color);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    applyGrid(cell, C.border);
  });
  ws.getRow(R).height = 16;
}

// Helper: detect if any assignment in a row has a note (affects row height)
function assignment_note_in_row(
  row: MonthSchedule["weeks"][0]["rows"][0] | undefined,
  dates: Date[]
): boolean {
  if (!row) return false;
  return dates.some((d) => {
    const ds = formatDate(d);
    return !!row.days[ds]?.note;
  });
}

// ─── Sheet 2: Resumen ────────────────────────────────────────────────────────
function buildResumen(
  wb: ExcelJS.Workbook,
  schedule: MonthSchedule,
  employees: Employee[]
) {
  const ws = wb.addWorksheet("Resumen", {
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1 },
  });
  ws.properties.tabColor = { argb: "FF059669" };
  ws.views = [{ showGridLines: false }];

  const stats = calculateStats(schedule, employees);
  const nEmp  = employees.length;

  // Column widths: label col + one per employee
  ws.getColumn(1).width = 28;
  for (let c = 2; c <= nEmp + 1; c++) ws.getColumn(c).width = 16;

  let R = 1;

  // ── Title ────────────────────────────────────────────────────────────────
  const lastCol = String.fromCharCode(64 + nEmp + 1); // e.g. "D" for 3 employees

  ws.mergeCells(`A${R}:${lastCol}${R}`);
  ws.getCell(`A${R}`).fill = fill(C.accentBar);
  ws.getRow(R).height = 5;
  R++;

  ws.mergeCells(`A${R}:${lastCol}${R}`);
  styleTitle(ws.getCell(`A${R}`), {
    text: `RESUMEN MENSUAL  —  ${getMonthLabel(schedule.month, schedule.year).toUpperCase()}`,
    size: 14, bg: C.brand,
  });
  ws.getRow(R).height = 32;
  R++;

  ws.mergeCells(`A${R}:${lastCol}${R}`);
  styleTitle(ws.getCell(`A${R}`), {
    text: `Tech Support  ·  ${employees.map((e) => e.name).join("  ·  ")}`,
    size: 9, bold: false, bg: C.brand, color: "FF94A3B8",
  });
  ws.getRow(R).height = 18;
  R++;

  ws.mergeCells(`A${R}:${lastCol}${R}`);
  ws.getCell(`A${R}`).fill = fill(C.brand);
  ws.getRow(R).height = 8;
  R++;
  R++; // gap

  // ── Stats table ──────────────────────────────────────────────────────────
  ws.mergeCells(`A${R}:${lastCol}${R}`);
  const secCell = ws.getCell(`A${R}`);
  secCell.value = "DISTRIBUCIÓN DE MÉTRICAS";
  secCell.font  = { bold: true, size: 8, color: { argb: C.textMuted }, name: "Calibri" };
  secCell.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(R).height = 16;
  R++;

  // Header row: blank + employee names
  ws.getCell(R, 1).fill = fill(C.colHdr);
  ws.getCell(R, 1).value = "";
  applyGrid(ws.getCell(R, 1), C.borderMid);
  employees.forEach((emp, i) => {
    styleHeader(ws.getCell(R, i + 2), emp.name.toUpperCase(), { size: 10 });
  });
  ws.getRow(R).height = 26;
  R++;

  // Metric rows
  const metrics: { label: string; key: keyof typeof stats[0]; suffix?: string; highlight?: boolean }[] = [
    { label: "Horas totales",        key: "totalHours",       suffix: "h", highlight: true },
    { label: "Guardias nocturnas",   key: "guardCount"                                      },
    { label: "Feriados trabajados",  key: "holidayCount"                                    },
    { label: "Fines de semana",      key: "weekendDaysWorked"                               },
    { label: "Días de franco",       key: "francoCount"                                     },
    { label: "Vacaciones",           key: "vacationCount"                                   },
  ];

  // Pre-calculate max/min for hours
  const hourValues = stats.map((s) => s.totalHours);
  const maxHours   = Math.max(...hourValues);
  const minHours   = Math.min(...hourValues);

  metrics.forEach((metric, mi) => {
    const rowBg = mi % 2 === 0 ? C.white : C.altRow;

    // Label cell
    const labelCell = ws.getCell(R, 1);
    labelCell.value = metric.label;
    labelCell.font  = { bold: true, size: 10, color: { argb: C.textMed }, name: "Calibri" };
    labelCell.fill  = fill("FFF8FAFC");
    labelCell.alignment = { horizontal: "left", vertical: "middle" };
    applyGrid(labelCell, C.border);
    setSide(labelCell, "left", MEDIUM());

    employees.forEach((emp, ei) => {
      const s    = stats.find((x) => x.employeeId === emp.id)!;
      const val  = s[metric.key] as number;
      const cell = ws.getCell(R, ei + 2);

      // Highlight highest/lowest hours
      let cellBg = rowBg;
      if (metric.key === "totalHours") {
        if (val === maxHours && maxHours !== minHours) cellBg = C.rowHigh;
        if (val === minHours && maxHours !== minHours) cellBg = C.rowLow;
      }

      cell.value     = metric.suffix ? `${val}${metric.suffix}` : val;
      cell.font      = {
        bold: metric.highlight || val > 0,
        size: 11,
        color: { argb: val === 0 ? C.textMuted : C.textDark },
        name: "Calibri",
      };
      cell.fill      = fill(cellBg);
      cell.alignment = { horizontal: "center", vertical: "middle" };
      applyGrid(cell, C.border);
      if (ei === nEmp - 1) setSide(cell, "right", MEDIUM());
    });

    ws.getRow(R).height = 24;
    frameRow(ws, R, 1, nEmp + 1, mi === 0, mi === metrics.length - 1);
    R++;
  });

  R++; // gap

  // ── Balance indicator ────────────────────────────────────────────────────
  if (maxHours !== minHours) {
    ws.mergeCells(`A${R}:${lastCol}${R}`);
    const empMax = employees[hourValues.indexOf(maxHours)]?.name ?? "";
    const empMin = employees[hourValues.indexOf(minHours)]?.name ?? "";
    const balCell = ws.getCell(`A${R}`);
    balCell.value = `⚠  Balance de horas: ${empMax} tiene la mayor carga (${maxHours}h) · ${empMin} tiene la menor (${minHours}h) · Diferencia: ${maxHours - minHours}h`;
    balCell.font  = { size: 9, italic: true, color: { argb: "FF92400E" }, name: "Calibri" };
    balCell.fill  = fill("FFFEF3C7");
    balCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    applyGrid(balCell, "FFFDE68A");
    ws.getRow(R).height = 20;
    R++;
  }

  R++;

  // ── Guard detail table ───────────────────────────────────────────────────
  ws.mergeCells(`A${R}:${lastCol}${R}`);
  const guardSecCell = ws.getCell(`A${R}`);
  guardSecCell.value = "DISTRIBUCIÓN DE GUARDIAS NOCTURNAS";
  guardSecCell.font  = { bold: true, size: 8, color: { argb: C.textMuted }, name: "Calibri" };
  guardSecCell.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(R).height = 16;
  R++;

  // Guard day headers
  ["Día", "Guardia asignada", "Horario", "Turno"].forEach((h, i) => {
    const cell = ws.getCell(R, i + 1);
    styleHeader(cell, h, { align: i === 0 ? "left" : "center", size: 9 });
  });
  ws.getRow(R).height = 22;
  R++;

  schedule.weeks.forEach((week) => {
    const weekStart = parseLocalDate(week.startDate);
    const dates     = getDatesInWeek(weekStart);
    dates.forEach((date) => {
      const ds     = formatDate(date);
      if (date.getMonth() + 1 !== schedule.month) return;
      const guard  = week.guards.find((g) => g.date === ds);
      const emp    = guard?.employeeId ? employees.find((e) => e.id === guard.employeeId) : null;
      const wknd  = isWeekend(date);
      const hrs   = wknd ? "20:00-08:00" : "22:00-06:00";
      const rowBg = R % 2 === 0 ? C.white : C.altRow;

      const vals = [
        formatDisplayDate(ds),
        emp?.name ?? "—",
        emp ? hrs : "—",
        emp ? (wknd ? "Fin de semana" : "Día de semana") : "—",
      ];
      vals.forEach((v, i) => {
        const cell = ws.getCell(R, i + 1);
        cell.value = v;
        cell.font  = { size: 9, bold: i === 1 && !!emp, color: { argb: emp ? C.textDark : C.textMuted }, name: "Calibri" };
        cell.fill  = fill(emp ? (i === 1 ? C.guardCell : rowBg) : rowBg);
        cell.alignment = { horizontal: i === 0 ? "left" : "center", vertical: "middle" };
        applyGrid(cell, C.border);
        if (i === 0) setSide(cell, "left", MEDIUM());
        if (i === 3) setSide(cell, "right", MEDIUM());
      });
      ws.getRow(R).height = 18;
      R++;
    });
  });

  // Frame the guard table
  frameRow(ws, R - 1, 1, 4, false, true);
}

// ─── Sheet 3: Historial ──────────────────────────────────────────────────────
function buildHistorial(
  wb: ExcelJS.Workbook,
  history: MonthSchedule[],
  employees: Employee[]
) {
  const ws = wb.addWorksheet("Historial", {
    pageSetup: { orientation: "portrait", fitToPage: true, fitToWidth: 1 },
  });
  ws.properties.tabColor = { argb: "FFD97706" };
  ws.views = [{ showGridLines: false }];

  const nEmp    = employees.length;
  const lastCol = String.fromCharCode(64 + nEmp + 1);
  ws.getColumn(1).width = 28;
  for (let c = 2; c <= nEmp + 1; c++) ws.getColumn(c).width = 16;

  let R = 1;

  // Title
  ws.mergeCells(`A${R}:${lastCol}${R}`);
  ws.getCell(`A${R}`).fill = fill("FFD97706");
  ws.getRow(R).height = 5;
  R++;

  ws.mergeCells(`A${R}:${lastCol}${R}`);
  styleTitle(ws.getCell(`A${R}`), {
    text: "HISTORIAL  —  ÚLTIMOS MESES", size: 14, bg: "FF78350F",
  });
  ws.getRow(R).height = 32;
  R++;

  ws.mergeCells(`A${R}:${lastCol}${R}`);
  styleTitle(ws.getCell(`A${R}`), {
    text: `Tech Support  ·  Generado: ${today()}`, size: 9, bold: false, bg: "FF78350F", color: "FFFBBF24",
  });
  ws.getRow(R).height = 18;
  R++;

  ws.mergeCells(`A${R}:${lastCol}${R}`);
  ws.getCell(`A${R}`).fill = fill("FF78350F");
  ws.getRow(R).height = 8;
  R++;
  R++;

  if (history.length === 0) {
    ws.mergeCells(`A${R}:${lastCol}${R}`);
    const cell = ws.getCell(`A${R}`);
    cell.value = "Sin historial disponible. Los datos aparecerán aquí luego de guardar cronogramas de meses anteriores.";
    cell.font  = { size: 10, italic: true, color: { argb: C.textMuted }, name: "Calibri" };
    cell.fill  = fill(C.altRow);
    cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    ws.getRow(R).height = 40;
    return;
  }

  const metricKeys: { label: string; key: keyof ReturnType<typeof calculateStats>[0]; suffix?: string }[] = [
    { label: "Horas totales",       key: "totalHours",       suffix: "h" },
    { label: "Guardias nocturnas",  key: "guardCount"                    },
    { label: "Feriados",            key: "holidayCount"                  },
    { label: "Fines de semana",     key: "weekendDaysWorked"             },
    { label: "Francos",             key: "francoCount"                   },
  ];

  history.forEach((month, hi) => {
    const stats = calculateStats(month, employees);
    const label = getMonthLabel(month.month, month.year).toUpperCase();

    // Month sub-header
    ws.mergeCells(`A${R}:${lastCol}${R}`);
    const mhCell = ws.getCell(`A${R}`);
    mhCell.value = `  ${label}`;
    mhCell.font  = { bold: true, size: 10, color: { argb: C.textWhite }, name: "Calibri" };
    mhCell.fill  = fill("FFB45309");
    mhCell.alignment = { horizontal: "left", vertical: "middle" };
    ws.getRow(R).height = 22;
    R++;

    // Employee header
    ws.getCell(R, 1).value = "";
    ws.getCell(R, 1).fill  = fill(C.colHdr);
    applyGrid(ws.getCell(R, 1), C.borderMid);
    employees.forEach((emp, i) => {
      styleHeader(ws.getCell(R, i + 2), emp.name.toUpperCase(), { size: 10 });
    });
    ws.getRow(R).height = 24;
    frameRow(ws, R, 1, nEmp + 1, true, false);
    R++;

    metricKeys.forEach((metric, mi) => {
      const rowBg = mi % 2 === 0 ? C.white : C.altRow;
      const labelCell = ws.getCell(R, 1);
      labelCell.value = metric.label;
      labelCell.font  = { size: 9, bold: true, color: { argb: C.textMed }, name: "Calibri" };
      labelCell.fill  = fill(C.nameCol);
      labelCell.alignment = { horizontal: "left", vertical: "middle" };
      applyGrid(labelCell, C.border);
      setSide(labelCell, "left", MEDIUM());

      employees.forEach((emp, ei) => {
        const s    = stats.find((x) => x.employeeId === emp.id)!;
        const val  = s[metric.key] as number;
        const cell = ws.getCell(R, ei + 2);
        cell.value = metric.suffix ? `${val}${metric.suffix}` : val;
        cell.font  = { size: 10, bold: val > 0, color: { argb: val > 0 ? C.textDark : C.textMuted }, name: "Calibri" };
        cell.fill  = fill(rowBg);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        applyGrid(cell, C.border);
        if (ei === nEmp - 1) setSide(cell, "right", MEDIUM());
      });

      ws.getRow(R).height = 20;
      if (mi === metricKeys.length - 1) frameRow(ws, R, 1, nEmp + 1, false, true);
      R++;
    });

    if (hi < history.length - 1) {
      ws.mergeCells(`A${R}:${lastCol}${R}`);
      ws.getRow(R).height = 12;
      R++;
    }
  });
}

// ─── Request validation ──────────────────────────────────────────────────────

interface ExportRequestBody {
  schedule: MonthSchedule;
  employees: Employee[];
  history: MonthSchedule[];
}

function parseRequestBody(raw: unknown): ExportRequestBody | AppError {
  if (typeof raw !== "object" || raw === null) {
    return makeError("EXPORT_VALIDATION_FAILED", "Request body must be a JSON object.");
  }

  const body = raw as Record<string, unknown>;

  if (!isMonthSchedule(body["schedule"])) {
    return makeError("EXPORT_VALIDATION_FAILED", "Field 'schedule' is missing or invalid.");
  }

  if (!Array.isArray(body["employees"]) || body["employees"].length === 0) {
    return makeError("EXPORT_VALIDATION_FAILED", "Field 'employees' must be a non-empty array.");
  }

  const employees = body["employees"] as unknown[];
  const validEmployees = employees.every(
    (e) =>
      typeof e === "object" &&
      e !== null &&
      typeof (e as Record<string, unknown>)["id"] === "string" &&
      typeof (e as Record<string, unknown>)["name"] === "string",
  );
  if (!validEmployees) {
    return makeError("EXPORT_VALIDATION_FAILED", "Each employee must have string 'id' and 'name'.");
  }

  const history = Array.isArray(body["history"])
    ? (body["history"] as unknown[]).filter(isMonthSchedule)
    : [];

  return {
    schedule:  body["schedule"] as MonthSchedule,
    employees: body["employees"] as Employee[],
    history,
  };
}

function errorResponse(error: AppError, status: number): NextResponse {
  return NextResponse.json(
    { code: error.code, message: ERROR_LABELS[error.code] ?? error.message },
    { status },
  );
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return errorResponse(
      makeError("EXPORT_VALIDATION_FAILED", "Invalid JSON in request body."),
      400,
    );
  }

  const bodyOrError = parseRequestBody(rawBody);
  if ("code" in bodyOrError) {
    return errorResponse(bodyOrError, 400);
  }

  const { schedule, employees, history } = bodyOrError;

  try {
    const wb = new ExcelJS.Workbook();
    wb.creator  = "Tech Support";
    wb.company  = "Tech Support Team";
    wb.created  = new Date();
    wb.modified = new Date();

    buildCronograma(wb, schedule, employees);
    buildResumen(wb, schedule, employees);
    buildHistorial(wb, history, employees);

    const buffer = await wb.xlsx.writeBuffer();
    const month  = String(schedule.month).padStart(2, "0");

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Cronograma_${schedule.year}-${month}.xlsx"`,
      },
    });
  } catch (cause) {
    const error = fromUnknown(cause, "EXPORT_SERVER_FAILED");
    console.error("[export/route]", error.message, cause);
    return errorResponse(error, 500);
  }
}
