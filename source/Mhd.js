/**
 * Vyhledání nejbližší zastávky podle GPS ???
 * Oblíbené
 */

enyo.kind({
	name: "Mhd",
	kind: enyo.VFlexBox,
	components: [
		{kind: "PageHeader", components: [
			{kind: "Input", name: "zastavka", onchange: "storePrefs", flex: 1, components: [
					{ content: "Zastávka", className: "enyo-label"},
					{kind: "ListSelector", value: "", hideItem: true,
						hideArrow: true, name: "selector", popupAlign: 'left',
						onChange: "listSelected", items: []}
				]
			},
			{kind: "ActivityButton", content: "Hledej", name: "search",
				className: "enyo-button-affirmative", onclick: "buttonPressed"}
			
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
		/*{kind: "Toolbar", components: [
			
		]}*/
		{kind: "AppMenu", components: [ // In chromium: CTRL + `
			{kind: "EditMenu"},
			{caption: "Refresh", name: "menuRefresh", onclick: "doRefresh"},
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
	odjezdy: [],
	showPopup: function(message){
		this.$.messageScroller.setScrollTop(0);
		this.$.errorText.setContent(message);
		this.$.errorMessage.openAtCenter();
	},
	closePopup: function(inSender, inEvent) {
		this.$.errorMessage.close();
	},
	listSelected: function(inSender, inValue, inOldValue){
		this.$.search.setActive(true);
		this.$.search.setDisabled(true);
		
		title = this.$.selector.popup.fetchItemByValue(inValue);
		this.$.zastavka.setValue(title.caption);
		
		this.doRequest(inValue);
	},
	buttonPressed: function(){
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
		xmlhttp.send('stop='+search+'&odeslat=Hledej');
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
				
				this.$.selector.setItems(items);
				this.$.selector.openPopup();
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
	}
});
