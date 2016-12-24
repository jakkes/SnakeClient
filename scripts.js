
var SERVER_ADDRESS = "ws://127.0.0.1:8080";

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");


var ws = new WebSocket(SERVER_ADDRESS);

var ID;
var Settings;
var ScaleFactor;

// Left = -1, None = 0, Right = 1
var Turn = 0;

context.clear = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
};

ws.onmessage = function (e) {
    var o = JSON.parse(e.data);
    switch (o.Action) {
        case "GameData":
            _handleGameData(o);
            break;
        case "Died":
            _handleSnakeDied();
            break;
        case "ID":
            _handleId(o.Id);
            break;
        case "Settings":
            _handleSettings(o.Settings);
            break;
    }
};

function _sendConnectRequest() {
    ws.send(JSON.stringify({ "Action": "Connect" }));
}

function _sendSettingsRequest() {
    ws.send(JSON.stringify({ "Action": "Settings" }));
}

function _handleSettings(settings) {
    Settings = settings;
    ScaleFactor = canvas.width / Settings.Width;
    _sendConnectRequest();
}

function _handleGameData(data) {
    console.log(data);
    context.clear();
    for (var i = 0; i < data.Snakes.length; i++) {
        context.beginPath();
        for (var j = 0; j < data.Snakes[i].Nodes.length - 1; j++) {
            context.moveTo(
                data.Snakes[i].Nodes[j].X * ScaleFactor,
                data.Snakes[i].Nodes[j].Y * ScaleFactor
                );
            context.lineTo(
                data.Snakes[i].Nodes[j + 1].X * ScaleFactor,
                data.Snakes[i].Nodes[j + 1].Y * ScaleFactor
                );
        }
        context.lineWidth = Settings.SnakeRadius * 2 * ScaleFactor;
        context.stroke();
    }

    for (i = 0; i < data.Apples.length; i++) {
        context.beginPath();
        context.arc(data.Apples[i].X, data.Apples[i].Y, Settings.AppleRadius * ScaleFactor, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    }
}

function _handleId(id){
    ID = id;
    _sendSettingsRequest();
}

function _startTurnLeft() {
    if (Turn !== -1) {
        Turn = -1;
        _sendTurnData();
    }
}

function _startTurnRight(){
    if (Turn !== 1) {
        Turn = 1;
        _sendTurnData();
    }
}

function _stopTurnLeft() {
    if (Turn === -1) {
        Turn = 0;
        _sendTurnData();
    }
}

function _stopTurnRight() {
    if (Turn === 1) {
        Turn = 0;
        _sendTurnData();
    }
}

function _sendTurnData() {
    ws.send(JSON.stringify({
        "Action": "TurnData",
        "Turn": Turn
    }));
}

function _handleKeyDown(keyCode) {
    switch (keyCode) {
        case 37:
            _startTurnLeft();
            break;
        case 39:
            _startTurnRight();
            break;
    }
}

function _handleKeyUp(keyCode) {
    switch (keyCode) {
        case 37:
            _stopTurnLeft();
            break;
        case 39:
            _stopTurnRight();
            break;
    }
}

function _handleSnakeDied() {
    context.clear();
    _sendConnectRequest();
}

document.onkeydown = function (e) {
    _handleKeyDown(e.keyCode);
};

document.onkeyup = function (e) {
    _handleKeyUp(e.keyCode);
};