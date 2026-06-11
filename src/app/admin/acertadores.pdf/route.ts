import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { getDailyWinners, type DailyWinner, type WinnerFilters } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getFilters(url: string): WinnerFilters {
  const searchParams = new URL(url).searchParams;

  return {
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    matchId: searchParams.get("matchId") || undefined,
    department: searchParams.get("department") || undefined,
  };
}

function filterSummary(filters: WinnerFilters) {
  const parts = [];
  if (filters.dateFrom) parts.push(`De ${formatDate(filters.dateFrom)}`);
  if (filters.dateTo) parts.push(`ate ${formatDate(filters.dateTo)}`);
  if (filters.department) parts.push(`Departamento: ${filters.department}`);
  if (filters.matchId) parts.push(`Jogo: ${filters.matchId}`);

  return parts.length > 0 ? parts.join(" | ") : "Todos os acertadores";
}

function drawRow(
  doc: PDFKit.PDFDocument,
  winner: DailyWinner,
  index: number,
  startY: number,
) {
  const y = startY;
  const fill = index % 2 === 0 ? "#F6F7FB" : "#FFFFFF";

  doc.rect(40, y - 6, 515, 34).fill(fill);
  doc.fillColor("#171925").fontSize(8);
  doc.text(formatDate(winner.matchDate), 46, y, { width: 45 });
  doc.text(winner.kickoffTime, 91, y, { width: 30 });
  doc.text(winner.matchLabel, 124, y, { width: 115 });
  doc.text(winner.name, 243, y, { width: 92 });
  doc.text(winner.department, 339, y, { width: 70 });
  doc.text(winner.predictedScore, 411, y, { width: 32, align: "center" });
  doc.text(winner.finalScore, 444, y, { width: 30, align: "center" });
  doc.text(formatDateTime(winner.updatedAt), 480, y, { width: 70 });
}

async function makePdf(winners: DailyWinner[], filters: WinnerFilters) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: "Acertadores do Bolao DR Monitora",
      Author: "DR Monitora",
    },
  });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.font("Helvetica-Bold").fontSize(20).fillColor("#171925").text("Acertadores do Bolao", 40, 40);
  doc.font("Helvetica").fontSize(10).fillColor("#62677F").text("DR Monitora | Copa 2026", 40, 66);
  doc.fontSize(9).text(`Filtros: ${filterSummary(filters)}`, 40, 86, { width: 515 });
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#3857E8").text(`${winners.length} acertador(es)`, 40, 112);

  let y = 150;
  doc.rect(40, y - 8, 515, 24).fill("#171925");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(8);
  doc.text("Data", 46, y, { width: 45 });
  doc.text("Hora", 91, y, { width: 30 });
  doc.text("Jogo", 124, y, { width: 115 });
  doc.text("Nome", 243, y, { width: 92 });
  doc.text("Depto.", 339, y, { width: 70 });
  doc.text("Palp.", 411, y, { width: 32, align: "center" });
  doc.text("Real", 444, y, { width: 30, align: "center" });
  doc.text("Alterado", 480, y, { width: 70 });
  y += 28;

  if (winners.length === 0) {
    doc.font("Helvetica").fontSize(11).fillColor("#62677F").text("Nenhum acertador encontrado para os filtros selecionados.", 40, y);
  } else {
    winners.forEach((winner, index) => {
      if (y > 760) {
        doc.addPage();
        y = 60;
      }

      drawRow(doc, winner, index, y);
      y += 34;
    });
  }

  doc.end();

  await new Promise<void>((resolve) => {
    doc.on("end", resolve);
  });

  return Buffer.concat(chunks);
}

export async function GET(request: Request) {
  const filters = getFilters(request.url);
  const winners = await getDailyWinners(filters);
  const pdf = await makePdf(winners, filters);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="acertadores-bolao-drmonitora.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
