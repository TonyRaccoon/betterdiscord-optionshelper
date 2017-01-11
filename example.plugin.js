//META{"name":"optionsExample"}*//
function optionsExample(){}

optionsExample.prototype.getName          = function() { return "OptionsPlugin Example Usage"; }
optionsExample.prototype.getDescription   = function() { return "";  }
optionsExample.prototype.getVersion       = function() { return "1.0.0"; }
optionsExample.prototype.getAuthor        = function() { return "TonyLemur"; }

optionsExample.prototype.load             = function() {}
optionsExample.prototype.unload           = function() {}
optionsExample.prototype.onMessage        = function() {}
optionsExample.prototype.onSwitch         = function() {}
optionsExample.prototype.stop             = function() {}
optionsExample.prototype.observer         = function(e){}

optionsExample.prototype.start          = function() {
	var self = this;
	
	var OptionsPlugin = this.getOptionsPlugin();
	this.options = new OptionsPlugin({
		plugin:      this,
		storageKey:  "options-test",
		defaults:    {
			text:     {value:"Text", type:"text",   label:"Some text",  help:"This is some help text under the label"},
			number:   {value:50,     type:"number", label:"A number",   help:"This is some help text under the label"},
			range:    {value:50,     type:"range",  label:"A range", min:0, max:100, step:1,  help:"This is some help text under the label" },
			range_10: {value:50,     type:"range",  label:"A range", min:0, max:100, step:10, help:"This is some help text under the label" },
			range_5s: {value:50,     type:"range",  label:"A range", min:5, max:95,  step:5,  help:"This is some help text under the label" },
			toggle:   {value:true,   type:"toggle", label:"A toggle",   help:"This is some help text under the label"},
			select:   {value:"One",  type:"select", label:"A dropdown", help:"This is some help text under the label", options:["One", "Two", "Three"]},
		},
		
		onSave:function(key,value){
			console.log(key + " was set to " + value);
		},
		
		onReset:function(){
			console.log("Settings were reset");
		}
	});
	
	this.options.load();
}

optionsExample.prototype.exampleFunction() {
	// Get an option
	console.log("The text entered into the 'Text' box is: " + this.options.get("text"));
	
	// Set an option
	this.options.set("text", "New value");
	
}

optionsExample.prototype.getSettingsPanel = function() {
	if (this.options) return this.options.settingsHTML();
}

// Tony's OptionsPlugin Helper /////////////////////////////////////
// https://github.com/tony311/betterdiscord-optionshelper //////////
optionsExample.prototype.getOptionsPlugin  = function(){
	var OptionsPlugin                      = function(params){       // Constructor
		params.defaults = params.defaults || {};
		
		$.each(params.defaults, function(key,option) {
			if (option.type == "range") {
				option.min = (option.min === undefined) ? 0 : option.min;
				option.max = (option.max === undefined) ? 100 : option.max;
				option.step = (option.step === undefined || option.step == 0) ? 1 : option.step;
				option.percent = (option.percent === undefined) ? true : option.percent;
			}
		});
		
		this.options         = this._clone(params.defaults);
		this.defaults        = this._clone(params.defaults);
		this.plugin          = params.plugin;
		this.saveCallback    = params.onSave;
		this.resetCallback   = params.onReset;
		this.pluginName      = params.plugin.getName();
		this.pluginShortName = this.pluginName.replace(/[^a-zA-Z0-9-_]/g,"").toLowerCase();
		this.storageKey      = params.storageKey || this.pluginShortName + "-options";
		
		// Save a reference to this options instance in the original plugin
		params.plugin._optionsplugin = this;
		
		// Hook into the plugin's observer event and extend it to clean up our listeners when the settings window is hidden
		this.oldObserver = params.plugin.observer;
		var self = this;
		params.plugin.observer = function(e){
			if (e.removedNodes[0] && e.removedNodes[0].id == "bd-psm-id") {
				$(document).off("keydown.optionsplugin").off("mouseup.optionsplugin").off("mousemove.optionsplugin");
			}
			
			if (self.oldObserver) self.oldObserver.bind(self.plugin,e)();
		}
		
		BdApi.clearCSS(`optionsplugin-${this.pluginShortName}`);
		BdApi.injectCSS(`optionsplugin-${this.pluginShortName}`, `
			.optionsplugin-${this.pluginShortName}-title              { font-size:18pt; font-weight:bold; margin-bottom:5px; }
			#optionsplugin-${this.pluginShortName} .help-text         { margin:5px 0px; }
			.optionsplugin-${this.pluginShortName}-buttons            { width:100%; margin-top:5px; }
			.optionsplugin-${this.pluginShortName}-buttons button     { float:right; }
			#optionsplugin-${this.pluginShortName}-defaults           { margin-right:5px; color:#ddd !important; background:#949494 !important; }
			
			.slider-handle span.hovered { opacity:1 !important; }
		`);
	};
	OptionsPlugin.prototype.getDefaults    = function(){             // Get default options object
		return this.defaults;
	};
	OptionsPlugin.prototype.get            = function(name){         // Get a value
		if (!this.options[name]) return;
		
		return this.options[name].value;
	};
	OptionsPlugin.prototype.set            = function(name,value){   // Set a value
		if (!this.options[name])
			this.options[name] = {};
		
		this.options[name].value = value;
		
		this.save();
	};
	OptionsPlugin.prototype.getAll         = function(){             // Get all options
		return this.options;
	};
	OptionsPlugin.prototype.simpleOptions  = function(){             // Get options as a key=value object (used for bdPluginStorage)
		var simpleoptions = {};
		
		$.each(this.options, function(key, option){
			simpleoptions[key] = option.value;
		});
		
		return simpleoptions;
	};
	OptionsPlugin.prototype.save           = function(){             // Save options to bdPluginStorage
		bdPluginStorage.set(this.storageKey, JSON.stringify(this.simpleOptions()));
	};
	OptionsPlugin.prototype.load           = function(){             // Load options from bdPluginStorage
		this.options = this._clone(this.defaults);
		
		var loaded = JSON.parse(bdPluginStorage.get(this.storageKey));
		if (!loaded) return;
		
		var self = this;
		$.each(loaded, function(key,value){
			if (value) {
				if (self.options[key])
					self.options[key].value = value;
			}
		});
	};
	OptionsPlugin.prototype.reset          = function(){             // Reset options to defaults
		this.options = this._clone(this.defaults);
		this.save();
	}
	OptionsPlugin.prototype._setFromForm   = function(elem){        // Save an element's value. elem = null to save all inputs
		var key = $(elem).attr("data-optionsplugin-name");
		var value;
		
		if ($(elem).attr("type") == "checkbox")
			value = $(elem).prop("checked");
		else if ($(elem).attr("type") == "number" || $(elem).attr("type") == "range") {
			value = parseFloat($(elem).val(), 10);
		}
		else
			value = $(elem).val();
		
		this.options[key].value = value;
		this.save();
		if (this.saveCallback) this.saveCallback(key, value);
	}
	OptionsPlugin.prototype._resetSettings = function(){             // Called when "Defaults" button is clicked
		var self = this;
		
		$.each(this.defaults, function(key, option){
			var input = $(`#${self.pluginShortName}-settings-${key}`);
			
			if (option.type == "range") {
				input.attr("value", option.value).trigger("change");
			}
			else if (option.type == "toggle") {
				input.prop("checked", option.value).trigger("change");
			}
			else if (option.type == "select") {
				input.val(option.value).trigger("change");
			}
			else
				input.attr("value", option.value).trigger("change");
		});
		
		if (this.resetCallback) this.resetCallback();
	}
	
	OptionsPlugin.prototype.settingsHTML   = function(){             // Returns the settings panel (call this in getSettingsPanel())
		var self = this;
		
		var html = `<div class='optionsplugin-${this.pluginShortName}-title'>${this.pluginName}</div><div class='form' id='optionsplugin-${this.pluginShortName}' style='width:100%;overflow:hidden;padding:5px;'>`;
		
		$.each(this.getAll(), function(key,option){
			html += `<div class='control-group'>${self._inputHTML(key,option).html()}</div>`;
		});
		
		
		html += `</div>
			<div class='form optionsplugin-${this.pluginShortName}-buttons'>
				<button type='button' class='btn btn-primary' id='optionsplugin-${this.pluginShortName}-done'>Done</button>
				<button type='button' class='btn btn-primary' id='optionsplugin-${this.pluginShortName}-defaults'>Defaults</button>
				<div style='clear:both'></div>
			</div>
			<script>
				var round = BdApi.getPlugin("${this.pluginName}")._optionsplugin._round; // Save the OptionsPlugin's _round function as a variable for easier access;
				var convertRange = BdApi.getPlugin("${this.pluginName}")._optionsplugin._convertRange;
				var snapTo = BdApi.getPlugin("${this.pluginName}")._optionsplugin._snapTo;
				var dragging, lastDragged, spanUnhover;
				
				var num = function(str){return parseFloat(str,10);}
				var updateSliderValues = function(slider, showTooltip) {
					var input = slider.closest(".slider").find("input");
					
					var pct = convertRange({
						value:input.attr("value"),
						from:[input.attr("min"),input.attr("max")],
						to:[0,100],
					});
					
					slider.find("span").text(input.attr("value") + (input.attr("data-percent") == "true" ? "%":""));
					
					if (showTooltip) {
						slider.find("span").addClass("hovered");
						clearTimeout(spanUnhover);
						spanUnhover = setTimeout(function(){slider.find("span").removeClass("hovered");},1000);
					}
					
					slider.closest(".slider").find(".slider-bar-fill").css("width", pct + "%");
					slider.css("left", pct+"%");
				}
				
				$("#optionsplugin-${this.pluginShortName} .slider-handle").mousedown(function(){
					lastDragged = $(this);
					dragging = $(this);
				});
				
				$(document).on("mouseup.optionsplugin", function(){
					dragging = false;
				}).on("mousemove.optionsplugin", function(event){
					if (dragging) {
						var left = event.pageX - dragging.width()/2;
						var farLeft = dragging.parent().offset().left - 15;
						var farRight = dragging.parent().offset().left + dragging.parent().width() - 10;
						
						     if (left < farLeft ) left = farLeft;
						else if (left > farRight) left = farRight;
						
						dragging.offset({left:left});
						
						var input = dragging.closest(".slider").find("input");
						
						var value = convertRange({
							value:left,
							from:[farLeft,farRight],
							to:[input.attr("min"),input.attr("max")],
						});
						
						value = snapTo({
							value:value,
							step:input.attr("data-step"),
							min:input.attr("min"),
							max:input.attr("max"),
						});
						
						var pct = convertRange({
							value:left,
							from:[farLeft,farRight],
							to:[0,100],
						});
						
						dragging.find("span").text(value + (input.attr("data-percent") == "true" ? "%":""));
						input.attr("value", value).trigger("change");
						dragging.closest(".slider").find(".slider-bar-fill").css("width", pct + "%");
					}
				}).on("keydown.optionsplugin", function(e){
					var direction;
					if      (e.which == 37) direction = -1;
					else if (e.which == 39) direction =  1;
					else                    return;
					
					var input = lastDragged.closest(".slider").find("input");
					var newVal = parseFloat(input.attr("value"),10) + ((parseFloat(input.attr("data-step"),10) || 1) * direction);
					
					newVal = snapTo({
						value:newVal,
						step:input.attr("data-step"),
						min:input.attr("min"),
						max:input.attr("max"),
					});
					
					input.attr("value", newVal).trigger("change");
					updateSliderValues(lastDragged, true);
				});
				
				var setSliderValue = function(handle){
					handle.hide();
				}
				
				
				$("#optionsplugin-${this.pluginShortName} .checkbox").click(function(){
					$(this).find("input").prop("checked", !$(this).find("input").prop("checked")).trigger("change");
				});
				
				$("#optionsplugin-${this.pluginShortName} input, #optionsplugin-${this.pluginShortName} select").on("change paste keyup", function(){
					BdApi.getPlugin("${this.pluginName}")._optionsplugin._setFromForm(this);
					
					if ($(this).attr("type") == "number" && $(this).attr("data-step")) {
						updateSliderValues($(this).closest(".slider").find(".slider-handle"));
					}
				});
				
				$("#optionsplugin-${this.pluginShortName}-done").click(function(){
					$(".bd-psm").remove();
				});
				
				$("#optionsplugin-${this.pluginShortName}-defaults").click(function(){
					BdApi.getPlugin("${this.pluginName}")._optionsplugin._resetSettings()
				});
			</script>`;
		
		return html;
	}
	OptionsPlugin.prototype._inputHTML     = function(key, option){  // Returns <input> HTML for a setting
		if (option.type == "number") {
			var input = $(`<div>${this._labelHTML(key,option).html()}<input type='number' id='${this.pluginShortName}-settings-${key}'/></div>`);
			input.find("input").attr("value", option.value).attr("data-optionsplugin-name", key);
		}
		
		else if (option.type == "range") {
			var input = $(`<div>${this._labelHTML(key,option).html()}<div class='slider'><input type='number' id='${this.pluginShortName}-settings-${key}' readonly><div class='slider-bar'><div class='slider-bar-fill'></div></div><div class='slider-handle-track'><div class='slider-handle'><span></span></div></div></div></div>`);
			
			var pct = ((option.value-option.min)*100) / (option.max-option.min);
			
			     if (pct > 100) pct = 100;
			else if (pct < 0  ) pct = 0;
			
			input.find(".slider-bar-fill").css("width", pct+"%");
			input.find(".slider-handle").css("left", pct+"%");
			input.find("span").text(this._snapTo({
				value:option.value,
				step:option.step||1,
				min:option.min,
				max:option.max,
			}) + (option.percent ? "%":""));
			input.find("input").attr("value", option.value).attr("min", option.min).attr("max", option.max).attr("data-percent", option.percent ? "true" : "false").attr("data-step", option.step ? option.step : 1).attr("data-optionsplugin-name", key);
		}
		
		else if (option.type == "toggle") {
			var input = $(`<div><ul class='checkbox-group'><li><div class='checkbox'><div class='checkbox-inner'><input type='checkbox' id='${this.pluginShortName}-settings-${key}'><span></span></div><span>${option.label}</span></div></li></ul></div>`);
			input.find("input").attr("checked", option.value ? "checked" : null).attr("data-optionsplugin-name", key);
			if (option.help) input.find(".checkbox").after(`<div class='help-text'>${option.help}</div>`);
		}
		
		else if (option.type == "select") {
			var input = $(`<div>${this._labelHTML(key,option).html()}<select id='${this.pluginShortName}-settings-${key}'></select></div>`);
			input.find("select").attr("data-optionsplugin-name", key);
			
			$.each(option.options, function(i, value){
				var selected = (value == option.value) ? " selected='selected'" : "";
				input.find("select").append(`<option${selected}>${value}</option>`);
			});
		}
		
		else {
			var input = $(`<div>${this._labelHTML(key,option).html()}<input type='text' id='${this.pluginShortName}-settings-${key}'/></div>`);
			input.find("input").attr("value", option.value).attr("data-optionsplugin-name", key);
		}
		
		return input;
	}
	OptionsPlugin.prototype._labelHTML     = function(key, option){  // Returns <label> HTML for a setting
		var label = $(`<div><label for='${this.pluginShortName}-settings-${key}'>${option.label}</label></div>`);
		
		if (option.help) label.find("label").after(`<div class='help-text'>${option.help}</div>`);
		
		return label;
		
	}
	
	OptionsPlugin.prototype._clone         = function(object){       // Helper function to clone an object/array
		// http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object-in-javascript
		return JSON.parse(JSON.stringify(object));
	}
	OptionsPlugin.prototype._round         = function(num,precision){// Rounds a number to the given decimal precision
		var factor = Math.pow(10, precision);
		var tempNumber = number * factor;
		var roundedTempNumber = Math.round(tempNumber);
		return roundedTempNumber / factor;
	};
	OptionsPlugin.prototype._convertRange  = function(v) {           // Converts a value from one range to another
		return (((num(v.value) - num(v.from[0])) * (num(v.to[1]) - num(v.to[0]))) / (num(v.from[1]) - num(v.from[0]))) + num(v.to[0]);
	}
	OptionsPlugin.prototype._snapTo        = function(v){            // Snap a number to a given increment starting at the given base
		
		v.value = parseFloat(v.value, 10);
		v.step = parseFloat(v.step, 10);
		v.min = parseFloat(v.min, 10);
		v.max = parseFloat(v.max, 10);
		
		var offset = (v.value - v.min) % v.step;
		v.value -= offset;
		offset *= 2;
		if (offset >= v.step)
			v.value += v.step;
		
		if (v.value > v.max) v.value = v.max;
		if (v.value < v.min) v.value = v.min;
		
		var places = v.step.toString().replace(/0*$/,'').split(".")[1];
		return v.value.toFixed(places ? places.length : 0);
	}
	
	return OptionsPlugin;
}
// End Tony's OptionsPlugin Helper /////////////////////////////////