exports.filesetsTransform = (filesets) => {
  if (!filesets.length) {
    return [];
  }
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

exports.transformUser = ({ _id, displayName }) => {
  return { id: _id, username: displayName };
};

exports.datasetTransform = async (data, user = {}, userDataset = false) => {
  let status;

  if (!userDataset) {
    return {
      datasetGroupId: data?._id,
      status,
      filesetInfo: [],
      user: this.transformUser(user),
      curatedDatasets: data.samples,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  return data.map(async (item) => {
    return {
      datasetGroupId: item._id,
      title: item.title,
      status: item.isPublic ? 'APPROVED' : 'WORK_IN_PROGRESS',
      filesetInfo: this.filesetsTransform(item.filesets),
      curatedDatasets: [],
      user,
      createdAt: new Date(parseInt(item?.dttm_created) * 1000),
      updatedAt: new Date(parseInt(item?.dttm_updated) * 1000)
    };
  });
};
