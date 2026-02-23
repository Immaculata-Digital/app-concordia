import React, { useMemo, useState } from 'react';
import { Box, Collapse, IconButton } from '@mui/material';
import {
    AddCircleOutline,
    SyncAlt,
    BuildOutlined,
    WarningAmberOutlined,
    CancelOutlined,
    ShieldOutlined,
    ExpandMore,
    ExpandLess
} from '@mui/icons-material';

import changelogData from '../../assets/data/changelog.json';
import './style.css';

interface ChangeVersion {
    version: string;
    date: string;
    summary?: string;
    changes: {
        Adicionado?: string[];
        Alterado?: string[];
        Corrigido?: string[];
        Obsoleto?: string[];
        Removido?: string[];
        Seguranca?: string[];
    };
}

const categoryIcons: Record<string, React.ReactNode> = {
    Adicionado: <AddCircleOutline fontSize="small" />,
    Alterado: <SyncAlt fontSize="small" />,
    Corrigido: <BuildOutlined fontSize="small" />,
    Obsoleto: <WarningAmberOutlined fontSize="small" />,
    Removido: <CancelOutlined fontSize="small" />,
    Seguranca: <ShieldOutlined fontSize="small" />,
};

const formatDate = (dateString: string) => {
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return dateString;
    }
};

const ChangelogPage: React.FC = () => {
    const versions = useMemo(() => changelogData.versions as ChangeVersion[], []);

    // Inicia apenas a primeira versão (index 0) como aberta
    const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
        [versions[0]?.version]: true
    });

    const toggleVersion = (version: string) => {
        setExpandedVersions(prev => ({
            ...prev,
            [version]: !prev[version]
        }));
    };

    return (
        <Box className="changelog">
            <header className="changelog__header">
                <h1 className="changelog__title">Notas da Atualização</h1>
            </header>

            <main className="changelog__content">
                {versions.map((version, index) => {
                    const isExpanded = !!expandedVersions[version.version];

                    return (
                        <Box
                            key={version.version}
                            className={`changelog__version-card ${!isExpanded ? 'changelog__version-card--collapsed' : ''}`}
                        >
                            <header
                                className="changelog__version-header"
                                onClick={() => toggleVersion(version.version)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Box className="changelog__version-tag-wrapper">
                                    <span className="changelog__badge">v{version.version}</span>
                                    {index === 0 && <span className="changelog__current-tag">Atual</span>}
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <span className="changelog__date">{formatDate(version.date)}</span>
                                    <IconButton size="small" sx={{ color: 'var(--color-on-secondary)' }}>
                                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                </Box>
                            </header>

                            {version.summary && (
                                <p
                                    className="changelog__summary"
                                    onClick={() => !isExpanded && toggleVersion(version.version)}
                                    style={{ cursor: !isExpanded ? 'pointer' : 'default' }}
                                >
                                    {version.summary}
                                </p>
                            )}

                            <Collapse in={isExpanded}>
                                <div className="changelog__categories-grid">
                                    {Object.entries(version.changes).map(([category, items]) => {
                                        if (!items || items.length === 0) return null;

                                        return (
                                            <section
                                                key={category}
                                                className={`changelog__category changelog__category--${category.toLowerCase()}`}
                                            >
                                                <div className="changelog__category-header">
                                                    <div className="changelog__category-icon">
                                                        {categoryIcons[category]}
                                                    </div>
                                                    <h3 className="changelog__category-title">
                                                        {category === 'Seguranca' ? 'Segurança' : category}
                                                    </h3>
                                                </div>

                                                <ul className="changelog__item-list">
                                                    {items.map((item, idx) => (
                                                        <li key={idx} className="changelog__item">
                                                            <span className="changelog__item-bullet" />
                                                            <span className="changelog__item-text">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </section>
                                        );
                                    })}
                                </div>
                            </Collapse>
                        </Box>
                    );
                })}
            </main>
        </Box>
    );
};

export default ChangelogPage;
