# Form.io contrib components library

This module contains contributed components for use with Form.io. It also serves as a good example on how you can create your very own custom components library that can be used with Form.io platform.

## Installation

To install this library, do the following.

```sh
npm install --save @formio/contrib
```

## Usage

```javascript
import { Formio } from 'formiojs';
import FormioContrib from '@formio/contrib';
Formio.use(FormioContrib);
```

You can also include this library within the DOM of your application like the following.

```html
<link rel="stylesheet" href="https://unpkg.com/formiojs@latest/dist/formio.full.min.css">
<script src="https://unpkg.com/formiojs@latest/dist/formio.full.min.js"></script>
<script src="https://unpkg.com/@formio/contrib@latest/dist/formio-contrib.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@formio/contrib@latest/dist/formio-contrib.css">
<script type="text/javascript">
    Formio.use(FormioContrib);
</script>
```

Or you can use the **formio-contrib.use.min.js** file which automatically adds the ```Formio.use``` method.

```html
<link rel="stylesheet" href="https://unpkg.com/formiojs@latest/dist/formio.full.min.css">
<script src="https://unpkg.com/formiojs@latest/dist/formio.full.min.js"></script>
<script src="https://unpkg.com/@formio/contrib@latest/dist/formio-contrib.use.min.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@formio/contrib@latest/dist/formio-contrib.css">
```

### Using within the Form.io Developer Portal

It is also possible to inject custom components within the Form.io Developer Portal. This allows you to use the Developer Portal to create forms that include your custom components. Note: This currently only works with the Next portal @ <https://next.form.io>

To make this work, navigate to your project settings, and then click on **Custom JS and CSS**. Within the **Custom JavaScript** box, you will then place the hosted URL to the **dist/formio-contrib.use.min.js** file within this library, like so.

![Custom CSS and Javascript](https://api.monosnap.com/file/download?id=dQmYlhPWLa7mDDDJMN1VpkJwXy7iHG)

You can also use the unpkg url to this repo to test this out. [https://unpkg.com/@formio/contrib@latest/dist/formio-contrib.use.min.js](https://unpkg.com/@formio/contrib@latest/dist/formio-contrib.use.min.js)

### Using within the Form Manager application

You can also use this method to introduce custom components into the Form Manager application. To get this to work, you just need to Enable Public configurations within your project settings, and then provide the **js** setting to contain the URL of the **dist/formio-contrib.use.min.js** file within this repository like so.

![Public Configurations](https://api.monosnap.com/file/download?id=lvK2kW9eOuAEVDMNW96hP5qLOCaQEY)
