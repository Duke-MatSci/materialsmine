export const organizeByName = (data) => {
  const datasetNames = [...new Set(data.map((d) => d.name))]

  const datasets = []

  datasetNames.map((name, i) => {
    const filteredData = data.filter((d) => d.name === name)
    datasets.push({
      name: name,
      color: filteredData[0].color,
      data: filteredData
    })
  })

  return datasets
}
