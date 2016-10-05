The settings manager:

To add settings to your plugin, you need to add a function to your plugin called `getSettingSchema` that returns an array of JSON Schema definitions.

We use https://github.com/jdorn/json-editor/ as the tool to parse the JSON schema files.

Each schema definition can have the following additional attributes:
'category' : The settings category to include these settings
'managedBy' : A string identifying the entity that will handle these settings.  The default settings display will not provide a UI for the end user to 'managedBy' settings.

Todo:
- [ ] Fix the spacing issue with check boxes at the end of the form that have description text
- [ ] Move the UI elements to polymer controls
- [ ] Add default material stylings (drop shadows)
- [ ] Get rid of the title showing in the top of the detail section.
