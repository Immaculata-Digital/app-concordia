
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
};

export const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return "0%";
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1).replace(".", ",")}%`;
};
