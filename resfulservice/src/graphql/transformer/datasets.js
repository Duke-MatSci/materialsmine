exports.filesetsTransform = (filesets) => {
  return filesets?.map(({ fileset, files }) => {
    return {
      filesetName: fileset ?? null,
      files: files?.map(({ type, id, metadata }) => {
        return {
          id,
          filename: metadata?.filename ?? null,
          contentType: metadata?.contentType ?? null
        };
      }) ?? []
    };
  }) ?? [];
};

const filterDataset = (data) => {
  return data?.dataset?.map(({ _id, filesets }) => {
    return {
      datasetId: _id ?? null,
      datasets: this.filesetsTransform(filesets)
    };
  }) ?? [];
};

exports.transformUser = ({ _id, displayName }) => {
  return { id: _id, username: displayName };
};

exports.datasetTransform = async (data) => {
  let datasetAccum = [];

  if (data.dataset.length) {
    datasetAccum = filterDataset(data);
  }

  return {
    datasetGroupId: data?._id,
    user: this.transformUser(data.user),
    status: data?.status,
    userDatasetInfo: datasetAccum,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt
  };
};
