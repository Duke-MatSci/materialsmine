import createWrapper from '../../../jest/script/wrapper';
import { enableAutoDestroy } from '@vue/test-utils';
import SpreadsheetUpload from '@/pages/explorer/curate/spreadsheet/SpreadsheetUpload.vue';

const apollo = {
  verifyUser: {
    isAuth: true,
    user: {
      username: 'Test User'
    }
  }
};
const testSpreadsheet = [
  {
    file: { name: 'master_template.xlsx' },
    id: 'master_template.xlsx',
    status: 'incomplete'
  }
];
const testFiles = [
  {
    file: { name: 'fakedata.csv' },
    id: 'fakedata.csv',
    status: 'incomplete'
  },
  {
    file: { name: 'fakeimage.jpeg' },
    id: 'fakeimage.jpeg',
    status: 'incomplete'
  }
];

const mockValues = {
  xml: '',
  user: {
    _id: '63feb2a02e34b87a5c278ab8',
    displayName: 'Anya Wallace'
  },
  sampleID: 'L1_S23',
  groupId: '123456',
  isApproved: false,
  status: 'Editing'
};

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockValues),
    statusText: 'OK',
    status: 200
  })
);

describe('SpreadsheetUpload.vue', () => {
  const defaultProps = {
    datasetId: '123456789'
  };
  let wrapper;
  beforeEach(async () => {
    wrapper = await createWrapper(
      SpreadsheetUpload,
      {
        props: defaultProps,
        mocks: {
          $apollo: {
            loading: false
          }
        },
        stubs: {
          MdPortal: { template: '<div><slot/></div>' }
        }
      },
      true
    );
    await wrapper.setData({ verifyUser: apollo.verifyUser });
  });

  enableAutoDestroy(afterEach);

  it('shows the current dataset ID', () => {
    expect.assertions(1);
    expect(wrapper.text()).toContain(defaultProps.datasetId);
  });

  it('renders steppers', () => {
    expect.assertions(1);
    const steppers = wrapper.findAll('.md-stepper');
    expect(steppers.length).toBe(6);
  });

  it.skip('provides link to download template', () => {
    expect.assertions(3);
    const steppers = wrapper.findAll('.md-stepper');
    expect(steppers.at(0).text()).toContain(
      'Click here to download the template spreadsheet, and fill it out with your data.'
    );
    const downloadLinks = steppers.at(0).findAll('a');
    expect(downloadLinks.at(0).exists()).toBe(true);
    expect(downloadLinks.at(0).html()).toContain('href');
  });

  it('contains drop areas for spreadsheet and supplementary files', () => {
    expect.assertions(1);
    const dropArea = wrapper.findAll('.form__drop-area');
    expect(dropArea.length).toBe(2);
  });

  it('provides field input for doi', () => {
    expect.assertions(2);
    const fields = wrapper.findAll('.md-field');
    expect(fields.length).toBe(1);
    expect(fields.at(0).text()).toContain('DOI');
  });

  it('verifies provided information', async () => {
    expect.assertions(4);
    await wrapper.setData({
      doi: '10.000',
      spreadsheetFiles: testSpreadsheet,
      suppFiles: testFiles
    });
    const verificationStep = wrapper.findAll('.md-stepper').at(4);
    expect(verificationStep.html()).toContain('10.000');
    expect(verificationStep.text()).toContain(testSpreadsheet[0].file.name);
    for (const index in testFiles) {
      expect(verificationStep.text()).toContain(testFiles[index].file.name);
    }
  });

  it('provides a button for changing dataset ID', async () => {
    expect.assertions(1);
    const editButton = wrapper.find('#editId');
    expect(editButton.exists()).toBe(true);
  });

  it('renders a submit button', async () => {
    expect.assertions(1);
    const submitButton = wrapper.find('#submit');
    expect(submitButton.exists()).toBe(true);
  });

  it('calls submit functions', async () => {
    expect.assertions(3);
    const submitFiles = jest.spyOn(wrapper.vm, 'submitFiles');
    const createSample = jest.spyOn(wrapper.vm, 'createSample');

    const submitButton = wrapper.find('#submit');
    await submitButton.trigger('click');

    const confirmButton = wrapper.find('#confirmSubmit');
    expect(confirmButton.exists()).toBe(true);
    await confirmButton.trigger('click');

    expect(submitFiles).toHaveBeenCalledTimes(1);
    expect(createSample).toHaveBeenCalledTimes(1);
  });
});
