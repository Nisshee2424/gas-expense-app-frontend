import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
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
	// 編集モード用ステートは将来的な拡張用にコメントアウト
	// const [editingRows, setEditingRows] = useState<{ [key: string]: boolean }>({});
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

	const onBudgetChange = async (rowData: AnnualSummaryItem, newValue: number) => {
		// 楽観的UI更新
		const newSummary = summaryData.map(item => {
			if (item.item_id === rowData.item_id) {
				return { ...item, budget: newValue };
			}
			return item;
		});
		setSummaryData(newSummary);

		try {
			const year = date.getFullYear();
			await saveBudget(year, rowData.item_id, newValue);
			toast.current?.show({ severity: 'success', summary: '保存', detail: '予算を更新しました', life: 1000 });
		} catch (e: any) {
			toast.current?.show({ severity: 'error', summary: 'エラー', detail: '予算更新に失敗しました' });
			// 戻すなどの処理が必要だが今回は省略
		}
	};

	const budgetEditor = (rowData: AnnualSummaryItem) => {
		return (
			<InputNumber
				value={rowData.budget}
				onValueChange={(e) => onBudgetChange(rowData, e.value || 0)}
				mode="currency" currency="JPY" locale="ja-JP"
				inputStyle={{ width: '100px', textAlign: 'right' }}
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
				<Column footer={totalCurrent.toLocaleString()} align="right" />
				<Column footer={totalBudget.toLocaleString()} align="right" />
				<Column footer={totalPrev.toLocaleString()} align="right" />
			</Row>
		</ColumnGroup>
	);

	return (
		<Card title="年次集計・予算管理">
			<Toast ref={toast} />
			<div className="flex align-items-center gap-3 mb-4">
				<label>対象年:</label>
				<Calendar value={date} onChange={(e) => setDate(e.value as Date)} view="year" dateFormat="yy" showIcon inputStyle={{ color: '#333' }} />
				<Button icon="pi pi-refresh" rounded text onClick={fetchAnnual} tooltip="再読み込み" />
			</div>

			<DataTable value={summaryData} loading={loading} footerColumnGroup={footerGroup} sortField="current_amount" sortOrder={-1}>
				<Column field="item_name" header="費目" sortable />
				<Column field="current_amount" header="実績(今年)" sortable body={(r) => r.current_amount.toLocaleString()} align="right" />
				<Column field="budget" header="予算" body={budgetEditor} align="right" />
				<Column field="prev_amount" header="実績(前年)" sortable body={(r) => r.prev_amount.toLocaleString()} align="right" />
			</DataTable>
		</Card>
	);
};
