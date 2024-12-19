import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DataItem {
  name: string;
  value: number;
}

interface MyPieChartProps {
  data: DataItem[];
  title: string;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}

const MyPieChart: React.FC<MyPieChartProps> = ({ data, title }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  const RADIAN = Math.PI / 180;

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: CustomLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null; // Don't show labels for small segments
    
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  // If no data or empty array, show a message
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow flex items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 md:h-[400px] bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>
      <div className="w-full h-[calc(110%-1rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value} athletes`, name]}
            />
            <Legend 
              layout="horizontal" 
              align="center"
              verticalAlign="bottom"
              wrapperStyle={{
                paddingTop: '12px',
                maxWidth: '100%',
                overflowX: 'auto'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MyPieChart;