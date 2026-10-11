import { GroundTruthValues } from '../types';

export interface SalesRecord {
  date: string;
  month: string;
  region: string;
  category: string;
  product: string;
  units: number;
  unit_price: number;
  revenue: number;
}

// Deterministic Pseudo-Random Generator (Linear Congruential Generator)
class SeededRandom {
  private state: number;
  constructor(seed = 123456789) {
    this.state = seed;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  intBetween(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export function generateSalesDataset(rowCount = 200): { csv: string; records: SalesRecord[]; groundTruth: GroundTruthValues } {
  const rng = new SeededRandom(42);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const regions = ['North', 'South', 'East', 'West'];

  const categoryProducts: Record<string, { product: string; basePrice: number }[]> = {
    'Electronics': [
      { product: 'Wireless Mouse', basePrice: 25 },
      { product: 'Mechanical Keyboard', basePrice: 85 },
      { product: '27-inch Monitor', basePrice: 220 },
      { product: 'USB-C Dock', basePrice: 110 },
      { product: 'Noise-Cancelling Headphones', basePrice: 160 },
    ],
    'Office Supplies': [
      { product: 'Ergonomic Desk Mat', basePrice: 30 },
      { product: 'Heavy Duty Stapler', basePrice: 18 },
      { product: 'Gel Pens (Pack of 12)', basePrice: 12 },
      { product: 'Laser Printer Paper (Box)', basePrice: 45 },
      { product: 'Desk Organizer Tray', basePrice: 22 },
    ],
    'Furniture': [
      { product: 'Ergonomic Mesh Chair', basePrice: 280 },
      { product: 'Standing Desk Frame', basePrice: 350 },
      { product: 'Filing Cabinet 3-Drawer', basePrice: 140 },
      { product: 'Monitor Arm Mount', basePrice: 65 },
      { product: 'Footrest Cushion', basePrice: 35 },
    ],
  };

  const categories = Object.keys(categoryProducts);
  const records: SalesRecord[] = [];

  let grandTotal = 0;
  const monthSums: Record<string, number> = {};
  const categorySums: Record<string, number> = {};

  for (const m of months) monthSums[m] = 0;
  for (const c of categories) categorySums[c] = 0;

  for (let i = 1; i <= rowCount; i++) {
    const month = rng.choice(months);
    const region = rng.choice(regions);
    const category = rng.choice(categories);
    const productItem = rng.choice(categoryProducts[category]);

    // Units between 1 and 15
    const units = rng.intBetween(1, 15);
    // Slight price variance +/- 5%
    const priceVariance = (rng.next() * 0.1 - 0.05);
    const unit_price = Math.round(productItem.basePrice * (1 + priceVariance) * 100) / 100;
    const revenue = Math.round(units * unit_price * 100) / 100;

    const day = rng.intBetween(1, 28).toString().padStart(2, '0');
    const monthIndex = (months.indexOf(month) + 1).toString().padStart(2, '0');
    const date = `2026-${monthIndex}-${day}`;

    records.push({
      date,
      month,
      region,
      category,
      product: productItem.product,
      units,
      unit_price,
      revenue,
    });

    grandTotal += revenue;
    monthSums[month] += revenue;
    categorySums[category] += revenue;
  }

  // Round values
  const totalRevenue = Math.round(grandTotal * 100) / 100;
  const monthlyRevenue: Record<string, number> = {};
  for (const m of months) {
    monthlyRevenue[m] = Math.round(monthSums[m] * 100) / 100;
  }

  const roundedCategorySums: Record<string, number> = {};
  let topCategory = categories[0];
  let maxCatRev = 0;
  for (const c of categories) {
    const sum = Math.round(categorySums[c] * 100) / 100;
    roundedCategorySums[c] = sum;
    if (sum > maxCatRev) {
      maxCatRev = sum;
      topCategory = c;
    }
  }

  const averageOrderValue = Math.round((totalRevenue / rowCount) * 100) / 100;

  const groundTruth: GroundTruthValues = {
    totalRevenue,
    monthlyRevenue,
    topCategory,
    categoryRevenues: roundedCategorySums,
    averageOrderValue,
    totalOrders: rowCount,
  };

  // Convert to CSV
  const headers = ['date', 'month', 'region', 'category', 'product', 'units', 'unit_price', 'revenue'];
  const csvLines = [headers.join(',')];
  for (const r of records) {
    csvLines.push(`${r.date},${r.month},${r.region},"${r.category}","${r.product}",${r.units},${r.unit_price.toFixed(2)},${r.revenue.toFixed(2)}`);
  }
  const csv = csvLines.join('\n');

  return { csv, records, groundTruth };
}
