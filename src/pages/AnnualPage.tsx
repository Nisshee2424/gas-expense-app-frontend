import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

import { getAnnualSummary, saveBudget } from '../api/client';
import type { AnnualSummaryItem } from '../types';
import { InputText } from 'primereact/inputtext';

interface AnnualPageProps {
	token: string;
}

export const AnnualPage: React.FC<AnnualPageProps> = ({ token }) => {
	const [date, setDate] = useState<Date>(new Date());
	const [summaryData, setSummaryData] = useState<AnnualSummaryItem[]>([]);
	const [editedBudgets, setEditedBudgets] = useState<Record<number, number>>({});
	const [loading, setLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
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
			setSummaryData(data);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const onBudgetChange = (rowData: AnnualSummaryItem, newValue: number) => {
		// 編集された予算を記録
		setEditedBudgets(prev => ({
			...prev,
			[rowData.item_id]: newValue
		}));

		// 楽観的UI更新
		const newSummary = summaryData.map(item => {
			if (item.item_id === rowData.item_id) {
				return { ...item, budget: newValue };
			}
			return item;
		});
		setSummaryData(newSummary);
	};

	const handleSave = async () => {
		if (Object.keys(editedBudgets).length === 0) return;

		setIsSaving(true);
		try {
			const year = date.getFullYear();
			const savePromises = Object.entries(editedBudgets).map(([itemId, amount]) =>
				saveBudget(year, Number(itemId), amount)
			);

			await Promise.all(savePromises);

			toast.current?.show({
				severity: 'success',
				summary: '保存完了',
				detail: '予算を更新しました',
				life: 3000
			});
			setEditedBudgets({}); // 編集状態をクリア
		} catch (e) {
			console.error('Failed to save budgets:', e);
			toast.current?.show({
				severity: 'error',
				summary: 'エラー',
				detail: '予算の保存中にエラーが発生しました',
				life: 5000
			});
		} finally {
			setIsSaving(false);
		}
	};

	const budgetEditor = (rowData: AnnualSummaryItem) => {
		return (
			<InputText
				value={rowData.budget ? rowData.budget.toString() : ''}
				onChange={(e) => {
					const value = e.target.value;
					// 数字のみ許可（空文字列は許可）
					if (value === '' || /^[0-9]+$/.test(value)) {
						onBudgetChange(rowData, value === '' ? 0 : parseInt(value, 10));
					}
				}}
				style={{ width: '100px', textAlign: 'left' }}
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
			/>
		);
	};

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
						setEditedBudgets({}); // 年を変更したら編集状態をリセット
					}}
					view="year"
					dateFormat="yy"
					showIcon
					inputStyle={{ color: '#333', width: '4.5em' }}
				/>
				<Button
					icon="pi pi-refresh"
					rounded
					onClick={() => {
						fetchAnnual();
						setEditedBudgets({}); // 再読み込み時に編集状態をリセット
					}}
					tooltip="再読み込み"
					className="p-button-text"
					disabled={loading}
				/>
				<Button
					label=""
					icon="pi pi-save"
					onClick={handleSave}
					disabled={Object.keys(editedBudgets).length === 0 || isSaving}
					loading={isSaving}
					className="p-button-warning"
				/>
			</div>

			<DataTable value={summaryData} loading={loading} footerColumnGroup={footerGroup}>
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
