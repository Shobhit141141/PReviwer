export const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};
