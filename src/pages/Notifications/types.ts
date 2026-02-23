
export type NotificationCategory = 'system' | 'contract' | 'user' | 'billing' | 'alert';

export interface NotificationAction {
    label: string;
    onClick: () => void;
    primary?: boolean;
}

export interface NotificationItem {
    id: string;
    category: NotificationCategory;
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
    actions?: NotificationAction[];
}
