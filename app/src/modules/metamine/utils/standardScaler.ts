/**
 * StandardScaler class for normalizing data using z-score standardization
 */
export class StandardScaler {
  private means: number[];
  private stds: number[];

  constructor() {
    this.means = [0, 0, 0, 0, 0, 0];
    this.stds = [0, 0, 0, 0, 0, 0];
  }

  /**
   * Fits the scaler to the data by computing mean and standard deviation
   * @param data - 2D array of numerical data
   */
  fit(data: number[][]): void {
    const nFeatures = data[0].length;

    for (let i = 0; i < nFeatures; i++) {
      const featureData = data.map((row) => row[i]);
      const mean = featureData.reduce((acc, val) => acc + val, 0) / featureData.length;
      const std = Math.sqrt(
        featureData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / featureData.length
      );
      this.means[i] = mean;
      this.stds[i] = std;
    }
  }

  /**
   * Transforms data using the fitted parameters
   * @param data - 2D array of numerical data to transform
   * @returns Transformed data
   */
  transform(data: number[][]): number[][] {
    const nFeatures = data[0].length;

    const scaledData = data.map((row) => {
      const scaledRow: number[] = [];
      for (let i = 0; i < nFeatures; i++) {
        scaledRow.push(this.stds[i] === 0 ? 0 : (row[i] - this.means[i]) / this.stds[i]);
      }
      return scaledRow;
    });

    return scaledData;
  }

  /**
   * Fits the scaler and transforms the data in one step
   * @param data - 2D array of numerical data
   * @returns Transformed data
   */
  fitTransform(data: number[][]): number[][] {
    this.fit(data);
    return this.transform(data);
  }
}
