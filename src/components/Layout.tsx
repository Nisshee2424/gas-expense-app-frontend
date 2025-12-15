import React, { useState } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import type { MenuItem } from 'primereact/menuitem';

interface LayoutProps {
	children: React.ReactNode;
	activePage: string;
	onNavigate: (page: 'home' | 'monthly' | 'annual') => void;
	user: any;
	onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, user, onLogout }) => {
	const [visible, setVisible] = useState(false);

	// メニュー項目の定義
	const items: MenuItem[] = [
		{
			label: 'ホーム',
			icon: 'pi pi-home',
			command: () => { onNavigate('home'); setVisible(false); },
			className: activePage === 'home' ? 'font-bold' : ''
		},
		{
			label: '月次集計',
			icon: 'pi pi-calendar',
			command: () => { onNavigate('monthly'); setVisible(false); },
			className: activePage === 'monthly' ? 'font-bold' : ''
		},
		{
			label: '年次集計',
			icon: 'pi pi-chart-bar',
			command: () => { onNavigate('annual'); setVisible(false); },
			className: activePage === 'annual' ? 'font-bold' : ''
		},
		{
			separator: true
		},
		{
			label: 'ログアウト',
			icon: 'pi pi-sign-out',
			command: onLogout
		}
	];

	return (
		<div className="layout-wrapper min-h-screen flex flex-column">
			{/* Header / Navbar - 上部固定、100%幅 */}
			<header className="flex align-items-center justify-content-between p-3 surface-card shadow-2" style={{ width: '100%' }}>
				<div className="flex align-items-center gap-2">
					<Button icon="pi pi-bars" onClick={() => setVisible(true)} text aria-label="Menu" />
					<h2 className="m-0 text-xl font-bold">家計簿アプリ</h2>
				</div>
				<div className="flex align-items-center gap-2">
					{user && (
						<>
							{user.picture && (
								<img src={user.picture} alt="avatar" className="border-circle" style={{ width: '32px', height: '32px' }} />
							)}
							<span className="text-sm hidden md:inline-block">
								{user.name || user.email}
							</span>
						</>
					)}
				</div>
			</header>

			{/* Sidebar Menu */}
			<Sidebar visible={visible} onHide={() => setVisible(false)}>
				<h2>メニュー</h2>
				<Menu model={items} className="w-full border-none" />
			</Sidebar>

			{/* Main Content - 中央寄せ */}
			<main className="flex-grow-1 p-3" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
				{children}
			</main>
		</div>
	);
};
