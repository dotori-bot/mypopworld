/**
 * @fileoverview PDF exporter for popup card SVG templates.
 * Converts SVG elements to multi-page PDF documents using jsPDF + svg2pdf.js.
 * All units are in mm for accurate print output.
 *
 * Dependencies:
 *   - jsPDF (https://github.com/parallax/jsPDF)
 *   - svg2pdf.js (https://github.com/yWorks/svg2pdf.js)
 *
 * @module generators/pdfExporter
 */

import { PAPER_SIZES } from './constants.js';

/**
 * @typedef {Object} ExportOptions
 * @property {'A4'|'LETTER'} paperSize   - Paper format
 * @property {string} [filename='popup-card-template.pdf'] - Output filename
 * @property {string} [title='MyPopWorld Template']        - PDF metadata title
 * @property {string} [author='MyPopWorld']                - PDF metadata author
 * @property {'portrait'|'landscape'} [orientation='portrait']
 */

/**
 * @typedef {Object} InstructionContent
 * @property {string} title       - Instruction page title
 * @property {string[]} steps     - Ordered list of instruction steps
 * @property {string} [materials] - Materials needed
 * @property {string} [tips]      - Additional tips
 */

/**
 * Export an array of SVG elements to a multi-page PDF.
 *
 * @param {SVGSVGElement[]} svgPages - Array of SVG elements, one per page
 * @param {ExportOptions} options
 * @returns {Promise<Blob>} PDF as a Blob for download
 *
 * @example
 * ```js
 * import { renderVFold } from './vfold.js';
 * import { exportToPdf } from './pdfExporter.js';
 *
 * const { svg } = renderVFold({ paperSize: 'A4', armLength: 40 });
 * const blob = await exportToPdf([svg], { paperSize: 'A4', filename: 'vfold.pdf' });
 * // Trigger download
 * const url = URL.createObjectURL(blob);
 * const a = document.createElement('a');
 * a.href = url;
 * a.download = 'vfold.pdf';
 * a.click();
 * ```
 */
export async function exportToPdf(svgPages, options) {
  const {
    paperSize = 'A4',
    filename  = 'popup-card-template.pdf',
    title     = 'MyPopWorld Template',
    author    = 'MyPopWorld',
    orientation = 'portrait',
  } = options;

  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;

  // Dynamic import for jsPDF (expected as an ES module or global)
  const { jsPDF } = await getJsPDF();

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [paper.width, paper.height],
    compress: true,
  });

  // Set PDF metadata
  doc.setProperties({
    title,
    author,
    subject: 'Popup Card Template',
    creator: 'MyPopWorld Generator',
  });

  for (let i = 0; i < svgPages.length; i++) {
    if (i > 0) {
      doc.addPage([paper.width, paper.height], orientation);
    }

    const svgEl = svgPages[i];

    // Use svg2pdf.js to render SVG onto the PDF page
    try {
      // @ts-ignore – svg2pdf.js adds itself as a jsPDF plugin
      await doc.svg(svgEl, {
        x: 0,
        y: 0,
        width: paper.width,
        height: paper.height,
      });
    } catch (err) {
      console.error(`[pdfExporter] Failed to render SVG page ${i + 1}:`, err);
      // Fallback: add a note on the page
      doc.setFontSize(12);
      doc.text(`Page ${i + 1} – SVG rendering failed. Please check svg2pdf.js is loaded.`, 10, 20);
    }
  }

  // Return as Blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Add an assembly instruction page to an existing jsPDF document.
 *
 * @param {import('jspdf').jsPDF} doc - jsPDF document instance
 * @param {InstructionContent} instructions - Instruction content
 * @param {'ko'|'en'} [language='ko'] - Display language
 * @param {'A4'|'LETTER'} [paperSize='A4']
 */
export function addInstructionPage(doc, instructions, language = 'ko', paperSize = 'A4') {
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  doc.addPage([paper.width, paper.height], 'portrait');

  const margin = 15;
  let yPos = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(instructions.title, margin, yPos);
  yPos += 10;

  // Materials section
  if (instructions.materials) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'ko' ? '준비물:' : 'Materials:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(instructions.materials, margin + 5, yPos);
    yPos += 8;
  }

  // Steps
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(language === 'ko' ? '만드는 방법:' : 'Instructions:', margin, yPos);
  yPos += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  for (let i = 0; i < instructions.steps.length; i++) {
    const step = instructions.steps[i];
    const stepText = `${i + 1}. ${step}`;

    // Word wrap for long steps
    const lines = doc.splitTextToSize(stepText, paper.width - 2 * margin);
    for (const line of lines) {
      if (yPos > paper.height - margin) {
        doc.addPage([paper.width, paper.height], 'portrait');
        yPos = margin;
      }
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    }
    yPos += 2;
  }

  // Tips section
  if (instructions.tips) {
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text(language === 'ko' ? '💡 팁:' : '💡 Tips:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const tipLines = doc.splitTextToSize(instructions.tips, paper.width - 2 * margin);
    for (const line of tipLines) {
      doc.text(line, margin + 3, yPos);
      yPos += 5;
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Generated by MyPopWorld — mypopworld.com', margin, paper.height - 8);
  doc.setTextColor(0);
}

/**
 * Convenience function: export template SVGs to PDF and trigger download.
 *
 * @param {SVGSVGElement[]} svgPages
 * @param {ExportOptions} options
 * @param {InstructionContent} [instructions] - Optional assembly instructions
 * @param {'ko'|'en'} [language='ko']
 */
export async function exportAndDownload(svgPages, options, instructions, language = 'ko') {
  const {
    paperSize = 'A4',
    filename  = 'popup-card-template.pdf',
    title     = 'MyPopWorld Template',
    author    = 'MyPopWorld',
    orientation = 'portrait',
  } = options;

  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const { jsPDF } = await getJsPDF();

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [paper.width, paper.height],
    compress: true,
  });

  doc.setProperties({ title, author, subject: 'Popup Card Template', creator: 'MyPopWorld' });

  // Render SVG pages
  for (let i = 0; i < svgPages.length; i++) {
    if (i > 0) doc.addPage([paper.width, paper.height], orientation);
    try {
      // @ts-ignore
      await doc.svg(svgPages[i], { x: 0, y: 0, width: paper.width, height: paper.height });
    } catch (err) {
      console.error(`[pdfExporter] SVG page ${i + 1} failed:`, err);
      doc.setFontSize(12);
      doc.text(`Error rendering page ${i + 1}`, 10, 20);
    }
  }

  // Add instruction page if provided
  if (instructions) {
    addInstructionPage(doc, instructions, language, paperSize);
  }

  // Trigger download
  doc.save(filename);
}

// ─── Internal: resolve jsPDF dependency ─────────────────────────────

/**
 * Attempt to get the jsPDF constructor.
 * Supports: window.jspdf (CDN), ES module import.
 * @returns {Promise<{ jsPDF: typeof import('jspdf').jsPDF }>}
 */
async function getJsPDF() {
  // Check if already available on window (CDN usage)
  // @ts-ignore
  if (typeof window !== 'undefined' && window.jspdf) {
    // @ts-ignore
    return window.jspdf;
  }

  // Try dynamic ES import
  try {
    const mod = await import('jspdf');
    return mod;
  } catch {
    throw new Error(
      '[pdfExporter] jsPDF not found. Install via npm (npm i jspdf svg2pdf.js) ' +
      'or include via CDN script tags.'
    );
  }
}
