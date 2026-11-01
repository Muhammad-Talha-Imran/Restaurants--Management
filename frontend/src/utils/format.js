export const formatCurrency = (value) => {
  const number = Number(value || 0);
  const formatted = number.toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `Rs ${formatted}`;
};
