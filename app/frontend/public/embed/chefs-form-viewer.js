/* eslint-disable no-console */
// CHEFS Form Viewer Web Component
// Version: 1.0.0
// Description: A web component for embedding CHEFS forms in external applications
(function () {
  'use strict';

  class CHEFSFormViewer extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // Initialize properties
      this.formId = null;
      this.apiKey = null;
      this.submissionId = null;
      this.versionId = null;
      this.readOnly = false;
      this.preview = false;
      this.theme = 'default';
      this.language = 'en';
      this.baseUrl = null;

      // Internal state
      this.form = {};
      this.formSchema = {};
      this.submission = { data: {} };
      this.formioInstance = null;
      this.isLoading = false; // Start as false, only set to true when actually loading
      this.isAuthorized = true;
      this.loadFormTimeout = null; // For debouncing loadForm calls
      this.requiredAttributesSet = false; // Track if all required attributes are set

      // Bind methods
      this.handleSubmit = this.handleSubmit.bind(this);
      this.handleBeforeSubmit = this.handleBeforeSubmit.bind(this);
      this.handleFormChange = this.handleFormChange.bind(this);
      this.handleFormRender = this.handleFormRender.bind(this);
    }

    static get observedAttributes() {
      return [
        'form-id',
        'api-key',
        'submission-id',
        'version-id',
        'read-only',
        'preview',
        'theme',
        'language',
        'base-url',
      ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
      console.log(
        `CHEFS Web Component: attributeChangedCallback called for ${name}: ${oldValue} -> ${newValue}`
      );
      if (oldValue !== newValue) {
        switch (name) {
          case 'form-id':
            this.formId = newValue;
            break;
          case 'api-key':
            this.apiKey = newValue;
            break;
          case 'submission-id':
            this.submissionId = newValue;
            break;
          case 'version-id':
            this.versionId = newValue;
            break;
          case 'read-only':
            this.readOnly = newValue === 'true';
            console.log(
              `CHEFS Web Component: readOnly set to ${this.readOnly}`
            );
            break;
          case 'preview':
            this.preview = newValue === 'true';
            break;
          case 'theme':
            this.theme = newValue;
            // Only re-render if we're not in the initial loading phase
            if (this.requiredAttributesSet) {
              this.render();
            }
            break;
          case 'language':
            this.language = newValue;
            break;
          case 'base-url':
            this.baseUrl = newValue;
            break;
        }

        // Check if all required attributes are now set
        this.checkAndLoadForm();
      }
    }

    connectedCallback() {
      this.render();
      // Don't call loadForm here - let attributeChangedCallback handle it
      // This prevents race conditions between connectedCallback and attributeChangedCallback
    }

    disconnectedCallback() {
      if (this.formioInstance) {
        this.formioInstance.destroy();
      }
    }

    checkAndLoadForm() {
      // Check if all required attributes are set
      const hasRequiredAttributes = this.formId && this.apiKey && this.baseUrl;

      if (hasRequiredAttributes && !this.requiredAttributesSet) {
        this.requiredAttributesSet = true;

        // Clear any existing timeout
        if (this.loadFormTimeout) {
          clearTimeout(this.loadFormTimeout);
        }

        // Set a new timeout to load the form
        this.loadFormTimeout = setTimeout(() => {
          if (this.formId && this.apiKey && this.baseUrl && !this.isLoading) {
            console.log(
              'CHEFS Web Component: All required attributes set, loading form'
            );
            this.loadForm();
          }
        }, 50); // Reduced timeout for better responsiveness
      }
    }

    async loadForm() {
      console.log('CHEFS Web Component: loadForm called', {
        formId: this.formId,
        apiKey: this.apiKey ? '***' : 'undefined',
        baseUrl: this.baseUrl,
        isLoading: this.isLoading,
        isAuthorized: this.isAuthorized,
      });

      // Prevent multiple simultaneous loads
      if (this.isLoading) {
        console.log(
          'CHEFS Web Component: loadForm already in progress, skipping'
        );
        return;
      }

      try {
        this.isLoading = true;
        this.render();

        // Load form schema
        await this.getFormSchema();

        // Load submission data if submissionId is provided
        if (this.submissionId) {
          await this.fetchFormData();
        }

        // Form.io will be initialized after loading is complete
      } catch (error) {
        console.error('Error loading form:', error);
        this.dispatchEvent(
          new CustomEvent('formError', {
            detail: { error: error.message },
            bubbles: true,
            composed: true,
          })
        );
      } finally {
        console.log('CHEFS Web Component: loadForm finally block');
        this.isLoading = false;
        this.render();

        // Re-initialize Form.io after loading is complete and container is available
        if (this.formSchema) {
          console.log(
            'CHEFS Web Component: Form schema available, initializing Form.io'
          );
          // Destroy existing Form.io instance if it exists
          if (this.formioInstance) {
            console.log(
              'CHEFS Web Component: Destroying existing Form.io instance'
            );
            try {
              this.formioInstance.destroy();
            } catch (error) {
              console.warn(
                'CHEFS Web Component: Error destroying Form.io instance:',
                error
              );
            }
            this.formioInstance = null;
          }

          setTimeout(() => {
            console.log(
              'CHEFS Web Component: setTimeout callback - calling initializeFormio'
            );
            this.initializeFormio().catch((error) => {
              console.error(
                'CHEFS Web Component: Failed to initialize Form.io:',
                error
              );
            });
          }, 100);
        } else {
          console.log('CHEFS Web Component: No form schema available');
        }
      }
    }

    async getFormSchema() {
      console.log('CHEFS Web Component: getFormSchema called');
      const baseUrl = this.getBaseUrl();
      const credentials = btoa(`${this.formId}:${this.apiKey}`);
      const url = `${baseUrl}/webcomponents/v1/form-viewer/${this.formId}/schema`;
      console.log('CHEFS Web Component: Fetching schema from:', url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.isAuthorized = false;
          throw new Error('Unauthorized access to form');
        }
        throw new Error(`Failed to load form: ${response.statusText}`);
      }

      const data = await response.json();
      this.form = data.form || data;
      this.formSchema = data.schema || data.form?.versions?.[0]?.schema || data;
    }

    async fetchFormData() {
      console.log(
        'CHEFS Web Component: fetchFormData called with submissionId:',
        this.submissionId
      );

      if (!this.submissionId) {
        console.log(
          'CHEFS Web Component: No submissionId provided, skipping fetch'
        );
        return;
      }

      const credentials = btoa(`${this.formId}:${this.apiKey}`);
      const url = `${this.getBaseUrl()}/api/v1/submissions/${
        this.submissionId
      }`;
      console.log('CHEFS Web Component: Fetching submission from:', url);

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(
          'CHEFS Web Component: Submission fetch response status:',
          response.status
        );

        if (!response.ok) {
          console.error(
            'CHEFS Web Component: Failed to load submission:',
            response.statusText
          );
          throw new Error(`Failed to load submission: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('CHEFS Web Component: Submission data received:', data);
        this.submission = data.submission || data;
        console.log('CHEFS Web Component: Submission set to:', this.submission);
      } catch (error) {
        console.error(
          'CHEFS Web Component: Error fetching submission data:',
          error
        );
        // Don't throw - let the form load without submission data
        this.submission = null;
      }
    }

    async initializeFormio() {
      console.log('CHEFS Web Component: initializeFormio called');
      // Load Form.io from CDN if not already loaded
      if (!window.Formio) {
        await this.loadFormioScript();
      }

      // Load BC Gov styles into shadow DOM before creating Form.io instance
      await this.loadBcGovStyles();

      // Create form container
      const formContainer = this.shadowRoot.getElementById('formio-container');
      console.log(
        'CHEFS Web Component: Form container found:',
        !!formContainer
      );
      if (!formContainer) {
        console.error(
          'CHEFS Web Component: formio-container not found in shadow DOM'
        );
        throw new Error('Form container not found');
      }

      // Form.io options with proper hooks
      const options = {
        sanitizeConfig: {
          addTags: ['iframe'],
          ALLOWED_TAGS: ['iframe'],
        },
        readOnly: this.readOnly,
        language: this.language,
        hooks: {
          beforeSubmit: this.handleBeforeSubmit.bind(this),
        },
        evalContext: {
          // Add any context needed for form evaluation
        },
      };

      console.log('CHEFS Web Component: Form.io options:', {
        readOnly: this.readOnly,
        language: this.language,
        hasHooks: !!options.hooks,
      });

      // Add submission data to options if available
      console.log(
        'CHEFS Web Component: Checking submission data for Form.io options:',
        {
          hasSubmission: !!this.submission,
          submissionKeys: this.submission ? Object.keys(this.submission) : null,
          hasData: this.submission && !!this.submission.data,
          dataKeys:
            this.submission && this.submission.data
              ? Object.keys(this.submission.data)
              : null,
          submissionObject: this.submission,
        }
      );

      // Store submission data for later use
      let submissionData = null;
      if (
        this.submission &&
        this.submission.submission &&
        this.submission.submission.data
      ) {
        submissionData = this.submission.submission.data;
        console.log(
          'CHEFS Web Component: Found submission data in submission.submission.data'
        );
      } else if (this.submission && this.submission.data) {
        submissionData = this.submission.data;
        console.log(
          'CHEFS Web Component: Found submission data in submission.data'
        );
      } else if (this.submission && this.submission.submission) {
        submissionData = this.submission.submission;
        console.log(
          'CHEFS Web Component: Found submission data in submission.submission'
        );
      } else if (this.submission) {
        submissionData = this.submission;
        console.log(
          'CHEFS Web Component: Using entire submission object as data'
        );
      }

      if (submissionData) {
        console.log(
          'CHEFS Web Component: Submission data found, will apply after Form.io creation:',
          submissionData
        );
      } else {
        console.log('CHEFS Web Component: No submission data available');
      }

      // Create Form.io instance - use the most reliable method
      if (typeof window.Formio.createForm === 'function') {
        // Use Formio.createForm static method (preferred)
        this.formioInstance = await window.Formio.createForm(
          formContainer,
          this.formSchema,
          options
        );
      } else if (typeof window.Formio.Form === 'function') {
        // Fallback to Formio.Form class
        this.formioInstance = new window.Formio.Form(
          formContainer,
          this.formSchema,
          options
        );
      } else {
        throw new Error(
          'Formio is not available. Formio may not have loaded properly.'
        );
      }

      // Verify we have a valid Form.io instance
      if (
        !this.formioInstance ||
        typeof this.formioInstance.on !== 'function'
      ) {
        throw new Error('Failed to create Form.io instance');
      }
      // Configure the form to submit to our custom endpoint
      const baseUrl = this.getBaseUrl();
      const credentials = btoa(`${this.formId}:${this.apiKey}`);
      this.formioInstance.url = `${baseUrl}/api/v1/webcomponent/${this.formId}/submit`;
      this.formioInstance.headers = {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      };

      // Add event listeners using Form.io's built-in event system
      this.formioInstance.on('change', this.handleFormChange.bind(this));
      this.formioInstance.on('render', this.handleFormRender.bind(this));

      // Set submission data after Form.io instance is created
      if (submissionData) {
        console.log(
          'CHEFS Web Component: Setting submission data on Form.io instance'
        );

        // Try using setSubmission method if available
        if (this.formioInstance.setSubmission) {
          console.log('CHEFS Web Component: Using setSubmission method');
          this.formioInstance.setSubmission({ data: submissionData });
        } else {
          console.log('CHEFS Web Component: Using submission property');
          this.formioInstance.submission = { data: submissionData };
        }

        console.log('CHEFS Web Component: Submission data set successfully');
        console.log(this.formioInstance.submission);
      }

      console.log('CHEFS Web Component: Form.io event listeners attached');
    }

    async loadFormioScript() {
      return new Promise((resolve, reject) => {
        if (window.Formio) {
          // Form.io is already loaded, load custom components and styles if needed
          Promise.all([this.loadCustomComponents(), this.loadBcGovStyles()])
            .then(resolve)
            .catch(reject);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.form.io/formiojs/formio.full.min.js';
        script.onload = () => {
          // After Form.io loads, load custom components and styles
          Promise.all([this.loadCustomComponents(), this.loadBcGovStyles()])
            .then(resolve)
            .catch(reject);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    async loadCustomComponents() {
      return new Promise((resolve, reject) => {
        // Check if custom components are already loaded
        if (window.BcGovFormioComponents) {
          window.Formio.use(window.BcGovFormioComponents);
          resolve();
          return;
        }

        // Load custom components from your server
        const script = document.createElement('script');
        script.src = `${this.getBaseUrl()}/webcomponents/v1/form-viewer/components`;
        script.onload = () => {
          if (window.BcGovFormioComponents) {
            window.Formio.use(window.BcGovFormioComponents);
            resolve();
          } else {
            reject(new Error('Custom components failed to load'));
          }
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    async loadBcGovStyles() {
      return new Promise((resolve) => {
        // Check if BC Gov styles are already loaded in shadow DOM
        if (
          this.shadowRoot &&
          this.shadowRoot.querySelector(
            'link[href*="bcgov-webcomponent-styles"]'
          )
        ) {
          resolve();
          return;
        }

        // Load BC Gov styles from your server and inject into shadow DOM
        fetch(`${this.getBaseUrl()}/webcomponents/v1/form-viewer/styles`)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
          })
          .then((cssText) => {
            // Create a style element and inject the CSS into shadow DOM
            if (this.shadowRoot) {
              const style = document.createElement('style');
              style.textContent = cssText;
              this.shadowRoot.appendChild(style);
              console.log(
                'CHEFS Web Component: BC Gov styles injected into shadow DOM'
              );
            }
            resolve();
          })
          .catch((error) => {
            // Don't reject - just resolve without the styles
            console.warn(
              'CHEFS Web Component: BC Gov styles failed to load, continuing without them:',
              error
            );
            resolve();
          });
      });
    }

    async handleBeforeSubmit(submission, next) {
      console.log(
        'CHEFS Web Component: handleBeforeSubmit called with submission:',
        submission
      );
      if (this.preview) {
        this.dispatchEvent(
          new CustomEvent('formPreviewSubmit', {
            detail: { submission },
            bubbles: true,
            composed: true,
          })
        );
        return;
      }

      // Emit before submit event
      this.dispatchEvent(
        new CustomEvent('formBeforeSubmit', {
          detail: { submission },
          bubbles: true,
          composed: true,
        })
      );

      // Handle the submission ourselves instead of letting Form.io do it
      try {
        await this.handleSubmit(submission);
        // Call next() to continue Form.io's submission process
        next();
      } catch (error) {
        console.error(
          'CHEFS Web Component: Submission failed in beforeSubmit:',
          error
        );
        // Don't call next() to prevent Form.io from continuing
        // This will effectively cancel the submission
      }
    }

    async handleSubmit(submission) {
      console.log(
        'CHEFS Web Component: handleSubmit called with submission:',
        submission
      );

      if (this.preview) {
        console.log(
          'CHEFS Web Component: Preview mode - dispatching preview event'
        );
        this.dispatchEvent(
          new CustomEvent('formPreviewSubmit', {
            detail: { submission },
            bubbles: true,
            composed: true,
          })
        );
        return;
      }

      try {
        const baseUrl = this.getBaseUrl();
        const credentials = btoa(`${this.formId}:${this.apiKey}`);
        console.log(
          'CHEFS Web Component: Submitting to:',
          `${baseUrl}/webcomponents/v1/form-viewer/${this.formId}/submit`
        );

        // Submit to CHEFS API
        const response = await fetch(
          `${baseUrl}/webcomponents/v1/form-viewer/${this.formId}/submit`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              draft: false,
              submission: submission,
            }),
          }
        );

        console.log(
          'CHEFS Web Component: Response status:',
          response.status,
          response.statusText
        );

        if (!response.ok) {
          throw new Error(`Submission failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(
          'CHEFS Web Component: Submission successful, result:',
          result
        );

        // Emit success event
        this.dispatchEvent(
          new CustomEvent('formSubmit', {
            detail: { submission: result },
            bubbles: true,
            composed: true,
          })
        );
      } catch (error) {
        console.error('Submission error:', error);

        // Emit error event
        this.dispatchEvent(
          new CustomEvent('formError', {
            detail: { error: error.message },
            bubbles: true,
            composed: true,
          })
        );
      }
    }

    handleFormChange(event) {
      console.log(
        'CHEFS Web Component: handleFormChange called with event:',
        event
      );
      this.dispatchEvent(
        new CustomEvent('formChange', {
          detail: {
            changed: event.changed,
            submission: event.submission,
          },
          bubbles: true,
          composed: true,
        })
      );
    }

    handleFormRender() {
      console.log('CHEFS Web Component: handleFormRender called');
      this.isLoading = false;
      this.render();

      this.dispatchEvent(
        new CustomEvent('formRender', {
          detail: { form: this.form },
          bubbles: true,
          composed: true,
        })
      );
    }

    render() {
      const styles = this.getStyles();

      this.shadowRoot.innerHTML = `
        ${styles}
        <div class="chefs-form-viewer">
                  ${this.renderUnauthorizedMessage()}
        ${this.renderLoadingMessage()}
          ${this.renderForm()}
        </div>
      `;

      console.log('CHEFS Web Component: Render completed');
      console.log(
        'CHEFS Web Component: Shadow DOM content:',
        this.shadowRoot.innerHTML.substring(0, 200) + '...'
      );
    }

    renderUnauthorizedMessage() {
      if (!this.isAuthorized) {
        return `
          <div class="alert alert-error">
            <h3>Access Denied</h3>
            <p>You are not authorized to view this form.</p>
          </div>
        `;
      }
      return '';
    }

    renderLoadingMessage() {
      if (this.isLoading) {
        return `
          <div class="loading">
            <div class="spinner"></div>
            <p>Loading form...</p>
          </div>
        `;
      }
      return '';
    }

    renderForm() {
      console.log('CHEFS Web Component: renderForm() called', {
        isAuthorized: this.isAuthorized,
        isLoading: this.isLoading,
      });

      if (!this.isAuthorized || this.isLoading) {
        console.log(
          'CHEFS Web Component: renderForm() returning empty - conditions not met'
        );
        return '';
      }

      console.log('CHEFS Web Component: renderForm() returning form container');
      return `
        <div class="form-container">
          <div id="formio-container"></div>
        </div>
      `;
    }

    getStyles() {
      const themeStyles = this.getThemeStyles();

      return `
        <style>
          :host {
            display: block;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .chefs-form-viewer {
            max-width: 100%;
          }

          .alert {
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 4px;
            border: 1px solid;
          }

          .alert-error {
            background-color: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
          }

          .alert-warning {
            background-color: #fff3cd;
            border-color: #ffeaa7;
            color: #856404;
          }

          .loading {
            text-align: center;
            padding: 2rem;
          }

          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .form-container {
            padding: 1rem;
          }

          .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            text-decoration: none;
            display: inline-block;
          }

          .btn-primary {
            background-color: #007bff;
            color: white;
          }

          .btn-primary:hover {
            background-color: #0056b3;
          }

          ${themeStyles}
        </style>
      `;
    }

    getThemeStyles() {
      const themes = {
        bcgov: `
          :host {
            --primary-color: #003366;
            --secondary-color: #fcba19;
            --font-family: 'BCSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .btn-primary {
            background-color: var(--primary-color);
          }
          
          .btn-primary:hover {
            background-color: #002244;
          }
        `,
        modern: `
          :host {
            --primary-color: #007bff;
            --secondary-color: #6c757d;
            --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
        `,
        default: `
          :host {
            --primary-color: #007bff;
            --secondary-color: #6c757d;
          }
        `,
      };

      return themes[this.theme] || themes.default;
    }

    // Public methods for external control
    getFormData() {
      return this.formioInstance ? this.formioInstance.submission : null;
    }

    setFormData(data) {
      if (this.formioInstance) {
        this.formioInstance.submission = data;
      }
    }

    validate() {
      return this.formioInstance ? this.formioInstance.checkValidity() : false;
    }

    submit() {
      if (this.formioInstance) {
        this.formioInstance.submit();
      }
    }

    // Explicit reload method for when attributes change after initial load
    reload() {
      console.log('CHEFS Web Component: Explicit reload called');
      this.requiredAttributesSet = false;
      this.checkAndLoadForm();
    }

    // Load with specific submission data
    loadWithSubmission(submissionId, readOnly = false) {
      console.log(
        'CHEFS Web Component: loadWithSubmission called with:',
        submissionId,
        'readOnly:',
        readOnly
      );
      this.submissionId = submissionId;
      this.readOnly = readOnly;
      this.requiredAttributesSet = false;
      this.checkAndLoadForm();
    }

    getBaseUrl() {
      return this.baseUrl || window.location.origin;
    }
  }

  // Register the web component
  customElements.define('chefs-form-viewer', CHEFSFormViewer);
})();
