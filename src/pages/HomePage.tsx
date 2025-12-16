import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';

import { createTransaction, deleteTransaction, getRecentTransactions, updateTransaction } from '../api/client';
import type { Item, Transaction } from '../types';
import { items } from '../constants/items';

interface HomePageProps {
	items: Item[];
	token: string;
}

export const HomePage: React.FC<HomePageProps> = ({ token }) => {
	// 新規登録用
	const [date, setDate] = useState<Date>(new Date());
	const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
	const [note, setNote] = useState<string>(''); // 品目
	const [amounts, setAmounts] = useState<number[]>([0]);
	const [loading, setLoading] = useState(false);

	// 一覧と編集モーダル用
	const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
	const [editDialogVisible, setEditDialogVisible] = useState(false);
	const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
	const [editDate, setEditDate] = useState<Date>(new Date());
	const [editItemId, setEditItemId] = useState<number | null>(null);
	const [editNote, setEditNote] = useState<string>('');
	const [editAmount, setEditAmount] = useState<number>(0);

	// 中央通知用
	const [notification, setNotification] = useState<string | null>(null);

	const toast = useRef<Toast>(null);
	const hasFetched = useRef(false);

	useEffect(() => {
		if (token && !hasFetched.current) {
			hasFetched.current = true;
			fetchRecent();
		}
	}, [token]);

	const fetchRecent = async () => {
		try {
			setLoading(true);
			const data = await getRecentTransactions();
			setRecentTransactions(data);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	// 中央通知を表示
	const showNotification = (message: string) => {
		setNotification(message);
		setTimeout(() => setNotification(null), 2000);
	};

	// 新規登録の入力が完了しているか
	const isFormValid = selectedItemId !== null && amounts.reduce((s, a) => s + (a || 0), 0) > 0 && note.trim() !== '';

	const handleAddAmount = () => {
		setAmounts([...amounts, 0]);
	};

	const handleDateShortcut = (diff: number) => {
		const d = new Date();
		d.setDate(d.getDate() - diff);
		setDate(d);
	};

	const handleSubmit = async () => {
		if (!isFormValid) return;

		// 先に入力をクリア（即座に次の入力ができるように）
		const submitData = {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			item_id: selectedItemId,
			amount: amounts.reduce((sum, a) => sum + (a || 0), 0),
			note: note,
			is_income: 0
		};
		setSelectedItemId(null);
		setNote('');
		setAmounts([0]);

		showNotification('登録中...');
		setLoading(true);
		try {
			await createTransaction(submitData);
			showNotification('登録しました！');
			fetchRecent();
		} catch (e: any) {
			showNotification(`エラー: ${e.message}`);
		} finally {
			setLoading(false);
		}
	};

	// 編集モーダルを開く
	const openEditDialog = (tx: Transaction) => {
		setEditingTransaction(tx);
		setEditDate(new Date(tx.year, tx.month - 1, Number(tx.day)));
		setEditItemId(tx.item_id);
		setEditNote(tx.note || '');
		setEditAmount(Number(tx.amount));
		setEditDialogVisible(true);
	};

	// 編集モーダルの更新処理
	const handleUpdate = async () => {
		if (!editingTransaction || !editItemId || !editAmount) return;

		// 先にモーダルを閉じる
		setEditDialogVisible(false);
		showNotification('更新中...');
		setLoading(true);
		try {
			await updateTransaction(editingTransaction.id, {
				year: editDate.getFullYear(),
				month: editDate.getMonth() + 1,
				day: editDate.getDate(),
				item_id: editItemId,
				note: editNote,
				amount: editAmount
			});
			showNotification('更新しました！');
			fetchRecent();
		} catch (e: any) {
			showNotification(`エラー: ${e.message}`);
		} finally {
			setLoading(false);
		}
	};

	// 編集モーダルの削除処理
	const handleDeleteFromModal = () => {
		if (!editingTransaction) return;
		// 先にモーダルを閉じる
		setEditDialogVisible(false);
		confirmDialog({
			message: '本当に削除しますか？',
			header: '削除確認',
			accept: async () => {
				showNotification('削除中...');
				try {
					await deleteTransaction(editingTransaction.id);
					showNotification('削除しました！');
					fetchRecent();
				} catch (e: any) {
					showNotification(`エラー: ${e.message}`);
				}
			}
		});
	};

	const getItemName = (id: number) => items.find(i => i.id === id)?.name || id;

	const getDayLabel = (dateObj: Date) => {
		const days = ['日', '月', '火', '水', '木', '金', '土'];
		return days[dateObj.getDay()];
	};

	return (
		<div className="grid">
			<Toast ref={toast} />
			<ConfirmDialog />

			{/* 中央通知オーバーレイ */}
			{notification && (
				<div className="custom-notification-overlay">
					<div className="custom-notification">{notification}</div>
				</div>
			)}

			{/* 新規登録フォーム */}
			<div className="col-12 md:col-6">
				<Card title="新規登録">
					<div className="field">
						<label className="block mb-2">1. 日付: {date && date.toLocaleDateString()} ({getDayLabel(date)})</label>
						<div className="flex flex-wrap gap-2 mb-2">
							<Button label="今日" size="small" outlined onClick={() => handleDateShortcut(0)} className="flex-shrink-0" />
							<Button label="昨日" size="small" outlined onClick={() => handleDateShortcut(1)} className="flex-shrink-0" />
							<Button label="一昨日" size="small" outlined onClick={() => handleDateShortcut(2)} className="flex-shrink-0" />
							{/* <Button label="3日前" size="small" outlined onClick={() => handleDateShortcut(3)} className="flex-shrink-0" /> */}
						</div>
						<Calendar value={date} onChange={(e) => setDate(e.value as Date)} showIcon dateFormat="yy/mm/dd" />
					</div>

					<div className="field">
						<label>2. 金額</label>
						{amounts.map((amt, index) => (
							<div key={index} className="flex gap-2 mb-2 align-items-center">
								<InputNumber
									value={amt}
									onValueChange={(e) => {
										const newAmounts = [...amounts];
										newAmounts[index] = e.value || 0;
										setAmounts(newAmounts);
									}}
									placeholder="金額"
									className="w-full"
									useGrouping={true}
									inputMode="decimal"
									pattern="[0-9]*"
								/>
							</div>
						))}
						<Button icon="pi pi-plus" label="金額追加" className="p-button-text p-button-sm" onClick={handleAddAmount} />
						<div className="mt-2 text-right font-bold">
							合計: {amounts.reduce((s, a) => s + (a || 0), 0).toLocaleString()}円
						</div>
					</div>

					<div className="field">
						<label>3. 費目</label>
						<Dropdown
							value={selectedItemId}
							options={items}
							optionLabel="name"
							optionValue="id"
							onChange={(e) => setSelectedItemId(e.value)}
							placeholder={items.length === 0 ? "読み込み中..." : "費目を選択"}
							className="w-full"
							emptyMessage="利用可能な費目がありません"
						/>
					</div>

					<div className="field">
						<label>4. 品目</label>
						<InputText
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="例) ミスド"
							className="w-full"
						/>
					</div>

					{/* 登録ボタン: 入力完了時のみ有効で橙色 */}
					<Button
						label="登録"
						icon="pi pi-check"
						onClick={handleSubmit}
						disabled={!isFormValid}
						severity={isFormValid ? "warning" : undefined}
						className={isFormValid ? "" : "p-button-secondary"}
					/>
				</Card>
			</div>

			{/* 直近の明細 */}
			<div className="col-12 md:col-6">
				<Card title="直近の明細">
					<DataTable
                        value={recentTransactions}
                        loading={loading}
                        size="small"
                        stripedRows
                        emptyMessage="明細データがありません"
                        selectionMode="single"
                        onRowClick={(e) => {
                            const transaction = e.data as Transaction;
                            if (transaction) {
                                openEditDialog(transaction);
                            }
                        }}
                        rowClassName={() => "cursor-pointer hover:surface-100"}
                    >
						<Column field="date" header="日付" body={(rowData) => `${rowData.month}/${rowData.day} (${getDayLabel(new Date(rowData.year, rowData.month - 1, rowData.day))})`} />
						<Column field="item_id" header="費目" body={(rowData) => getItemName(rowData.item_id)} />
						<Column field="note" header="品目" />
						<Column field="amount" header="金額" body={(rowData) => `¥${Number(rowData.amount).toLocaleString()}`} />
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
				<div className="field mt-3">
					<label className="block mb-2">日付</label>
					<Calendar value={editDate} onChange={(e) => setEditDate(e.value as Date)} showIcon dateFormat="yy/mm/dd" className="w-full" />
				</div>

				<div className="field">
					<label>金額</label>
					<InputNumber
						value={editAmount}
						onValueChange={(e) => setEditAmount(e.value || 0)}
						placeholder="金額"
						className="w-full"
						useGrouping={true}
						inputMode="decimal"
						pattern="[0-9]*"
					/>
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

				<div className="flex justify-content-between mt-4">
					<Button label="削除" icon="pi pi-trash" severity="danger" onClick={handleDeleteFromModal} />
					<Button label="更新" icon="pi pi-check" severity="warning" onClick={handleUpdate} loading={loading} />
				</div>
			</Dialog>
		</div>
	);
};
