/**
 * Vyhledání nejbližší zastávky podle GPS ???
 */
PREFS_COOKIE = "webHMDprefs";

enyo.kind({
	name: "Mhd",
	kind: enyo.VFlexBox,
	components: [
		{kind: "PageHeader", components: [
			{kind: "Input", name: "zastavka", onchange: "zastavkaChanged",
				hint: "Zastávka", flex: 1, selectAllOnFocus: true, components: [
					{kind: "ListSelector", value: "", hideItem: true,
						hideArrow: true, name: "selector", popupAlign: 'left',
						onChange: "listSelected", items: []}
				]
			},
			{kind: "ActivityButton", content: "Hledej", name: "search",
				className: "enyo-button-affirmative", onclick: "searchPressed"}
			
			//{content: "Page Header"}
		]},
		{flex: 1, kind: "Pane", components: [
			{flex: 1, kind: "Scroller", components: [
				{name: "list", kind: "VirtualRepeater",
				onSetupRow: "listGetItem", components: [
					{kind: "Item", layoutKind: "VFlexLayout", components: [
						{name: "cTitle", kind: "Divider", allowHtml: true},
						{layoutKind: "HFlexLayout", components: [
							{layoutKind: "VFlexLayout", flex: 1, components: [
								{name: "destination"},
								]},
							{name: "time"},
						]}
					]}
				]
			}
			]}
		]},
		{kind: "Toolbar", components: [
			{kind: "ToolButton", name: 'addFavorite', icon: "images/menu-icon-add.png",
				onclick: "addFavorites", toggling: true},
			{kind: "Spacer"},
			{kind: "ToolButton", icon: "images/toaster-icon-bookmarks.png", onclick: "showFavorites"},
			{kind: "ListSelector", name: "favorites", hideItem: true, hideArrow: true,
				onSelect: "listSelected", items: [], },
			{kind: "ToolButton", icon: "images/toaster-icon-history.png", onclick: "showHistory"},
			{kind: "ListSelector", name: "history", hideItem: true, hideArrow: true,
				onSelect: "listSelected", items: [], value: undefined}
		]},
		{kind: "AppMenu", components: [ // In chromium: CTRL + `
			{kind: "EditMenu"},
			{caption: "Add Favorites", name: "menuRefresh", onclick: "doRefresh"},
			{caption: "Preferences", onclick: "showPreferences"},
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

	],
	
	create: function() {
		this.inherited(arguments);
		this.$.zastavka.setValue(this.getPrefs('current'));
		this.updateUI();
	},
	ready: function(){
		this.$.zastavka.forceFocus();
	},
	updateUI: function(){
		current = this.$.zastavka.getValue();
		this.favorites = this.getPrefs('favorites');
		this.$.favorites.setItems(this.favorites);
		this.history = this.getPrefs('history');
		this.$.history.setItems(this.history);
		if( this.favorites.indexOf(current) !== -1 ){
			this.$.addFavorite.setDepressed(true);
		} else {
			this.$.addFavorite.setDepressed(false);
		}

	},
	
	zastavkaChanged: function(inSender){
		this.setPrefs("current", inSender.getValue());
	},
	
	favorites: [],
	history: [],
	
	addFavorites: function(inSender, inEvent){
		var current = this.$.zastavka.getValue();
		if( inSender.depressed ){
			this.favorites.push(current);
		} else {
			var index = this.favorites.indexOf(current);
			this.favorites.splice(index, 1);
		}
		this.setPrefs("favorites", this.favorites);
		this.updateUI();
	},
	
	addHistory: function(zastavka){
		this.history.push(zastavka);
		if( this.history.length > 10 ){
			this.history.pop();
		}
		this.setPrefs("history", this.history);
		this.updateUI();
	},
	
	showFavorites: function(){
		if( this.favorites.length > 0 ){
			this.$.favorites.openPopup();
		}
	},
	
	showHistory: function(){
		if( this.history.length > 0 ){
			this.$.history.openPopup();
		}
	},
	
	odjezdy: [],
	
	showPopup: function(message){
		this.$.messageScroller.setScrollTop(0);
		this.$.errorText.setContent(message);
		this.$.errorMessage.openAtCenter();
	},
	
	closePopup: function(inSender, inEvent) {
		this.$.errorMessage.close();
	},
	
	listSelected: function(inSender, inValue){
		this.$.search.setActive(true);
		this.$.search.setDisabled(true);
		
		title = inSender.items[inValue];
		this.$.zastavka.setValue(title);
		this.doRequest("index.php");
		this.updateUI();
		return false;
	},
	
	searchPressed: function(){
		this.$.search.setActive(true);
		this.$.search.setDisabled(true);
		
		this.doRequest('index.php');
	},
	
	doRequest: function(url){
		search = this.$.zastavka.getValue();
		xmlhttp=new XMLHttpRequest();
		xmlhttp.open('post', 'http://www.reinto.cz/projekty/mhd/'+url, true);
		xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		xmlhttp.onreadystatechange = this.doneRequest.bind(this);
		xmlhttp.send('stop='+encodeURIComponent(search)+'&odeslat=Hledej');
		
		// timeout
	},
	
	doneRequest: function(r){
		if (xmlhttp.readyState==4 && xmlhttp.status==200) {
			var reply = xmlhttp.responseText;
			if( reply.indexOf('<form action="index.php" method="post">') !== -1 ){
				// seznam zastavek
				start = reply.indexOf('<h3>Brno MHD Display</h3>');
				context = reply.substr(start);
				parts = context.split('<br />');
				items = new Array();
				for( i in parts){
					res = parts[i].match(/<a href="([^"]+)">([^<]+)<\/a>/);
					if( res ){
						items.push({caption:res[2], value:res[1]});
					}
				}
				
				if( items.length > 0 ){
					// mame alespon jednu zastavku na vyber v seznamu
					this.$.selector.setItems(items);
					this.$.selector.openPopup();
				} else {
					this.showPopup("Zastávka nenalezena.");
				}
			} else if( reply.indexOf('<div id="telo">') !== -1) {
				// odjezdy
				if( reply.indexOf('<div class="cislo">') !== -1) {
					// mame tu vysledky a tak budeme vykreslovat
					parts = reply.split(/<div class="cislo">/);
					this.odjezdy = new Array();
					for(i in parts){
						if(i > 0){
							res = parts[i].match(/([0-9]+)<\/div>\s+<div class="nazev">([^<]+)<\/div>\s+<div class="cas">([^<]+)<\/div>/);
							if( res != null){
								this.odjezdy.push({'cislo': res[1], 'nazev': res[2], 'cas': res[3]});
							}
						}
					}
					this.$.list.render();
				} else {
					// nejsou vysledky: neexistuji odjezdy, nebo je nejaky vypadek
					this.showPopup("Služba vrátila prázný seznam výsledků. Z dané zastávky nejede žádný spoj, nebo je web IDS JMK nedostupný.");
				}
				var zastavka = this.$.zastavka.getValue();
				if( this.favorites.indexOf(zastavka) !== -1 ){
					this.$.addFavorite.setDepressed(true);
				} else {
					this.$.addFavorite.setDepressed(false);
				}
				this.addHistory(zastavka);
			}
			this.$.search.setActive(false);
			this.$.search.setDisabled(false);
		}
	},
	
	listGetItem: function(inSender, inIndex){
		if (inIndex < this.odjezdy.length) {
			if (this.$.list) {
				var item = this.odjezdy[inIndex];
				this.$.cTitle.setCaption( item.cislo );
				this.$.destination.setContent( item.nazev );
				this.$.time.setContent( item.cas );
			}
			return true;
		}
		return false;
	},
	prefs: null,
	
	default_prefs: {"favorites": [], "current": "", "history": []},
	
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
	
});
