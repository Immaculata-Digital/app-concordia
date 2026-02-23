/**
 * Shared print styles constants to ensure consistency between
 * browser-based printing (Editor) and PDF generation (Contracts).
 */

export const COMMON_PRINT_BASE_CSS = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    @page {
        size: A4;
        margin: 0;
    }

    html, body {
        background-color: white !important;
        background: white !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #000;
        width: 100%;
    }

    .print-hidden {
        display: none !important;
    }

    /* Standard Document Content Styling */
    .document-content h1, .contract-content h1 {
        font-size: 16pt;
        font-weight: bold;
        margin: 20px 0 10px 0;
        color: #000;
        text-align: left;
    }

    .document-content h2, .contract-content h2 {
        font-size: 14pt;
        font-weight: bold;
        margin: 18px 0 8px 0;
        color: #000;
        text-align: left;
    }

    .document-content h3, .contract-content h3 {
        font-size: 13pt;
        font-weight: bold;
        margin: 16px 0 6px 0;
        color: #000;
        text-align: left;
    }

    .document-content p, .contract-content p {
        margin: 10px 0;
        line-height: 1.8;
        color: #000;
        text-align: justify;
    }

    .document-content ul, .contract-content ul {
        margin: 10px 0;
        padding-left: 30px;
        color: #000;
        list-style-type: disc;
    }

    .document-content ol, .contract-content ol {
        margin: 10px 0;
        padding-left: 30px;
        color: #000;
        list-style-type: decimal;
    }

    .document-content li, .contract-content li {
        margin: 5px 0;
        line-height: 1.8;
        color: #000;
        display: list-item;
    }
`;

export const PDF_SPECIFIC_PRINT_CSS = `
    @page {
        margin: 3cm 2.5cm;
    }

    .contract-content-wrapper {
        margin-bottom: 150px !important;
    }

    .signers-section {
        margin-top: 150px;
        page-break-inside: avoid;
    }
`;
