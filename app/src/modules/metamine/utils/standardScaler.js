export class StandardScaler {
  constructor () {
    this.means = [0, 0, 0, 0, 0, 0]
    this.stds = [0, 0, 0, 0, 0, 0]
  }

  fit (data) {
    const nFeatures = data[0].length

    for (let i = 0; i < nFeatures; i++) {
      const featureData = data.map((row) => row[i])
      const mean = featureData.reduce((acc, val) => acc + val, 0) / featureData.length
      const std = Math.sqrt(
        featureData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / featureData.length
      )
      this.means[i] = mean
      this.stds[i] = std
    }
  }

  transform (data) {
    const nFeatures = data[0].length

    const scaledData = data.map((row) => {
      const scaledRow = []
      for (let i = 0; i < nFeatures; i++) {
        scaledRow.push(this.stds[i] === 0 ? 0 : (row[i] - this.means[i]) / this.stds[i])
      }
      return scaledRow
    })

    return scaledData
  }

  fitTransform (data) {
    this.fit(data)
    return this.transform(data)
  }
}
