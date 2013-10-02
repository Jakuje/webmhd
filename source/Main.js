enyo.kind({
	name: "Mhd.Main",
	kind: enyo.VFlexBox,
	components: [
		{kind: "PageHeader", components: [
			{kind: "SearchInput", name: "zastavka", onchange: "zastavkaChanged", onkeypress: "keyPressed", onkeyup: "keyUp",
				hint: "Zastávka", flex: 1, selectAllOnFocus: true, components: [
					{kind: "ListSelector", name: "selector", hideItem: true,
						hideArrow: true, popupAlign: 'right',
						onSelect: "listSelected", items: []}
				]
			},
			{kind: "ActivityButton", content: "Hledej", name: "search",
				className: "enyo-button-affirmative", onclick: "searchPressed"}
			
			//{content: "Page Header"}
		]},
		{flex: 1, name: "Main", className: "enyo-bg", kind: "Scroller", components: [
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
		
	],
	create: function() {
		this.inherited(arguments);
		this.$.zastavka.setValue(this.owner.getPrefs('current'));
		this.updateUI();
	},
	ready: function(){
		this.$.zastavka.forceFocus();
	},
	updateUI: function(){
		current = this.$.zastavka.getValue();
		this.favorites = this.owner.getPrefs('favorites');
		this.$.favorites.setItems(this.favorites);
		this.history = this.owner.getPrefs('history');
		this.$.history.setItems(this.history);
		if( this.favorites.indexOf(current) !== -1 ){
			this.$.addFavorite.setDepressed(true);
		} else {
			this.$.addFavorite.setDepressed(false);
		}

	},
	
	keyPressed: function(inSender, inEvent) {
		if(inEvent.keyCode == 13) {
			this.$.zastavka.forceBlur();
			this.searchPressed();
		}
	},
	keyUp: function(inSender, inEvent) {
		deviceInfo = JSON.parse(PalmSystem.deviceInfo);
		majorVersion = deviceInfo["platformVersionMajor"];
		if (majorVersion < 3 && inEvent.keyCode == 13) {
			this.searchPressed();
			return;
		}
	},
	
	zastavkaChanged: function(inSender){
		this.owner.setPrefs("current", inSender.getValue());
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
		this.owner.setPrefs("favorites", this.favorites);
		this.updateUI();
	},
	
	addHistory: function(zastavka){
		this.history.push(zastavka);
		if( this.history.length > 10 ){
			this.history.pop();
		}
		this.owner.setPrefs("history", this.history);
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
	
	listSelected: function(inSender, inValue){
		this.$.search.setActive(true);
		this.$.search.setDisabled(true);
		
		var value = inSender.items[inValue];
		if( typeof value == 'string' ){
			this.$.zastavka.setValue(value);
			this.doRequest("index.php");
		} else {
			this.$.zastavka.setValue(value.caption);
			this.doRequest(value.value);
		}
		this.updateUI();
		inSender.setValue(undefined);
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
						//items.push(res[2]);
					}
				}
				
				if( items.length > 0 ){
					// mame alespon jednu zastavku na vyber v seznamu
					this.$.selector.setItems(items);
					this.$.selector.openPopup();
				} else {
					this.owner.showPopup("Zastávka nenalezena.");
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
					this.owner.showPopup("Služba vrátila prázný seznam výsledků. Z dané zastávky nejede žádný spoj, nebo je web IDS JMK nedostupný.");
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
				var icislo = parseInt(item.cislo);
				if( icislo >= 1 && icislo <= 12 ){
					this.$.cTitle.setIcon('images/type_tram.png');
				} else if( icislo <= 39) {
					this.$.cTitle.setIcon('images/type_trolejbus.png');
				} else if( icislo <= 99) {
					// nocni
					this.$.cTitle.setIcon('images/type_bus.png');
				} else {
					this.$.cTitle.setIcon('images/type_bus.png');
				}
				// Lod?
				this.$.destination.setContent( item.nazev );
				this.$.time.setContent( item.cas );
			}
			return true;
		}
		return false;
	},
	

});
