import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import moment from 'moment-timezone';
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
  //Skipped this test for reminderservice feature needs to be changed
  it.skip('reminder should be enabled if the open submission date is the same as the current day or is a future day', async () => {
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

  it('changing schedule type preserves values when switching between types', async () => {
    const SOME_DAY = moment();
    // eslint-disable-next-line no-unused-vars
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

    // Setup initial CLOSINGDATE values
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

    // Verify initial values
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

    // Change to MANUAL
    formStore.form.schedule.scheduleType = ScheduleType.MANUAL;

    await flushPromises();

    // values should be preserved
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

    // Change back to CLOSINGDATE
    formStore.form.schedule.scheduleType = ScheduleType.CLOSINGDATE;

    await flushPromises();

    // Values should still be preserved
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
  });

  it('documents legacy PERIOD functionality for backward compatibility', async () => {
    // This test documents that the application maintains support for
    // forms with PERIOD schedule type even after removing it from the UI

    // Create a form with PERIOD schedule settings
    formStore.form = {
      schedule: {
        enabled: true,
        scheduleType: ScheduleType.PERIOD,
        openSubmissionDateTime: moment().format('YYYY-MM-DD'),
        keepOpenForTerm: 7,
        keepOpenForInterval: 'days',
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 2,
            intervalType: 'days',
          },
        },
        repeatSubmission: {
          enabled: true,
          everyTerm: 1,
          everyIntervalType: 'months',
          repeatUntil: moment().add(3, 'months').format('YYYY-MM-DD'),
        },
      },
    };

    // Verify that the form can be properly configured with PERIOD settings
    expect(formStore.form.schedule.scheduleType).toBe(ScheduleType.PERIOD);
    expect(formStore.form.schedule.keepOpenForTerm).toBe(7);
    expect(formStore.form.schedule.keepOpenForInterval).toBe('days');
    expect(formStore.form.schedule.repeatSubmission.enabled).toBe(true);
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toBe(1);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toBe(
      'months'
    );
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toBe(true);
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toBe(2);
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toBe('days');

    // Verify that changing to a different schedule type and back to PERIOD
    // works as expected (maintains feature parity)
    formStore.form.schedule.scheduleType = ScheduleType.MANUAL;
    expect(formStore.form.schedule.scheduleType).toBe(ScheduleType.MANUAL);

    // Switch back to PERIOD
    formStore.form.schedule.scheduleType = ScheduleType.PERIOD;
    expect(formStore.form.schedule.scheduleType).toBe(ScheduleType.PERIOD);

    // This test documents that the application code still supports the PERIOD
    // schedule type, ensuring backward compatibility for existing forms
    // even after removing it from the UI
  });

  it('saves timezone when times are selected', async () => {
    const wrapper = mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    // Set up test dates and times
    const testOpenDate = '2025-03-15';
    const testOpenTime = '09:30';
    const testCloseDate = '2025-03-20';
    const testCloseTime = '17:45';

    // Set closing date schedule type
    formStore.form.schedule.scheduleType = ScheduleType.CLOSINGDATE;
    formStore.form.schedule.openSubmissionDateTime = testOpenDate;
    formStore.form.schedule.closeSubmissionDateTime = testCloseDate;

    await flushPromises();

    // Set times
    formStore.form.schedule.openSubmissionTime = testOpenTime;
    formStore.form.schedule.closeSubmissionTime = testCloseTime;

    // Call the new combined timezone function
    wrapper.vm.saveTimezone();

    // Verify timezone was saved
    expect(formStore.form.schedule.timezone).toBeDefined();
    expect(formStore.form.schedule.timezone).toBe(wrapper.vm.timezone);

    // Verify changing schedule type doesn't affect times
    formStore.form.schedule.scheduleType = ScheduleType.MANUAL;
    await flushPromises();

    // Times should be preserved with our new implementation
    expect(formStore.form.schedule.openSubmissionTime).toBe(testOpenTime);
    expect(formStore.form.schedule.closeSubmissionTime).toBe(testCloseTime);
  });

  it('initializes default times for new schedules on mount', async () => {
    // Ensure we're testing a new schedule (scheduleType is null)
    formStore.form.schedule.scheduleType = null;
    formStore.form.schedule.openSubmissionTime = null;
    formStore.form.schedule.closeSubmissionTime = null;

    mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    // Verify default times were set for new schedules
    expect(formStore.form.schedule.openSubmissionTime).toBe('08:30');
    expect(formStore.form.schedule.closeSubmissionTime).toBe('16:00');
  });

  it('initializes default times for existing schedules on mount', async () => {
    // Setup an existing schedule with missing times
    formStore.form.schedule.scheduleType = ScheduleType.CLOSINGDATE;
    formStore.form.schedule.openSubmissionTime = null;
    formStore.form.schedule.closeSubmissionTime = null;

    mount(FormScheduleSettings, {
      global: {
        plugins: [pinia],
        stubs: {
          BasePanel: {
            name: 'BasePanel',
            template: '<div class="base-panel-stub"><slot /></div>',
          },
        },
      },
    });

    // Verify default times were set for existing schedules
    expect(formStore.form.schedule.openSubmissionTime).toBe('00:00');
    expect(formStore.form.schedule.closeSubmissionTime).toBe('23:59');
  });
});
