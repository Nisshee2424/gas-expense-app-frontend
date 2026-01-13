import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

import { getAnnualSummary, saveBudget } from '../api/client';
import type { AnnualSummaryItem } from '../types';

interface AnnualPageProps {
	token: string;
}

export const AnnualPage: React.FC<AnnualPageProps> = ({ token }) => {
	const [date, setDate] = useState<Date>(new Date());
	const [summaryData, setSummaryData] = useState<AnnualSummaryItem[]>([]);
	const [loading, setLoading] = useState(false);
	const toast = useRef<Toast>(null);

	useEffect(() => {
		if (token && date) {
			fetchAnnual();
		}
	}, [token, date]);

	const fetchAnnual = async () => {
		setLoading(true);
		try {
			const year = date.getFullYear();
			const data = await getAnnualSummary(year);
			setSummaryData(data || []);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const onBudgetChange = useCallback(async (rowData: AnnualSummaryItem, newValue: number) => {
		// 1. ローカルステートを即座に更新してUIに反映 (チラつき防止)
		setSummaryData(prev => prev.map(item =>
			item.item_id === rowData.item_id ? { ...item, budget: newValue } : item
		));

		// 2. 裏側で保存を実行 (await しないことで入力をブロックしない)
		try {
			const year = date.getFullYear();
			await saveBudget(year, rowData.item_id, newValue);
		} catch (e) {
			console.error('Failed to auto-save budget:', e);
			toast.current?.show({
				severity: 'error',
				summary: '保存失敗',
				detail: `${rowData.item_name}の予算保存に失敗しました`,
				life: 3000
			});
		}
	}, [date]);

	const budgetEditor = useCallback((rowData: AnnualSummaryItem) => {
		return (
			<InputText
				value={rowData.budget === 0 ? '' : rowData.budget.toString()}
				onChange={(e) => {
					const val = e.target.value;
					if (val === '' || /^[0-9]+$/.test(val)) {
						const numVal = val === '' ? 0 : parseInt(val, 10);
						onBudgetChange(rowData, numVal);
					}
				}}
				placeholder="予算"
				className="w-full"
				inputMode="numeric"
				pattern="[0-9]*"
				style={{ width: '100px', textAlign: 'left' }}
			/>
		);
	}, [onBudgetChange]);

	// 合計行計算
	const totalCurrent = summaryData.reduce((sum, item) => sum + item.current_amount, 0);
	const totalPrev = summaryData.reduce((sum, item) => sum + item.prev_amount, 0);
	const totalBudget = summaryData.reduce((sum, item) => sum + item.budget, 0);

	const footerGroup = (
		<ColumnGroup>
			<Row>
				<Column footer="合計" colSpan={1} footerStyle={{ textAlign: 'right' }} />
				<Column footer={`¥${totalCurrent.toLocaleString()}`} align="left" />
				<Column footer={`¥${totalBudget.toLocaleString()}`} align="left" />
				<Column footer={`¥${totalPrev.toLocaleString()}`} align="left" />
			</Row>
		</ColumnGroup>
	);

	return (
		<Card title="年次集計・予算管理">
			<Toast ref={toast} />
			<div className="flex align-items-center gap-3 mb-4">
				<label>対象年:</label>
				<Calendar
					value={date}
					onChange={(e) => {
						setDate(e.value as Date);
					}}
					view="year"
					dateFormat="yy"
					showIcon
					inputStyle={{ color: '#333', width: '100px' }}
				/>
				<Button
					icon="pi pi-refresh"
					rounded
					onClick={() => {
						fetchAnnual();
					}}
					tooltip="再読み込み"
					className="p-button-text"
					disabled={loading}
				/>
			</div>

			<DataTable
				value={summaryData}
				loading={loading}
				footerColumnGroup={footerGroup}
				dataKey="item_id"
			>
				<Column
					field="item_name"
					header="費目"
					bodyStyle={{ textAlign: 'left' }}
					headerStyle={{ textAlign: 'left' }}
				/>
				<Column
					field="current_amount"
					header="今年"
					body={(r) => `¥${r.current_amount.toLocaleString()}`}
					bodyStyle={{ textAlign: 'left' }}
					headerStyle={{ textAlign: 'left' }}
				/>
				<Column
					field="budget"
					header="予算"
					body={budgetEditor}
					bodyStyle={{ textAlign: 'left' }}
					headerStyle={{ textAlign: 'left' }}
				/>
				<Column
					field="prev_amount"
					header="前年"
					body={(r) => `¥${r.prev_amount.toLocaleString()}`}
					bodyStyle={{ textAlign: 'left' }}
					headerStyle={{ textAlign: 'left' }}
				/>
			</DataTable>
		</Card>
	);
};
