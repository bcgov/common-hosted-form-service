import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import moment from 'moment';
import { beforeEach, describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n({ useScope: 'global' });

import { useFormStore } from '~/store/form';
import FormScheduleSettings from '~/components/designer/settings/FormScheduleSettings.vue';
import { ScheduleType } from '~/utils/constants';
import { useAppStore } from '~/store/app';

describe('FormScheduleSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);
  const appStore = useAppStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    appStore.$reset();
    formStore.form = ref({
      schedule: {
        enabled: null,
        scheduleType: null,
        openSubmissionDateTime: moment().add(1, 'days'),
        closingMessageEnabled: null,
        closingMessage: null,
        closeSubmissionDateTime: null,
        allowLateSubmissions: {
          enabled: null,
          forNext: {
            term: null,
            intervalType: null,
          },
        },
      },
    });
  });

  it('renders', () => {
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toMatch('trans.formSettings.opensubmissions');
    expect(wrapper.text()).toMatch('trans.formSettings.submissionsDeadline');
    expect(wrapper.text()).toMatch(
      'trans.formSettings.keepSubmissnOpenTilUnplished'
    );
    expect(wrapper.text()).toMatch('trans.formSettings.submissionsClosingDate');

    // Closing message shouldn't be visible
    expect(wrapper.find('[data-test="text-name"]').exists()).toBeFalsy();
  });

  it('reminder should be enabled if the open submission date is the same as the current day or is a future day', async () => {
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    // True by default
    expect(wrapper.vm.enableReminderDraw).toBeTruthy();

    formStore.form.schedule.openSubmissionDateTime = moment().add(1, 'days');

    await flushPromises();

    wrapper.vm.openDateTypeChanged();

    expect(wrapper.vm.enableReminderDraw).toBeTruthy();

    // Should fail if the open day has passed

    formStore.form.schedule.openSubmissionDateTime = moment().subtract(
      1,
      'days'
    );

    await flushPromises();

    wrapper.vm.openDateTypeChanged();

    expect(wrapper.vm.enableReminderDraw).toBeFalsy();
  });

  it('schedule a closing date renders', async () => {
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    formStore.form.schedule.scheduleType = ScheduleType.CLOSINGDATE;

    await flushPromises();

    expect(
      wrapper.find('[data-test="closeSubmissionDateTime"]').exists()
    ).toBeTruthy();
    expect(
      wrapper.find('[data-test="afterCloseDateFor"]').exists()
    ).toBeFalsy();
  });

  it('closing date with late submissions', async () => {
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    formStore.form.schedule.scheduleType = ScheduleType.CLOSINGDATE;
    formStore.form.schedule.allowLateSubmissions.enabled = true;

    await flushPromises();

    expect(
      wrapper.find('[data-test="closeSubmissionDateTime"]').exists()
    ).toBeTruthy();
    expect(
      wrapper.find('[data-test="afterCloseDateFor"]').exists()
    ).toBeTruthy();
  });

  it('schedule a closing date renders with a closing message', async () => {
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    formStore.form.schedule.scheduleType = ScheduleType.CLOSINGDATE;
    formStore.form.schedule.closingMessageEnabled = true;

    await flushPromises();

    expect(
      wrapper.find('[data-test="closeSubmissionDateTime"]').exists()
    ).toBeTruthy();
    expect(
      wrapper.find('[data-test="afterCloseDateFor"]').exists()
    ).toBeFalsy();

    // Closing message should be visible
    expect(wrapper.find('[data-test="text-name"]').exists()).toBeTruthy();
  });

  it('changing schedule type to manual will set the appropriate values to null', async () => {
    const SOME_DAY = moment();
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    formStore.form.schedule = {
      ...formStore.form.schedule,
      scheduleType: ScheduleType.CLOSINGDATE,
      closingMessageEnabled: true,
      closingMessage: 'This is a closing message',
      closeSubmissionDateTime: SOME_DAY,
      allowLateSubmissions: {
        enabled: true,
        forNext: {
          term: 2,
          intervalType: 'days',
        },
      },
    };

    expect(formStore.form.schedule.scheduleType).toEqual(
      ScheduleType.CLOSINGDATE
    );
    expect(formStore.form.schedule.closingMessageEnabled).toBeTruthy();
    expect(formStore.form.schedule.closingMessage).toEqual(
      'This is a closing message'
    );
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(SOME_DAY);
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toBeTruthy();
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toEqual(
      2
    );
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toEqual('days');

    // Change it to MANUAL
    formStore.form.schedule.scheduleType = ScheduleType.MANUAL;

    await flushPromises();

    wrapper.vm.scheduleTypeChanged();

    expect(formStore.form.schedule.scheduleType).toEqual(ScheduleType.MANUAL);
    expect(formStore.form.schedule.closingMessageEnabled).toEqual(null);
    expect(formStore.form.schedule.closingMessage).toEqual(null);
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(null);
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toEqual(null);
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toEqual(
      null
    );
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toEqual(null);
  });

  it('changing schedule type to closing will set the appropriate values to null', async () => {
    const SOME_DAY = moment();
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    formStore.form.schedule = {
      ...formStore.form.schedule,
      scheduleType: ScheduleType.MANUAL,
      closingMessageEnabled: true,
      closingMessage: 'This is a closing message',
      closeSubmissionDateTime: SOME_DAY,
      allowLateSubmissions: {
        enabled: true,
        forNext: {
          term: 2,
          intervalType: 'days',
        },
      },
    };

    expect(formStore.form.schedule.scheduleType).toEqual(ScheduleType.MANUAL);
    expect(formStore.form.schedule.closingMessageEnabled).toBeTruthy();
    expect(formStore.form.schedule.closingMessage).toEqual(
      'This is a closing message'
    );
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(SOME_DAY);
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toBeTruthy();
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toEqual(
      2
    );
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toEqual('days');

    // Change it to CLOSINGDATE
    formStore.form.schedule.scheduleType = ScheduleType.CLOSINGDATE;

    await flushPromises();

    wrapper.vm.scheduleTypeChanged();

    expect(formStore.form.schedule.scheduleType).toEqual(
      ScheduleType.CLOSINGDATE
    );
    expect(formStore.form.schedule.closingMessageEnabled).toEqual(null);
    expect(formStore.form.schedule.closingMessage).toEqual(null);
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(SOME_DAY);
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toEqual(null);
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toEqual(
      null
    );
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toEqual(null);
  });

  it('renders submission schedule and late submission text with correct spacing', async () => {
    const TODAY = moment().format('YYYY-MM-DD HH:MM:SS');
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BaseInfoCard: {
            name: 'BaseInfoCard',
            template: '<div class="base-info-card-stub"><slot /></div>',
          },
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    // Set up the form store with necessary data
    formStore.form = ref({
      schedule: {
        enabled: true,
        openSubmissionDateTime: TODAY,
        closeSubmissionDateTime: moment(TODAY)
          .add(2, 'days')
          .format('YYYY-MM-DD HH:MM:SS'),
        scheduleType: ScheduleType.CLOSINGDATE,
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 2,
            intervalType: 'days',
          },
        },
      },
    });

    await flushPromises();

    // Check submission schedule text
    const submissionScheduleText = wrapper.find(
      '[data-test="submission-schedule-text"]'
    );
    expect(submissionScheduleText.exists()).toBe(true);

    const scheduleTextContent = submissionScheduleText.text();
    expect(scheduleTextContent).toContain(
      t('trans.formSettings.submissionsOpenDateRange')
    );
    expect(scheduleTextContent).toContain(TODAY);
    expect(scheduleTextContent).toContain(t('trans.formSettings.to'));
    expect(scheduleTextContent).toContain(
      formStore.form.value.schedule.closeSubmissionDateTime
    );

    // Check late submission text
    const lateSubmissionText = wrapper.find(
      '[data-test="late-submission-text"]'
    );
    expect(lateSubmissionText.exists()).toBe(true);

    const lateTextContent = lateSubmissionText.text();
    expect(lateTextContent).toContain(
      t('trans.formSettings.allowLateSubmissnInterval')
    );
    expect(lateTextContent).toContain('2');
    expect(lateTextContent).toContain('days');
  });
});
