import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportAnalyticsPdf(data) {
  if (!data) return;

  const doc = new jsPDF();
  const { insights, date_range, location } = data;
  const dolData = insights?.date_of_loss;

  // Header
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('WeatherShield', 14, 16);
  doc.setFontSize(10);
  doc.text('Insurance Weather Peril Report', 14, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

  // Location info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Location Details', 14, 45);
  doc.setFontSize(10);
  const addr = [location?.street_address, location?.city, location?.state, location?.zipcode].filter(Boolean).join(', ');
  doc.text(`Address: ${addr}`, 14, 53);
  doc.text(`Coordinates: ${location?.latitude?.toFixed(4)}, ${location?.longitude?.toFixed(4)}`, 14, 59);
  doc.text(`Date of Loss: ${date_range?.date_of_loss}`, 14, 65);
  doc.text(`Analysis Period: ${date_range?.start_date} to ${date_range?.end_date}`, 14, 71);

  // Summary stats
  doc.setFontSize(14);
  doc.text('Summary', 14, 85);
  doc.setFontSize(10);
  doc.text(`Total Days Analyzed: ${insights?.total_days || 0}`, 14, 93);
  doc.text(`Total Peril Days: ${insights?.peril_days || 0}`, 14, 99);
  doc.text(`Peril Frequency: ${insights?.total_days ? ((insights.peril_days / insights.total_days) * 100).toFixed(1) : 0}%`, 14, 105);

  // DOL weather
  if (dolData) {
    doc.setFontSize(14);
    doc.text('Date of Loss Weather', 14, 119);
    doc.setFontSize(10);
    doc.text(`Temperature: ${dolData.temp_min?.toFixed(1)}°F - ${dolData.temp_max?.toFixed(1)}°F`, 14, 127);
    doc.text(`Precipitation: ${dolData.precipitation?.toFixed(2)} inches`, 14, 133);
    doc.text(`Max Wind Gust: ${dolData.windgusts_max?.toFixed(1)} mph`, 14, 139);
    const dolPerils = dolData.perils?.map((p) => p.type).join(', ') || 'None';
    doc.text(`Perils Detected: ${dolPerils}`, 14, 145);
  }

  // Peril frequency table
  if (insights?.peril_frequency && Object.keys(insights.peril_frequency).length > 0) {
    const startY = dolData ? 159 : 119;
    doc.setFontSize(14);
    doc.text('Peril Frequency Breakdown', 14, startY);

    const perilRows = Object.entries(insights.peril_frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => [type, count.toString(), `${((count / (insights.total_days || 1)) * 100).toFixed(1)}%`]);

    doc.autoTable({
      startY: startY + 4,
      head: [['Peril Type', 'Days', '% of Period']],
      body: perilRows,
      theme: 'striped',
      headStyles: { fillColor: [76, 110, 245], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
    });
  }

  // All peril events table (new page if needed)
  const perilEvents = data.days?.filter((d) => d.perils.length > 0) || [];
  if (perilEvents.length > 0) {
    doc.addPage();
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('All Peril Events', 14, 14);

    const eventRows = perilEvents
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 100)
      .map((d) => [
        d.date,
        d.perils.map((p) => p.type).join(', '),
        `${d.temp_min?.toFixed(0)}–${d.temp_max?.toFixed(0)}°F`,
        `${d.precipitation?.toFixed(2)} in`,
        `${d.windgusts_max?.toFixed(0)} mph`,
      ]);

    doc.autoTable({
      startY: 26,
      head: [['Date', 'Perils', 'Temp', 'Precip', 'Wind']],
      body: eventRows,
      theme: 'striped',
      headStyles: { fillColor: [76, 110, 245], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
      },
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `WeatherShield Insurance Weather Portal — Page ${i} of ${totalPages}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const filename = `WeatherShield_${location?.city}_${location?.state}_${date_range?.date_of_loss}.pdf`;
  doc.save(filename);
}
