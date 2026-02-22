import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VerdictStatus } from '@/constants/rules';

export interface ScanRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  answers: Record<string, string>;
  handBaggageStatus: VerdictStatus;
  checkedBaggageStatus: VerdictStatus;
  handBaggageText: string;
  checkedBaggageText: string;
  handBaggageTip?: string;
  checkedBaggageTip?: string;
  photoUri?: string;
  timestamp: number;
}

const STORAGE_KEY = 'zrh_scan_history';

export async function getScanHistory(): Promise<ScanRecord[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data) as ScanRecord[];
}

export async function saveScanRecord(record: ScanRecord): Promise<void> {
  const history = await getScanHistory();
  history.unshift(record);
  if (history.length > 50) history.length = 50;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export async function deleteScanRecord(id: string): Promise<void> {
  const history = await getScanHistory();
  const updated = history.filter(r => r.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function clearScanHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
