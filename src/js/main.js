global.$ = $;
var irc = require('irc');
var username = null;
var password = null
var connected = false;
var connection = null;
var emotes = null;
var activeTab = 'system';

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
        var chan = $('#channel').val();
        if(chan.length > 0) {
            $('#tabBar').append('<li><a href="#'+chan+'" data-toggle="tab">'+chan+'</a></li>');
            $('#tabContent').append('<div class="tab-pane fill" id="'+chan+'"></div>');
            $('#tabBar a:last').tab('show');
            connection.join("#"+chan);
        }
    });
    $('#chatinput').keypress(function(e) {
        console.log(e.which);
        if(e.which == 13) {
            console.log('enter pressed')
            if(connected) {
                var chan = $('#tabContent .active').attr('id');
                var message = $('#chatinput').val();
                console.log({event: 'say', channel: chan, message: message});
                if(chan == "system") {
                    if(message.indexOf("/") == 0) {
                        //Check for command stuff here
                        if(message == "/debug") {
                            console.log(connection.opt.channels);
                            console.log(connection.chans);
                        }
                    }
                    else {
                        $('#system').append("<div class='error'>Sorry you can't do that</div>");
                    }
                }
                else {
                    connection.say("#"+chan, message);
                    message = parseEmotes(message);
                    $('#'+chan).append("<div class='chatmessage'><span class='chatuser'>"+username+"</span>: "+message+"</div>")
                    $('#chatinput').val('');
                    scrollPage();
                }
            }
        }
    });
    $('#tabBar a').click(function() {
        scrollPage();
    });

    $('a[data-toggle="tab"]').on('click', function (e) {
        scrollPage();
        activeTab = getActiveTab();
        console.log({activeTab: activeTab, event: e});
    });

    $.get('https://api.twitch.tv/kraken/chat/emoticons', function(data) {
        //console.log(data);
        //console.log(data.emoticons.length);
        emotes = data.emoticons;
    }, 'json');
});

function scrollPage() {
    //$(".tab-content .active").animate({ scrollTop: $(document).height() }, 1000);
    $(".tab-content .active").animate({ scrollTop: 9999 }, 1000);
}

function getActiveTab() {
    return $('#tabContent .active').attr('id');
}
function connect() {
    if(username == null || password == null) {
        //prompt for username & password
        $('#system').append('No username or password defined!<br />');
        $('#userinfo').modal({show: true});
    }
    else {
        //Add connect code here
        alert("Starting connection as "+username);
        connection = new irc.Client('irc.twitch.tv', username, {
            password: password
        });
        alert("Addind listeners");
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
        });
        connected = true;
        $('#doIt').html('Disconnect');
    }
}

function disconnect() {
    alert('Disconnected!');
    connection.disconnect();
    connected = false;
    $('#doIt').html('Connect');
}

function systemLog(message) {
    addContent('system', "<div>"+message+"</div>");
}

function addContent(tab, content) {
    $('#'+tab).append(content);
}

function parseEmotes(message) {
    //console.log(message);
    for(var x = 0; x < emotes.length; x++) {
        //console.log({regex: emotes[x].regex, image: emotes[x].images[0].url});
        message = message.replace(unescape(emotes[x].regex), '<img src="'+emotes[x].images[0].url+'" />');
    }
    return message;
}