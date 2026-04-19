const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generatePDF(summary, quiz) {
  return new Promise((resolve, reject) => {
    const filename = `notes_${Date.now()}.pdf`;

    const filePath = path.join(__dirname, "../temp", filename);

    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("AI Video Notes");

    doc.moveDown();

    doc.fontSize(14).text("Summary");

    doc.moveDown();

    doc.text(summary);

    doc.moveDown();

    doc.text("Quiz");

    doc.moveDown();

    quiz.forEach((q, i) => {
      doc.text(`${i + 1}. ${q.question}`);

      q.options.forEach((o) => doc.text(o));

      doc.moveDown();
    });

    doc.end();

    stream.on("finish", () => {
      resolve(`temp/${filename}`);
    });

    stream.on("error", reject);
  });
}

module.exports = { generatePDF };
