/**
 * Vyhledání nejbližší zastávky podle GPS ???
 */
PREFS_COOKIE = "webHMDprefs";

enyo.kind({
	name: "Mhd",
	kind: enyo.VFlexBox,
	components: [
		{flex: 1, kind: "Pane", name: "pane", components: [
			{name: "pMain", className: "enyo-bg", kind: "Mhd.Main"},
			{name: "pHelp", className: "enyo-bg", kind: "Mhd.Help"}
		]},
		{kind: "AppMenu", components: [ // In chromium: CTRL + `
			{kind: "EditMenu"},
			//{caption: "Preferences", onclick: "showPreferences"},
			{caption: "Help", onclick: "showHelp"}
		]},
		{
		   kind: "ModalDialog",
		   name: "errorMessage",
		   caption: "Chyba",
		   layoutKind: "VFlexLayout",
		   lazy: false,
		   components: [
				{name: "messageScroller", kind: "BasicScroller", autoVertical: true, style: "height: auto;", flex: 1,
					components: [
						{ layoutKind: "VFlexLayout", align: "center", components: [
							{
								src: "images/error.png",
								name: "media",
								kind: "Image",
							},
						]},
						{
							name: "errorText",
							content: "Chyba toho a toho.",
							className: "",
						},
					]
			   },
				{
					name: "button",
					kind: "Button",
					caption: "OK",
					onclick: "closePopup",
				},
		   ],
		},
		{ kind: enyo.ApplicationEvents,
			onBack: "goBack",
		},
	],
	
	create: function() {
		this.inherited(arguments);
		enyo.setAllowedOrientation( this.getPrefs("orientation") );
	},
	showHelp: function(){
		this.$.pane.selectViewByName("pHelp");
	},
	
	showPopup: function(message){
		this.$.messageScroller.setScrollTop(0);
		this.$.errorText.setContent(message);
		this.$.errorMessage.openAtCenter();
	},
	
	closePopup: function(inSender, inEvent) {
		this.$.errorMessage.close();
	},
	
	prefs: null,
	
	default_prefs: {"favorites": [], "current": "", "history": [], 'orientation': 'up'},
	
	getPrefs: function(key){
		if( !this.prefs ){
			try {
				this.prefs = enyo.json.parse( enyo.getCookie(PREFS_COOKIE) );
			} catch(err) {
				this.prefs = this.default_prefs;
				this.setPrefs();
			}
		}
		if( typeof this.prefs[key] != 'undefined' ){
			return this.prefs[key];
		} else {
			return this.default_prefs[key];
		}
	},
	
	setPrefs: function(key, value){
		if( key ){
			this.prefs[key] = value;
		}
		enyo.setCookie(PREFS_COOKIE, enyo.json.stringify(this.prefs));
	},

	goBack: function(inSender, inEvent, force) {
		console.log("back");
		inEvent.stopPropagation();

		// we are on home page and we want to go to card view
		if( this.$.pane.getViewName() !=  "pMain" ){
			inEvent.preventDefault();
		}

		this.$.pane.back(inEvent);
	},
	

});
