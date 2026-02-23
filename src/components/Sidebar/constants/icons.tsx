import {
    Inventory2Outlined,
    PeopleAltOutlined,
    AdminPanelSettingsOutlined,
    Groups2Outlined,
    MailOutlined,
    EmailOutlined,
    ContactMailOutlined,
    SendOutlined,
    AccountBalance,
    TrendingUp,
    DescriptionOutlined,
    DashboardCustomizeOutlined,
    PersonOutline,
    Share,
    Storage,
    Loyalty,
    AssignmentInd,
    LocalOffer,
    Redeem,
    SwapHorizOutlined,
    CurrencyExchangeOutlined,
    FastfoodOutlined,
    CategoryOutlined,
    TableRestaurantOutlined,
    ReceiptLongOutlined
} from '@mui/icons-material'
import React from 'react'

export const ICON_MAPPING: Record<string, React.ReactElement> = {
    People: <PeopleAltOutlined />,
    Groups: <Groups2Outlined />,
    AdminPanelSettings: <AdminPanelSettingsOutlined />,
    Inventory: <Inventory2Outlined />,
    Mail: <MailOutlined />,
    Email: <EmailOutlined />,
    ContactMail: <ContactMailOutlined />,
    Send: <SendOutlined />,
    AccountBalance: <AccountBalance />,
    TrendingUp: <TrendingUp />,
    Description: <DescriptionOutlined />,
    Layout: <DashboardCustomizeOutlined />,
    Person: <PersonOutline />,
    Share: <Share />,
    Storage: <Storage />,
    Loyalty: <Loyalty />,
    AssignmentInd: <AssignmentInd />,
    LocalOffer: <LocalOffer />,
    Redeem: <Redeem />,
    SwapHoriz: <SwapHorizOutlined />,
    CurrencyExchange: <CurrencyExchangeOutlined />,
    Fastfood: <FastfoodOutlined />,
    Category: <CategoryOutlined />,
    TableRestaurant: <TableRestaurantOutlined />,
    ReceiptLong: <ReceiptLongOutlined />
}

export const getIcon = (iconName: string) => {
    return ICON_MAPPING[iconName] || <Inventory2Outlined />
}
