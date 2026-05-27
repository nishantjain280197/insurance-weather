import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

const SAMPLE_CSV = `street_address,city,state,zipcode,latitude,longitude,date_of_loss
123 Main St,Houston,TX,77001,29.7604,-95.3698,2023-06-15
456 Oak Ave,Miami,FL,33101,25.7617,-80.1918,2023-09-01
789 Pine Rd,Chicago,IL,60601,41.8781,-87.6298,2023-12-20`;

export default function BatchUpload() {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const required = ['city', 'state', 'latitude', 'longitude', 'date_of_loss'];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(', ')}`);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map((v) => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      row.latitude = parseFloat(row.latitude);
      row.longitude = parseFloat(row.longitude);
      if (isNaN(row.latitude) || isNaN(row.longitude)) {
        throw new Error(`Row ${i}: Invalid latitude/longitude`);
      }
      if (!row.city || !row.state || !row.date_of_loss) {
        throw new Error(`Row ${i}: Missing city, state, or date_of_loss`);
      }
      if (!US_STATES.includes(row.state.toUpperCase())) {
        throw new Error(`Row ${i}: Invalid state code "${row.state}"`);
      }
      rows.push(row);
    }
    return rows;
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setParseError('');
    setParsedRows([]);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        setParsedRows(rows);
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.readAsText(f);
  };

  const handleProcess = async () => {
    if (parsedRows.length === 0) return;
    setProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      const res = await fetch('/api/batch/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rows: parsedRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setProgress(100);
    } catch (err) {
      setParseError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Batch Address Upload</h2>
          <p className="text-gray-500 dark:text-storm-400 mt-1">Process multiple addresses at once via CSV upload</p>
        </div>
        <button
          onClick={downloadSample}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-storm-600 text-gray-700 dark:text-storm-300 hover:bg-gray-100 dark:hover:bg-storm-800 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Template
        </button>
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-storm-900/50 rounded-xl p-6 border border-gray-200 dark:border-white/10 mb-6">
        <div className="border-2 border-dashed border-gray-300 dark:border-storm-600 rounded-lg p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-storm-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-storm-400 mb-2">
            Upload a CSV file with columns: <code className="bg-gray-100 dark:bg-storm-800 px-1 rounded">city, state, latitude, longitude, date_of_loss</code>
          </p>
          <p className="text-xs text-gray-400 dark:text-storm-500 mb-4">Optional columns: street_address, zipcode • Maximum 50 addresses per batch</p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-storm-600 text-white rounded-lg text-sm cursor-pointer hover:bg-storm-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Choose CSV File
          </label>
          {file && <p className="text-sm text-gray-600 dark:text-storm-300 mt-2">{file.name}</p>}
        </div>
      </div>

      {parseError && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
          {parseError}
        </div>
      )}

      {/* Preview table */}
      {parsedRows.length > 0 && !results && (
        <div className="bg-white dark:bg-storm-900/50 rounded-xl border border-gray-200 dark:border-white/10 mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{parsedRows.length} addresses ready to process</h3>
            <button
              onClick={handleProcess}
              disabled={processing}
              className="px-4 py-2 text-sm rounded-lg bg-storm-600 text-white hover:bg-storm-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {processing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  Process All
                </>
              )}
            </button>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-storm-800">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">#</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">City</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">State</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">Lat/Lng</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">DOL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-storm-700">
                {parsedRows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-storm-800/50">
                    <td className="px-3 py-2 text-gray-500 dark:text-storm-400">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{row.city}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{row.state}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-storm-400">{row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{row.date_of_loss}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="bg-white dark:bg-storm-900/50 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Batch Results</h3>
            <div className="flex gap-4 mt-2">
              <span className="text-sm text-green-600 dark:text-green-400">{results.success} succeeded</span>
              {results.failed > 0 && <span className="text-sm text-red-600 dark:text-red-400">{results.failed} failed</span>}
              <span className="text-sm text-gray-500 dark:text-storm-400">{results.total} total</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-storm-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">#</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">Location</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">Status</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">Peril Days</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">Peril %</th>
                  <th className="px-3 py-2 text-left text-gray-600 dark:text-storm-300">Max Wind</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-storm-700">
                {results.results.map((r) => (
                  <tr key={r.index} className="hover:bg-gray-50 dark:hover:bg-storm-800/50">
                    <td className="px-3 py-2 text-gray-500 dark:text-storm-400">{r.index + 1}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{r.location || r.input?.city}</td>
                    <td className="px-3 py-2">
                      {r.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Success
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 text-xs">{r.error}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{r.summary?.peril_days ?? '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{r.summary?.peril_percentage ? `${r.summary.peril_percentage}%` : '—'}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{r.summary?.max_wind_gust ? `${r.summary.max_wind_gust} mph` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
