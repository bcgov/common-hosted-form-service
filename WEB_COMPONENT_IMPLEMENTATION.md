# CHEFS Form Viewer Web Component Implementation

## Overview

This implementation provides a complete web component solution for embedding CHEFS forms in external applications. The web component allows clients to design and administrate forms in your CHEFS application while enabling their users to interact with forms in their own applications (WordPress, Vue, React, Kotlin, native phone apps, etc.).

## What Was Implemented

### 1. Web Component Files

- **`app/frontend/public/embed/chefs-form-viewer.js`** - Main web component file
- **`app/frontend/public/embed/chefs-form-viewer.min.js`** - Minified version
- **`app/frontend/public/embed/index.html`** - Demo and documentation page
- **`app/frontend/public/embed/test.html`** - Test page for debugging
- **`app/frontend/public/embed/README.md`** - Comprehensive documentation

### 2. Backend Web Component Module (Isolated Structure)

- **`app/src/webcomponents/v1/form-viewer/controller.js`** - Web component controller methods
- **`app/src/webcomponents/v1/form-viewer/routes.js`** - Web component API routes
- **`app/src/webcomponents/index.js`** - Main web component router
- **`app/app.js`** - Updated to mount web component routes at `/app/webcomponents`

### 3. Backend API Endpoints (Isolated Paths)

- **`GET /app/webcomponents/v1/form-viewer/:formId/schema`** - Public endpoint to retrieve form schema
- **`POST /app/webcomponents/v1/form-viewer/:formId/submit`** - Public endpoint to submit form data
- **`GET /app/webcomponents/v1/form-viewer/components`** - Serve custom Form.io components
- **`GET /app/webcomponents/v1/form-viewer/styles`** - Serve BC Gov styling
- Added CORS support for cross-origin requests
- Added API key authentication middleware

### 4. Custom Form.io Components and Styling

- **`components/src/sass/bcgov-styles.scss`** - BC Government styling for web components
- **`components/dist/bcgov-formio-components.js`** - Built custom Form.io components
- **`components/dist/bcgov-webcomponent-styles.css`** - Compiled BC Gov styles
- **`components/webpack.config.js`** - Webpack configuration for building components
- **`components/package.json`** - Build scripts for components and styles

### 5. Features Implemented

#### Core Functionality

- ✅ Form rendering using Form.io with custom components
- ✅ Form submission handling with proper validation
- ✅ API key authentication via Basic Auth
- ✅ CORS support for cross-origin requests
- ✅ Error handling and validation
- ✅ Loading states and user feedback
- ✅ Race condition prevention and debouncing

#### Customization Options

- ✅ Multiple themes (BC Government, Modern, Default)
- ✅ Language support
- ✅ Read-only mode with submission data loading
- ✅ Custom base URL configuration
- ✅ Responsive design
- ✅ BC Government branding and styling

#### Integration Features

- ✅ Custom events for form lifecycle (formRender, formSubmit, formError, formChange, formBeforeSubmit)
- ✅ Public methods for programmatic control (reload, loadWithSubmission, getFormData, setFormData, validate, submit)
- ✅ Framework-agnostic design
- ✅ Shadow DOM encapsulation for style isolation
- ✅ Comprehensive documentation and examples

#### Advanced Features

- ✅ Custom Form.io components loading
- ✅ BC Government styling injection into Shadow DOM
- ✅ Submission data loading for readonly mode
- ✅ Automatic form reload after submission
- ✅ Debounced form loading to prevent race conditions

## Architecture

### Isolated Web Component Structure

The web component implementation is now completely isolated from the main API:

```
Backend Routes:
├── /app/api/v1/*                    # Main API endpoints
└── /app/webcomponents/v1/form-viewer/*  # Web component endpoints (isolated)

Frontend Static Files:
├── /app/embed/*                     # Web component static files
└── /app/*                           # Main Vue application
```

### File Organization

```
app/
├── src/webcomponents/               # Isolated web component backend
│   └── v1/form-viewer/
│       ├── controller.js            # Web component controller
│       └── routes.js                # Web component routes
├── frontend/public/embed/           # Web component static files
│   ├── chefs-form-viewer.js         # Main web component
│   ├── test.html                    # Test page
│   └── README.md                    # Documentation
└── app.js                           # Updated to mount web component routes

components/
├── src/sass/bcgov-styles.scss       # BC Gov styling source
├── dist/
│   ├── bcgov-formio-components.js   # Built custom components
│   └── bcgov-webcomponent-styles.css # Compiled styles
└── package.json                     # Build configuration
```

## How to Use

### For Clients (External Applications)

1. **Include the Script**

   ```html
   <script src="https://your-domain.com/app/embed/chefs-form-viewer.js"></script>
   ```

2. **Use the Component**

   ```html
   <chefs-form-viewer
     form-id="your-form-id"
     api-key="your-api-key"
     base-url="https://your-domain.com"
     theme="bcgov"
   >
   </chefs-form-viewer>
   ```

3. **Handle Events**

   ```javascript
   document.addEventListener("formSubmit", (event) => {
     console.log("Form submitted:", event.detail.submission);
   });

   document.addEventListener("formRender", (event) => {
     console.log("Form rendered successfully");
   });
   ```

### For Administrators (CHEFS Application)

1. **Generate API Keys**: Use the existing API key management in CHEFS
2. **Configure CORS**: The endpoints are already configured for cross-origin requests
3. **Share Documentation**: Provide clients with the demo page URL and documentation

## Public URLs

Once deployed, the web component will be available at:

- **Demo Page**: `https://your-domain.com/app/embed/`
- **JavaScript File**: `https://your-domain.com/app/embed/chefs-form-viewer.js`
- **Minified Version**: `https://your-domain.com/app/embed/chefs-form-viewer.min.js`
- **Test Page**: `https://your-domain.com/app/embed/test.html`
- **API Endpoints**: `https://your-domain.com/app/webcomponents/v1/form-viewer/*`

**Note:** The web component files are served through the frontend proxy and the API endpoints are isolated from the main API.

## Security Considerations

### API Key Authentication

- All requests require a valid API key via Basic Authentication
- API keys are validated using the existing `apiAccess` middleware
- Unauthorized requests return 401 errors

### CORS Configuration

- Public endpoints allow cross-origin requests
- CORS headers are properly set for browser compatibility
- No additional CORS configuration needed for clients

### Data Validation

- Form submissions are validated on the backend
- Input sanitization is handled by Form.io
- Error messages are user-friendly but don't expose internal details

### Isolation

- Web component endpoints are completely isolated from main API
- Separate routing structure prevents conflicts
- Independent versioning and management

## Framework Integration Examples

### React

```jsx
<chefs-form-viewer
  ref={formRef}
  form-id={formId}
  api-key={apiKey}
  base-url="https://your-domain.com"
  theme="modern"
/>
```

### Vue

```vue
<chefs-form-viewer
  :form-id="formId"
  :api-key="apiKey"
  base-url="https://your-domain.com"
  theme="bcgov"
  @formSubmit="handleSuccess"
/>
```

### WordPress

```php
[chefs_form form_id="abc123" api_key="your-key" base_url="https://your-domain.com" theme="bcgov"]
```

### Native Mobile Apps

```javascript
const formElement = document.createElement("chefs-form-viewer");
formElement.setAttribute("form-id", "abc123");
formElement.setAttribute("api-key", "your-key");
formElement.setAttribute("base-url", "https://your-domain.com");
```

## Testing

### Local Testing

1. Start the backend server: `cd app && npm run serve`
2. Start the frontend server: `cd app/frontend && npm run serve`
3. Navigate to `http://localhost:5173/app/embed/test.html`
4. Enter a valid form ID and API key
5. Set base URL to `http://localhost:5173/app`
6. Click "Load Form" to test the component
7. Check the event log for results

### Production Testing

1. Deploy the application
2. Visit the demo page at `/app/embed/`
3. Test with real form IDs and API keys
4. Verify cross-origin functionality

## Development and Build Process

### Building Custom Components

```bash
cd components
npm install
npm run build
```

This builds:

- `dist/bcgov-formio-components.js` - Custom Form.io components
- `dist/bcgov-webcomponent-styles.css` - BC Government styling

### Docker Build

The Dockerfile automatically builds the components during the build process:

- Runs `npm run all:ci` which includes `npm run components:ci`
- Builds all components and styles
- Serves them from the correct paths in production

## Benefits of This Approach

### For Your Organization

- ✅ **Centralized Form Management**: All forms designed and managed in one place
- ✅ **Consistent Branding**: BC Government themes and styling with custom components
- ✅ **Security Control**: API key management and validation
- ✅ **Analytics**: Track form usage and submissions
- ✅ **Maintenance**: Single codebase to maintain
- ✅ **Isolation**: Web component functionality is completely separate from main API

### For Your Clients

- ✅ **Easy Integration**: Simple HTML tag or framework component
- ✅ **No Dependencies**: Works with any technology stack
- ✅ **Customizable**: Multiple themes and configuration options
- ✅ **Reliable**: Built on proven Form.io technology with custom components
- ✅ **Secure**: API key authentication and CORS support
- ✅ **Professional**: BC Government branding and styling

## Next Steps

### Immediate Actions

1. **Deploy the Application**: The web component is ready for production
2. **Test with Real Forms**: Create test forms and API keys
3. **Share with Clients**: Provide the demo page URL and documentation

### Future Enhancements

1. **Advanced Analytics**: Track form performance and user behavior
2. **Custom Themes**: Allow clients to create custom themes
3. **Webhook Support**: Real-time notifications for form submissions
4. **Multi-language**: Enhanced internationalization support
5. **Mobile Optimization**: Enhanced mobile experience
6. **CSS Containment**: Further style isolation for better integration

## Support and Maintenance

### Documentation

- Complete API reference in `README.md`
- Live demo page with examples
- Framework-specific integration guides
- Troubleshooting section

### Monitoring

- Error logging and reporting
- Performance monitoring
- Usage analytics
- Security monitoring

### Updates

- Version control for the web component
- Backward compatibility considerations
- Automated testing and deployment
- Client notification system

## Conclusion

This web component implementation provides a complete solution for embedding CHEFS forms in external applications. It maintains the centralized form design and administration capabilities of CHEFS while enabling clients to integrate forms seamlessly into their own applications.

The implementation is production-ready and includes comprehensive documentation, testing tools, security measures, and a completely isolated architecture. Clients can start using it immediately with minimal setup required.

The isolated structure ensures that web component functionality can be managed independently from the main API, providing better maintainability and reducing the risk of conflicts during updates.
