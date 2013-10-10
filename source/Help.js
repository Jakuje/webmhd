// The Help scene displays at least one method of support (developer website, phone number, email) that works. It can also contain links to application-related help, frequently asked questions, etc.

enyo.kind({
	name: "Mhd.Help",
	kind: "Scroller",
	components: [
		{kind: "PageHeader", components: [
			{kind: "IconButton", icon: "images/menu-icon-back.png", onclick: "goBack"},
			{kind: "Spacer"}
		]},
		{kind: "Item", content: "<b>Brno MHD Display</b> by <i>Jakuje</i>"},
		{kind: "Item", content: "Data čerpána z IDS JMK, předzracování: Reinto.cz"},
		
		{kind: "Item", content: "Local aplication for public transport in Brno, Czech republic"},
		
		{kind: "RowGroup", caption: "Help", components: [
			{kind: "HFlexBox", onclick: "showWeb", components: [
				{kind: "Image", src: "images/browser.png", style: "width:50%;margin: -7px 0;"},
				{content: "Support"},
			]},
		]},
		{kind: "RowGroup", caption: "Contact", components: [
			{kind: "HFlexBox", onclick: "showEmail", components: [
				{kind: "Image", src: "images/email.png", style: "width:50%;margin: -7px 0;"},
				{content: "Email contact"},
			]}
		]},
		{kind: "Item", content: "© Copyright 2013 Jakuje"},
		{
            name : "browser",
            kind : "PalmService",
            service : "palm://com.palm.applicationManager",
            method : "open",
         }
	],
	showWeb: function(){
		this.$.browser.call({"target": "http://jakuje.dta3.com/webmhd.phtml"});
	},
	showEmail: function(){
		this.$.browser.call({"target": "mailto: jakuje@gmail.com"});
	},
	goBack: function(inSender, inEvent){
		this.owner.goBack(inSender, inEvent);
	}
});
