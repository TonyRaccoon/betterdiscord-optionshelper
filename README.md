# betterdiscord-optionshelper
Copy-and-paste code to manage options and settings panel stuff in your BetterDiscord plugin. See [example.plugin.js](example.plugin.js) for example usage.

# Methods
The following methods are exposed by the helper:
| Method | Description |
|---|---|
| `get(key)`       | Gets the value of an option. `number` types are automatically returned as a float. |
| `set(key,value)` | Sets the value of an option (also saves all options to localStorage). |
| `getDefaults()` | Gets all default values, in the form of `{key:{...}, key2:{...}, ...}` (same structure as the constructor). |
| `getAll()` | Gets all values, in the form of `{key:{...}, key2:{...}, ...}` (same structure as the constructor). |
| `simpleOptions()` | Gets all values, in the form of `{key:value, key2:value2, ...}` |
| `save()` | Manually save to localStorage. Should never need to be done, as setting a value or resetting to defaults automatically saves. |
| `load()` | Load saved options from localStorage. |
| `reset()` | Resets all options to their default values and saves to localStorage. |
| `settingsHTML()` | Returns the HTML for the BetterDiscord settings window. Use this in your plugin's `getSettingsPanel()` method. |

# Constructor
The following properties can be passed to the helper's constructor method:
| Property | Description |
|---|---|---|
| `plugin` | Reference to the originating plugin (pass `this`). Required. |
| `storageKey` | Key used to save options to localStorage. Required. |
| `defaults` | Table containing all options, their default values, and their parameters. See below for details. |
| `onSave` | Function that will be called when an option is changed. Passed two parameters, `key` and `value`. |
| `onReset` | Function that will be called when options are reset to defaults. |

# Options
### Global
All option types have these properties:
| Property | Example | Description |
|---|---|---|
| `value` | `"tag1, tag2"` | Default value of the option. |
| `type` | `"text"` | Type of the option. Can be either `text`, `number`, `range`, `toggle`, or `select` |
| `label` | `"Type some tags here"` | Title displayed next to the input in the settings panel. |
| `help` | `"Separate tags with commas"` | Additional, smaller text displayed under the label. |

### `range`
Options of type `range` have the following additional properties:
| Property | Example | Description |
|---|---|---|
| `min` | `10` | Minimum value of the slider. Default `0`. |
| `max` | `50` | Maximum value of the slider. Default `100`. |
| `step` | `10` | Step value of the slider. Values will be rounded to this increment. e.g. `10` will snap values to the nearest 10, `1` will snap values to the nearest integer, and `0.1` will snap values to the nearest tenth. Default `1`. |
| `percent` | `true` | Whether to display the value as a percentage or not. Default `false`. |

### `select`
Options of type `select` have the following additional properties:
| Property | Example | Description |
|---|---|---|
| `options` | `["One", "Two", "Three"]` | An array containing all options in the dropdown. |

# Installation
1. Copy the code block from [code.js](code.js) into your plugin's file.
2. Change `PLUGIN_CONSTRUCTOR_HERE` to your plugin's constructor (for example, `myPlugin`)
3. In your `start` method, create a reference to the helper:

```js
var OptionsPlugin = this.getOptionsPlugin();
```

4. Right under that, call the constructor and assign it to a variable:

```js
this.options = new OptionsPlugin({
    plugin:      this,
    storageKey:  "options-test",
    defaults:    {
        text:   {value:"Text", type:"text",   label:"Some text", help:"This is some help text under the label"},
        number: {value:50,     type:"number", label:"A number", help:"This is some help text under the label"},
        range:  {value:50,     type:"range",  label:"A range", min:40, max:50, percent:false, help:"This is some help text under the label" },
        toggle: {value:true,   type:"toggle", label:"A toggle", help:"This is some help text under the label"},
        select: {value:"One",  type:"select", label:"A dropdown", help:"This is some help text under the label", options:["One", "Two", "Three"]},
    },

    onSave:function(key,value){
        console.log(key + " was set to " + value);
    },
    onReset:function(){
        console.log("Settings were reset");
    }
});
```

5. Load values from localStorage:

```js
this.options.load();
```

6. Set up the settings window:

```js
myPlugin.prototype.getSettingsPanel = function() {
    // BD bug: getSettingsPanel() is called even if plugin isn't enabled
    // in which case this.options doesn't exist, so check first
	if (this.options) return this.options.settingsHTML();
}
```

7. Use!:

```js
this.options.get("someoption");
this.options.set("someoption", "new value");
```