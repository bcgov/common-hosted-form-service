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
import { getSubmissionPeriodDates } from '~/utils/transformUtils';

describe('FormScheduleSettings.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const formStore = useFormStore(pinia);

  beforeEach(() => {
    formStore.$reset();
    formStore.form = ref({
      schedule: {
        enabled: null,
        scheduleType: null,
        openSubmissionDateTime: moment().add(1, 'days'),
        keepOpenForTerm: null,
        keepOpenForInterval: null,
        closingMessageEnabled: null,
        closingMessage: null,
        closeSubmissionDateTime: null,
        repeatSubmission: {
          enabled: null,
          repeatUntil: null,
          everyTerm: null,
          everyIntervalType: null,
        },
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
    expect(wrapper.text()).toMatch('trans.formSettings.submissionPeriod');

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
      keepOpenForTerm: 2,
      keepOpenForInterval: 'days',
      closingMessageEnabled: true,
      closingMessage: 'This is a closing message',
      closeSubmissionDateTime: SOME_DAY,
      repeatSubmission: {
        enabled: false,
        repeatUntil: SOME_DAY,
        everyTerm: 2,
        everyIntervalType: 'days',
      },
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
    expect(formStore.form.schedule.keepOpenForTerm).toEqual(2);
    expect(formStore.form.schedule.keepOpenForInterval).toEqual('days');
    expect(formStore.form.schedule.closingMessageEnabled).toBeTruthy();
    expect(formStore.form.schedule.closingMessage).toEqual(
      'This is a closing message'
    );
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(SOME_DAY);
    expect(formStore.form.schedule.repeatSubmission.enabled).toBeFalsy();
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(
      SOME_DAY
    );
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(2);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      'days'
    );
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
    expect(formStore.form.schedule.keepOpenForTerm).toEqual(null);
    expect(formStore.form.schedule.keepOpenForInterval).toEqual(null);
    expect(formStore.form.schedule.closingMessageEnabled).toEqual(null);
    expect(formStore.form.schedule.closingMessage).toEqual(null);
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.enabled).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      null
    );
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
      keepOpenForTerm: 2,
      keepOpenForInterval: 'days',
      closingMessageEnabled: true,
      closingMessage: 'This is a closing message',
      closeSubmissionDateTime: SOME_DAY,
      repeatSubmission: {
        enabled: false,
        repeatUntil: SOME_DAY,
        everyTerm: 2,
        everyIntervalType: 'days',
      },
      allowLateSubmissions: {
        enabled: true,
        forNext: {
          term: 2,
          intervalType: 'days',
        },
      },
    };

    expect(formStore.form.schedule.scheduleType).toEqual(ScheduleType.MANUAL);
    expect(formStore.form.schedule.keepOpenForTerm).toEqual(2);
    expect(formStore.form.schedule.keepOpenForInterval).toEqual('days');
    expect(formStore.form.schedule.closingMessageEnabled).toBeTruthy();
    expect(formStore.form.schedule.closingMessage).toEqual(
      'This is a closing message'
    );
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(SOME_DAY);
    expect(formStore.form.schedule.repeatSubmission.enabled).toBeFalsy();
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(
      SOME_DAY
    );
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(2);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      'days'
    );
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
    expect(formStore.form.schedule.keepOpenForTerm).toEqual(null);
    expect(formStore.form.schedule.keepOpenForInterval).toEqual(null);
    expect(formStore.form.schedule.closingMessageEnabled).toEqual(null);
    expect(formStore.form.schedule.closingMessage).toEqual(null);
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(SOME_DAY);
    expect(formStore.form.schedule.repeatSubmission.enabled).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      null
    );
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toEqual(null);
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toEqual(
      null
    );
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toEqual(null);
  });

  it('changing schedule type to period will set the appropriate values to null', async () => {
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
      keepOpenForTerm: 2,
      keepOpenForInterval: 'days',
      closingMessageEnabled: true,
      closingMessage: 'This is a closing message',
      closeSubmissionDateTime: SOME_DAY,
      repeatSubmission: {
        enabled: false,
        repeatUntil: SOME_DAY,
        everyTerm: 2,
        everyIntervalType: 'days',
      },
      allowLateSubmissions: {
        enabled: true,
        forNext: {
          term: 2,
          intervalType: 'days',
        },
      },
    };

    expect(formStore.form.schedule.scheduleType).toEqual(ScheduleType.MANUAL);
    expect(formStore.form.schedule.keepOpenForTerm).toEqual(2);
    expect(formStore.form.schedule.keepOpenForInterval).toEqual('days');
    expect(formStore.form.schedule.closingMessageEnabled).toBeTruthy();
    expect(formStore.form.schedule.closingMessage).toEqual(
      'This is a closing message'
    );
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(SOME_DAY);
    expect(formStore.form.schedule.repeatSubmission.enabled).toBeFalsy();
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(
      SOME_DAY
    );
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(2);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      'days'
    );
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toBeTruthy();
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toEqual(
      2
    );
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toEqual('days');

    // Change it to PERIOD
    formStore.form.schedule.scheduleType = ScheduleType.PERIOD;

    await flushPromises();

    wrapper.vm.scheduleTypeChanged();

    expect(formStore.form.schedule.scheduleType).toEqual(ScheduleType.PERIOD);
    expect(formStore.form.schedule.keepOpenForTerm).toEqual(2);
    expect(formStore.form.schedule.keepOpenForInterval).toEqual('days');
    expect(formStore.form.schedule.closingMessageEnabled).toEqual(null);
    expect(formStore.form.schedule.closingMessage).toEqual(null);
    expect(formStore.form.schedule.closeSubmissionDateTime).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.enabled).toBeFalsy();
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(
      SOME_DAY
    );
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(2);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      'days'
    );
    expect(formStore.form.schedule.allowLateSubmissions.enabled).toEqual(null);
    expect(formStore.form.schedule.allowLateSubmissions.forNext.term).toEqual(
      null
    );
    expect(
      formStore.form.schedule.allowLateSubmissions.forNext.intervalType
    ).toEqual(null);
  });

  it('if a submission periods repeat is disabled, it should set the repeat values to null', async () => {
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

    formStore.form.schedule.scheduleType = ScheduleType.PERIOD;
    formStore.form.schedule.repeatSubmission = {
      enabled: true,
      everyTerm: 2,
      everyIntervalType: 'days',
      repeatUntil: SOME_DAY,
    };

    expect(formStore.form.schedule.scheduleType).toEqual(ScheduleType.PERIOD);
    expect(formStore.form.schedule.repeatSubmission.enabled).toEqual(true);
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(2);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      'days'
    );
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(
      SOME_DAY
    );

    formStore.form.schedule.repeatSubmission.enabled = false;

    wrapper.vm.repeatSubmissionChanged();

    expect(formStore.form.schedule.scheduleType).toEqual(ScheduleType.PERIOD);
    expect(formStore.form.schedule.repeatSubmission.enabled).toEqual(false);
    expect(formStore.form.schedule.repeatSubmission.everyTerm).toEqual(null);
    expect(formStore.form.schedule.repeatSubmission.everyIntervalType).toEqual(
      null
    );
    expect(formStore.form.schedule.repeatSubmission.repeatUntil).toEqual(null);
  });

  it('AVAILABLE_DATES should return the same values as the function..', async () => {
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

    const originalDates = await getSubmissionPeriodDates(
      2,
      'days',
      moment(TODAY).format('YYYY-MM-DD HH:MM:SS'),
      2,
      'days',
      // late term
      2,
      // late term period
      'days',
      moment(TODAY).add(1, 'days').format('YYYY-MM-DD HH:MM:SS')
    );

    await flushPromises();

    expect(originalDates.length).toEqual(1);
    expect(originalDates[0].startDate).toEqual(
      moment(TODAY).format('YYYY-MM-DD HH:MM:SS')
    );
    expect(originalDates[0].closeDate).toEqual(
      moment(TODAY).add(2, 'days').format('YYYY-MM-DD HH:MM:SS')
    );
    // we specified 2 late days after closing which is 2 days
    expect(originalDates[0].graceDate).toEqual(
      moment(TODAY).add(4, 'days').format('YYYY-MM-DD HH:MM:SS')
    );

    formStore.form = {
      schedule: {
        keepOpenForTerm: 2,
        keepOpenForInterval: 'days',
        openSubmissionDateTime: moment(TODAY).format('YYYY-MM-DD HH:MM:SS'),
        repeatSubmission: {
          everyTerm: 2,
          everyIntervalType: 'days',
          repeatUntil: moment(TODAY)
            .add(2, 'days')
            .format('YYYY-MM-DD HH:MM:SS'),
        },
        allowLateSubmissions: {
          forNext: {
            term: 2,
            intervalType: 'days',
          },
        },
        scheduleType: ScheduleType.PERIOD,
        closeSubmissionDateTime: moment(TODAY)
          .add(1, 'days')
          .format('YYYY-MM-DD HH:MM:SS'),
      },
    };

    await flushPromises();

    const availableDates = wrapper.vm.AVAILABLE_DATES;
    expect(availableDates.length).toEqual(1);
    expect(availableDates[0].startDate).toEqual(
      moment(TODAY).format('YYYY-MM-DD HH:MM:SS')
    );
    expect(availableDates[0].closeDate).toEqual(
      moment(TODAY).add(2, 'days').format('YYYY-MM-DD HH:MM:SS')
    );
    // we specified 2 days
    expect(availableDates[0].graceDate).toEqual(
      moment(TODAY).add(4, 'days').format('YYYY-MM-DD HH:MM:SS')
    );
  });

  it('AVAILABLE_PERIOD_OPTIONS should return the appropriate period options', async () => {
    const START_DAY = moment();
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

    // If the difference in days is at greater than a week but less than a month, then it should show months, quarters, years
    formStore.form = {
      schedule: {
        openSubmissionDateTime: START_DAY.clone(),
        keepOpenForTerm: 7,
        keepOpenForInterval: 'days',
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 1,
            intervalType: 'days',
          },
        },
      },
    };

    expect(wrapper.vm.AVAILABLE_PERIOD_OPTIONS).toEqual([
      'months',
      'quarters',
      'years',
    ]);

    // If the difference in days is at greater than a month but less than a quarter, then it should show quarters, years
    formStore.form = {
      schedule: {
        openSubmissionDateTime: START_DAY.clone(),
        keepOpenForTerm: 30,
        keepOpenForInterval: 'days',
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 1,
            intervalType: 'days',
          },
        },
      },
    };

    expect(wrapper.vm.AVAILABLE_PERIOD_OPTIONS).toEqual(['quarters', 'years']);

    // If the difference in days is at greater than a quarter, then it should show years
    formStore.form = {
      schedule: {
        openSubmissionDateTime: START_DAY.clone(),
        keepOpenForTerm: 91,
        keepOpenForInterval: 'days',
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 1,
            intervalType: 'days',
          },
        },
      },
    };

    expect(wrapper.vm.AVAILABLE_PERIOD_OPTIONS).toEqual(['years']);

    // If the difference in days is less than 7 days, then it should show weeks, months, quarters, years
    formStore.form = {
      schedule: {
        openSubmissionDateTime: START_DAY.clone(),
        keepOpenForTerm: 5,
        keepOpenForInterval: 'days',
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 1,
            intervalType: 'days',
          },
        },
      },
    };

    expect(wrapper.vm.AVAILABLE_PERIOD_OPTIONS).toEqual([
      'weeks',
      'months',
      'quarters',
      'years',
    ]);

    // If the difference in days is less than 7 days, then it should show quarters, years
    // and the late submission period interval is not in days, but something else
    formStore.form = {
      schedule: {
        openSubmissionDateTime: START_DAY.clone(),
        keepOpenForTerm: 5,
        keepOpenForInterval: 'days',
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 1,
            intervalType: 'months',
          },
        },
      },
    };

    expect(wrapper.vm.AVAILABLE_PERIOD_OPTIONS).toEqual(['quarters', 'years']);
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
    const formStore = useFormStore();
    formStore.form = {
      schedule: {
        enabled: true,
        openSubmissionDateTime: TODAY,
        closeSubmissionDateTime: moment(TODAY).add(2, 'days').format('YYYY-MM-DD HH:MM:SS'),
        scheduleType: ScheduleType.CLOSINGDATE,
        allowLateSubmissions: {
          enabled: true,
          forNext: {
            term: 2,
            intervalType: 'days'
          }
        }
      }
    };
  
    await flushPromises();
  
    // Check submission schedule text
    const submissionScheduleText = wrapper.find('[data-test="submission-schedule-text"]');
    expect(submissionScheduleText.exists()).toBe(true);
    
    const scheduleTextContent = submissionScheduleText.text();
    expect(scheduleTextContent).toContain(t('trans.formSettings.submissionsOpenDateRange'));
    expect(scheduleTextContent).toContain(TODAY);
    expect(scheduleTextContent).toContain(t('trans.formSettings.to'));
    expect(scheduleTextContent).toContain(formStore.form.schedule.closeSubmissionDateTime);
  
    // Check that there's exactly one space before and after the "to" text
    const toIndex = scheduleTextContent.indexOf(t('trans.formSettings.to'));
    expect(scheduleTextContent[toIndex - 1]).toBe(' ');
    expect(scheduleTextContent[toIndex + t('trans.formSettings.to').length]).toBe(' ');
  
    // Check late submission text
    const lateSubmissionText = wrapper.find('[data-test="late-submission-text"]');
    expect(lateSubmissionText.exists()).toBe(true);
  
    const lateTextContent = lateSubmissionText.text();
    const expectedLateText = `${t('trans.formSettings.allowLateSubmissnInterval')} 2 days.`;
    expect(lateTextContent).toBe(expectedLateText);
  
    // Check that there's exactly one space before and after the term and interval type
    const termIndex = lateTextContent.indexOf('2');
    expect(lateTextContent[termIndex - 1]).toBe(' ');
    expect(lateTextContent[termIndex + 1]).toBe(' ');
  
    const intervalTypeIndex = lateTextContent.indexOf('days');
    expect(lateTextContent[intervalTypeIndex - 1]).toBe(' ');
    expect(lateTextContent[intervalTypeIndex + 4]).toBe('.');
  });
  
});
