import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import PDFDocument from "pdfkit";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, balance: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ senderId: session.userId }, { receiverId: session.userId }],
      },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const completionPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Header
    doc.fontSize(24).fillColor("#7c3aed").text("APEX BANK", { align: "center" });
    doc.fontSize(10).fillColor("#666").text("Account Statement", { align: "center" });
    doc.moveDown();

    // Account info
    doc.fontSize(12).fillColor("#333").text(`Account Holder: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Account ID: ${user.id}`);
    doc.text(`Statement Generated: ${new Date().toLocaleDateString()}`);
    doc.text(`Current Balance: $${user.balance.toFixed(2)}`);
    doc.moveDown();

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#ddd");
    doc.moveDown();

    // Transactions header
    doc.fontSize(14).fillColor("#333").text("Transaction History");
    doc.moveDown();

    // Table header
    const tableTop = doc.y;
    doc.fontSize(9).fillColor("#666");
    doc.text("Date", 50, tableTop, { width: 80 });
    doc.text("Type", 130, tableTop, { width: 60 });
    doc.text("Description", 190, tableTop, { width: 180 });
    doc.text("Amount", 420, tableTop, { width: 80, align: "right" });
    doc.text("Balance", 500, tableTop, { width: 60, align: "right" });

    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke("#ddd");

    // Transactions
    let runningBalance = user.balance;
    let y = tableTop + 25;

    for (const tx of transactions.slice(0, 50)) {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      const isSent = tx.senderId === session.userId;
      const other = isSent ? tx.receiver : tx.sender;
      const type = isSent ? "SENT" : "RECEIVED";
      const amount = isSent ? -tx.amount : tx.amount;
      const date = new Date(tx.createdAt).toLocaleDateString();

      doc.fontSize(8).fillColor("#333");
      doc.text(date, 50, y, { width: 80 });
      doc.text(type, 130, y, { width: 60 });
      doc.text(`${isSent ? "To" : "From"} ${other?.name || "Unknown"}`, 190, y, { width: 180 });

      doc.fillColor(isSent ? "#ef4444" : "#22c55e");
      doc.text(`${amount >= 0 ? "+" : ""}$${amount.toFixed(2)}`, 420, y, { width: 80, align: "right" });

      doc.fillColor("#333");
      doc.text(`$${runningBalance.toFixed(2)}`, 500, y, { width: 60, align: "right" });

      runningBalance -= amount;
      y += 20;
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#ddd");
    doc.moveDown();
    doc.fontSize(8).fillColor("#999").text(
      "This is a computer-generated statement. No signature required.",
      { align: "center" }
    );
    doc.text("Apex Bank - Premium Digital Banking", { align: "center" });

    doc.end();
    const pdfBuffer = await completionPromise;

    return new Response(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="apex-bank-statement-${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate statement" }, { status: 500 });
  }
}
