import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

type NotificationType = {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warn';
  duration?: number;
};

// 通知コンポーネント
const Notification: React.FC<{ message: string; type?: string; onClose: () => void }> = ({
  message,
  type = 'info',
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClass = type ? `notification-${type}` : '';

  return ReactDOM.createPortal(
    <div className="notification-overlay">
      <div className={`notification ${typeClass}`}>
        {message}
      </div>
    </div>,
    document.body
  );
};

// 通知用のフック
const useNotification = () => {
  const [notification, setNotification] = useState<{message: string; type?: string} | null>(null);

  const showNotification = (message: string, type?: 'success' | 'error' | 'info' | 'warn') => {
    setNotification({ message, type });
  };

  const NotificationComponent = () => {
    if (!notification) return null;
    return (
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(null)}
      />
    );
  };

  return { showNotification, Notification: NotificationComponent };
};

// シンプルな通知用の関数（フックを使わない場合）
const showSimpleNotification = ({ message, type = 'info', duration = 2000 }: NotificationType) => {
  const container = document.createElement('div');
  container.className = 'notification-overlay';

  const notification = document.createElement('div');
  const typeClass = type ? `notification-${type}` : '';
  notification.className = `notification ${typeClass}`;
  notification.textContent = message;

  container.appendChild(notification);
  document.body.appendChild(container);

  // アニメーション用のクラスを追加
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // 通知を削除
  setTimeout(() => {
    notification.classList.remove('show');
    notification.classList.add('hide');

    // アニメーションが終了したらDOMから削除
    setTimeout(() => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 300);
  }, duration);
};

// ローディング中の通知を表示する関数
const showLoadingNotification = (message: string): { close: () => void } => {
  const container = document.createElement('div');
  container.className = 'notification-overlay';

  const notification = document.createElement('div');
  notification.className = 'notification notification-info';
  notification.textContent = message;

  container.appendChild(notification);
  document.body.appendChild(container);

  // アニメーション用に少し遅延を入れる
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // 閉じる関数を返す
  return {
    close: () => {
      notification.classList.remove('show');
      notification.classList.add('hide');

      // アニメーション後に要素を削除
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 300);
    }
  };
};

export { useNotification, showSimpleNotification, showLoadingNotification };
