interface DataItem {
  name: string;
  color: string;
  [key: string]: any;
}

interface OrganizedDataset {
  name: string;
  color: string;
  data: DataItem[];
}

/**
 * Organizes data by name, grouping items with the same name together
 * @param data - Array of data items with name and color properties
 * @returns Array of organized datasets
 */
export const organizeByName = (data: DataItem[]): OrganizedDataset[] => {
  const datasetNames = [...new Set(data.map((d) => d.name))];

  const datasets: OrganizedDataset[] = [];

  datasetNames.forEach((name) => {
    const filteredData = data.filter((d) => d.name === name);
    datasets.push({
      name: name,
      color: filteredData[0].color,
      data: filteredData,
    });
  });

  return datasets;
};

export type { DataItem, OrganizedDataset };
