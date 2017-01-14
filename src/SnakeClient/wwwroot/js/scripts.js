
var SERVER_ADDRESS = "ws://snk.jakke.se:8080";

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");


var ws = new WebSocket(SERVER_ADDRESS);

var ID;
var Settings;
var ScaleFactor;
var Snakes;
var Apples;
var _newSnakes = null;

var _moveTimer;
var _drawTimer;

// Left = -1, None = 0, Right = 1
var Turn = 0;

context.clear = function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
};

ws.onmessage = function (e) {
    var o = JSON.parse(e.data);
    console.log(o);
    switch (o.Action) {
        case "GameData":
            _handleGameData(o);
            break;
        case "Died":
            _handleSnakeDied();
            break;
        case "GameStart":
            _handleGameStart();
            break;
        case "ID":
            _handleId(o.Id);
            break;
        case "Settings":
            _handleSettings(o.Settings);
            break;
    }
};

function _handleGameStart(){
    _drawTimer = setInterval(_draw,1000 / 60);
    _moveTimer = setInterval(_moveSnakes, 1000 / Settings.SnakeMovementRate);
}

function _draw(){
    context.clear();
    for (var i = 0; i < Snakes.length; i++) {
        context.beginPath();
        for (var j = 0; j < Snakes[i].Nodes.length - 1; j++) {
            context.moveTo(
                Snakes[i].Nodes[j].X * ScaleFactor,
                Snakes[i].Nodes[j].Y * ScaleFactor
                );
            context.lineTo(
                Snakes[i].Nodes[j + 1].X * ScaleFactor,
                Snakes[i].Nodes[j + 1].Y * ScaleFactor
                );
        }
        context.lineWidth = Settings.SnakeRadius * 2 * ScaleFactor;
        context.stroke();
    }

    for (i = 0; i < Apples.length; i++) {
        context.beginPath();
        context.arc(Apples[i].X, Apples[i].Y, Settings.AppleRadius * ScaleFactor, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    }
}

function _moveSnake(snake){
    var head = snake.Nodes[0];
    snake.Nodes.splice(0,0,{
        X: head.X + Math.cos(snake.Heading) * ScaleFactor,
        Y: head.Y + Math.sin(snake.Heading) * ScaleFactor
    });
    snake.Nodes.splice(snake.Length);
}

function _moveSnakes(){
    if(_newSnakes !== null){
        Snakes = _newSnakes;
        _newSnakes = null;
    }
    for(var i = 0; i < Snakes.length; i++){
        _moveSnake(Snakes[i]);
    }
}

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
    _newSnakes = data.Snakes;
    Apples = data.Apples;
}

function _handleId(id) {
    ID = id;
    _sendSettingsRequest();
}

function _startTurnLeft() {
    if (Turn !== -1) {
        Turn = -1;
        _sendTurnData();
    }
}

function _startTurnRight() {
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
    clearInterval(_moveTimer);
    clearInterval(_drawTimer);
    _sendConnectRequest();
}

document.onkeydown = function (e) {
    _handleKeyDown(e.keyCode);
};

document.onkeyup = function (e) {
    _handleKeyUp(e.keyCode);
};