/*
 * Copyright (C) 2016 www.phantombot.net
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* 
 * @author IllusionaryOne
 */

/*
 * dashboardPanel.js
 * Drives the Dashboard Panel
 */
(function() {

    var streamOnline = false,
        whisperMode = false,
        responseMode = false,
        meMode = false,
        pauseMode = false;
        toutGraphData = [];
        chatGraphData = [];


    /*
     * @function onMessage
     * This event is generated by the connection (WebSocket) object.
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        // Check for dbkeysresult queries
        if (panelHasQuery(msgObject)) {
            if (panelMatch(msgObject['query_id'], 'dashboard_highlights')) {
                var htmlStr = "";
                for (var i in msgObject['results']) {
                    var highlightData = msgObject['results'][i]['value'];
                    htmlStr += highlightData + " @ " + msgObject['results'][i]['key'] + "<br>";
                }
                if (htmlStr.length == 0) {
                    $("#showHighlights").html("No Highlights Found");
                } else {
                    $("#showHighlights").html(htmlStr);
                }
            }

            if (panelCheckQuery(msgObject, 'dashboard_chatCount')) {
                var chatDate = "",
                    chatKey = "",
                    chatCount = "";

                chatGraphData = [];
                for (var i = 0, j = 5; i <= 4; i++, j--) {
                    var dateObj = new Date();
                    chatDate = $.format.date(Date.now() - (i * 24 * 36e5), "MM.dd.yy");
                    chatKey = "chat_" + chatDate;
                    chatCount = "0";
                    for (idx in msgObject['results']) {
                        if (panelMatch(msgObject['results'][idx]['key'], chatKey)) {
                            chatCount = msgObject['results'][idx]['value'];
                            break;
                        }
                    }
                    $("#chatDate-" + i).html("<span class=\"purplePill\">Date: " + chatDate + "</span>");
                    $("#chatCount-" + i).html("<span class=\"bluePill\">Chat Count: " + chatCount + "</span>");
                    chatGraphData.push([ j, chatCount ]);
                }
            }

            if (panelCheckQuery(msgObject, 'dashboard_modCount')) {
                var modDate = "",
                    modKey = "",
                    modCount = "";

                toutGraphData = [];
                for (var i = 0, j = 5; i <= 4; i++, j--) {
                    var dateObj = new Date();
                    modDate = $.format.date(Date.now() - (i * 24 * 36e5), "MM.dd.yy");
                    modKey = "mod_" + modDate;
                    modCount = "0";
                    for (idx in msgObject['results']) {
                        if (panelMatch(msgObject['results'][idx]['key'], modKey)) {
                            modCount = msgObject['results'][idx]['value'];
                            break;
                        }
                    }
                    $("#modCount-" + i).html("<span style=\"width: 120px\" class=\"redPill\">Timeouts: " + modCount + "</span>");
                    toutGraphData.push([ j, modCount ]);
                }

            }
            if (toutGraphData.length > 0 && chatGraphData.length > 0) {
                $.plot($("#panelStatsGraph"),
                           [
                               { data: chatGraphData, lines: { show: true }, color: "#4444ff" },
                               { data: toutGraphData, lines: { show: true }, color: "#ff4444" }
                           ],
                           { xaxis: { show: false }, yaxis: { show: false }
                       });
            }

            if (panelCheckQuery(msgObject, 'dashboard_panelStatsEnabled')) {
                if (panelMatch(msgObject['results']['enabled'], 'true')) {
                    if (!panelStatsEnabled) {
                        panelStatsEnabled = true;
                        doQuery(); // Run the query again to populate fields.
                    }
                } else {
                    $("#panelStatsEnabled").html("<span>Panel Stats are Disabled</span>");
                }
            }

            if (panelCheckQuery(msgObject, 'dashboard_streamTitle')) {
                $("#streamTitleInput").attr("placeholder", msgObject['results']['title']).blur();
            }
 
            if (panelCheckQuery(msgObject, 'dashboard_gameTitle')) {
                $("#gameTitleInput").attr("placeholder", msgObject['results']['game']).blur();
            }
 
            if (panelCheckQuery(msgObject, 'dashboard_streamOnline')) {
                streamOnline = (panelMatch(msgObject['results']['streamOnline'], 'true'));
                if (streamOnline) {
                    $("#streamOnline").html("<span class=\"greenPill\">Stream Online</span>");
                } else {
                    $("#streamOnline").html("<span class=\"redPill\">Stream Offline</span>");
                }
            }

            if (panelCheckQuery(msgObject, 'dashboard_whisperMode')) {
                whisperMode = (panelMatch(msgObject['results']['whisperMode'], 'true'));
            }
            if (panelCheckQuery(msgObject, 'dashboard_muteMode')) {
                responseMode = (panelMatch(msgObject['results']['response_@chat'], 'true'));
            }
            if (panelCheckQuery(msgObject, 'dashboard_toggleMe')) {
                meMode = (panelMatch(msgObject['results']['response_action'], 'true'));
            }
            if (panelCheckQuery(msgObject, 'dashboard_commandsPaused')) {
                pauseMode = (panelMatch(msgObject['results']['commandsPaused'], 'true'));
            }

            if (whisperMode) {
                $("#whisperModeStatus").html("<span class=\"bluePill\">Whisper Mode</span>");
            } else {
                $("#whisperModeStatus").html("");
            }

            if (meMode) {
                $("#meModeStatus").html("<span class=\"bluePill\">Action (/me) Mode</span>");
            } else {
                $("#meModeStatus").html("");
            }
            if (!responseMode) {
                $("#muteModeStatus").html("<span class=\"redPill\">Mute Mode</span>");
            } else {
                $("#muteModeStatus").html("");
            }

            if (pauseMode) {
                $("#commandPauseStatus").html("<span class=\"redPill\">Commands Paused</span>");
            } else {
                $("#commandPauseStatus").html("");
            }

            if (streamOnline) {
                if (panelCheckQuery(msgObject, 'dashboard_streamUptime')) {
                    $("#streamUptime").html("<span class=\"bluePill\">Uptime: " + msgObject['results']['streamUptime'] + "</span>");
                }
                if (panelCheckQuery(msgObject, 'dashboard_viewerCount')) {
                    $("#viewerCount").html("<span class=\"bluePill\">Viewers: " + msgObject['results']['viewerCount'] + "</span>");
                }
            }

        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBQuery("dashboard_streamTitle", "streamInfo", "title");
        sendDBQuery("dashboard_gameTitle", "streamInfo", "game");
        sendDBQuery("dashboard_whisperMode", "settings", "whisperMode"); 
        sendDBQuery("dashboard_muteMode", "settings", "response_@chat");
        sendDBQuery("dashboard_toggleMe", "settings", "response_action");
        sendDBQuery("dashboard_commandsPaused", "commandPause", "commandsPaused");
        sendDBKeys("dashboard_highlights", "highlights");

        if (!panelStatsEnabled) {
            sendDBQuery("dashboard_panelStatsEnabled", "panelstats", "enabled");
        } else {
            sendDBQuery("dashboard_viewerCount", "panelstats", "viewerCount");
            sendDBQuery("dashboard_streamOnline", "panelstats", "streamOnline");
            sendDBQuery("dashboard_streamUptime", "panelstats", "streamUptime");
            sendDBKeys("dashboard_chatCount", "panelchatstats");
            sendDBKeys("dashboard_modCount", "panelmodstats");
        }
    }

    /**
     * @function toggleCommand
     */
    function toggleCommand(command)
    {
        if (panelMatch(command, 'pausecommands')) {
            if (pauseMode) {
                command += " clear";
            } else {
                command += " 300";
            }
        }
        sendCommand(command);
        setTimeout(function() { doQuery(); }, 500);
    }

    /**
     * @function setStreamTitle
     */
    function setStreamTitle() {
        var newTitle = $("#streamTitleInput").val();
        if (newTitle.length > 0) {
            sendCommand("title " + newTitle);
            $("#streamTitleInput").val('')
            $("#streamTitleInput").attr("placeholder", newTitle).blur();
        }
    }

    /**
     * @function setGameTitle
     */
    function setGameTitle() {
        var newGame = $("#gameTitleInput").val();
        if (newGame.length > 0) {
            sendCommand("game " + newGame);
            $("#gameTitleInput").val('')
            $("#gameTitleInput").attr("placeholder", newGame).blur();
        }
    }

    /**
     * @function chatReconnect
     */
    function chatReconnect() {
        sendCommand("reconnect");
    }

    /**
     * @function setHighlight
     */
    function setHighlight() {
        $("#showHighlights").html("<i style=\"color: blue\" class=\"fa fa-spinner fa-spin\" />");
        sendCommand("highlight " + $("#highlightInput").val());
        $("#highlightInput").val('');
        setTimeout(function() { sendDBKeys("dashboard_highlights", "highlights"); }, 500);
    }

    /**
     * @function clearHighlights
     */
    function clearHighlights() {
        $("#showHighlights").html("<i style=\"color: blue\" class=\"fa fa-spinner fa-spin\" />");
        sendCommand("clearhighlights");
        setTimeout(function() { sendDBKeys("dashboard_highlights", "highlights"); }, 500);
    }

    /**
     * @function setMultiLink
     */
    function setMultiLink() {
        sendCommand("multi set " + $("#multiLinkInput").val());
    }
    
    /**
     * @function setMultiLinkTimer
     */
    function setMultiLinkTimer() {
        sendCommand("multi timerinterval " + $("#multiLinkTimerInput").val());
    }

    /**
     * @function clearMultiLink
     */
    function clearMultiLink() {
        sendCommand("multi clear");
    }
 
    /**
     * @function multiLinkTimerOn
     */
    function multiLinkTimerOn() {
        sendCommand("multi timer on");
    }
 
    /**
     * @function multiLinkTimerOff
     */
    function multiLinkTimerOff() {
        sendCommand("multi timer off");
    }

    /**
     * @function toggleTwitchChat
     */
    function toggleTwitchChat() {
        if (panelMatch(document.getElementById("chatsidebar").style.display, 'none')) {
            document.getElementById("chatsidebar").style.display = "block";
        } else {
            document.getElementById("chatsidebar").style.display = "none";
        }
    }

 
    // Import the HTML file for this panel.
    $("#dashboardPanel").load("/panel/dashboard.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 0 && isConnected) {
            doQuery();
            clearInterval(interval); 
        }
    }, 200);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 0 && isConnected) {
            newPanelAlert('Refreshing Dashboard Data', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export functions - Needed when calling from HTML.
    $.dashboardOnMessage = onMessage;
    $.setStreamTitle = setStreamTitle;
    $.setGameTitle = setGameTitle;
    $.chatReconnect = chatReconnect;
    $.setHighlight = setHighlight;
    $.clearHighlights = clearHighlights;
    $.setMultiLink = setMultiLink;
    $.setMuliLinkTimer = setMultiLinkTimer;
    $.clearMultiLink = clearMultiLink;
    $.multiLinkTimerOn = multiLinkTimerOn;
    $.multiLinkTimerOff = multiLinkTimerOff;
    $.toggleCommand = toggleCommand;
    $.toggleTwitchChat = toggleTwitchChat;
})();