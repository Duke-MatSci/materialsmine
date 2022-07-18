const paginator = (counts, pgNumber, pgSize) => {
  if (typeof counts !== 'number') throw new Error('paginator( counts, ...  ) param must be of type number');
  const ppageNumber = pgNumber && typeof parseInt(pgNumber, 10) === 'number' ? Math.max(1, parseInt(pgNumber, 10)) : 1;
  const ppageSize = pgSize && typeof parseInt(pgSize, 10) === 'number' ? Math.max(1, parseInt(pgSize, 10)) : 20;

  const skip = (ppageNumber - 1) * ppageSize;
  const limit = ppageSize;
  const totalItems = counts;
  const pageSize = ppageSize;
  const pageNumber = ppageNumber;
  const totalPages = counts > ppageSize ? Math.ceil(counts / ppageSize) : 1;
  const hasPreviousPage = pageNumber > 1;
  const hasNextPage = totalPages > pageNumber;

  return { skip, limit, totalItems, pageSize, pageNumber, totalPages, hasPreviousPage, hasNextPage };
};

module.exports = paginator;
