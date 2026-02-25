import 'cypress-file-upload';
import 'cypress-axe';

Cypress.Commands.add('checkA11yPage', () => {
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.injectAxe();

  cy.checkA11y(
    null,
    {
      includedImpacts: ['critical', 'serious', 'moderate', 'minor'],
      skipFailures: true,
    },
    (violations) => {
      if (!violations) {
        console.warn('No axe violations found');
        return;
      }

      // Call task to write axe report
      cy.task('writeAxeReport', {
        results: { violations }, // ✅ wrap in results object
        filePath: 'cypress/axe-reports/report.json',
      });
    },
    true
  );
});
