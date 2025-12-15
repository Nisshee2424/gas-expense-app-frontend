import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

import { getMonthlyTransactions, updateTransaction, deleteTransaction } from '../api/client';
import type { Item, Transaction } from '../types';

interface MonthlyPageProps {
	items: Item[];
	token: string;
}

interface CategorySummary {
	item_id: number;
	item_name: string;
	amount: number;
}

export const MonthlyPage: React.FC<MonthlyPageProps> = ({ items, token }) => {
	const [date, setDate] = useState<Date>(new Date());
	const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(false);

	// 編集モーダル用
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
	const [editDate, setEditDate] = useState<Date>(new Date());
	const [editItemId, setEditItemId] = useState<number | null>(null);
	const [editNote, setEditNote] = useState<string>('');
	const [editAmount, setEditAmount] = useState<number>(0);

	const toast = useRef<Toast>(null);

	useEffect(() => {
		if (token && date) {
			fetchMonthly();
		}
	}, [token, date]);

	const fetchMonthly = async () => {
		setLoading(true);
		try {
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const data = await getMonthlyTransactions(year, month);
			setAllTransactions(data || []);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const getItemName = (id: number) => items.find(i => i.id === id)?.name || `ID:${id}`;

	// データを分類
	const fixedCosts = allTransactions.filter(t => !t.day);
	const variableCosts = allTransactions.filter(t => t.day);

	// 費目別集計
	const categorySummary: CategorySummary[] = [];
	const categoryMap = new Map<number, number>();
	allTransactions.forEach(t => {
		const current = categoryMap.get(t.item_id) || 0;
		categoryMap.set(t.item_id, current + Number(t.amount));
	});
	categoryMap.forEach((amount, item_id) => {
		categorySummary.push({
			item_id,
			item_name: getItemName(item_id),
			amount
		});
	});
	categorySummary.sort((a, b) => b.amount - a.amount);

	// 合計計算
	const totalAll = allTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
	const totalFixed = fixedCosts.reduce((sum, t) => sum + Number(t.amount), 0);
	const totalVariable = variableCosts.reduce((sum, t) => sum + Number(t.amount), 0);

	// 固定費の金額編集
	const handleFixedCostChange = async (tx: Transaction, newAmount: number) => {
		try {
			await updateTransaction(tx.id, {
				year: tx.year,
				month: tx.month,
				day: tx.day,
				item_id: tx.item_id,
				amount: newAmount
			});
			toast.current?.show({ severity: 'success', summary: '更新', detail: '固定費を更新しました', life: 1000 });
			fetchMonthly();
		} catch (e: any) {
			toast.current?.show({ severity: 'error', summary: 'エラー', detail: e.message });
		}
	};

	// 編集モーダルを開く
	const openEditDialog = (tx: Transaction) => {
		setEditingTransaction(tx);
		setEditDate(new Date(tx.year, tx.month - 1, Number(tx.day) || 1));
		setEditItemId(tx.item_id);
		setEditNote(tx.note || '');
		setEditAmount(Number(tx.amount));
		setEditDialogVisible(true);
	};

	// 更新処理
	const handleUpdate = async () => {
		if (!editingTransaction || !editItemId) return;
		setEditDialogVisible(false);
		try {
			await updateTransaction(editingTransaction.id, {
				year: editDate.getFullYear(),
				month: editDate.getMonth() + 1,
				day: editDate.getDate(),
				item_id: editItemId,
				note: editNote,
				amount: editAmount
			});
			toast.current?.show({ severity: 'success', summary: '更新完了', detail: 'データを更新しました' });
			fetchMonthly();
		} catch (e: any) {
			toast.current?.show({ severity: 'error', summary: 'エラー', detail: e.message });
		}
	};

	// 削除処理
	const handleDelete = () => {
		if (!editingTransaction) return;
		confirmDialog({
			message: '本当に削除しますか？',
			header: '削除確認',
			icon: 'pi pi-exclamation-triangle',
			accept: async () => {
				try {
					await deleteTransaction(editingTransaction.id);
					toast.current?.show({ severity: 'success', summary: '削除完了', detail: '削除しました' });
					setEditDialogVisible(false);
					fetchMonthly();
				} catch (e: any) {
					toast.current?.show({ severity: 'error', summary: 'エラー', detail: e.message });
				}
			}
		});
	};

	// フッター
	const categoryFooter = (
		<ColumnGroup>
			<Row>
				<Column footer="合計" footerStyle={{ textAlign: 'left' }} />
				<Column footer={`¥${totalAll.toLocaleString()}`} />
			</Row>
		</ColumnGroup>
	);

	const fixedFooter = (
		<ColumnGroup>
			<Row>
				<Column footer="小計" footerStyle={{ textAlign: 'left' }} />
				<Column footer={`¥${totalFixed.toLocaleString()}`} />
			</Row>
		</ColumnGroup>
	);

	const variableFooter = (
		<ColumnGroup>
			<Row>
				<Column footer="小計" colSpan={3} footerStyle={{ textAlign: 'left' }} />
				<Column footer={`¥${totalVariable.toLocaleString()}`} />
				<Column footer="" />
			</Row>
		</ColumnGroup>
	);

	return (
		<div className="grid">
			<Toast ref={toast} />
			<ConfirmDialog />

			{/* 月選択 */}
			<div className="col-12">
				<div className="flex align-items-center gap-3 mb-4">
					<label>対象月:</label>
					<Calendar value={date} onChange={(e) => setDate(e.value as Date)} view="month" dateFormat="yy/mm" showIcon inputStyle={{ color: '#333' }} />
					<Button icon="pi pi-refresh" rounded text onClick={fetchMonthly} tooltip="再読み込み" />
				</div>
			</div>

			{/* 費目別集計 */}
			<div className="col-12 md:col-6">
				<Card title="費目別集計">
					<DataTable value={categorySummary} loading={loading} footerColumnGroup={categoryFooter} size="small" stripedRows>
						<Column field="item_name" header="費目" />
						<Column field="amount" header="金額" body={(row) => `¥${row.amount.toLocaleString()}`} />
					</DataTable>
				</Card>
			</div>

			{/* 固定費 */}
			<div className="col-12 md:col-6">
				<Card title="固定費">
					<DataTable value={fixedCosts} loading={loading} footerColumnGroup={fixedFooter} size="small" stripedRows emptyMessage="固定費データがありません">
						<Column field="item_id" header="費目" body={(row) => getItemName(row.item_id)} />
						<Column
							field="amount"
							header="金額"
							body={(row) => (
								<InputNumber
									value={Number(row.amount)}
									onValueChange={(e) => {
										if (e.value !== undefined && e.value !== null) {
											handleFixedCostChange(row, e.value);
										}
									}}
									className="w-full"
									useGrouping={true}
									inputStyle={{ maxWidth: '120px' }}
								/>
							)}
						/>
					</DataTable>
				</Card>
			</div>

			{/* 明細一覧 */}
			<div className="col-12">
				<Card title="明細一覧">
					<DataTable
						value={variableCosts}
						loading={loading}
						footerColumnGroup={variableFooter}
						sortField="day"
						sortOrder={-1}
						removableSort
						size="small"
						stripedRows
						emptyMessage="明細データがありません"
					>
						<Column field="day" header="日" sortable style={{ width: '60px' }} />
						<Column field="item_id" header="費目" sortable body={(row) => getItemName(row.item_id)} />
						<Column field="note" header="品目" />
						<Column field="amount" header="金額" sortable body={(row) => `¥${Number(row.amount).toLocaleString()}`} />
						<Column body={(row) => (
							<Button icon="pi pi-pencil" text severity="info" onClick={() => openEditDialog(row)} />
						)} style={{ width: '50px' }} />
					</DataTable>
				</Card>
			</div>

			{/* 編集モーダル */}
			<Dialog
				header="明細編集"
				visible={editDialogVisible}
				onHide={() => setEditDialogVisible(false)}
				style={{ width: '90vw', maxWidth: '500px' }}
			>
				<div className="field">
					<label className="block mb-2">日付</label>
					<Calendar value={editDate} onChange={(e) => setEditDate(e.value as Date)} showIcon dateFormat="yy/mm/dd" className="w-full" />
				</div>

				<div className="field">
					<label>費目</label>
					<Dropdown
						value={editItemId}
						options={items}
						optionLabel="name"
						optionValue="id"
						onChange={(e) => setEditItemId(e.value)}
						placeholder="費目を選択"
						className="w-full"
					/>
				</div>

				<div className="field">
					<label>品目</label>
					<InputText
						value={editNote}
						onChange={(e) => setEditNote(e.target.value)}
						placeholder="品目を入力（任意）"
						className="w-full"
					/>
				</div>

				<div className="field">
					<label>金額</label>
					<InputNumber
						value={editAmount}
						onValueChange={(e) => setEditAmount(e.value || 0)}
						placeholder="金額"
						className="w-full"
						useGrouping={true}
					/>
				</div>

				<div className="flex justify-content-between mt-4">
					<Button label="削除" icon="pi pi-trash" severity="danger" onClick={handleDelete} />
					<Button label="更新" icon="pi pi-check" severity="warning" onClick={handleUpdate} />
				</div>
			</Dialog>
		</div>
	);
};
