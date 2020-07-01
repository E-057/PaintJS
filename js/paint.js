var paintManager = (function () {

    const HEADER_SIZE = 300;

    const PAINT_MODE = 'source-over';
    const ERASER_MODE = 'destination-out';

    const PAINT_LINE_WIDTH = 10;
    const ERASER_LINE_WIDTH = 20;

    const PAINT_LINE_JOIN = 'round';
    const PAINT_LINE_CAP = 'round';

    var obj = {};

    var _paintPanel = null;

    var _canvas = null;

    var _context = null;

    var _paintCanvas = null;

    var _paintContext = null;

    var _backgroundCanvas = null;

    var _backgroundContext = null;

    var _lastPosition = {x: null, y: null};

    var _isDrag = false;

    var _lineCap = PAINT_LINE_CAP;

    var _lineJoin = PAINT_LINE_JOIN;

    var _lineWidth = PAINT_LINE_WIDTH;

    var _strokeStyle = 'black';

    var _mode = PAINT_MODE;

    var _init = false;

    function _drawCanvas() {
        _context.clearRect(0, 0, _canvas.width, _canvas.height);

        _context.drawImage(_backgroundCanvas, 0, 0);
        _context.drawImage(_paintCanvas, 0, 0);

        window.requestAnimationFrame(_drawCanvas);
    }

    /**
     * 線描画
     * @param x
     * @param y
     */
    function _draw(x, y) {
        if (!_isDrag) {
            return;
        }

        _paintContext.lineCap = _lineCap;
        _paintContext.lineJoin = _lineJoin;
        _paintContext.lineWidth = _lineWidth;
        _paintContext.strokeStyle = _strokeStyle;
        _paintContext.globalCompositeOperation = _mode;

        if (_lastPosition.x === null || _lastPosition.y === null) {
            _paintContext.moveTo(x, y);
        } else {
            _paintContext.moveTo(_lastPosition.x, _lastPosition.y);
        }

        _paintContext.lineTo(x, y);

        _paintContext.stroke();

        _lastPosition.x = x;
        _lastPosition.y = y;
    }

    function _dragStart(event) {
        _paintContext.beginPath();
        _isDrag = true;
    }

    var count = 0;

    function _dragEnd(event) {
        _paintContext.closePath();
        _isDrag = false;

        _lastPosition.x = null;
        _lastPosition.y = null;
    }

    function _initEventHandler() {
        var userAgent = window.navigator.userAgent.toLowerCase();

        // PC
        if(userAgent.indexOf("windows nt") !== -1 || userAgent.indexOf("mac os x") !== -1) {
            _canvas.addEventListener('mousedown', _dragStart);
            _canvas.addEventListener('mouseup', _dragEnd);
            _canvas.addEventListener('mouseout', _dragEnd);
            _canvas.addEventListener('mousemove', (event) => {
                _draw(event.layerX, event.layerY);
            });
        }

        //タブレット・スマホ
        if(userAgent.indexOf("android") !== -1 || userAgent.indexOf("iphone") !== -1 ||
            userAgent.indexOf("ipad") !== -1 || userAgent.indexOf("amazon") !== -1) {
            _canvas.addEventListener('touchstart', _dragStart);
            _canvas.addEventListener('touchend', _dragEnd);
            _canvas.addEventListener('touchmove', (event) => {
                event.preventDefault();
                _draw(event.changedTouches[0].pageX - _canvas.getBoundingClientRect().left, event.changedTouches[0].pageY - _canvas.getBoundingClientRect().top);
            });
        }
    }

    /**
     * 描画クリア
     */
    function clear() {
        _paintContext.clearRect(0, 0, _paintCanvas.width, _paintCanvas.height);
        _backgroundContext.clearRect(0, 0, _backgroundCanvas.width, _backgroundCanvas.height);
    }

    /**
     * 初期設定
     * @param paintPanelId
     * @param canvasId
     */
    function init(paintPanelId, canvasId) {

        if(_init){
            return;
        }

        //正面設定と現在の向きを取得
        var orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;

        if (orientation.type !== "portrait-primary") {
            return;
        }

        var canvas = document.getElementById(canvasId);

        _canvas = canvas;

        if (_canvas == undefined || _canvas == null) {
            alert('初期設定でエラーが発生しました。\n_canvas is null');
            return;
        }

        _context = _canvas.getContext('2d');

        if (_context == undefined || _context == null) {
            alert('初期設定でエラーが発生しました。\n_context is null');
            return;
        }

        _paintPanel = document.getElementById(paintPanelId);

        if (_paintPanel == undefined || _paintPanel == null) {
            alert('画面設定でエラーが発生しました。\npaintPanel not found');
            return;
        }

        _canvas.width = _paintPanel.clientWidth;
        _canvas.height = _paintPanel.clientHeight - HEADER_SIZE;

        // ペイント用キャンバス
        _paintCanvas = document.createElement('canvas');
        _paintCanvas.width = _canvas.width;
        _paintCanvas.height = _canvas.height;
        _paintContext = _paintCanvas.getContext('2d');

        // 背景用キャンバス
        _backgroundCanvas = document.createElement('canvas');
        _backgroundCanvas.width = _canvas.width;
        _backgroundCanvas.height = _canvas.height;
        _backgroundContext = _backgroundCanvas.getContext('2d');

        _drawCanvas();
        _initEventHandler();

        _init = true;
    }

    function background(image) {
        var left = (_canvas.width - image.naturalWidth) / 2;
        var top = (_canvas.height - image.naturalHeight) / 2;
        _backgroundContext.drawImage(image, left, top);
    }

    function color(color) {
        _strokeStyle = color;
    }

    function paint() {
        _mode = PAINT_MODE;
        _lineWidth = PAINT_LINE_WIDTH;
    }

    function eraser() {
        _mode = ERASER_MODE;
        _lineWidth = ERASER_LINE_WIDTH;
    }

    obj.init = init;
    obj.clear = clear;
    obj.background = background;
    obj.color = color;
    obj.paint = paint;
    obj.eraser = eraser;

    return obj;
})();

$(function () {

    //画面向きのチェック
    (function orientCheck(){
        //正面設定と現在の向きを取得
        var orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;

        if (orientation.type === "portrait-primary") {
            paintManager.init('paint_panel', 'paint_canvas');
            $('#hidden_panel').hide();
        } else {
            $('#hidden_panel').show();
        }

        window.requestAnimationFrame(orientCheck);
    })();

    $("#file_background").change(function () {
        var file = this.files[0];

        if (file == null) return;

        var image = new Image();

        var fr = new FileReader();

        fr.onload = function (evt) {
            image.onload = function () {
                paintManager.background(image);
            };

            image.src = evt.target.result;
        };

        fr.readAsDataURL(file);
    });

    $('#save_image').on('click', function () {
        var canvas = document.getElementById("paint_canvas");
        var base64 = canvas.toDataURL("image/jpeg");
        document.getElementById("save_image").href = base64;
    });

    $('[id^=color_button_]').on('click', function () {
        var color = $(this).attr('id').split('_')[2];
        paintManager.color(color);
        paintManager.paint();
        document.getElementById('eraser_button').style.background = 'white';

        resetColorBotunBorder();

        $(this).css("border", "#FFF 15px solid");
    });

    $('#eraser_button').on('click', function () {
        resetColorBotunBorder();

        $(this).css("border", "#F00 15px solid");

        paintManager.eraser();
    });
    
    $('#clear_button').on('click', function(){
       paintManager.clear(); 
    });

    function resetColorBotunBorder(){
        $('#eraser_button').css("border", "none");

        $('[id^=color_button_]').each(function(index, element){
            $(element).css("border", "none");
        });
    }

    $('#color_button_black').css("border", "#FFF 15px solid");
});

