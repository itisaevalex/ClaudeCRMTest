import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import RevenueChart from '../components/RevenueChart';

interface Transaction {
  id: number;
  customer: {
    name: string;
  };
  dateTime: string;
  price: number;
  cleaningType: string;
}

interface RevenueData {
  month: string;
  amount: number;
}

interface OverviewStats {
  monthlyRevenue: number;
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
}

function FinancialTracking() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, transactionsRes, revenueRes] = await Promise.all([
          fetch('http://localhost:5001/api/finances/overview'),
          fetch('http://localhost:5001/api/finances/transactions'),
          fetch('http://localhost:5001/api/finances/revenue-graph')
        ]);

        if (!overviewRes.ok) throw new Error('Failed to fetch overview');
        if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');
        if (!revenueRes.ok) throw new Error('Failed to fetch revenue data');

        const overviewData = await overviewRes.json();
        const transactionsData = await transactionsRes.json();
        const revenueData = await revenueRes.json();

        setStats(overviewData);
        setTransactions(transactionsData);
        setRevenueData(revenueData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Financial Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          label="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toFixed(2)}`}
          bgColor="bg-blue-100"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          label="Total Bookings"
          value={stats.totalBookings.toString()}
          bgColor="bg-green-100"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6 text-yellow-600" />}
          label="Upcoming"
          value={stats.upcomingBookings.toString()}
          bgColor="bg-yellow-100"
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6 text-purple-600" />}
          label="Completed"
          value={stats.completedBookings.toString()}
          bgColor="bg-purple-100"
        />
      </div>

      {/* Revenue Graph */}
      <div className="bg-white shadow rounded-lg p-6">
        <RevenueChart data={revenueData} />
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.dateTime).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.cleaningType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      new Date(transaction.dateTime) < new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {new Date(transaction.dateTime) < new Date() ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, bgColor }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`p-2 ${bgColor} rounded-lg`}>
        {icon}
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default FinancialTracking;