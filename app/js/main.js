global.$ = $;
var irc = require('irc');
var gui = require('nw.gui');
var username = null;
var password = null
var connected = false;
var connection = null;
var emotes = null;
var activeTab = 'system';

var CLIENT_ID = 'qcpu06r59tv8w0iyb1064pfxlntif6n';
var CLIENT_SECRET = 'atke7nft36wmp50hvgp1vtog80z1wef';

$(function() {
    $('#doIt').click(function() {
        if(!connected) {
            connect();
        }
        else {
            disconnect();
        }
    });
    $('#userinfo-save').click(function() {
        username = $('#username').val();
        password = $('#password').val();
        connect();
    });
    $('#newChannel').click(function() {
        if(connected) {
            $('#chanInput').modal({show: true});
        }
    });
    $('#newChanButton').click(function() {
        var chan = $('#channel').val().toLowerCase();
        if(chan.length > 0) {
            $('#tabBar').append('<li data-tab="'+chan+'"><a href="#'+chan+'" data-toggle="tab"><button class="close closeTab" onClick="closeTab(\''+chan+'\')" data-tab="'+chan+'">x</button>'+chan+'</a></li>');
            $('#tabContent').append('<div class="tab-pane fill" id="'+chan+'"></div>');
            $('#tabBar a:last').tab('show');
            connection.join("#"+chan);
            activeTab = chan;
        }
        $('#channel').val(null);
    });
    //$('#chatinput').keypress(function(e) {
    $('#chatinput').keydown(function(e) {
        //console.log(e.which);
        switch(e.which) {
            case 13: {
                e.preventDefault();
                console.log('Enter pressed!');
                if(connected) {
                    var chan = $('#tabContent .active').attr('id');
                    var message = $('#chatinput').val();
                    console.log({event: 'say', channel: chan, message: message});
                    if(chan == "system") {
                        if(message.indexOf("/") == 0) {
                            //Check for command stuff here
                            if(message == "/debug") {
                                var gui = require('nw.gui');
                                gui.Window.get().showDevTools();
                                console.log(connection.opt.channels);
                                console.log(connection.chans);
                            }
                        }
                        else {
                            $('#system').append("<div class='error'>Sorry you can't do that</div>");
                        }
                        $('#chatinput').val('');
                    }
                    else {
                        connection.say("#"+chan, message);
                        message = parseEmotes(message);
                        $('#'+chan).append("<div class='chatmessage'><span class='chatuser'>"+username+"</span>: "+message+"</div>")
                        $('#chatinput').val('');
                        scrollPage();
                    }
                }
                break;
            }
            case 9: {
                e.preventDefault();
                console.log('Do autocomplete shit here');
                break;
            }
        }
    });

    $('#tabBar').on('click', 'a', function(e) {
        //console.log($(this).parent().attr('data-tab'));
        activeTab = $(this).parent().attr('data-tab');
        $('li[data-tab="'+activeTab+'"]').children().removeClass('dirty');
        scrollPage();
        console.log({activeTab: activeTab, event: e});
    });

    $.get('https://api.twitch.tv/kraken/chat/emoticons', function(data) {
        //console.log(data);
        //console.log(data.emoticons.length);
        emotes = data.emoticons;
    }, 'json');
});

function scrollPage() {
    //Need to fix this so that it uses activeTab
    $(".tab-content .active").animate({ scrollTop: 999999 }, 1000);
}

function getActiveTab() {
    //return $('#tabContent .active').attr('id');
    return activeTab;
}
function connect() {
    if(username == null || password == null) {
        //prompt for username & password
        $('#system').append('No username or password defined!<br />');
        $('#userinfo').modal({show: true});
    }
    else {
        //Add connect code here
        //console.log("Starting connection as "+username);
        connection = new irc.Client('irc.twitch.tv', username, {
            password: password
        });
        //console.log("Addind listeners");
        connection.addListener('error', function(message) {
            //$('#system').append("ERROR: "+message+"<br />");
            systemLog(message);
        });
        connection.addListener('motd', function(message) {
            //$('#system').append(message.args.join(" ")+"<br />");
            systemLog("MOTD Start");
            systemLog(message);
            systemLog("MOTD End");
        });
        connection.addListener('join', function(channel, nickname) {
            //This will update the username list
        });
        connection.addListener('message', function(from, to, message) {
            //console.log({even: 'message', from: from, channel: channel, message: message});
            to = to.replace('#', '');
            message = parseEmotes(message);
            $('#'+to).append("<div class='chatmessage'><span class='chatuser'>"+from+"</span>: "+message+"</div>");
            if(to == getActiveTab()) {
                scrollPage();
            }
            else {
                $('li[data-tab="'+to+'"]').children().addClass('dirty');
            }
        });
        connected = true;
        $('#doIt').html('Disconnect');
    }
}

function disconnect() {
    //alert('Disconnected!');
    connection.disconnect();
    connected = false;
    systemLog("Disconnected from Twitch Chat");
    $('#doIt').html('Connect');
    connection = null;
}

function systemLog(message) {
    addContent('system', "<div>"+message+"</div>");
}

function addContent(tab, content) {
    $('#'+tab).append(content);
}

function parseEmotes(message) {
    //console.log(message);

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    message = message.replace(replacePattern1, '<a href="$1" target="new">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    message = message.replace(replacePattern2, '$1<a href="http://$2" target="new">$2</a>');

    //TODO: Add code to parse .com, .org, .net, and .tv urls without protocol or www

    for(var x = 0; x < emotes.length; x++) {
        message = message.replace(new RegExp(unescape(emotes[x].regex), 'g'), '<img src="'+emotes[x].images[0].url+'" />');
    }
    return message;
}

function closeTab(tab) {
    console.log('Close event id: '+tab);
    connection.part('#'+tab);
    $('#tabBar a:first').tab('show');
    $('li[data-tab="'+tab+'"]').remove();
    $('#'+tab).remove();
}

function openTMI() {
    gui.Shell.openExternal('http://www.twitchapps.com/tmi');
}