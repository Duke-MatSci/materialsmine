/*
See usage notes below code
*/

interface JobFileInfo {
  idx: number;
  fileName: string;
  dataUri: string;
  statusCode: number | null;
  statusText: string | null;
}

interface JobParameters {
  user?: string;
  [key: string]: any;
}

interface JobMgrInstance {
  jobType: string | null;
  jobId: string | null;
  err: any;
  jobInputFiles: JobFileInfo[];
  jobParameters: JobParameters | null;
  createJobPath: string;
  postJobFilePath: string;
  submitJobPath: string;
  getJobId(): string | null;
  handleErr(err: any, failureFunction: (status: number, message: string) => void): void;
  submitJob(
    successFunction: (jobId: string) => void,
    failureFunction: (status: number, message: string) => void
  ): void;
  setJobType(jobType: string): void;
  getJobType(): string | null;
  getFileCount(): number;
  getFileInfo(idx: number): JobFileInfo | null;
  addInputFile(fileName: string, dataUri: string): void;
  setJobParameters(paramsObject: JobParameters): void;
}

export function JobMgr(): JobMgrInstance {
  const instance: JobMgrInstance = {
    jobType: null,
    jobId: null,
    err: null,
    jobInputFiles: [],
    jobParameters: null,
    createJobPath: '/nmr/jobcreate',
    postJobFilePath: '/nmr/jobpostfile',
    submitJobPath: '/nmr/jobsubmit',

    getJobId(): string | null {
      return this.jobId;
    },

    handleErr(err: any, failureFunction: (status: number, message: string) => void): void {
      if (err.response) {
        if (err.config && err.config.data) {
          const data = JSON.parse(err.config.data);
          if (data.jobFileInfo) {
            this.jobInputFiles[data.jobFileInfo.idx].statusCode = err.response.status;
            this.jobInputFiles[data.jobFileInfo.idx].statusText = err.response.statusText;
          }
        }
        return failureFunction(err.response.status, err.response.statusText);
      } else if (err.request) {
        return failureFunction(500, err);
      } else {
        return failureFunction(500, err);
      }
    },

    submitJob(
      successFunction: (jobId: string) => void,
      failureFunction: (status: number, message: string) => void
    ): void {
      // this.jobId = SET by remote call
      if (this.jobType === null) {
        setTimeout(() => failureFunction(400, 'Job type required'), 0); // don't do this on main path -- it's supposed to be async
      } else {
        // create job to get jobId and initialize job directory
        const fileSends: Promise<any>[] = [];
        let jobUser = ''; // default for now, server will set real value unless runAsUser is set by an admin (checked on server side)
        const runAs = (window as any).$store?.getters?.runAsUser;
        if (runAs && runAs.length > 0) {
          jobUser = runAs;
        }
        if (this.jobParameters) {
          this.jobParameters.user = jobUser;
        } else {
          this.jobParameters = { user: jobUser };
        }
        try {
          fetch(this.createJobPath, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jobParameters: this.jobParameters,
              jobType: this.jobType,
            }),
          })
            .then((res) => res.json())
            .then((res) => {
              this.jobId = res.data.data.jobId;
              this.jobInputFiles.forEach((v) => {
                // send each file in a separate request and wait for all to complete successfully before submitting job
                fileSends.push(
                  fetch(this.postJobFilePath, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      jobId: this.jobId,
                      jobType: this.jobType,
                      jobFileInfo: v,
                    }),
                  })
                );
              });
              Promise.all(fileSends)
                .then((p) => {
                  // wait for all files to be sent then submit job
                  p.forEach((v) => {
                    // set status and status text this.jobInputFiles[idx].statusCode=p.
                    const reqData = JSON.parse((v as any).config?.data || '{}');
                    const index = reqData.jobFileInfo?.idx;
                    if (index !== undefined) {
                      this.jobInputFiles[index].statusCode = (v as any).status;
                      this.jobInputFiles[index].statusText = (v as any).statusText;
                    }
                  });
                  fetch(this.submitJobPath, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      jobId: this.jobId,
                      jobType: this.jobType,
                    }),
                  })
                    .then((res) => res.json())
                    .then((res) => {
                      return successFunction(this.jobId!);
                    })
                    .catch((err) => {
                      this.handleErr(err, failureFunction);
                    });
                })
                .catch((err) => {
                  this.handleErr(err, failureFunction);
                });
            })
            .catch((err) => {
              this.handleErr(err, failureFunction);
            });
        } catch (err) {
          this.handleErr(err, failureFunction);
        }
      }
    },

    setJobType(jobType: string): void {
      this.jobType = jobType;
    },

    getJobType(): string | null {
      return this.jobType;
    },

    getFileCount(): number {
      return this.jobInputFiles.length;
    },

    getFileInfo(idx: number): JobFileInfo | null {
      let rv = null;
      if (idx >= 0 && idx < this.jobInputFiles.length) {
        rv = this.jobInputFiles[idx];
      }
      return rv;
    },

    addInputFile(fileName: string, dataUri: string): void {
      const idx = this.jobInputFiles.length;
      this.jobInputFiles.push({
        idx: idx,
        fileName: fileName,
        dataUri: dataUri,
        statusCode: null,
        statusText: null,
      });
    },

    setJobParameters(paramsObject: JobParameters): void {
      this.jobParameters = paramsObject;
    },
  };

  return instance;
}

export type { JobMgrInstance, JobFileInfo, JobParameters };

/* Using this class
import {JobMgr} from '@/modules/JobMgr.ts'
const jm = new JobMgr()
jm.addInputFile(fileName[0], dataUrl[0])
jm.addInputFile(fileName[N], dataUrl[N])
jm.setJobParameters({ testField: val1, myField2: val2 })
jm.setJobType(jobType)
jm.submitJob(function success (jobid) {}, function failure (err) {
  for (let i = 0; i < jm.getFileCount(); ++i) {
    const fileInfo = jm.getFileInfo(i)
  }
})
*/
