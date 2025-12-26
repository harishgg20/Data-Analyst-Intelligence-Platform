
export const generatePDF = async (elementIds: string | string[], fileName: string = 'report.pdf') => {
    let content = '';

    if (typeof elementIds === 'string') {
        const el = document.getElementById(elementIds);
        if (el) content = el.outerHTML; // Use outerHTML to keep container styles if any
    } else {
        // Array of IDs
        elementIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Wrap in a div for separation
                content += `<div class="report-section" style="margin-bottom: 30px;">${el.outerHTML}</div>`;
            }
        });
    }

    if (!content) {
        console.warn("No content found to print");
        return;
    }

    // Create a hidden iframe to print from
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${fileName}</title>
            <style>
                body {
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    color: #1a202c; /* gray-900 */
                    background: #ffffff;
                    padding: 40px;
                    line-height: 1.5;
                }
                h1 { font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #111827; }
                h2 { font-size: 20px; font-weight: bold; margin-top: 24px; margin-bottom: 12px; color: #1f2937; }
                p { margin-bottom: 12px; color: #374151; }
                ul { list-style-type: disc; margin-left: 20px; margin-bottom: 16px; }
                li { margin-bottom: 4px; color: #374151; }
                strong { font-weight: 600; color: #111827; }
                .text-sm { font-size: 14px; }
                .text-xs { font-size: 12px; }
                .text-slate-500 { color: #64748b; }
                /* Hide screen-only interactions if any copied */
                button { display: none !important; }
                
                @media print {
                    @page { margin: 2cm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${content}
            <script>
                window.onload = () => {
                   // Small delay to ensure styles are applied
                   setTimeout(() => {
                        window.print();
                        // We can't easily remove the iframe because print() behavior varies.
                        // Leaving a 0x0 iframe is harmless.
                   }, 500);
                };
            </script>
        </body>
        </html>
    `);
    doc.close();
};
