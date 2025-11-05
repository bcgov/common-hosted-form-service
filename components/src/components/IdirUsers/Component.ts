/* tslint:disable */
import { Components } from 'formiojs';
import editForm from './Component.form';
import _ from 'lodash';

const FieldComponent = (Components as any).components.field;

export default class Component extends FieldComponent {
  static schema(...extend) {
    return FieldComponent.schema({
      type: 'idirusers',
      label: 'IDIR Users',
      key: 'idirusers',
      input: true,
      defaultValue: {
        email: '',
        lastName: '',
        username: '',
        firstName: '',
        attributes: {
          display_name: [],
          idir_username: [],
          idir_user_guid: []
        }
      },
      searchDebounce: 300,
      minSearch: 2,
      apiEndpoint: `${import.meta.env.VITE_FRONTEND_BASEPATH}/api/v1/cs/css/idir/users`,
    }, ...extend);
  }

  static get builderInfo() {
    return {
      title: 'IDIR Users',
      group: 'basic',
      icon: 'user',
      weight: 90,
      schema: Component.schema(),
    };
  }

  public static readonly editForm = editForm;

  // Track component state
  componentID: string;
  pendingRequest = false;
  lastQuery = '';
  selectedUser = null;
  searchResultsData = [];

  constructor(component, options, data) {
    // @SonarIgnore: This super constructor call is required
    super(component, options, data);
    
    this.componentID = super.elementInfo().component.id;
    this.component.searchDebounce = this.component.searchDebounce || 300;
    this.component.minSearch = this.component.minSearch || 2;
    this.component.apiEndpoint = this.component.apiEndpoint || `${import.meta.env.VITE_FRONTEND_BASEPATH}/api/v1/cs/css/idir/users`;
  }

  render() {
    // Only render the container for both modes
    return super.render(`<div id="${this.component.key}-${this.id}"></div>`);
  }

  renderUserViewHTML(value) {
    if (!value) {
      return '<div class="text-muted">No user selected</div>';
    }
    const displayName = value.attributes?.display_name?.[0] || `${value.firstName || ''} ${value.lastName || ''}`;
    const username = value.attributes?.idir_username?.[0] || value.username || '';
    return `
      <div class="alert alert-info">
        <div class="selected-user-view mt-2">
          <div><strong>Name:</strong> ${this.sanitize(displayName)}</div>
          <div><strong>Username:</strong> ${this.sanitize(username)}</div>
          <div><strong>Email:</strong> ${this.sanitize(value.email || '')}</div>
        </div>
      </div>
    `;
  }

  // Helper method to sanitize output
  sanitize(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Attach event handlers after render
  attach(element) {
    const superAttach = super.attach(element);
    
    // Start initialization after a small delay
    setTimeout(() => this.initializeComponent(), 200);
    
    return superAttach;
  }

  initializeComponent() {
    // Find the container
    const container = document.getElementById(`${this.component.key}-${this.id}`);
    if (!container) return;

    if (this.options.readOnly || this.disabled) {
      // Render read-only view
      container.innerHTML = this.renderUserViewHTML(this.dataValue);
      return;
    }

    // Render edit mode UI
    container.innerHTML = `
      <div class="idir-user-container">
        <!-- Selected user display (outside the search panel) -->
        <div class="idir-user-selection mb-3" style="display:none">
          <div class="alert alert-info">
            <strong>Selected User:</strong>
            <div class="selected-user-info"></div>
            <button type="button" class="btn btn-sm btn-warning clear-selection" style="position: absolute; right: 15px; top: 15px;">Clear</button>
          </div>
        </div>
        
        <!-- Search panel -->
        <div class="card panel panel-default mb-3">
          <div class="card-header bg-light">
            <h4 class="mb-0">Search for IDIR User</h4>
          </div>
          <div class="card-body">
            <div class="idir-user-search-fields">
              <div class="row">
                <div class="col-md-4 form-group">
                  <label for="${this.id}-email">Email</label>
                  <input type="text" id="${this.id}-email" class="form-control email-field" placeholder="Search by email"/>
                </div>
                <div class="col-md-4 form-group">
                  <label for="${this.id}-firstName">First Name</label>
                  <input type="text" id="${this.id}-firstName" class="form-control firstName-field" placeholder="Search by first name"/>
                </div>
                <div class="col-md-4 form-group">
                  <label for="${this.id}-lastName">Last Name</label>
                  <input type="text" id="${this.id}-lastName" class="form-control lastName-field" placeholder="Search by last name"/>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 text-right mt-3">
                  <button type="button" class="btn btn-primary search-button">Search</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Results panel -->
        <div class="idir-user-results card panel panel-default" style="display:none">
          <div class="card-header bg-light">
            <h5 class="mb-0">Search Results</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th style="width: 100px;">Action</th>
                  </tr>
                </thead>
                <tbody class="search-results">
                  <!-- Results will be inserted here -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Validation message area -->
        <div class="validation-message">
        </div>
      </div>
    `;

    // Set up DOM references and event listeners
    this.setupEventListeners(container);
    
    // If we have an existing value, show the selection
    if (this.dataValue) {
      this.showSelectedUser(this.dataValue);
    }
  }

  setupEventListeners(container) {
    this.emailInput = container.querySelector(`#${this.id}-email`);
    this.firstNameInput = container.querySelector(`#${this.id}-firstName`);
    this.lastNameInput = container.querySelector(`#${this.id}-lastName`);
    this.searchButton = container.querySelector('.search-button');
    this.searchResults = container.querySelector('.search-results');
    this.userResults = container.querySelector('.idir-user-results');
    this.userResultsTable = container.querySelector('.idir-user-results .table-responsive');
    this.userSelection = container.querySelector('.idir-user-selection');
    this.selectedUserInfo = container.querySelector('.selected-user-info');
    this.clearSelection = container.querySelector('.clear-selection');

    if (this.searchButton) {
      this.addEventListener(this.searchButton, 'click', this.performSearch.bind(this));
    }
    if (this.clearSelection) {
      this.addEventListener(this.clearSelection, 'click', this.clearSelectionHandler.bind(this));
    }
  }

  // Perform search when button is clicked
  performSearch() {
    const email = this.emailInput ? this.emailInput.value.trim() : '';
    const firstName = this.firstNameInput ? this.firstNameInput.value.trim() : '';
    const lastName = this.lastNameInput ? this.lastNameInput.value.trim() : '';

    // Validate that at least one field has enough characters
    if ((!email || email.length < this.component.minSearch) && 
        (!firstName || firstName.length < this.component.minSearch) && 
        (!lastName || lastName.length < this.component.minSearch)) {
      this.setCustomValidity('Please enter at least ' + this.component.minSearch + ' characters in at least one search field');
      return;
    }

    // Clear previous validation messages
    this.setCustomValidity('');

    // Build query parameters
    const params = new URLSearchParams();
    if (email && email.length >= this.component.minSearch) {
      params.append('email', email);
    }
    if (firstName && firstName.length >= this.component.minSearch) {
      params.append('firstName', firstName);
    }
    if (lastName && lastName.length >= this.component.minSearch) {
      params.append('lastName', lastName);
    }

    // If we have at least one valid parameter, perform the search
    if (params.toString()) {
      this.executeSearch(params);
    }
  }

  // Execute the API search
  executeSearch(params) {
    const queryString = params.toString();
    if (queryString === this.lastQuery && this.pendingRequest) {
      return;
    }

    this.lastQuery = queryString;
    this.pendingRequest = true;
    this.setCustomValidity('');

    const url = `${this.component.apiEndpoint}?${queryString}`;

    fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
      this.pendingRequest = false;
      if (data) this.searchResultsData = _.get(data, 'data') || [];
      if (this.searchResultsData.length == 0) {
        this.setCustomValidity('Your search returns 0 results.');
      }
      this.renderSearchResults();
    })
    .catch(err => {
      console.error('Error in search:', err);
      this.pendingRequest = false;
      this.searchResultsData = [];
      this.setCustomValidity(err);
      this.renderSearchResults();
    });
  }

  // Render the search results in the table
  renderSearchResults() {
    if (!this.searchResults) return;

    // Clear existing results
    this.searchResults.innerHTML = '';

    this.userResults.style.display = 'block';
  
    // Show/hide the results container
    if (this.searchResultsData.length > 0) {
      this.userResults.style.display = 'block';
    } else {
      this.userResults.style.display = 'none';
      return;
    }

    // Add rows for each result
    for (let user of this.searchResultsData) {
      const row = document.createElement('tr');
      
      // Name cell
      const nameCell = document.createElement('td');
      const displayName = user?.attributes?.display_name?.[0] || `${user.firstName || ''} ${user.lastName || ''}`;
      nameCell.textContent = displayName;
      row.appendChild(nameCell);

      // Username cell
      const usernameCell = document.createElement('td');
      const username =  user?.attributes?.idir_username?.[0] || user.username || '';
      usernameCell.textContent = username;
      row.appendChild(usernameCell);

      // Email cell
      const emailCell = document.createElement('td');
      emailCell.textContent = user.email || '';
      row.appendChild(emailCell);

      // Action cell
      const actionCell = document.createElement('td');
      const selectButton = document.createElement('button');
      selectButton.type = 'button';
      selectButton.className = 'btn btn-sm btn-success text-white';
      selectButton.textContent = 'Select';
      selectButton.onclick = () => this.selectUser(user);
      actionCell.appendChild(selectButton);
      row.appendChild(actionCell);

      this.searchResults.appendChild(row);
    }
  }

  // Select a user from the results
  selectUser(user) {
    this.selectedUser = user;
    
    // Update the component value
    this.setValue(user);
    
    // Show the selected user in the UI
    this.showSelectedUser(user);
    
    // Hide the results after selection
    this.userResults.style.display = 'none';
  
    // Clear search fields
    if (this.emailInput) this.emailInput.value = '';
    if (this.firstNameInput) this.firstNameInput.value = '';
    if (this.lastNameInput) this.lastNameInput.value = '';
  }

  // Display the selected user information
  showSelectedUser(user) {
    if (!this.selectedUserInfo || !this.userSelection) return;
    
    // Make sure the user selection area is visible
    this.userSelection.style.display = 'block';
    
    // Format display info
    const displayName = user?.attributes?.display_name?.[0] || `${user.firstName || ''} ${user.lastName || ''}`;

    const username = user?.attributes?.idir_username?.[0] || user.username || '';
    
    // Display the user info
    this.selectedUserInfo.innerHTML = `
      <div><strong>Name:</strong> ${this.sanitize(displayName)}</div>
      <div><strong>Username:</strong> ${this.sanitize(username)}</div>
      <div><strong>Email:</strong> ${this.sanitize(user.email || '')}</div>
    `;
  }

  // Clear the selected user
  clearSelectionHandler() {
    this.selectedUser = null;
    this.setValue(null);
    
    // Hide the user selection area
    this.userSelection.style.display = 'none';
  }

  // Set custom validation message
  setCustomValidity(message) {
    if (message) {
      // Create or update validation message element
      let validationEl = this.element.querySelector('.idir-user-validation');
      if (!validationEl) {
        validationEl = document.createElement('div');
        validationEl.className = 'idir-user-validation text-danger mt-2';
        this.element.querySelector('.validation-message').appendChild(validationEl);
      }
      validationEl.textContent = message;
    } else {
      // Remove validation message if exists
      const validationEl = this.element.querySelector('.idir-user-validation');
      if (validationEl) {
        validationEl.remove();
      }
    }
  }

  // Return proper display value for table view
  getValueAsString(value) {
    if (!value) return '';
    
    const displayName = value.attributes?.display_name?.[0] || 
                      `${value.firstName || ''} ${value.lastName || ''}`;
    
    const username = value.attributes?.idir_username?.[0] || value.username || '';
    
    return `${displayName} (${username})`;
  }

  // Ensure custom component works correctly with FormBuilder
  get emptyValue() {
    return null;
  }

  // Check if component is empty for validation
  isEmpty() {
    return !this.dataValue;
  }

  setValue(value) {
    return super.setValue(value);
  }
}