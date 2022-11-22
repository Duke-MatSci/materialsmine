exports.filesetsTransform = (filesets) => {
  const transformedFilesets = filesets?.map(({ fileset, files }) => {
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
  return transformedFilesets;
};

const filterDataset = (data) => {
  if (!data.filesets.length) {
    return null;
  }
  return [{
    datasetId: data._id ?? null, // Todo: (@tholulomo) deprecate this field
    datasets: this.filesetsTransform(data.filesets)
  }];
};

exports.transformUser = ({ _id, displayName }) => {
  return { id: _id, username: displayName };
};

// Todo: (@tholulomo) Remove third arg and refactor schema output
exports.datasetTransform = async (data, user = {}, userDataset = false) => {
  let status;

  if (!userDataset) {
    data.isPublic ? status = 'APPROVED' : status = 'WORK_IN_PROGRESS';
    return {
      datasetGroupId: data?._id,
      user: this.transformUser(user),
      status,
      userDatasetInfo: filterDataset(data),
      createdAt: new Date(parseInt(data?.dttm_created) * 1000),
      updatedAt: new Date(parseInt(data?.dttm_updated) * 1000)
    };
  }

  return data.map(async (item) => {
    return {
      datasetGroupId: item._id,
      user: this.transformUser(user),
      title: item.title,
      status: item.isPublic ? 'APPROVED' : 'WORK_IN_PROGRESS',
      userDatasetInfo: filterDataset(item),
      createdAt: new Date(parseInt(item?.dttm_created) * 1000),
      updatedAt: new Date(parseInt(item?.dttm_updated) * 1000)
    };
  });
};
