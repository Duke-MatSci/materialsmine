export const organizeByName = (data) => {
  const datasetNames = [...new Set(data.map(d => d.name))]

  const datasets = []

  datasetNames.map((name, i) => {
    datasets.push({
      name: name,
      color: data.filter(d => d.name === name)[0].color,
      data: data.filter(d => d.name === name)
    })
  })

  return datasets
}
