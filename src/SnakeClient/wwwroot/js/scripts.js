
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");


var ws = new WebSocket(SERVER_ADDRESS);

var ID;
var Settings;
var ScaleFactor;
var Snakes = [];
var Apples = {};
var _newSnakes = null;

var _moveTimer;

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
        case "AppleSpawned":
            _handleAppleSpawn(o);
            break;
        case "AppleDespawned":
            _handleAppleDespawned(o);
            break;
        case "SnakeDied":
            _handleSnakeDied(o);
            break;
        case "Died":
            console.log("Omg snake died!!!");
            _handleDied();
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

function _handleSnakeDied(o) {
    if (o.ID === ID) {
        return;
        //_handleDied();
    } else {
        for (var i = 0; i < Snakes.length; i++) {
            if (Snakes[i].ID === o.ID) {
                Snakes[i].Nodes = [];
                break;
            }
        }
    }
}

function _handleAppleDespawned(o) {
    delete Apples[o.ID];
}

function _handleAppleSpawn(o) {
    Apples[o.Apple.ID] = o.Apple;
}

function _handleGameStart(){
    _moveTimer = setInterval(_moveSnakes, 1000 / Settings.SnakeMovementRate);
}

function _draw(){
    context.clear();

    // Draw snakes
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

    // Draw apples
    for (var key in Apples) {
        context.beginPath();
        context.arc(Apples[key].X * ScaleFactor, Apples[key].Y * ScaleFactor, Settings.AppleRadius * ScaleFactor, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
    }
}

function _moveSnake(snake) {

    // Is there a snake..?
    if (snake.Nodes.length === 0) return;

    var head = snake.Nodes[0];
    snake.Nodes.splice(0,0,{
        X: head.X + Math.cos(snake.Heading) * Settings.SnakeMovementLength,
        Y: head.Y + Math.sin(snake.Heading) * Settings.SnakeMovementLength
    });
    snake.Nodes.splice(snake.Length);
}

function _moveSnakes(){
    if(_newSnakes !== null){
        Snakes = _newSnakes;
        _newSnakes = null;
    }
    if (Snakes !== null) {
        for (var i = 0; i < Snakes.length; i++) {
            _moveSnake(Snakes[i]);
        }
        _draw();
    }
}

function _sendConnectRequest() {
    ws.send(JSON.stringify({ "Action": "Connect" }));
    console.log("I wanna live!!");
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

function _handleDied() {
    console.log("And it sucks :(");
    context.clear();
    clearInterval(_moveTimer);
    Apples = {};
    Snakes = [];
    console.log("I dont wanna be dead anymore!!!");
    _sendConnectRequest();
}

document.onkeydown = function (e) {
    _handleKeyDown(e.keyCode);
};

document.onkeyup = function (e) {
    _handleKeyUp(e.keyCode);
};