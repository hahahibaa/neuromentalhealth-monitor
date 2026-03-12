import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function FFTChart({ spectrum }) {
  // Format spectrum data for ChartJS
  const labels = spectrum.map(s => s.frequency.toFixed(1) + 'Hz');
  const magnitudes = spectrum.map(s => s.magnitude);

  // Default color is a muted blue, highlight Alpha (8-12Hz) in green
  const backgroundColors = spectrum.map(s => {
    if (s.frequency >= 8 && s.frequency <= 12) {
      return 'rgba(16, 185, 129, 0.8)'; // Green for Alpha
    }
    return 'rgba(59, 130, 246, 0.5)'; // Blue for others
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Power',
        data: magnitudes,
        backgroundColor: backgroundColors,
        borderRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94a3b8',
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="glass-panel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1rem', color: '#94a3b8', fontFamily: 'var(--font-heading)' }}>Power Spectrum (1-40 Hz)</h3>
      <div style={{ flex: 1, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
