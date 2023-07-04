export default [
    {
        type: 'datetime',
        input: true,
        key: 'datePicker.minDate',
        label: 'Minimum allowed date',
        weight: 10,
        tooltip: 'Set the minimum allowed date.'
    },
    {
        type: 'datetime',
        input: true,
        key: 'datePicker.maxDate',
        label: 'Maximum allowed Date',
        weight: 20,
        tooltip: 'Set the maximum allowed date.',
    },
    {
        type: 'checkbox',
        input: true,
        key: 'datePicker.disableWeekends',
        label: 'Disable weekends',
        tooltip: 'Check to disable weekends',
        weight: 23
    },
    {
        type: 'checkbox',
        input: true,
        key: 'datePicker.disableWeekdays',
        label: 'Disable weekdays',
        tooltip: 'Check to disable weekdays',
        weight: 23
    }
];
