import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
    title: string;
    date: string;
    kpis: {
        revenue: string;
        orders: number;
        aov: string;
        customers: number;
    };
    aiInsight: {
        title: string;
        content: string;
        type: string;
    } | null;
}

export const generateFullReport = async (data: ReportData) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Helper: Add Title
    doc.setFontSize(24);
    doc.setTextColor(33, 41, 54); // Slate-900
    doc.text(data.title, margin, 30);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Generated on: ${data.date}`, margin, 38);

    // --- SECTION 1: Executive Summary (KPIs) ---
    doc.setFontSize(16);
    doc.setTextColor(33, 41, 54);
    doc.text("Executive Summary", margin, 55);

    // Draw KPI Cards (Simple Text Boxes)
    const cardWidth = 40;
    const cardHeight = 25;
    const gap = 5;
    let startX = margin;
    const startY = 65;

    // Revenue
    doc.setFillColor(239, 246, 255); // Blue-50
    doc.roundedRect(startX, startY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(59, 130, 246); // Blue-500
    doc.text("Total Revenue", startX + 5, startY + 8);
    doc.setFontSize(12);
    doc.setTextColor(33, 41, 54);
    doc.text(data.kpis.revenue, startX + 5, startY + 18);

    startX += cardWidth + gap;

    // Orders
    doc.setFillColor(255, 247, 237); // Orange-50
    doc.roundedRect(startX, startY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(249, 115, 22); // Orange-500
    doc.text("Active Orders", startX + 5, startY + 8);
    doc.setFontSize(12);
    doc.setTextColor(33, 41, 54);
    doc.text(data.kpis.orders.toString(), startX + 5, startY + 18);

    startX += cardWidth + gap;

    // AOV
    doc.setFillColor(240, 253, 244); // Green-50
    doc.roundedRect(startX, startY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(34, 197, 94); // Green-500
    doc.text("Avg. Order Value", startX + 5, startY + 8);
    doc.setFontSize(12);
    doc.setTextColor(33, 41, 54);
    doc.text(data.kpis.aov, startX + 5, startY + 18);

    startX += cardWidth + gap;

    // Customers
    doc.setFillColor(245, 243, 255); // Purple-50
    doc.roundedRect(startX, startY, cardWidth, cardHeight, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(139, 92, 246); // Purple-500
    doc.text("Active Customers", startX + 5, startY + 8);
    doc.setFontSize(12);
    doc.setTextColor(33, 41, 54);
    doc.text(data.kpis.customers.toString(), startX + 5, startY + 18);

    // --- SECTION 2: AI Analysis ---
    if (data.aiInsight) {
        const insightY = startY + cardHeight + 20;
        doc.setFontSize(16);
        doc.setTextColor(33, 41, 54);
        doc.text("AI Business Analysis", margin, insightY);

        // Insight Box
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, insightY + 5, pageWidth - (margin * 2), 40, 3, 3, 'FD');

        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(data.aiInsight.title, margin + 5, insightY + 15);

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // Slate-600
        const splitText = doc.splitTextToSize(data.aiInsight.content, pageWidth - (margin * 2) - 10);
        doc.text(splitText, margin + 5, insightY + 25);
    }

    // --- SECTION 3: Visual Analytics (New Page) ---
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(33, 41, 54);
    doc.text("Visual Analytics: Revenue Trends", margin, 20);

    // Capture Revenue Chart
    await addChartToDoc(doc, 'revenue-chart-container', margin, 30, pageWidth - (margin * 2), 80);

    doc.setFontSize(10); // Explanation
    doc.setTextColor(71, 85, 105);
    const trendExpl = "This chart visualizes the revenue trajectory over the selected period. The purple dashed line indicates the projected forecast based on historical linear regression analysis.";
    const splitTrend = doc.splitTextToSize(trendExpl, pageWidth - (margin * 2));
    doc.text(splitTrend, margin, 120);

    // --- SECTION 4: Categories & Regions (New Page) ---
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(33, 41, 54);
    doc.text("Market Segmentation", margin, 20);

    // Capture Category Chart
    doc.setFontSize(12);
    doc.text("Top Categories", margin, 35);
    await addChartToDoc(doc, 'category-chart-container', margin, 40, pageWidth - (margin * 2), 70);

    doc.setFontSize(10);
    const catExpl = "Performance breakdown by product category. Focus on top performers to drive inventory decisions.";
    doc.text(catExpl, margin, 115);

    // Capture Region Chart
    doc.setFontSize(12);
    doc.setTextColor(33, 41, 54);
    doc.text("Regional Distribution", margin, 135);
    await addChartToDoc(doc, 'region-chart-container', margin, 140, pageWidth - (margin * 2), 70);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const regExpl = "Geographic distribution of sales revenue. Identifying key regions allows for targeted marketing campaigns.";
    doc.text(regExpl, margin, 220);

    doc.save("Executive_Report.pdf");
};

const addChartToDoc = async (doc: jsPDF, elementId: string, x: number, y: number, w: number, h: number) => {
    const element = document.getElementById(elementId);
    if (element) {
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', x, y, w, h);
        } catch (e) {
            doc.setFontSize(10);
            doc.setTextColor(239, 68, 68);
            doc.text(`[Chart unavailable: ${elementId}]`, x, y + 10);
        }
    }
};
