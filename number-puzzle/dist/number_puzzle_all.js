(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var prelude_ts_1 = require("prelude.ts");
var CELL_WIDTH_PX = 0; // will be overwritten during initialization
var TEXT_VERTICAL_OFFSET = 0; // will be overwritten during initialization
var HINTS_SPACING_X = 20;
var FONT = "px Arial";
var FONT_WIDTH_PROPORTION_OF_CELL_PCENT = 20;
var CANVAS_PADDING_X_PX = 0; // will be overwritten during initialization
var CANVAS_PADDING_Y_PX = 0; // will be overwritten during initialization
var WINNING_TOTAL = 38;
// the board layout is:
//   xxx
//   xxxx
//  xxxxx
//   xxxx
//   xxx
// rows are: 3 cells, 4 cells, 5 cells, 4, cells, 3 cells.
// for the columns, we base the coordinates on the central
// 5-cells row. its left is x 0.
// for the y, we start on the top row.
// we have fractional coordinates.
// the first row starts are (x,y) 1,0
// second row: (0.5, 1)
// third row: (0, 2), ...
var rows = prelude_ts_1.Vector.of({ x: 1, items: 3 }, { x: 0.5, items: 4 }, { x: 0, items: 5 }, { x: 0.5, items: 4 }, { x: 1, items: 3 });
var cellCount = rows.sumOn(function (cur) { return cur.items; });
// list, one item per row on the board,
// containing the start item index for that row
var rowsStartItemIdx = rows.map(function (r) { return r.items; }).foldLeft({ itemsCount: 0, rows: prelude_ts_1.Vector.empty() }, function (sofar, cur) { return ({ itemsCount: sofar.itemsCount + cur,
    rows: sofar.rows.append(sofar.itemsCount) }); }).rows;
;
;
var appState = {
    // initialize with items at random positions on the board
    tilePositions: prelude_ts_1.Stream.iterate(0, function (i) { return i + 1; })
        .take(cellCount).shuffle()
        .map(function (x) { return ({ kind: "in_board", cellIdx: x }); }).toVector(),
    boardPolygons: [],
    tilePolygons: [],
    selectedPolygon: undefined,
    displayHints: new URLSearchParams(window.location.search).get("hints") === "1"
};
function cellIdxGetRowCol(cellIdx) {
    var rowsBefore = rowsStartItemIdx.takeWhile(function (startIdx) { return startIdx <= cellIdx; });
    return [rowsBefore.length() - 1, cellIdx - rowsBefore.last().getOrThrow()];
}
function drawTile(ctx, value, isInWinningDiagonal, x, y) {
    var polygon = [];
    ctx.save();
    ctx.translate(x, y);
    var translate = function (inputX, inputY) {
        return ({ x: inputX + x, y: inputY + y });
    };
    ctx.beginPath();
    ctx.moveTo(CELL_WIDTH_PX / 2, 0);
    polygon.push(translate(CELL_WIDTH_PX / 2, 0));
    var addPoint = function (x, y) {
        ctx.lineTo(x, y);
        polygon.push(translate(x, y));
    };
    addPoint(CELL_WIDTH_PX, CELL_WIDTH_PX / 4);
    addPoint(CELL_WIDTH_PX, 3 * CELL_WIDTH_PX / 4);
    addPoint(CELL_WIDTH_PX / 2, CELL_WIDTH_PX);
    addPoint(0, 3 * CELL_WIDTH_PX / 4);
    addPoint(0, CELL_WIDTH_PX / 4);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.fillStyle = appState.displayHints ?
        (isInWinningDiagonal ? "blue" : "black") : "black";
    if (value !== undefined) {
        var text = value + "";
        var metrics = ctx.measureText(text);
        ctx.fillText(text, (CELL_WIDTH_PX - metrics.width) / 2, TEXT_VERTICAL_OFFSET);
    }
    ctx.restore();
    return polygon;
}
function drawTileInBoard(ctx, value, isInWinningDiagonal, x, y) {
    var xOffset = CELL_WIDTH_PX * x + CANVAS_PADDING_X_PX;
    var yOffset = 3 * CELL_WIDTH_PX / 4 * y + CANVAS_PADDING_Y_PX;
    return drawTile(ctx, value, isInWinningDiagonal, xOffset, yOffset);
}
function drawAndCheckForWin(canvas, ctx, options) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var _a = drawBoardAndCheckForWin(ctx, options), boardPolygons = _a.boardPolygons, allItemsInWinningDiagonals = _a.allItemsInWinningDiagonals;
    return { boardPolygons: boardPolygons, tilePolygons: drawTiles(ctx, allItemsInWinningDiagonals, options) };
}
var allDiagonal1Indexes = prelude_ts_1.Vector.of(prelude_ts_1.HashSet.of(7, 12, 16), prelude_ts_1.HashSet.of(3, 8, 13, 17), prelude_ts_1.HashSet.of(0, 4, 9, 14, 18), prelude_ts_1.HashSet.of(1, 5, 10, 15), prelude_ts_1.HashSet.of(2, 6, 11));
var allDiagonal2Indexes = prelude_ts_1.Vector.of(prelude_ts_1.HashSet.of(0, 3, 7), prelude_ts_1.HashSet.of(1, 4, 8, 12), prelude_ts_1.HashSet.of(2, 5, 9, 13, 16), prelude_ts_1.HashSet.of(6, 10, 14, 17), prelude_ts_1.HashSet.of(11, 15, 18));
function drawTotalCheckDisqualifiesWin(ctx, rowIdx, row, options) {
    var positionsToConsider = appState.tilePositions
        .zipWithIndex()
        .filter(function (tileWithIndex) { return options ? options.skipTile !== tileWithIndex[1] : true; })
        .filter(prelude_ts_1.typeGuard(function (p) { return p[0].kind === "in_board"; }, {}));
    var drawTotal = function (val) {
        ctx.fillStyle = val === WINNING_TOTAL ? "green" : (val > WINNING_TOTAL ? "red" : "orange");
        ctx.fillText(val + "", HINTS_SPACING_X, TEXT_VERTICAL_OFFSET);
    };
    var itemsInWinningDiagonals = prelude_ts_1.HashSet.empty();
    // horizontal totals
    var rowTotal = positionsToConsider
        .filter(function (p) { return cellIdxGetRowCol(p[0].cellIdx)[0] === rowIdx; })
        .sumOn(function (p) { return p[1] + 1; });
    if (appState.displayHints) {
        ctx.save();
        ctx.translate((row.x + row.items) * CELL_WIDTH_PX + CANVAS_PADDING_X_PX, rowIdx * (CELL_WIDTH_PX * 3 / 4) + CANVAS_PADDING_Y_PX);
        ctx.beginPath();
        ctx.moveTo(5, CELL_WIDTH_PX / 2);
        ctx.lineTo(15, CELL_WIDTH_PX / 2);
        ctx.stroke();
        drawTotal(rowTotal);
        ctx.restore();
    }
    if (rowTotal === WINNING_TOTAL) {
        itemsInWinningDiagonals = itemsInWinningDiagonals.addAll(positionsToConsider
            .filter(function (p) { return cellIdxGetRowCol(p[0].cellIdx)[0] === rowIdx; })
            .map(function (p) { return p[0].cellIdx; }));
    }
    // top-left->bottom right totals
    var diag1indexes = allDiagonal1Indexes.get(rowIdx).getOrThrow();
    var diag1Total = positionsToConsider
        .filter(function (p) { return diag1indexes.contains(p[0].cellIdx); })
        .sumOn(function (p) { return p[1] + 1; });
    if (appState.displayHints) {
        ctx.save();
        var _a = __read(cellIdxGetRowCol(allDiagonal1Indexes.get(rowIdx).getOrThrow().toArray({ sortOn: function (x) { return x; } })[0]), 2), row_1 = _a[0], col = _a[1];
        ctx.translate((rows.get(row_1).getOrThrow().x + col) * CELL_WIDTH_PX - CELL_WIDTH_PX / 2 + CANVAS_PADDING_X_PX, row_1 * (CELL_WIDTH_PX * 3 / 4) - CELL_WIDTH_PX / 2 + CANVAS_PADDING_Y_PX);
        ctx.beginPath();
        var metrics = ctx.measureText(diag1Total + "");
        ctx.moveTo(HINTS_SPACING_X + metrics.width + 5, CELL_WIDTH_PX / 2);
        ctx.lineTo(HINTS_SPACING_X + metrics.width + 5 + 10, CELL_WIDTH_PX / 2 + 10);
        ctx.stroke();
        drawTotal(diag1Total);
        ctx.restore();
    }
    if (diag1Total === WINNING_TOTAL) {
        itemsInWinningDiagonals = itemsInWinningDiagonals.addAll(positionsToConsider
            .filter(function (p) { return diag1indexes.contains(p[0].cellIdx); })
            .map(function (p) { return p[0].cellIdx; }));
    }
    // top-right->bottom left totals
    var diag2indexes = allDiagonal2Indexes.get(rowIdx).getOrThrow();
    var diag2Total = positionsToConsider
        .filter(function (p) { return diag2indexes.contains(p[0].cellIdx); })
        .sumOn(function (p) { return p[1] + 1; });
    if (appState.displayHints) {
        ctx.save();
        var _b = __read(cellIdxGetRowCol(allDiagonal2Indexes.get(rowIdx).getOrThrow().toArray({ sortOn: function (x) { return cellCount - x; } })[0]), 2), row_2 = _b[0], col = _b[1];
        ctx.translate((rows.get(row_2).getOrThrow().x + col) * CELL_WIDTH_PX - CELL_WIDTH_PX / 2 + CANVAS_PADDING_X_PX, row_2 * (CELL_WIDTH_PX * 3 / 4) + CELL_WIDTH_PX / 2 + CANVAS_PADDING_Y_PX);
        ctx.beginPath();
        var metrics = ctx.measureText(diag2Total + "");
        ctx.moveTo(HINTS_SPACING_X + metrics.width + 5, CELL_WIDTH_PX / 2);
        ctx.lineTo(HINTS_SPACING_X + metrics.width + 5 + 10, CELL_WIDTH_PX / 2 - 10);
        ctx.stroke();
        drawTotal(diag2Total);
        ctx.restore();
    }
    if (diag2Total === WINNING_TOTAL) {
        itemsInWinningDiagonals = itemsInWinningDiagonals.addAll(positionsToConsider
            .filter(function (p) { return diag2indexes.contains(p[0].cellIdx); })
            .map(function (p) { return p[0].cellIdx; }));
    }
    var preventsWin = rowTotal !== diag1Total ||
        diag1Total !== WINNING_TOTAL ||
        diag2Total !== WINNING_TOTAL;
    return { preventsWin: preventsWin, itemsInWinningDiagonals: itemsInWinningDiagonals };
}
function drawBoardAndCheckForWin(ctx, options) {
    var polygons = [];
    var rowIdx = 0;
    var isWin = true;
    var allItemsInWinningDiagonals = prelude_ts_1.HashSet.empty();
    try {
        for (var rows_1 = __values(rows), rows_1_1 = rows_1.next(); !rows_1_1.done; rows_1_1 = rows_1.next()) {
            var row = rows_1_1.value;
            for (var i = 0; i < row.items; i++) {
                polygons.push(drawTileInBoard(ctx, undefined, false, row.x + i, rowIdx));
            }
            var _a = drawTotalCheckDisqualifiesWin(ctx, rowIdx, row, options), preventsWin = _a.preventsWin, itemsInWinningDiagonals = _a.itemsInWinningDiagonals;
            allItemsInWinningDiagonals =
                allItemsInWinningDiagonals.addAll(itemsInWinningDiagonals);
            isWin = (!preventsWin) && isWin;
            ++rowIdx;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rows_1_1 && !rows_1_1.done && (_b = rows_1.return)) _b.call(rows_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    if (isWin) {
        alert("Bravo!");
    }
    return { boardPolygons: polygons, allItemsInWinningDiagonals: allItemsInWinningDiagonals };
    var e_1, _b;
}
function drawTiles(ctx, allItemsInWinningDiagonals, options) {
    var polygons = [];
    for (var tileIdx = 0; tileIdx < appState.tilePositions.length(); tileIdx++) {
        if (options && tileIdx === options.skipTile) {
            continue;
        }
        var tile = appState.tilePositions.get(tileIdx).getOrThrow();
        if (tile.kind === "in_board") {
            var _a = __read(cellIdxGetRowCol(tile.cellIdx), 2), rowIdx = _a[0], colIdx = _a[1];
            var row = rows.get(rowIdx).getOrThrow();
            polygons.push(drawTileInBoard(ctx, tileIdx + 1, allItemsInWinningDiagonals.contains(tile.cellIdx), row.x + colIdx, rowIdx));
        }
        else {
            polygons.push(drawTile(ctx, tileIdx + 1, false, tile.pos.x, tile.pos.y));
        }
    }
    return polygons;
}
function vectorX(v) {
    return v[1].x - v[0].x;
}
function vectorY(v) {
    return v[1].y - v[0].y;
}
function crossProduct(v1, v2) {
    return vectorX(v1) * vectorY(v2) - vectorY(v1) * vectorX(v2);
}
function isInConvexPolygon(testPoint, polygon) {
    // https://stackoverflow.com/a/34689268/516188
    if (polygon.length < 3) {
        throw "Only supporting polygons of length at least 3";
    }
    // going through all the edges around the polygon. compute the
    // vector cross-product http://allenchou.net/2013/07/cross-product-of-2d-vectors/
    // to find out for each edge on which side of the edge is the point.
    // if the point is on the same side for all the edges, it's inside
    var initCrossIsPositive = undefined;
    for (var i = 0; i < polygon.length; i++) {
        if (polygon[i].x === testPoint.x &&
            polygon[i].y === testPoint.y) {
            // testPoint is an edge of the polygon
            return true;
        }
        var curPointOnEdge = polygon[i];
        var nextPointOnEdge = polygon[(i + 1) % polygon.length];
        var vector1 = [curPointOnEdge, nextPointOnEdge];
        var vector2 = [curPointOnEdge, testPoint];
        var cross = crossProduct(vector1, vector2);
        if (initCrossIsPositive === undefined) {
            initCrossIsPositive = cross > 0;
        }
        else {
            if (initCrossIsPositive !== (cross > 0)) {
                return false;
            }
        }
    }
    // all the cross-products have the same sign: we're inside
    return true;
}
function getSelected(polygons, x, y) {
    for (var i = 0; i < polygons.length; i++) {
        if (isInConvexPolygon({ x: x, y: y }, polygons[i])) {
            return i;
        }
    }
    return undefined;
}
function getOnCanvasXY(canvas, event) {
    var _a = __read(event instanceof MouseEvent ?
        [event.pageX, event.pageY] :
        [event.touches[0].pageX, event.touches[0].pageY], 2), clickX = _a[0], clickY = _a[1];
    return [clickX - canvas.offsetLeft, clickY - canvas.offsetTop];
}
/**
 * clamp the coordinates to make sure a tile will stay 100%
 * inside the playable area
 */
function clampedXY(canvas, coords) {
    return {
        x: Math.max(0, Math.min(coords.x - CELL_WIDTH_PX / 2, canvas.width - CELL_WIDTH_PX)),
        y: Math.max(0, Math.min(coords.y - CELL_WIDTH_PX / 2, canvas.height - CELL_WIDTH_PX))
    };
}
function onDown(backBuffer, backBufCtx, canvas, event) {
    var _a = __read(getOnCanvasXY(canvas, event), 2), x = _a[0], y = _a[1];
    appState.selectedPolygon = getSelected(appState.tilePolygons, x, y);
    if (appState.selectedPolygon !== undefined) {
        // repaint the backbuffer without the selected tile
        // since we'll paint it following the mouse movements
        drawAndCheckForWin(backBuffer, backBufCtx, { skipTile: appState.selectedPolygon });
    }
}
function onMove(backBuffer, canvas, ctx, event) {
    var _a = __read(getOnCanvasXY(canvas, event), 2), x = _a[0], y = _a[1];
    if (appState.selectedPolygon === undefined) {
        return [x, y];
    }
    ctx.drawImage(backBuffer, 0, 0);
    var clampedCoords = clampedXY(canvas, { x: x, y: y });
    drawTile(ctx, appState.selectedPolygon + 1, false, clampedCoords.x, clampedCoords.y);
    return [x, y];
}
function onUp(backBuffer, backBufCtx, ctx, x, y) {
    var wasSelected = appState.selectedPolygon;
    appState.selectedPolygon = getSelected(appState.tilePolygons, x, y);
    var clickedBoardCell = appState.selectedPolygon !== undefined ? undefined :
        getSelected(appState.boardPolygons, x, y);
    if (wasSelected !== undefined && (wasSelected === appState.selectedPolygon)) {
        // user clicked on the selected polygon, unselect it.
        appState.selectedPolygon = undefined;
    }
    else if (wasSelected !== undefined && clickedBoardCell !== undefined) {
        // user moved a tile on an empty board cell. move the tile there.
        var newBoard = appState.tilePositions
            .replace(wasSelected, { kind: "in_board",
            cellIdx: clickedBoardCell });
        appState.tilePositions = newBoard;
    }
    else if (wasSelected !== undefined && appState.selectedPolygon === undefined) {
        // user wanted to move the selected polygon to another spot
        var clampedCoords = clampedXY(backBuffer, { x: x, y: y });
        var newBoard = appState.tilePositions
            .replace(wasSelected, { kind: "out_of_board",
            pos: { x: clampedCoords.x, y: clampedCoords.y } });
        appState.tilePositions = newBoard;
    }
    else if (wasSelected !== undefined && appState.selectedPolygon !== undefined) {
        // user clicked on another tile tile. switch them
        var myPos = appState.tilePositions.get(wasSelected).getOrThrow();
        var hisPos = appState.tilePositions.get(appState.selectedPolygon).getOrThrow();
        var newBoard = appState.tilePositions
            .replace(wasSelected, hisPos)
            .replace(appState.selectedPolygon, myPos);
        appState.tilePositions = newBoard;
        appState.selectedPolygon = undefined;
    }
    appState.tilePolygons = drawAndCheckForWin(backBuffer, backBufCtx).tilePolygons;
    ctx.drawImage(backBuffer, 0, 0);
}
function computeFontSize(ctx) {
    var expectedWidth = CELL_WIDTH_PX * FONT_WIDTH_PROPORTION_OF_CELL_PCENT / 100;
    var measured = 0;
    var curFontSize = 1;
    while (measured < expectedWidth) {
        ctx.font = curFontSize + FONT;
        measured = ctx.measureText("1").width;
        ++curFontSize;
    }
    return curFontSize;
}
function computeDimensions(canvas, backBuffer, backBufCtx, ctx) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    backBuffer.width = canvas.clientWidth;
    backBuffer.height = canvas.clientHeight;
    CELL_WIDTH_PX = Math.min(canvas.width / 7, canvas.height / 6);
    // center the canvas horizontally
    CANVAS_PADDING_X_PX = (canvas.width - CELL_WIDTH_PX * 5) / 2;
    CANVAS_PADDING_Y_PX = (canvas.height - CELL_WIDTH_PX * 4) / 2;
    // can't vertically measure text with canvas AFAICT
    // so must approximate
    TEXT_VERTICAL_OFFSET = CELL_WIDTH_PX / 1.65;
    var fontSize = computeFontSize(backBufCtx);
    ctx.font = fontSize + FONT;
    backBufCtx.font = fontSize + FONT;
}
window.onload = function () {
    var canvas = prelude_ts_1.Option.ofNullable(document.getElementById("myCanvas"))
        .filter(prelude_ts_1.instanceOf(HTMLCanvasElement))
        .getOrThrow("Cannot find the canvas element!");
    var backBuffer = document.createElement("canvas");
    var backBufCtx = prelude_ts_1.Option.ofNullable(backBuffer.getContext("2d"))
        .getOrThrow("Can't get the 2d context for the backbuffer canvas!");
    var ctx = prelude_ts_1.Option.ofNullable(canvas.getContext("2d"))
        .getOrThrow("Can't get the 2d context for the canvas!");
    computeDimensions(canvas, backBuffer, backBufCtx, ctx);
    var mouseDown = false;
    var handleDownEvt = function (evt) {
        mouseDown = true;
        onDown(backBuffer, backBufCtx, canvas, evt);
    };
    canvas.addEventListener('touchstart', handleDownEvt, false);
    canvas.addEventListener('mousedown', handleDownEvt, false);
    var curX, curY;
    var handleMoveEvt = function (evt) {
        if (mouseDown) {
            _a = __read(onMove(backBuffer, canvas, ctx, evt), 2), curX = _a[0], curY = _a[1];
        }
        var _a;
    };
    canvas.addEventListener('mousemove', handleMoveEvt, false);
    canvas.addEventListener('touchmove', handleMoveEvt, false);
    var handleUpEvt = function () {
        mouseDown = false;
        onUp(backBuffer, backBufCtx, ctx, curX, curY);
    };
    canvas.addEventListener('mouseup', handleUpEvt, false);
    canvas.addEventListener('touchend', handleUpEvt, false);
    // double click to toggle hints
    canvas.addEventListener('dblclick', function () {
        appState.displayHints = !appState.displayHints;
        drawAndCheckForWin(backBuffer, backBufCtx);
        ctx.drawImage(backBuffer, 0, 0);
    });
    var polygons = drawAndCheckForWin(backBuffer, backBufCtx);
    ctx.drawImage(backBuffer, 0, 0);
    appState.boardPolygons = polygons.boardPolygons;
    appState.tilePolygons = polygons.tilePolygons;
    window.onresize = function () {
        computeDimensions(canvas, backBuffer, backBufCtx, ctx);
        var polygons = drawAndCheckForWin(backBuffer, backBufCtx);
        appState.boardPolygons = polygons.boardPolygons;
        appState.tilePolygons = polygons.tilePolygons;
        ctx.drawImage(backBuffer, 0, 0);
    };
};

},{"prelude.ts":17}],2:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Option_1 = require("./Option");
/**
 * Type guard for HasEquals: find out for a type with
 * semantic equality, whether you should call .equals
 * or ===
 */
function hasEquals(v) {
    // there is a reason why we check only for equals, not for hashCode.
    // we want to decide which codepath to take: === or equals/hashcode.
    // if there is a equals function then we don't want ===, regardless of
    // whether there is a hashCode method or not. If there is a equals
    // and not hashCode, we want to go on the equals/hashCode codepath,
    // which will blow a little later at runtime if the hashCode is missing.
    return (v.equals !== undefined);
}
exports.hasEquals = hasEquals;
/**
 * Helper function for your objects so you can compute
 * a hashcode. You can pass to this function all the fields
 * of your object that should be taken into account for the
 * hash, and the function will return a reasonable hash code.
 *
 * @param fields the fields of your object to take
 *        into account for the hashcode
 */
function fieldsHashCode() {
    var fields = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fields[_i] = arguments[_i];
    }
    // https://stackoverflow.com/a/113600/516188
    // https://stackoverflow.com/a/18066516/516188
    var result = 1;
    for (var _a = 0, fields_1 = fields; _a < fields_1.length; _a++) {
        var value = fields_1[_a];
        result = 37 * result + getHashCode(value);
    }
    return result;
}
exports.fieldsHashCode = fieldsHashCode;
/**
 * Helper function to compute a reasonable hashcode for strings.
 */
function stringHashCode(str) {
    // https://stackoverflow.com/a/7616484/516188
    var hash = 0, i, chr;
    if (str.length === 0)
        return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
exports.stringHashCode = stringHashCode;
/**
 * Equality function which tries semantic equality (using .equals())
 * if possible, degrades to === if not available, and is also null-safe.
 */
function areEqual(obj, obj2) {
    if (obj === null != obj2 === null) {
        return false;
    }
    if (obj === null || obj2 === null) {
        return true;
    }
    if (hasEquals(obj)) {
        return obj.equals(obj2);
    }
    return obj === obj2;
}
exports.areEqual = areEqual;
/**
 * Hashing function which tries to call hashCode()
 * and uses the object itself for numbers, then degrades
 * for stringHashCode of the string representation if
 * not available.
 */
function getHashCode(obj) {
    if (!obj) {
        return 0;
    }
    if (hasEquals(obj)) {
        return obj.hashCode();
    }
    if (typeof obj === 'number') {
        // this is the hashcode implementation for numbers from immutablejs
        if (obj !== obj || obj === Infinity) {
            return 0;
        }
        var h = obj | 0;
        if (h !== obj) {
            h ^= obj * 0xffffffff;
        }
        while (obj > 0xffffffff) {
            obj /= 0xffffffff;
            h ^= obj;
        }
        return smi(h);
    }
    var val = obj + "";
    return val.length > STRING_HASH_CACHE_MIN_STRLEN ?
        cachedHashString(val) :
        stringHashCode(val);
}
exports.getHashCode = getHashCode;
function cachedHashString(string) {
    var hashed = stringHashCache[string];
    if (hashed === undefined) {
        hashed = stringHashCode(string);
        if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
            STRING_HASH_CACHE_SIZE = 0;
            stringHashCache = {};
        }
        STRING_HASH_CACHE_SIZE++;
        stringHashCache[string] = hashed;
    }
    return hashed;
}
// v8 has an optimization for storing 31-bit signed numbers.
// Values which have either 00 or 11 as the high order bits qualify.
// This function drops the highest order bit in a signed number, maintaining
// the sign bit. (taken from immutablejs)
function smi(i32) {
    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xbfffffff);
}
var STRING_HASH_CACHE_MIN_STRLEN = 16;
var STRING_HASH_CACHE_MAX_SIZE = 255;
var STRING_HASH_CACHE_SIZE = 0;
var stringHashCache = {};
/**
 * @hidden
 */
function hasTrueEquality(val) {
    if (!val) {
        return Option_1.Option.none();
    }
    if (val.equals) {
        return Option_1.Option.of(true);
    }
    switch (val.constructor) {
        case String:
        case Number:
        case Boolean:
            return Option_1.Option.of(true);
    }
    return Option_1.Option.of(false);
}
exports.hasTrueEquality = hasTrueEquality;
;
/**
 * Typescript doesn't infer typeguards for lambdas; it only sees
 * predicates. This type allows you to cast a predicate to a type
 * guard in a handy manner.
 *
 * It comes in handy for discriminated unions with a 'kind' discriminator,
 * for instance:
 *
 * `.filter(typeGuard(p => p.kind === "in_board", {} as InBoard))`
 *
 * Normally you'd have to give both type parameters, but you can use
 * the type witness parameter as shown in that example to skip
 * the first type parameter.
 *
 * Also see [[typeGuard]], [[instanceOf]] and [[typeOf]].
 */
function typeGuard(predicate, typeWitness) {
    return predicate;
}
exports.typeGuard = typeGuard;
/**
 * Curried function returning a type guard telling us if a value
 * is of a specific instance.
 * Can be used when filtering to filter for the type and at the
 * same time change the type of the generics on the container.
 *
 *     Vector.of<any>("bad", new Date('04 Dec 1995 00:12:00 GMT')).filter(instanceOf(Date))
 *     => Vector.of<Date>(new Date('04 Dec 1995 00:12:00 GMT'))
 *
 *     Option.of<any>("test").filter(instanceOf(Date))
 *     => Option.none<Date>()
 *
 *     Option.of<any>(new Date('04 Dec 1995 00:12:00 GMT')).filter(instanceOf(Date))
 *     => Option.of<Date>(new Date('04 Dec 1995 00:12:00 GMT'))
 *
 * Also see [[typeGuard]] and [[typeOf]].
 */
function instanceOf(ctor) {
    // https://github.com/Microsoft/TypeScript/issues/5101#issuecomment-145693151
    return (function (x) { return x instanceof ctor; });
}
exports.instanceOf = instanceOf;
/**
 * Curried function returning a type guard telling us if a value
 * is of a specific type.
 * Can be used when filtering to filter for the type and at the
 * same time change the type of the generics on the container.
 *
 *     Vector.of<any>(1,"a",2,3,"b").filter(typeOf("string"))
 *     => Vector.of<string>("a", "b")
 *
 *     Option.of<any>(1).filter(typeOf("string"))
 *     => Option.none<string>()
 *
 *     Option.of<any>("str").filter(typeOf("string"))
 *     => Option.of<string>("str")
 *
 * Also see [[instanceOf]] and [[typeGuard]].
 */
function typeOf(typ) {
    return (function (x) { return typeof x === typ; });
}
exports.typeOf = typeOf;

},{"./Option":11}],3:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var preludeTsContractViolationCb = function (msg) { throw msg; };
/**
 * Some programmatic errors are only detectable at runtime
 * (for instance trying to setup a <code>HashSet</code> of <code>Option&lt;number[]&gt;</code>: you
 * can't reliably compare a <code>number[]</code> therefore you can't compare
 * an <code>Option&lt;number[]&gt;</code>.. but we can't detect this error at compile-time
 * in typescript). So when we detect them at runtime, prelude.ts throws
 * an exception by default.
 * This function allows you to change that default action
 * (for instance, you could display an error message in the console,
 * or log the error)
 *
 * You can reproduce the issue easily by running for instance:
 *
 *     HashSet.of(Option.of([1]))
 *     => throws
 */
function setContractViolationAction(action) {
    preludeTsContractViolationCb = action;
}
exports.setContractViolationAction = setContractViolationAction;
/**
 * @hidden
 */
function reportContractViolation(msg) {
    preludeTsContractViolationCb(msg);
}
exports.reportContractViolation = reportContractViolation;
/**
 * @hidden
 */
function contractTrueEquality(context) {
    var vals = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        vals[_i - 1] = arguments[_i];
    }
    for (var _a = 0, vals_1 = vals; _a < vals_1.length; _a++) {
        var val = vals_1[_a];
        if (val) {
            if (val.hasTrueEquality && (!val.hasTrueEquality())) {
                reportContractViolation(context + ": element doesn't support true equality: " + SeqHelpers_1.toStringHelper(val));
            }
            if (!Comparison_1.hasTrueEquality(val).getOrThrow()) {
                reportContractViolation(context + ": element doesn't support equality: " + SeqHelpers_1.toStringHelper(val));
            }
            // the first element i find is looking good, aborting
            return;
        }
    }
}
exports.contractTrueEquality = contractTrueEquality;

},{"./Comparison":2,"./SeqHelpers":13}],4:[function(require,module,exports){
"use strict";
/**
 * The [[Either]] type represents an alternative between two value types.
 * A "left" value which is also conceptually tied to a failure,
 * or a "right" value which is conceptually tied to success.
 *
 * The code is organized through the class [[Left]], the class [[Right]],
 * and the type alias [[Either]] (Left or Right).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[EitherStatic]] and are accessed through the global constant Either.
 *
 * Examples:
 *
 *     Either.right<number,number>(5);
 *     Either.left<number,number>(2);
 *     Either.right<number,number>(5).map(x => x*2);
 *
 * Left has the extra [[Left.getLeft]] method that [[Right]] doesn't have.
 * Right has the extra [[Right.get]] method that [[Left]] doesn't have.
 */
exports.__esModule = true;
var Option_1 = require("./Option");
var LinkedList_1 = require("./LinkedList");
var Vector_1 = require("./Vector");
var Comparison_1 = require("./Comparison");
var Contract_1 = require("./Contract");
/**
 * Holds the "static methods" for [[Either]]
 */
var EitherStatic = /** @class */ (function () {
    function EitherStatic() {
    }
    /**
     * Constructs an Either containing a left value which you give.
     */
    EitherStatic.prototype.left = function (val) {
        return new Left(val);
    };
    /**
     * Constructs an Either containing a right value which you give.
     */
    EitherStatic.prototype.right = function (val) {
        return new Right(val);
    };
    /**
     * Turns a list of eithers in an either containing a list of items.
     * Useful in many contexts.
     *
     *     Either.sequence(Vector.of(
     *         Either.right<number,number>(1),
     *         Either.right<number,number>(2)));
     *     => Either.right(Vector.of(1,2))
     *
     * But if a single element is None, everything is discarded:
     *
     *     Either.sequence(Vector.of(
     *           Either.right<number,number>(1),
     *           Either.left<number,number>(2),
     *           Either.left<number,number>(3)));
     *     => Either.left(2)
     */
    EitherStatic.prototype.sequence = function (elts) {
        var r = Vector_1.Vector.empty();
        var iterator = elts[Symbol.iterator]();
        var curItem = iterator.next();
        while (!curItem.done) {
            var v = curItem.value;
            if (v.isLeft()) {
                return v;
            }
            r = r.append(v.get());
            curItem = iterator.next();
        }
        return exports.Either.right(r);
    };
    /**
     * Applicative lifting for Either.
     * Takes a function which operates on basic values, and turns it
     * in a function that operates on eithers of these values ('lifts'
     * the function). The 2 is because it works on functions taking two
     * parameters.
     *
     *     const lifted = Either.liftA2(
     *         (x:number,y:number) => x+y, {} as string);
     *     lifted(
     *         Either.right<string,number>(5),
     *         Either.right<string,number>(6));
     *     => Either.right(11)
     *
     *     const lifted = Either.liftA2(
     *         (x:number,y:number) => x+y, {} as string);
     *     lifted(
     *         Either.right<string,number>(5),
     *         Either.left<string,number>("bad"));
     *     => Either.left("bad")
     *
     * @param R1 the first right type
     * @param R2 the second right type
     * @param L the left type
     * @param V the new right type as returned by the combining function.
     */
    EitherStatic.prototype.liftA2 = function (fn, leftWitness) {
        return function (p1, p2) { return p1.flatMap(function (a1) { return p2.map(function (a2) { return fn(a1, a2); }); }); };
    };
    /**
     * Applicative lifting for Either. 'p' stands for 'properties'.
     *
     * Takes a function which operates on a simple JS object, and turns it
     * in a function that operates on the same JS object type except which each field
     * wrapped in an Either ('lifts' the function).
     * It's an alternative to [[EitherStatic.liftA2]] when the number of parameters
     * is not two.
     *
     *     const fn = (x:{a:number,b:number,c:number}) => x.a+x.b+x.c;
     *     const lifted = Either.liftAp(fn, {} as number);
     *     lifted({a:Either.right<number,number>(5), b:Either.right<number,number>(6), c:Either.right<number,number>(3)});
     *     => Either.right(14)
     *
     *     const lifted = Either.liftAp<number,{a:number,b:number},number>(x => x.a+x.b);
     *     lifted({a:Either.right<number,number>(5), b:Either.left<number,number>(2)});
     *     => Either.left(2)
     *
     * @param L the left type
     * @param A the object property type specifying the parameters for your function
     * @param B the type returned by your function, returned wrapped in an either by liftAp.
     */
    EitherStatic.prototype.liftAp = function (fn, leftWitness) {
        return function (x) {
            var copy = {};
            for (var p in x) {
                if (x[p].isLeft()) {
                    return x[p];
                }
                copy[p] = x[p].getOrThrow();
            }
            return exports.Either.right(fn(copy));
        };
    };
    return EitherStatic;
}());
exports.EitherStatic = EitherStatic;
/**
 * The Either constant allows to call the either "static" methods
 */
exports.Either = new EitherStatic();
/**
 * Represents an [[Either]] containing a left value,
 * conceptually tied to a failure.
 * "static methods" available through [[EitherStatic]]
 * @param L the "left" item type 'failure'
 * @param R the "right" item type 'success'
 */
var Left = /** @class */ (function () {
    function Left(value) {
        this.value = value;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns true since this is a Left
     */
    Left.prototype.isLeft = function () {
        return true;
    };
    /**
     * Returns false since this is a Left
     */
    Left.prototype.isRight = function () {
        return false;
    };
    /**
     * Returns true if this is either is a right and contains the value you give.
     */
    Left.prototype.contains = function (val) {
        return false;
    };
    /**
     * If this either is a right, applies the function you give
     * to its contents and build a new right either, otherwise return this.
     */
    Left.prototype.map = function (fn) {
        return this;
    };
    /**
     * If this either is a right, call the function you give with
     * the contents, and return what the function returns, else
     * returns this.
     * This is the monadic bind.
     */
    Left.prototype.flatMap = function (fn) {
        return this;
    };
    /**
     * If this either is a left, call the function you give with
     * the left value and return a new either left with the result
     * of the function, else return this.
     */
    Left.prototype.mapLeft = function (fn) {
        return new Left(fn(this.value));
    };
    /**
     * Map the either: you give a function to apply to the value,
     * a function in case it's a left, a function in case it's a right.
     */
    Left.prototype.bimap = function (fnL, fnR) {
        return new Left(fnL(this.value));
    };
    /**
     * Combines two eithers. If this either is a right, returns it.
     * If it's a left, returns the other one.
     */
    Left.prototype.orElse = function (other) {
        return other;
    };
    /**
     * Execute a side-effecting function if the either
     * is a right; returns the either.
     */
    Left.prototype.ifRight = function (fn) {
        return this;
    };
    /**
     * Execute a side-effecting function if the either
     * is a left; returns the either.
     */
    Left.prototype.ifLeft = function (fn) {
        fn(this.value);
        return this;
    };
    /**
     * Handle both branches of the either and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for either.
     *
     *     Either.right<string,number>(5).match({
     *         Left:  x => "left " + x,
     *         Right: x => "right " + x
     *     });
     *     => "right 5"
     */
    Left.prototype.match = function (cases) {
        return cases.Left(this.value);
    };
    /**
     * If this either is a right, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Left.prototype.getOrThrow = function (message) {
        throw message || "Left.getOrThrow called!";
    };
    /**
     * If this either is a right, return its value, else return
     * the value you give.
     */
    Left.prototype.getOrElse = function (other) {
        return other;
    };
    /**
     * Get the value contained in this left.
     * NOTE: we know it's there, since this method
     * belongs to Left, not Either.
     */
    Left.prototype.getLeft = function () {
        return this.value;
    };
    /**
     * If this either is a left, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Left.prototype.getLeftOrThrow = function (message) {
        return this.value;
    };
    /**
     * If this either is a left, return its value, else return
     * the value you give.
     */
    Left.prototype.getLeftOrElse = function (other) {
        return this.value;
    };
    /**
     * Convert this either to an option, conceptually dropping
     * the left (failing) value.
     */
    Left.prototype.toOption = function () {
        return Option_1.Option.none();
    };
    /**
     * Convert to a vector. If it's a left, it's the empty
     * vector, if it's a right, it's a one-element vector with
     * the contents of the either.
     */
    Left.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert to a list. If it's a left, it's the empty
     * list, if it's a right, it's a one-element list with
     * the contents of the either.
     */
    Left.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.empty();
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Left.prototype.transform = function (converter) {
        return converter(this);
    };
    Left.prototype.hasTrueEquality = function () {
        return (this.value && this.value.hasTrueEquality) ?
            this.value.hasTrueEquality() :
            Comparison_1.hasTrueEquality(this.value);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Left.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this.value);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Left.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if ((!other) || (!other.isRight) || other.isRight()) {
            return false;
        }
        var leftOther = other;
        Contract_1.contractTrueEquality("Either.equals", this, leftOther);
        return Comparison_1.areEqual(this.value, leftOther.value);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Left.prototype.toString = function () {
        return "Left(" + this.value + ")";
    };
    /**
     * Used by the node REPL to display values.
     */
    Left.prototype.inspect = function () {
        return this.toString();
    };
    return Left;
}());
exports.Left = Left;
/**
 * Represents an [[Either]] containing a success value,
 * conceptually tied to a success.
 * "static methods" available through [[EitherStatic]]
 * @param L the "left" item type 'failure'
 * @param R the "right" item type 'success'
 */
var Right = /** @class */ (function () {
    function Right(value) {
        this.value = value;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns false since this is a Right
     */
    Right.prototype.isLeft = function () {
        return false;
    };
    /**
     * Returns true since this is a Right
     */
    Right.prototype.isRight = function () {
        return true;
    };
    /**
     * Returns true if this is either is a right and contains the value you give.
     */
    Right.prototype.contains = function (val) {
        return Comparison_1.areEqual(this.value, val);
    };
    /**
     * If this either is a right, applies the function you give
     * to its contents and build a new right either, otherwise return this.
     */
    Right.prototype.map = function (fn) {
        return new Right(fn(this.value));
    };
    /**
     * If this either is a right, call the function you give with
     * the contents, and return what the function returns, else
     * returns this.
     * This is the monadic bind.
     */
    Right.prototype.flatMap = function (fn) {
        return fn(this.value);
    };
    /**
     * If this either is a left, call the function you give with
     * the left value and return a new either left with the result
     * of the function, else return this.
     */
    Right.prototype.mapLeft = function (fn) {
        return this;
    };
    /**
     * Map the either: you give a function to apply to the value,
     * a function in case it's a left, a function in case it's a right.
     */
    Right.prototype.bimap = function (fnL, fnR) {
        return new Right(fnR(this.value));
    };
    /**
     * Combines two eithers. If this either is a right, returns it.
     * If it's a left, returns the other one.
     */
    Right.prototype.orElse = function (other) {
        return this;
    };
    /**
     * Execute a side-effecting function if the either
     * is a right; returns the either.
     */
    Right.prototype.ifRight = function (fn) {
        fn(this.value);
        return this;
    };
    /**
     * Execute a side-effecting function if the either
     * is a left; returns the either.
     */
    Right.prototype.ifLeft = function (fn) {
        return this;
    };
    /**
     * Handle both branches of the either and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for either.
     *
     *     Either.right<string,number>(5).match({
     *         Left:  x => "left " + x,
     *         Right: x => "right " + x
     *     });
     *     => "right 5"
     */
    Right.prototype.match = function (cases) {
        return cases.Right(this.value);
    };
    /**
     * Get the value contained in this right.
     * NOTE: we know it's there, since this method
     * belongs to Right, not Either.
     */
    Right.prototype.get = function () {
        return this.value;
    };
    /**
     * If this either is a right, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Right.prototype.getOrThrow = function (message) {
        return this.value;
    };
    /**
     * If this either is a right, return its value, else return
     * the value you give.
     */
    Right.prototype.getOrElse = function (other) {
        return this.value;
    };
    /**
     * If this either is a left, return its value, else throw
     * an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Right.prototype.getLeftOrThrow = function (message) {
        throw message || "Left.getOrThrow called!";
    };
    /**
     * If this either is a left, return its value, else return
     * the value you give.
     */
    Right.prototype.getLeftOrElse = function (other) {
        return other;
    };
    /**
     * Convert this either to an option, conceptually dropping
     * the left (failing) value.
     */
    Right.prototype.toOption = function () {
        return Option_1.Option.of(this.value);
    };
    /**
     * Convert to a vector. If it's a left, it's the empty
     * vector, if it's a right, it's a one-element vector with
     * the contents of the either.
     */
    Right.prototype.toVector = function () {
        return Vector_1.Vector.of(this.value);
    };
    /**
     * Convert to a list. If it's a left, it's the empty
     * list, if it's a right, it's a one-element list with
     * the contents of the either.
     */
    Right.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.of(this.value);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Right.prototype.transform = function (converter) {
        return converter(this);
    };
    Right.prototype.hasTrueEquality = function () {
        return (this.value && this.value.hasTrueEquality) ?
            this.value.hasTrueEquality() :
            Comparison_1.hasTrueEquality(this.value);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Right.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this.value);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Right.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if ((!other) || (!other.isRight) || (!other.isRight())) {
            return false;
        }
        var rightOther = other;
        Contract_1.contractTrueEquality("Either.equals", this, rightOther);
        return Comparison_1.areEqual(this.value, rightOther.value);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Right.prototype.toString = function () {
        return "Right(" + this.value + ")";
    };
    /**
     * Used by the node REPL to display values.
     */
    Right.prototype.inspect = function () {
        return this.toString();
    };
    return Right;
}());
exports.Right = Right;

},{"./Comparison":2,"./Contract":3,"./LinkedList":10,"./Option":11,"./Vector":16}],5:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * Rich functions with helpers such as [[Function1.andThen]],
 * [[Function2.apply1]] and so on.
 *
 * We support functions of arities up to 5. For each arity, we have
 * the interface ([[Function1]], [[Function2]], ...), builders are on functions
 * on [[Function1Static]], [[Function2Static]]... accessible on constants
 * named Function1, Function2,...
 *
 * It also has for instance [[Function1Static.liftOption]], which allows
 * to use functions which are not aware of [[Option]] (for instance _.find())
 * and make them take advantage of Option, or [[Function1Static.liftEither]],
 * which allow to work with [[Either]] instead of exceptions.
 *
 * Examples:
 *
 *     const combined = Function1.of((x:number)=>x+2).andThen(x=>x*3);
 *     combined(6);
 *     => 24
 *
 *     const plus5 = Function2.of((x:number,y:number)=>x+y).apply1(5);
 *     plus5(1);
 *     => 6
 */
var Option_1 = require("./Option");
var Either_1 = require("./Either");
/**
 * This is the type of the Function0 constant, which
 * offers some helper functions to deal
 * with [[Function0]] including
 * the ability to build [[Function0]]
 * from functions using [[Function0Static.of]].
 * It also offers some builtin functions like [[Function0Static.constant]].
 */
var Function0Static = /** @class */ (function () {
    function Function0Static() {
    }
    /**
     * The constant function of one parameter:
     * will always return the value you give, no
     * matter the parameter it's given.
     */
    Function0Static.prototype.constant = function (val) {
        return exports.Function0.of(function () { return val; });
    };
    /**
     * Take a one-parameter function and lift it to become a [[Function1Static]],
     * enabling you to call [[Function1.andThen]] and other such methods on it.
     */
    Function0Static.prototype.of = function (fn) {
        var r = (function () { return fn(); });
        r.andThen = function (fn2) { return exports.Function0.of(function () { return fn2(r()); }); };
        return r;
    };
    /**
     * Take a no-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     const randOpt = Function0.liftOption(Math.random);
     *     randOpt();
     *     => Option.of(0.49884723907769635)
     *
     *     const undef = Function0.liftOption(()=>undefined);
     *     undef();
     *     => Option.none()
     *
     *     const nl = Function0.liftOption(()=>null);
     *     nl();
     *     => Option.of(null)
     *
     *     const throws = Function0.liftOption(()=>{throw "x"});
     *     throws();
     *     => Option.none()
     *
     */
    Function0Static.prototype.liftOption = function (fn) {
        return exports.Function0.of(function () {
            try {
                return Option_1.Option.of(fn());
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a no-parameter partial function (may return null, undefined or throw),
     * and lift it to return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     const randOpt = Function0.liftNullable(Math.random);
     *     randOpt();
     *     => Option.of(0.49884723907769635)
     *
     *     const undef = Function0.liftNullable(()=>undefined);
     *     undef();
     *     => Option.none()
     *
     *     const nl = Function0.liftNullable(()=>null);
     *     nl();
     *     => Option.none()
     *
     *     const throws = Function0.liftNullable(()=>{throw "x"});
     *     throws();
     *     => Option.none()
     *
     */
    Function0Static.prototype.liftNullable = function (fn) {
        return exports.Function0.of(function () {
            try {
                return Option_1.Option.ofNullable(fn());
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a no-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Either]] instead.
     * Note that unlike the [[Function1Static.of]] version, if
     * the function returns undefined, the liftEither version will throw
     * (the liftOption version returns None()).
     *
     *     const eitherRand = Function0.liftEither(Math.random, {} as string);
     *     eitherRand();
     *     => Either.right(0.49884723907769635)
     *
     *     const undef = Function0.liftEither(() => undefined);
     *     undef();
     *     => throws
     *
     *     const throws = Function0.liftEither(() => {throw "x"});
     *     throws();
     *     => Either.left("x")
     */
    Function0Static.prototype.liftEither = function (fn, witness) {
        return exports.Function0.of(function () {
            try {
                var r = fn();
                if (r !== undefined) {
                    return Either_1.Either.right(r);
                }
            }
            catch (err) {
                return Either_1.Either.left(err);
            }
            throw "liftEither got undefined!";
        });
    };
    return Function0Static;
}());
exports.Function0Static = Function0Static;
/**
 * The Function1 constant allows to call the [[Function0]] "static" methods.
 */
exports.Function0 = new Function0Static();
/**
 * This is the type of the Function1 constant, which
 * offers some helper functions to deal
 * with [[Function1]] including
 * the ability to build [[Function1]]
 * from functions using [[Function1Static.of]].
 * It also offers some builtin functions like [[Function1Static.constant]].
 */
var Function1Static = /** @class */ (function () {
    function Function1Static() {
    }
    /**
     * The identity function.
     */
    Function1Static.prototype.id = function () {
        return exports.Function1.of(function (x) { return x; });
    };
    /**
     * The constant function of one parameter:
     * will always return the value you give, no
     * matter the parameter it's given.
     */
    Function1Static.prototype.constant = function (val) {
        return exports.Function1.of(function (x) { return val; });
    };
    /**
     * Take a one-parameter function and lift it to become a [[Function1Static]],
     * enabling you to call [[Function1.andThen]] and other such methods on it.
     */
    Function1Static.prototype.of = function (fn) {
        var r = (function (x) { return fn(x); });
        r.andThen = function (fn2) { return exports.Function1.of(function (x) { return fn2(r(x)); }); };
        r.compose = function (fn2) { return exports.Function1.of(function (x) { return r(fn2(x)); }); };
        return r;
    };
    /**
     * Take a one-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     const add = Function1.liftOption((x:number)=>x+1);
     *     add(1);
     *     => Option.of(2)
     *
     *     const undef = Function1.liftOption((x:number)=>undefined);
     *     undef(1);
     *     => Option.none()
     *
     *     const nl = Function1.liftOption((x:number)=>null);
     *     nl(1);
     *     => Option.some(null)
     *
     *     const throws = Function1.liftOption((x:number)=>{throw "x"});
     *     throws(1);
     *     => Option.none()
     *
     */
    Function1Static.prototype.liftOption = function (fn) {
        return exports.Function1.of(function (x) {
            try {
                return Option_1.Option.of(fn(x));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a one-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     const add = Function1.liftNullable((x:number)=>x+1);
     *     add(1);
     *     => Option.of(2)
     *
     *     const undef = Function1.liftNullable((x:number)=>undefined);
     *     undef(1);
     *     => Option.none()
     *
     *     const nl = Function1.liftNullable((x:number)=>null);
     *     nl(1);
     *     => Option.none()
     *
     *     const throws = Function1.liftNullable((x:number)=>{throw "x"});
     *     throws(1);
     *     => Option.none()
     *
     */
    Function1Static.prototype.liftNullable = function (fn) {
        return exports.Function1.of(function (x) {
            try {
                return Option_1.Option.ofNullable(fn(x));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a one-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Either]] instead.
     * Note that unlike the [[Function1Static.liftOption]] version, if
     * the function returns undefined, the liftEither version will throw
     * (the liftOption version returns None()).
     *
     *     const add1 = Function1.liftEither((x:number) => x+1, {} as string);
     *     add1(1);
     *     => Either.right(2)
     *
     *     const undef = Function1.liftEither((x:number) => undefined);
     *     undef(1);
     *     => throws
     *
     *     const throws = Function1.liftEither((x:number) => {throw "x"});
     *     throws(1);
     *     => Either.left("x")
     */
    Function1Static.prototype.liftEither = function (fn, witness) {
        return exports.Function1.of(function (x) {
            try {
                var r = fn(x);
                if (r !== undefined) {
                    return Either_1.Either.right(r);
                }
            }
            catch (err) {
                return Either_1.Either.left(err);
            }
            throw "liftEither got undefined!";
        });
    };
    return Function1Static;
}());
exports.Function1Static = Function1Static;
/**
 * The Function1 constant allows to call the [[Function1]] "static" methods.
 */
exports.Function1 = new Function1Static();
/**
 * This is the type of the Function2 constant, which
 * offers some helper functions to deal
 * with [[Function2]] including
 * the ability to build [[Function2]]
 * from functions using [[Function2Static.of]].
 * It also offers some builtin functions like [[Function2Static.constant]].
 */
var Function2Static = /** @class */ (function () {
    function Function2Static() {
    }
    /**
     * The constant function of two parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function2Static.prototype.constant = function (val) {
        return exports.Function2.of(function (x, y) { return val; });
    };
    /**
     * Take a two-parameter function and lift it to become a [[Function2]],
     * enabling you to call [[Function2.andThen]] and other such methods on it.
     */
    Function2Static.prototype.of = function (fn) {
        var r = (function (x, y) { return fn(x, y); });
        r.andThen = function (fn2) { return exports.Function2.of(function (x, y) { return fn2(r(x, y)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return r(x, y); }); }); };
        r.tupled = function () { return exports.Function1.of(function (pair) { return r(pair[0], pair[1]); }); };
        r.flipped = function () { return exports.Function2.of(function (x, y) { return r(y, x); }); };
        r.apply1 = function (x) { return exports.Function1.of(function (y) { return r(x, y); }); };
        return r;
    };
    /**
     * Take a two-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     const plus = Function2.liftOption((x:number,y:number)=>x+y);
     *     plus(1,2);
     *     => Option.of(3)
     *
     *     const undef = Function2.liftOption((x:number,y:number)=>undefined);
     *     undef(1,2);
     *     => Option.none()
     *
     *     const nl = Function2.liftOption((x:number,y:number)=>null);
     *     nl(1,2);
     *     => Option.some(null)
     *
     *     const throws = Function2.liftOption((x:number,y:number)=>{throw "x"});
     *     throws(1,2);
     *     => Option.none()
     */
    Function2Static.prototype.liftOption = function (fn) {
        return exports.Function2.of(function (x, y) {
            try {
                return Option_1.Option.of(fn(x, y));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a two-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     const plus = Function2.liftNullable((x:number,y:number)=>x+y);
     *     plus(1,2);
     *     => Option.of(3)
     *
     *     const undef = Function2.liftNullable((x:number,y:number)=>undefined);
     *     undef(1,2);
     *     => Option.none()
     *
     *     const nl = Function2.liftNullable((x:number,y:number)=>null);
     *     nl(1,2);
     *     => Option.none()
     *
     *     const throws = Function2.liftNullable((x:number,y:number)=>{throw "x"});
     *     throws(1,2);
     *     => Option.none()
     */
    Function2Static.prototype.liftNullable = function (fn) {
        return exports.Function2.of(function (x, y) {
            try {
                return Option_1.Option.ofNullable(fn(x, y));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a two-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Either]] instead.
     * Note that unlike the [[Function2Static.liftOption]] version, if
     * the function returns undefined, the liftEither version will throw
     * (the liftOption version returns None()).
     *
     *     const add = Function2.liftEither((x:number,y:number) => x+y, {} as string);
     *     add(1,2);
     *     => Either.right(3)
     *
     *     const undef = Function2.liftEither((x:number,y:number) => undefined);
     *     undef(1,2);
     *     => throws
     *
     *     const throws = Function2.liftEither((x:number,y:number) => {throw "x"});
     *     throws(1,2);
     *     => Either.left("x")
     */
    Function2Static.prototype.liftEither = function (fn, witness) {
        return exports.Function2.of(function (x, y) {
            try {
                var r = fn(x, y);
                if (r !== undefined) {
                    return Either_1.Either.right(r);
                }
            }
            catch (err) {
                return Either_1.Either.left(err);
            }
            throw "liftEither got undefined!";
        });
    };
    return Function2Static;
}());
exports.Function2Static = Function2Static;
/**
 * The Function2 constant allows to call the [[Function2]] "static" methods.
 */
exports.Function2 = new Function2Static();
/**
 * This is the type of the Function3 constant, which
 * offers some helper functions to deal
 * with [[Function3]] including
 * the ability to build [[Function3]]
 * from functions using [[Function3Static.of]].
 * It also offers some builtin functions like [[Function3Static.constant]].
 */
var Function3Static = /** @class */ (function () {
    function Function3Static() {
    }
    /**
     * The constant function of three parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function3Static.prototype.constant = function (val) {
        return exports.Function3.of(function (x, y, z) { return val; });
    };
    /**
     * Take a three-parameter function and lift it to become a [[Function3]],
     * enabling you to call [[Function3.andThen]] and other such methods on it.
     */
    Function3Static.prototype.of = function (fn) {
        var r = (function (x, y, z) { return fn(x, y, z); });
        r.andThen = function (fn2) { return exports.Function3.of(function (x, y, z) { return fn2(r(x, y, z)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return exports.Function1.of(function (z) { return r(x, y, z); }); }); }); };
        r.tupled = function () { return exports.Function1.of(function (tuple) { return r(tuple[0], tuple[1], tuple[2]); }); };
        r.flipped = function () { return exports.Function3.of(function (x, y, z) { return r(z, y, x); }); };
        r.apply1 = function (x) { return exports.Function2.of(function (y, z) { return r(x, y, z); }); };
        r.apply2 = function (x, y) { return exports.Function1.of(function (z) { return r(x, y, z); }); };
        return r;
    };
    /**
     * Take a three-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     const add3 = Function3.liftOption(
     *         (x:number,y:number,z:number)=>x+y+z);
     *     add3(1,2,3);
     *     => Option.of(6)
     *
     *     const undef = Function3.liftOption(
     *         (x:number,y:number,z:number)=>undefined);
     *     undef(1,2,3);
     *     => Option.none()
     *
     *     const nl = Function3.liftOption(
     *         (x:number,y:number,z:number)=>null);
     *     nl(1,2,3);
     *     => Option.some(null)
     *
     *     const throws = Function3.liftOption(
     *         (x:number,y:number,z:number)=>{throw "x"});
     *     throws(1,2,3);
     *     => Option.none()
     */
    Function3Static.prototype.liftOption = function (fn) {
        return exports.Function3.of(function (x, y, z) {
            try {
                return Option_1.Option.of(fn(x, y, z));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a three-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     const add3 = Function3.liftNullable(
     *         (x:number,y:number,z:number)=>x+y+z);
     *     add3(1,2,3);
     *     => Option.of(6)
     *
     *     const undef = Function3.liftNullable(
     *         (x:number,y:number,z:number)=>undefined);
     *     undef(1,2,3);
     *     => Option.none()
     *
     *     const nl = Function3.liftNullable(
     *         (x:number,y:number,z:number)=>undefined);
     *     nl(1,2,3);
     *     => Option.none()
     *
     *     const throws = Function3.liftNullable(
     *         (x:number,y:number,z:number)=>{throw "x"});
     *     throws(1,2,3);
     *     => Option.none()
     */
    Function3Static.prototype.liftNullable = function (fn) {
        return exports.Function3.of(function (x, y, z) {
            try {
                return Option_1.Option.ofNullable(fn(x, y, z));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a three-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Either]] instead.
     * Note that unlike the [[Function3Static.liftOption]] version, if
     * the function returns undefined, the liftEither version will throw
     * (the liftOption version returns None()).
     *
     *     const add3 = Function3.liftEither((x:number,y:number,z:number) => x+y+z, {} as string);
     *     add3(1,2,3);
     *     => Either.right(6)
     *
     *     const undef = Function3.liftEither((x:number,y:number,z:number) => undefined);
     *     undef(1,2,3);
     *     => throws
     *
     *     const throws = Function3.liftEither((x:number,y:number,z:number) => {throw "x"});
     *     throws(1,2,3);
     *     => Either.left("x")
     */
    Function3Static.prototype.liftEither = function (fn, witness) {
        return exports.Function3.of(function (x, y, z) {
            try {
                var r = fn(x, y, z);
                if (r !== undefined) {
                    return Either_1.Either.right(r);
                }
            }
            catch (err) {
                return Either_1.Either.left(err);
            }
            throw "liftEither got undefined!";
        });
    };
    return Function3Static;
}());
exports.Function3Static = Function3Static;
/**
 * The Function3 constant allows to call the [[Function3]] "static" methods.
 */
exports.Function3 = new Function3Static();
/**
 * This is the type of the Function4 constant, which
 * offers some helper functions to deal
 * with [[Function4]] including
 * the ability to build [[Function4]]
 * from functions using [[Function4Static.of]].
 * It also offers some builtin functions like [[Function4Static.constant]].
 */
var Function4Static = /** @class */ (function () {
    function Function4Static() {
    }
    /**
     * The constant function of four parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function4Static.prototype.constant = function (val) {
        return exports.Function4.of(function (x, y, z, a) { return val; });
    };
    /**
     * Take a four-parameter function and lift it to become a [[Function4]],
     * enabling you to call [[Function4.andThen]] and other such methods on it.
     */
    Function4Static.prototype.of = function (fn) {
        var r = (function (x, y, z, a) { return fn(x, y, z, a); });
        r.andThen = function (fn2) { return exports.Function4.of(function (x, y, z, a) { return fn2(r(x, y, z, a)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return exports.Function1.of(function (z) { return exports.Function1.of(function (a) { return r(x, y, z, a); }); }); }); }); };
        r.tupled = function () { return exports.Function1.of(function (tuple) { return r(tuple[0], tuple[1], tuple[2], tuple[3]); }); };
        r.flipped = function () { return exports.Function4.of(function (x, y, z, a) { return r(a, z, y, x); }); };
        r.apply1 = function (x) { return exports.Function3.of(function (y, z, a) { return r(x, y, z, a); }); };
        r.apply2 = function (x, y) { return exports.Function2.of(function (z, a) { return r(x, y, z, a); }); };
        r.apply3 = function (x, y, z) { return exports.Function1.of(function (a) { return r(x, y, z, a); }); };
        return r;
    };
    /**
     * Take a four-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     const add4 = Function4.liftOption(
     *         (x:number,y:number,z:number,a:number)=>x+y+z+a);
     *     add4(1,2,3,4);
     *     => Option.of(10)
     *
     *     const undef = Function4.liftOption(
     *         (x:number,y:number,z:number,a:number)=>undefined);
     *     undef(1,2,3,4);
     *     => Option.none()
     *
     *     const nl = Function4.liftOption(
     *         (x:number,y:number,z:number,a:number)=>null);
     *     nl(1,2,3,4);
     *     => Option.some(null)
     *
     *     const throws = Function4.liftOption(
     *         (x:number,y:number,z:number,a:number)=>{throw "x"});
     *     throws(1,2,3,4);
     *     => Option.none()
     */
    Function4Static.prototype.liftOption = function (fn) {
        return exports.Function4.of(function (x, y, z, a) {
            try {
                return Option_1.Option.of(fn(x, y, z, a));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a four-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     const add4 = Function4.liftNullable(
     *         (x:number,y:number,z:number,a:number)=>x+y+z+a);
     *     add4(1,2,3,4);
     *     => Option.of(10)
     *
     *     const undef = Function4.liftNullable(
     *         (x:number,y:number,z:number,a:number)=>undefined);
     *     undef(1,2,3,4);
     *     => Option.none()
     *
     *     const nl = Function4.liftNullable(
     *         (x:number,y:number,z:number,a:number)=>null);
     *     nl(1,2,3,4);
     *     => Option.none()
     *
     *     const throws = Function4.liftNullable(
     *         (x:number,y:number,z:number,a:number)=>{throw "x"});
     *     throws(1,2,3,4);
     *     => Option.none()
     */
    Function4Static.prototype.liftNullable = function (fn) {
        return exports.Function4.of(function (x, y, z, a) {
            try {
                return Option_1.Option.ofNullable(fn(x, y, z, a));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a four-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Either]] instead.
     * Note that unlike the [[Function4Static.liftOption]] version, if
     * the function returns undefined, the liftEither version will throw
     * (the liftOption version returns None()).
     *
     *     const add4 = Function4.liftEither((x:number,y:number,z:number,a:number) => x+y+z+a, {} as string);
     *     add4(1,2,3,4);
     *     => Either.right(10)
     *
     *     const undef = Function4.liftEither((x:number,y:number,z:number,a:number) => undefined);
     *     undef(1,2,3,4);
     *     => throws
     *
     *     const throws = Function4.liftEither((x:number,y:number,z:number,a:number) => {throw "x"});
     *     throws(1,2,3,4);
     *     => Either.left("x")
     */
    Function4Static.prototype.liftEither = function (fn, witness) {
        return exports.Function4.of(function (x, y, z, a) {
            try {
                var r = fn(x, y, z, a);
                if (r !== undefined) {
                    return Either_1.Either.right(r);
                }
            }
            catch (err) {
                return Either_1.Either.left(err);
            }
            throw "liftEither got undefined!";
        });
    };
    return Function4Static;
}());
exports.Function4Static = Function4Static;
;
/**
 * The Function4 constant allows to call the [[Function4]] "static" methods.
 */
exports.Function4 = new Function4Static();
/**
 * This is the type of the Function5 constant, which
 * offers some helper functions to deal
 * with [[Function5]] including
 * the ability to build [[Function5]]
 * from functions using [[Function5Static.of]].
 * It also offers some builtin functions like [[Function5Static.constant]].
 */
var Function5Static = /** @class */ (function () {
    function Function5Static() {
    }
    /**
     * The constant function of five parameters:
     * will always return the value you give, no
     * matter the parameters it's given.
     */
    Function5Static.prototype.constant = function (val) {
        return exports.Function5.of(function (x, y, z, a, b) { return val; });
    };
    /**
     * Take a five-parameter function and lift it to become a [[Function5]],
     * enabling you to call [[Function5.andThen]] and other such methods on it.
     */
    Function5Static.prototype.of = function (fn) {
        var r = (function (x, y, z, a, b) { return fn(x, y, z, a, b); });
        r.andThen = function (fn2) { return exports.Function5.of(function (x, y, z, a, b) { return fn2(r(x, y, z, a, b)); }); };
        r.curried = function () { return exports.Function1.of(function (x) { return exports.Function1.of(function (y) { return exports.Function1.of(function (z) { return exports.Function1.of(function (a) { return exports.Function1.of(function (b) { return r(x, y, z, a, b); }); }); }); }); }); };
        r.tupled = function () { return exports.Function1.of(function (tuple) { return r(tuple[0], tuple[1], tuple[2], tuple[3], tuple[4]); }); };
        r.flipped = function () { return exports.Function5.of(function (x, y, z, a, b) { return r(b, a, z, y, x); }); };
        r.apply1 = function (x) { return exports.Function4.of(function (y, z, a, b) { return r(x, y, z, a, b); }); };
        r.apply2 = function (x, y) { return exports.Function3.of(function (z, a, b) { return r(x, y, z, a, b); }); };
        r.apply3 = function (x, y, z) { return exports.Function2.of(function (a, b) { return r(x, y, z, a, b); }); };
        r.apply4 = function (x, y, z, a) { return exports.Function1.of(function (b) { return r(x, y, z, a, b); }); };
        return r;
    };
    /**
     * Take a five-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * undefined becomes a [[None]], everything else a [[Some]]
     *
     *     const add5 = Function5.liftOption(
     *         (x:number,y:number,z:number,a:number,b:number)=>x+y+z+a+b);
     *     add5(1,2,3,4,5);
     *     => Option.of(15)
     *
     *     const undef = Function5.liftOption(
     *         (x:number,y:number,z:number,a:number,b:number)=>undefined);
     *     undef(1,2,3,4,5);
     *     => Option.none()
     *
     *     const nl = Function5.liftOption(
     *         (x:number,y:number,z:number,a:number,b:number)=>null);
     *     nl(1,2,3,4,5);
     *     => Option.some(null)
     *
     *     const throws = Function5.liftOption(
     *         (x:number,y:number,z:number,a:number,b:number)=>{throw "x"});
     *     throws(1,2,3,4,5);
     *     => Option.none()
     */
    Function5Static.prototype.liftOption = function (fn) {
        return exports.Function5.of(function (x, y, z, a, b) {
            try {
                return Option_1.Option.of(fn(x, y, z, a, b));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a five-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Option]] instead.
     * null and undefined become a [[None]], everything else a [[Some]]
     *
     *     const add5 = Function5.liftNullable(
     *         (x:number,y:number,z:number,a:number,b:number)=>x+y+z+a+b);
     *     add5(1,2,3,4,5);
     *     => Option.of(15)
     *
     *     const undef = Function5.liftNullable(
     *         (x:number,y:number,z:number,a:number,b:number)=>undefined);
     *     undef(1,2,3,4,5);
     *     => Option.none()
     *
     *     const nl = Function5.liftNullable(
     *         (x:number,y:number,z:number,a:number,b:number)=>null);
     *     nl(1,2,3,4,5);
     *     => Option.none()
     *
     *     const throws = Function5.liftNullable(
     *         (x:number,y:number,z:number,a:number,b:number)=>{throw "x"});
     *     throws(1,2,3,4,5);
     *     => Option.none()
     */
    Function5Static.prototype.liftNullable = function (fn) {
        return exports.Function5.of(function (x, y, z, a, b) {
            try {
                return Option_1.Option.ofNullable(fn(x, y, z, a, b));
            }
            catch (_a) {
                return Option_1.Option.none();
            }
        });
    };
    /**
     * Take a five-parameter partial function (may return undefined or throw),
     * and lift it to return an [[Either]] instead.
     * Note that unlike the [[Function5Static.liftOption]] version, if
     * the function returns undefined, the liftEither version will throw
     * (the liftOption version returns None()).
     *
     *     const add5 = Function5.liftEither(
     *         (x:number,y:number,z:number,a:number,b:number) => x+y+z+a+b, {} as string);
     *     add5(1,2,3,4,5);
     *     => Either.right(15)
     *
     *     const undef = Function5.liftEither(
     *         (x:number,y:number,z:number,a:number,b:number) => undefined);
     *     undef(1,2,3,4,5);
     *     => throws
     *
     *     const throws = Function5.liftEither(
     *         (x:number,y:number,z:number,a:number,b:number) => {throw "x"});
     *     throws(1,2,3,4,5);
     *     => Either.left("x")
     */
    Function5Static.prototype.liftEither = function (fn, witness) {
        return exports.Function5.of(function (x, y, z, a, b) {
            try {
                var r = fn(x, y, z, a, b);
                if (r !== undefined) {
                    return Either_1.Either.right(r);
                }
            }
            catch (err) {
                return Either_1.Either.left(err);
            }
            throw "liftEither got undefined!";
        });
    };
    return Function5Static;
}());
exports.Function5Static = Function5Static;
/**
 * The Function5 constant allows to call the [[Function5]] "static" methods.
 */
exports.Function5 = new Function5Static();

},{"./Either":4,"./Option":11}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var Contract_1 = require("./Contract");
var Option_1 = require("./Option");
var HashSet_1 = require("./HashSet");
var Vector_1 = require("./Vector");
var LinkedList_1 = require("./LinkedList");
var SeqHelpers = require("./SeqHelpers");
var hamt = require("hamt_plus");
// HashMap could extend Collection, conceptually. But I'm
// not super happy of having the callbacks get a pair, for instance
// 'HashMap.filter' takes two parameters in the current HashMap;
// if HashMap did implement Collection, it would have to take a k,v
// pair. There's also another trick with 'contains'. The Collection signature
// says T&WithEquality, but here we get [K&WithEquality,V&WithEquality],
// but arrays don't have equality so that doesn't type-check :-(
/**
 * A dictionary, mapping keys to values.
 * @param K the key type
 * @param V the value type
 */
var HashMap = /** @class */ (function () {
    /**
     * @hidden
     */
    function HashMap(hamt) {
        this.hamt = hamt;
    }
    /**
     * The empty map.
     * @param K the key type
     * @param V the value type
     */
    HashMap.empty = function () {
        return emptyHashMap;
    };
    /**
     * Build a HashMap from key-value pairs.
     *
     *     HashMap.of([1,"a"],[2,"b"])
     *
     */
    HashMap.of = function () {
        var entries = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            entries[_i] = arguments[_i];
        }
        return HashMap.ofIterable(entries);
    };
    /**
     * Build a HashMap from an iterable containing key-value pairs.
     *
     *    HashMap.ofIterable(Vector.of<[number,string]>([1,"a"],[2,"b"]));
     */
    HashMap.ofIterable = function (entries) {
        // remember we must set up the hamt with the custom equality
        var iterator = entries[Symbol.iterator]();
        var curItem = iterator.next();
        if (curItem.done) {
            return new EmptyHashMap();
        }
        // emptyhashmap.put sets up the custom equality+hashcode
        var startH = (new EmptyHashMap()).put(curItem.value[0], curItem.value[1]).hamt;
        curItem = iterator.next();
        return new HashMap(startH.mutate(function (h) {
            while (!curItem.done) {
                h.set(curItem.value[0], curItem.value[1]);
                curItem = iterator.next();
            }
        }));
    };
    /**
     * Build a HashMap from a javascript object literal representing
     * a dictionary. Note that the key type must always be string,
     * as that's the way it works in javascript.
     * Also note that entries with undefined values will be stripped
     * from the map.
     *
     *     HashMap.ofObjectDictionary<number>({a:1,b:2})
     *     => HashMap.of(["a",1],["b",2])
     */
    HashMap.ofObjectDictionary = function (object) {
        // no need to bother with the proper equals & hashcode
        // as I know the key type supports ===
        var h = hamt.make().beginMutation();
        for (var property in object) {
            // the reason we strip entries with undefined values on
            // import from object dictionaries are: sanity, and also
            // partial object definitions like {[TKey in MyEnum]?:number}
            // where typescript sees the value type as 'number|undefined'
            // (there is a test covering that)
            if (object.hasOwnProperty(property) &&
                (typeof object[property] !== "undefined")) {
                h.set(property, object[property]);
            }
        }
        return new HashMap(h.endMutation());
    };
    /**
     * Get the value for the key you give, if the key is present.
     */
    HashMap.prototype.get = function (k) {
        return Option_1.Option.of(this.hamt.get(k));
    };
    /**
     * Implementation of the Iterator interface.
     */
    HashMap.prototype[Symbol.iterator] = function () {
        return this.hamt.entries();
    };
    /**
     * @hidden
     */
    HashMap.prototype.hasTrueEquality = function () {
        // for true equality, need both key & value to have true
        // equality. but i can't check when they're in an array,
        // as array doesn't have true equality => extract them
        // and check them separately.
        return Option_1.Option.of(this.hamt.entries().next().value)
            .map(function (x) { return x[0]; }).hasTrueEquality() &&
            Option_1.Option.of(this.hamt.entries().next().value)
                .map(function (x) { return x[1]; }).hasTrueEquality();
    };
    /**
     * Add a new entry in the map. If there was entry with the same
     * key, it will be overwritten.
     * @param k the key
     * @param v the value
     */
    HashMap.prototype.put = function (k, v) {
        return new HashMap(this.hamt.set(k, v));
    };
    /**
     * Return a new map with the key you give removed.
     */
    HashMap.prototype.remove = function (k) {
        return new HashMap(this.hamt.remove(k));
    };
    /**
     * Add a new entry in the map; in case there was already an
     * entry with the same key, the merge function will be invoked
     * with the old and the new value to produce the value to take
     * into account.
     * @param k the key
     * @param v the value
     * @param merge a function to merge old and new values in case of conflict.
     */
    HashMap.prototype.putWithMerge = function (k, v, merge) {
        return new HashMap(this.hamt.modify(k, function (curV) {
            if (curV === undefined) {
                return v;
            }
            return merge(curV, v);
        }));
    };
    /**
     * number of items in the map
     */
    HashMap.prototype.length = function () {
        return this.hamt.size;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    HashMap.prototype.single = function () {
        return this.hamt.size === 1
            ? Option_1.Option.of(this.hamt.entries().next().value)
            : Option_1.Option.none();
    };
    /**
     * true if the map is empty, false otherwise.
     */
    HashMap.prototype.isEmpty = function () {
        return this.hamt.size === 0;
    };
    /**
     * Get a Set containing all the keys in the map
     */
    HashMap.prototype.keySet = function () {
        return HashSet_1.HashSet.ofIterable(this.hamt.keys());
    };
    /**
     * Get an iterable containing all the values in the map
     * (can't return a set as we don't constrain map values
     * to have equality in the generics type)
     */
    HashMap.prototype.valueIterable = function () {
        return this.hamt.values();
    };
    /**
     * Create a new map combining the entries of this map, and
     * the other map you give. In case an entry from this map
     * and the other map have the same key, the merge function
     * will be invoked to get a combined value.
     * @param other another map to merge with this one
     * @param merge a merge function to combine two values
     *        in case two entries share the same key.
     */
    HashMap.prototype.mergeWith = function (elts, merge) {
        var iterator = elts[Symbol.iterator]();
        var map = this;
        var curItem = iterator.next();
        while (!curItem.done) {
            map = map.putWithMerge(curItem.value[0], curItem.value[1], merge);
            curItem = iterator.next();
        }
        return map;
    };
    /**
     * Return a new map where each entry was transformed
     * by the mapper function you give. You return key,value
     * as pairs.
     */
    HashMap.prototype.map = function (fn) {
        return this.hamt.fold(function (acc, value, key) {
            var _a = fn(key, value), newk = _a[0], newv = _a[1];
            return acc.put(newk, newv);
        }, HashMap.empty());
    };
    /**
     * Return a new map where keys are the same as in this one,
     * but values are transformed
     * by the mapper function you give. You return key,value
     * as pairs.
     */
    HashMap.prototype.mapValues = function (fn) {
        return this.hamt.fold(function (acc, value, key) {
            return acc.put(key, fn(value));
        }, HashMap.empty());
    };
    /**
     * Calls the function you give for each item in the map,
     * your function returns a map, all the maps are
     * merged.
     */
    HashMap.prototype.flatMap = function (fn) {
        return this.foldLeft(HashMap.empty(), function (soFar, cur) { return soFar.mergeWith(fn(cur[0], cur[1]), function (a, b) { return b; }); });
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    HashMap.prototype.allMatch = function (predicate) {
        var iterator = this.hamt.entries();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (!predicate(curItem.value[0], curItem.value[1])) {
                return false;
            }
            curItem = iterator.next();
        }
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    HashMap.prototype.anyMatch = function (predicate) {
        var iterator = this.hamt.entries();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value[0], curItem.value[1])) {
                return true;
            }
            curItem = iterator.next();
        }
        return false;
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    HashMap.prototype.contains = function (val) {
        return Comparison_1.areEqual(this.hamt.get(val[0]), val[1]);
    };
    /**
     * Returns true if there is item with that key in the collection,
     * false otherwise.
     *
     *     HashMap.of<number,string>([1,"a"],[2,"b"]).containsKey(1);
     *     => true
     *
     *     HashMap.of<number,string>([1,"a"],[2,"b"]).containsKey(3);
     *     => false
     */
    HashMap.prototype.containsKey = function (key) {
        return this.hamt.has(key);
    };
    /**
     * Call a predicate for each element in the collection,
     * build a new collection holding only the elements
     * for which the predicate returned true.
     */
    HashMap.prototype.filter = function (predicate) {
        var _this = this;
        return new HashMap(hamt.make({ hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq }).mutate(function (h) {
            var iterator = _this.hamt.entries();
            var curItem = iterator.next();
            while (!curItem.done) {
                if (predicate(curItem.value[0], curItem.value[1])) {
                    h.set(curItem.value[0], curItem.value[1]);
                }
                curItem = iterator.next();
            }
        }));
    };
    HashMap.prototype.filterKeys = function (predicate) {
        return this.filter(function (k, v) { return predicate(k); });
    };
    HashMap.prototype.filterValues = function (predicate) {
        return this.filter(function (k, v) { return predicate(v); });
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     HashMap.of<number,string>([1,"a"],[2,"b"],[3,"c"])
     *      .fold([0,""], ([a,b],[c,d])=>[a+c, b>d?b:d])
     *     => [6,"c"]
     */
    HashMap.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashMap.of([1,"a"], [2,"bb"], [3,"ccc"])
     *     .foldLeft(0, (soFar,[item,val])=>soFar+val.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    HashMap.prototype.foldLeft = function (zero, fn) {
        return this.hamt.fold(function (acc, v, k) {
            return fn(acc, [k, v]);
        }, zero);
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashMap.of([1,"a"], [2,"bb"], [3,"ccc"])
     *     .foldRight(0, ([item,value],soFar)=>soFar+value.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    HashMap.prototype.foldRight = function (zero, fn) {
        return this.foldLeft(zero, function (cur, soFar) { return fn(soFar, cur); });
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    HashMap.prototype.reduce = function (combine) {
        // not really glorious with any...
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Convert to array.
     */
    HashMap.prototype.toArray = function () {
        return this.hamt.fold(function (acc, value, key) { acc.push([key, value]); return acc; }, []);
    };
    /**
     * Convert this map to a vector of key,value pairs.
     * Note that Map is already an iterable of key,value pairs!
     */
    HashMap.prototype.toVector = function () {
        return this.hamt.fold(function (acc, value, key) {
            return acc.append([key, value]);
        }, Vector_1.Vector.empty());
    };
    /**
     * Convert this map to a list of key,value pairs.
     * Note that Map is already an iterable of key,value pairs!
     */
    HashMap.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this);
    };
    /**
     * Convert to a javascript object dictionary
     * You must provide a function to convert the
     * key to a string.
     *
     *     HashMap.of<string,number>(["a",1],["b",2])
     *         .toObjectDictionary(x=>x);
     *     => {a:1,b:2}
     */
    HashMap.prototype.toObjectDictionary = function (keyConvert) {
        return this.foldLeft({}, function (soFar, cur) {
            soFar[keyConvert(cur[0])] = cur[1];
            return soFar;
        });
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    HashMap.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    HashMap.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other.valueIterable) {
            return false;
        }
        Contract_1.contractTrueEquality("HashMap.equals", this, other);
        var sz = this.hamt.size;
        if (other.length() === 0 && sz === 0) {
            // we could get that i'm not the empty map
            // but my size is zero, after some filtering and such.
            return true;
        }
        if (sz !== other.length()) {
            return false;
        }
        var keys = Array.from(this.hamt.keys());
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var k = keys_1[_i];
            var myVal = this.hamt.get(k);
            var hisVal = other.get(k).getOrUndefined();
            if (myVal === undefined || hisVal === undefined) {
                return false;
            }
            if (!Comparison_1.areEqual(myVal, hisVal)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    HashMap.prototype.hashCode = function () {
        return this.hamt.fold(function (acc, value, key) {
            return Comparison_1.getHashCode(key) + Comparison_1.getHashCode(value);
        }, 0);
    };
    /*
     * Get a human-friendly string representation of that value.
     */
    HashMap.prototype.toString = function () {
        return "HashMap(" +
            this.hamt.fold(function (acc, value, key) {
                acc.push(SeqHelpers_1.toStringHelper(key, { quoteStrings: false }) +
                    ": " + SeqHelpers_1.toStringHelper(value));
                return acc;
            }, [])
                .join(", ") + ")";
    };
    HashMap.prototype.inspect = function () {
        return this.toString();
    };
    return HashMap;
}());
exports.HashMap = HashMap;
// we need to override the empty hashmap
// because i don't know how to get the hash & keyset
// functions for the keys without a key value to get
// the functions from
var EmptyHashMap = /** @class */ (function (_super) {
    __extends(EmptyHashMap, _super);
    function EmptyHashMap() {
        return _super.call(this, {}) || this;
    }
    EmptyHashMap.prototype.get = function (k) {
        return Option_1.none;
    };
    EmptyHashMap.prototype[Symbol.iterator] = function () {
        return { next: function () { return ({ done: true, value: undefined }); } };
    };
    EmptyHashMap.prototype.put = function (k, v) {
        Contract_1.contractTrueEquality("Error building a HashMap", k);
        if (Comparison_1.hasEquals(k)) {
            return new HashMap(hamt.make({
                hash: function (v) { return v.hashCode(); },
                keyEq: function (a, b) { return a.equals(b); }
            }).set(k, v));
        }
        return new HashMap(hamt.make().set(k, v));
    };
    EmptyHashMap.prototype.remove = function (k) {
        return this;
    };
    EmptyHashMap.prototype.hasTrueEquality = function () {
        return true;
    };
    EmptyHashMap.prototype.putWithMerge = function (k, v, merge) {
        return this.put(k, v);
    };
    EmptyHashMap.prototype.length = function () {
        return 0;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    EmptyHashMap.prototype.single = function () {
        return Option_1.Option.none();
    };
    EmptyHashMap.prototype.isEmpty = function () {
        return true;
    };
    EmptyHashMap.prototype.keySet = function () {
        return HashSet_1.HashSet.empty();
    };
    EmptyHashMap.prototype.valueIterable = function () {
        return _a = {},
            _a[Symbol.iterator] = function () {
                return {
                    next: function () {
                        return {
                            done: true,
                            value: undefined
                        };
                    }
                };
            },
            _a;
        var _a;
    };
    EmptyHashMap.prototype.mergeWith = function (other, merge) {
        return HashMap.ofIterable(other);
    };
    EmptyHashMap.prototype.map = function (fn) {
        return HashMap.empty();
    };
    EmptyHashMap.prototype.mapValues = function (fn) {
        return HashMap.empty();
    };
    EmptyHashMap.prototype.allMatch = function (predicate) {
        return true;
    };
    EmptyHashMap.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyHashMap.prototype.contains = function (val) {
        return false;
    };
    EmptyHashMap.prototype.filter = function (predicate) {
        return this;
    };
    EmptyHashMap.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
    EmptyHashMap.prototype.toArray = function () {
        return [];
    };
    EmptyHashMap.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    EmptyHashMap.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.empty();
    };
    EmptyHashMap.prototype.equals = function (other) {
        if (!other || !other.valueIterable) {
            return false;
        }
        return other === emptyHashMap || other.length() === 0;
    };
    EmptyHashMap.prototype.hashCode = function () {
        return 0;
    };
    EmptyHashMap.prototype.toString = function () {
        return "HashMap()";
    };
    return EmptyHashMap;
}(HashMap));
var emptyHashMap = new EmptyHashMap();

},{"./Comparison":2,"./Contract":3,"./HashSet":7,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Vector":16,"hamt_plus":18}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var ISet_1 = require("./ISet");
var Vector_1 = require("./Vector");
var HashMap_1 = require("./HashMap");
var LinkedList_1 = require("./LinkedList");
var Option_1 = require("./Option");
var Comparison_1 = require("./Comparison");
var SeqHelpers = require("./SeqHelpers");
var Contract_1 = require("./Contract");
var hamt = require("hamt_plus");
/**
 * An unordered collection of values, where no two values
 * may be equal. A value can only be present once.
 * @param T the item type
 */
var HashSet = /** @class */ (function () {
    /**
     * @hidden
     */
    function HashSet(hamt) {
        this.hamt = hamt;
    }
    /**
     * The empty hashset.
     * @param T the item type
     */
    HashSet.empty = function () {
        return emptyHashSet;
    };
    /**
     * Build a hashset from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    HashSet.ofIterable = function (elts) {
        return new EmptyHashSet().addAll(elts);
    };
    /**
     * Build a hashset from a series of items (any number, as parameters)
     * @param T the item type
     */
    HashSet.of = function () {
        var arr = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arr[_i] = arguments[_i];
        }
        return HashSet.ofIterable(arr);
    };
    /**
     * Implementation of the Iterator interface.
     */
    HashSet.prototype[Symbol.iterator] = function () {
        return this.hamt.keys();
    };
    /**
     * Add an element to this set.
     */
    HashSet.prototype.add = function (elt) {
        return new HashSet(this.hamt.set(elt, elt));
    };
    HashSet.prototype.addAllArray = function (elts) {
        return new HashSet(this.hamt.mutate(function (h) {
            if (elts.length > 0) {
                Contract_1.contractTrueEquality("Error building a HashSet", elts[0]);
            }
            for (var _i = 0, elts_1 = elts; _i < elts_1.length; _i++) {
                var val = elts_1[_i];
                h.set(val, val);
            }
        }));
    };
    /**
     * Add multiple elements to this set.
     */
    HashSet.prototype.addAll = function (elts) {
        if (Array.isArray(elts)) {
            return this.addAllArray(elts);
        }
        return new HashSet(this.hamt.mutate(function (h) {
            var checkedEq = false;
            var iterator = elts[Symbol.iterator]();
            var curItem = iterator.next();
            if (!curItem.done && curItem.value && !checkedEq) {
                Contract_1.contractTrueEquality("Error building a HashSet", curItem.value);
                checkedEq = true;
            }
            while (!curItem.done) {
                h.set(curItem.value, curItem.value);
                curItem = iterator.next();
            }
        }));
    };
    /**
     * Returns true if the element you give is present in
     * the set, false otherwise.
     */
    HashSet.prototype.contains = function (elt) {
        return this.hamt.has(elt);
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     * The resulting set may be smaller than the source.
     */
    HashSet.prototype.map = function (mapper) {
        return this.hamt.fold(function (acc, value, key) {
            return acc.add(mapper(value));
        }, HashSet.empty());
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     */
    HashSet.prototype.mapOption = function (mapper) {
        return this.hamt.fold(function (acc, value, key) {
            var val = mapper(value);
            return val.isSome() ? acc.add(val.get()) : acc;
        }, HashSet.empty());
    };
    /**
     * Calls the function you give for each item in the set,
     * your function returns a set, all the sets are
     * merged.
     */
    HashSet.prototype.flatMap = function (mapper) {
        return this.foldLeft(HashSet.empty(), function (soFar, cur) { return soFar.addAll(mapper(cur)); });
    };
    HashSet.prototype.filter = function (predicate) {
        var _this = this;
        return new HashSet(hamt.make({ hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq }).mutate(function (h) {
            var iterator = _this.hamt.values();
            var curItem = iterator.next();
            while (!curItem.done) {
                if (predicate(curItem.value)) {
                    h.set(curItem.value, curItem.value);
                }
                curItem = iterator.next();
            }
        }));
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     HashSet.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    HashSet.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashSet.of("a", "bb", "ccc").foldLeft(0, (soFar,item) => soFar+item.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    HashSet.prototype.foldLeft = function (zero, fn) {
        return this.hamt.fold(function (acc, v, k) {
            return fn(acc, v);
        }, zero);
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     * No guarantees for the order of items in a hashset!
     *
     * Example:
     *
     *     HashSet.of("a", "bb", "ccc").foldRight(0, (item,soFar) => soFar+item.length);
     *     => 6
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    HashSet.prototype.foldRight = function (zero, fn) {
        return this.foldLeft(zero, function (cur, soFar) { return fn(soFar, cur); });
    };
    /**
     * Converts this set to an array. Since a Set is not ordered
     * and since this method returns a JS array, it can be awkward
     * to get an array sorted in the way you'd like. So you can pass
     * an optional sorting function too.
     *
     *     HashSet.of(1,2,3).toArray().sort()
     *     => [1,2,3]
     *
     *     HashSet.of(1,2,3).toArray({sortOn:x=>x})
     *     => [1,2,3]
     *
     *     HashSet.of(1,2,3).toArray({sortBy:(x,y)=>x-y})
     *     => [1,2,3]
     */
    HashSet.prototype.toArray = function (sort) {
        if (!sort) {
            return Array.from(this.hamt.keys());
        }
        if (ISet_1.isSortOnSpec(sort)) {
            return Vector_1.Vector.ofIterable(this.hamt.keys())
                .sortOn(sort.sortOn)
                .toArray();
        }
        return Array.from(this.hamt.keys()).sort(sort.sortBy);
    };
    /**
     * Converts this set to an vector
     */
    HashSet.prototype.toVector = function () {
        return Vector_1.Vector.ofIterable(this.hamt.keys());
    };
    /**
     * Converts this set to an list
     */
    HashSet.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this.hamt.keys());
    };
    /**
     * Returns the number of elements in the set.
     */
    HashSet.prototype.length = function () {
        return this.hamt.size;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    HashSet.prototype.single = function () {
        return this.hamt.size === 1
            ? Option_1.Option.of(this.hamt.keys().next().value)
            : Option_1.Option.none();
    };
    /**
     * true if the set is empty, false otherwise.
     */
    HashSet.prototype.isEmpty = function () {
        return this.hamt.size === 0;
    };
    /**
     * Returns a new Set containing the difference
     * between this set and the other Set passed as parameter.
     * also see [[HashSet.intersect]]
     */
    HashSet.prototype.diff = function (elts) {
        return new HashSet(this.hamt.fold(function (acc, v, k) {
            return elts.contains(k) ? acc : acc.set(k, k);
        }, hamt.empty));
    };
    /**
     * Returns a new Set containing the intersection
     * of this set and the other Set passed as parameter
     * (the elements which are common to both sets)
     * also see [[HashSet.diff]]
     */
    HashSet.prototype.intersect = function (other) {
        return new HashSet(this.hamt.fold(function (acc, v, k) {
            return other.contains(k) ? acc.set(k, k) : acc;
        }, hamt.empty));
    };
    HashSet.prototype.isSubsetOf = function (other) {
        return this.allMatch(function (x) { return other.contains(x); });
    };
    /**
     * Returns a new set with the element you give removed
     * if it was present in the set.
     */
    HashSet.prototype.remove = function (elt) {
        return new HashSet(this.hamt.remove(elt));
    };
    /**
     * Returns a new set with all the elements of the current
     * Set, minus the elements of the iterable you give as a parameter.
     * If you call this function with a HashSet as parameter,
     * rather call 'diff', as it'll be faster.
     */
    HashSet.prototype.removeAll = function (elts) {
        return this.diff(HashSet.ofIterable(elts));
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    HashSet.prototype.allMatch = function (predicate) {
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (!predicate(curItem.value)) {
                return false;
            }
            curItem = iterator.next();
        }
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    HashSet.prototype.anyMatch = function (predicate) {
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value)) {
                return true;
            }
            curItem = iterator.next();
        }
        return false;
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[HashSet.arrangeBy]]
     */
    HashSet.prototype.groupBy = function (classifier) {
        var _this = this;
        // make a singleton set with the same equality as this
        var singletonHamtSet = function (v) { return hamt.make({
            hash: _this.hamt._config.hash, keyEq: _this.hamt._config.keyEq
        }).set(v, v); };
        // merge two mutable hamt sets, but I know the second has only 1 elt
        var mergeSets = function (v1, v2) {
            var k = v2.keys().next().value;
            v1.set(k, k);
            return v1;
        };
        return this.hamt.fold(
        // fold operation: combine a new value from the set with the accumulator
        function (acc, v, k) {
            return acc.putWithMerge(classifier(v), singletonHamtSet(v).beginMutation(), mergeSets);
        }, 
        // fold accumulator: the empty hashmap
        HashMap_1.HashMap.empty())
            .mapValues(function (h) { return new HashSet(h.endMutation()); });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[HashSet.groupBy]]
     */
    HashSet.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Returns a pair of two sets; the first one
     * will only contain the items from this sets for
     * which the predicate you give returns true, the second
     * will only contain the items from this collection where
     * the predicate returns false.
     *
     *     HashSet.of(1,2,3,4).partition(x => x%2===0)
     *     => [HashSet.of(2,4), HashSet.of(1,3)]
     */
    HashSet.prototype.partition = function (predicate) {
        var r1 = hamt.make({
            hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq
        }).beginMutation();
        var r2 = hamt.make({
            hash: this.hamt._config.hash, keyEq: this.hamt._config.keyEq
        }).beginMutation();
        var iterator = this.hamt.values();
        var curItem = iterator.next();
        while (!curItem.done) {
            if (predicate(curItem.value)) {
                r1.set(curItem.value, curItem.value);
            }
            else {
                r2.set(curItem.value, curItem.value);
            }
            curItem = iterator.next();
        }
        return [new HashSet(r1), new HashSet(r2)];
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    HashSet.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.minOn]]
     */
    HashSet.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.minBy]]
     */
    HashSet.prototype.minOn = function (getNumber) {
        return SeqHelpers.minOn(this, getNumber);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.maxOn]]
     */
    HashSet.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[HashSet.maxBy]]
     */
    HashSet.prototype.maxOn = function (getNumber) {
        return SeqHelpers.maxOn(this, getNumber);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     */
    HashSet.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    HashSet.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    HashSet.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        var sz = this.hamt.size;
        if (other === emptyHashSet && sz === 0) {
            // we could get that i'm not the empty map
            // but my size is zero, after some filtering and such.
            return true;
        }
        if (!other || !other.hamt) {
            return false;
        }
        if (sz !== other.hamt.size) {
            return false;
        }
        Contract_1.contractTrueEquality("HashSet.equals", this, other);
        var keys = Array.from(this.hamt.keys());
        for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
            var k = keys_1[_i];
            var hisVal = other.hamt.get(k);
            if (hisVal === undefined) {
                return false;
            }
            if (!Comparison_1.areEqual(k, hisVal)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    HashSet.prototype.hashCode = function () {
        return this.hamt.fold(function (acc, value, key) {
            return Comparison_1.getHashCode(key);
        }, 0);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    HashSet.prototype.toString = function () {
        return "HashSet(" +
            this.hamt.fold(function (acc, value, key) { acc.push(SeqHelpers.toStringHelper(key)); return acc; }, []).join(", ")
            + ")";
    };
    HashSet.prototype.inspect = function () {
        return this.toString();
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     HashSet.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     *
     * (of course, order is not guaranteed)
     */
    HashSet.prototype.mkString = function (separator) {
        return this.hamt.fold(function (acc, value, key) { acc.push(SeqHelpers.toStringHelper(key, { quoteStrings: false })); return acc; }, []).join(separator);
    };
    return HashSet;
}());
exports.HashSet = HashSet;
// we need to override the empty hashmap
// because i don't know how to get the hash & keyset
// functions for the keys without a key value to get
// the functions from
var EmptyHashSet = /** @class */ (function (_super) {
    __extends(EmptyHashSet, _super);
    function EmptyHashSet() {
        return _super.call(this, {}) || this;
    }
    EmptyHashSet.prototype.add = function (elt) {
        Contract_1.contractTrueEquality("Error building a HashSet", elt);
        if (!elt) {
            // special case if we get null for the first element...
            // less optimized variant because we don't know
            // if we should use '===' or 'equals'
            return new HashSet(hamt.make({
                hash: function (v) { return Comparison_1.getHashCode(v); },
                keyEq: function (a, b) { return Comparison_1.areEqual(a, b); }
            }).set(elt, elt));
        }
        // if the element is not null, save a if later by finding
        // out right now whether we should call equals or ===
        if (Comparison_1.hasEquals(elt)) {
            return new HashSet(hamt.make({
                hash: function (v) { return v.hashCode(); },
                keyEq: function (a, b) { return a.equals(b); }
            }).set(elt, elt));
        }
        return new HashSet(hamt.make().set(elt, elt));
    };
    /**
     * Add multiple elements to this set.
     */
    EmptyHashSet.prototype.addAll = function (elts) {
        var it = elts[Symbol.iterator]();
        var curItem = it.next();
        if (curItem.done) {
            return emptyHashSet;
        }
        return this.add(curItem.value).addAll((_a = {}, _a[Symbol.iterator] = function () { return it; }, _a));
        var _a;
    };
    EmptyHashSet.prototype.contains = function (elt) {
        return false;
    };
    EmptyHashSet.prototype.map = function (mapper) {
        return emptyHashSet;
    };
    EmptyHashSet.prototype.mapOption = function (mapper) {
        return emptyHashSet;
    };
    EmptyHashSet.prototype.filter = function (predicate) {
        return this;
    };
    EmptyHashSet.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
    EmptyHashSet.prototype.toArray = function (sort) {
        return [];
    };
    EmptyHashSet.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    EmptyHashSet.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.empty();
    };
    EmptyHashSet.prototype[Symbol.iterator] = function () {
        return { next: function () { return ({ done: true, value: undefined }); } };
    };
    EmptyHashSet.prototype.length = function () {
        return 0;
    };
    EmptyHashSet.prototype.isEmpty = function () {
        return true;
    };
    EmptyHashSet.prototype.diff = function (elts) {
        return this;
    };
    EmptyHashSet.prototype.intersect = function (other) {
        return this;
    };
    EmptyHashSet.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyHashSet.prototype.groupBy = function (classifier) {
        return HashMap_1.HashMap.empty();
    };
    EmptyHashSet.prototype.allMatch = function (predicate) {
        return true;
    };
    EmptyHashSet.prototype.partition = function (predicate) {
        return [this, this];
    };
    EmptyHashSet.prototype.remove = function (elt) {
        return this;
    };
    EmptyHashSet.prototype.equals = function (other) {
        if (!other || !other.length) {
            return false;
        }
        return other === emptyHashSet || other.length() === 0;
    };
    EmptyHashSet.prototype.hashCode = function () {
        return 0;
    };
    EmptyHashSet.prototype.toString = function () {
        return "HashSet()";
    };
    EmptyHashSet.prototype.mkString = function (separator) {
        return "";
    };
    return EmptyHashSet;
}(HashSet));
var emptyHashSet = new EmptyHashSet();

},{"./Comparison":2,"./Contract":3,"./HashMap":6,"./ISet":8,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Vector":16,"hamt_plus":18}],8:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * @hidden
 */
function isSortOnSpec(sortSpec) {
    return sortSpec.sortOn !== undefined;
}
exports.isSortOnSpec = isSortOnSpec;

},{}],9:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var SeqHelpers_1 = require("./SeqHelpers");
/**
 * Represent a lazily evaluated value. You give a function which
 * will return a value; that function is only called when the value
 * is requested from Lazy, but it will be computed at most once.
 * If the value is requested again, the previously computed result
 * will be returned: Lazy is memoizing.
 */
var Lazy = /** @class */ (function () {
    function Lazy(thunk) {
        this.thunk = thunk;
    }
    /**
     * Build a Lazy from a computation returning a value.
     * The computation will be called at most once.
     */
    Lazy.of = function (thunk) {
        return new Lazy(thunk);
    };
    /**
     * Evaluate the value, cache its value, and return it, or return the
     * previously computed value.
     */
    Lazy.prototype.get = function () {
        if (this.thunk) {
            this.value = this.thunk();
            this.thunk = undefined;
        }
        return this.value;
    };
    /**
     * Returns true if the computation underlying this Lazy was already
     * performed, false otherwise.
     */
    Lazy.prototype.isEvaluated = function () {
        return this.thunk === undefined;
    };
    /**
     * Return a new lazy where the element was transformed
     * by the mapper function you give.
     */
    Lazy.prototype.map = function (mapper) {
        var _this = this;
        return new Lazy(function () { return mapper(_this.get()); });
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Lazy.prototype.toString = function () {
        return this.isEvaluated() ?
            "Lazy(" + SeqHelpers_1.toStringHelper(this.get()) + ")" :
            "Lazy(?)";
    };
    /**
     * Used by the node REPL to display values.
     * Most of the time should be the same as toString()
     */
    Lazy.prototype.inspect = function () {
        return this.toString();
    };
    return Lazy;
}());
exports.Lazy = Lazy;

},{"./SeqHelpers":13}],10:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * A sequence of values, organized in-memory as a strict linked list.
 * Each element has an head (value) and a tail (the rest of the list).
 *
 * The code is organized through the class [[EmptyLinkedList]] (empty list
 * or tail), the class [[ConsLinkedList]] (list value and pointer to next),
 * and the type alias [[LinkedList]] (empty or cons).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[LinkedListStatic]] and are accessed through the global constant LinkedList.
 *
 * Random access is expensive, appending is expensive, prepend or getting
 * the tail of the list is very cheap.
 * If you often need random access you should rather use [[Vector]].
 * Avoid appending at the end of the list in a loop, prefer prepending and
 * then reversing the list.
 *
 * Examples:
 *
 *     LinkedList.of(1,2,3);
 *     LinkedList.of(1,2,3).map(x => x*2).last();
 */
var Option_1 = require("./Option");
var Vector_1 = require("./Vector");
var Comparison_1 = require("./Comparison");
var Contract_1 = require("./Contract");
var HashMap_1 = require("./HashMap");
var HashSet_1 = require("./HashSet");
var SeqHelpers = require("./SeqHelpers");
/**
 * Holds the "static methods" for [[LinkedList]]
 */
var LinkedListStatic = /** @class */ (function () {
    function LinkedListStatic() {
    }
    /**
     * The empty stream
     */
    LinkedListStatic.prototype.empty = function () {
        return emptyLinkedList;
    };
    /**
     * Create a LinkedList with the elements you give.
     */
    LinkedListStatic.prototype.of = function (elt) {
        var elts = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            elts[_i - 1] = arguments[_i];
        }
        return new ConsLinkedList(elt, exports.LinkedList.ofIterable(elts));
    };
    /**
     * Build a stream from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    LinkedListStatic.prototype.ofIterable = function (elts) {
        var iterator = elts[Symbol.iterator]();
        var curItem = iterator.next();
        var result = emptyLinkedList;
        while (!curItem.done) {
            result = new ConsLinkedList(curItem.value, result);
            curItem = iterator.next();
        }
        return result.reverse();
    };
    /**
     * Dual to the foldRight function. Build a collection from a seed.
     * Takes a starting element and a function.
     * It applies the function on the starting element; if the
     * function returns None, it stops building the list, if it
     * returns Some of a pair, it adds the first element to the result
     * and takes the second element as a seed to keep going.
     *
     *     LinkedList.unfoldRight(
     *          10, x=>Option.of(x)
     *              .filter(x => x!==0)
     *              .map<[number,number]>(x => [x,x-1]))
     *     => LinkedList.of(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
     */
    LinkedListStatic.prototype.unfoldRight = function (seed, fn) {
        var nextVal = fn(seed);
        var result = emptyLinkedList;
        while (!nextVal.isNone()) {
            result = new ConsLinkedList(nextVal.get()[0], result);
            nextVal = fn(nextVal.get()[1]);
        }
        return result.reverse();
    };
    return LinkedListStatic;
}());
exports.LinkedListStatic = LinkedListStatic;
/**
 * The LinkedList constant allows to call the LinkedList "static" methods
 */
exports.LinkedList = new LinkedListStatic();
/**
 * EmptyLinkedList is the empty linked list; every non-empty
 * linked list also has a pointer to an empty linked list
 * after its last element.
 * "static methods" available through [[LinkedListStatic]]
 * @param T the item type
 */
var EmptyLinkedList = /** @class */ (function () {
    function EmptyLinkedList() {
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * @hidden
     */
    EmptyLinkedList.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * Implementation of the Iterator interface.
     */
    EmptyLinkedList.prototype[Symbol.iterator] = function () {
        return {
            next: function () {
                return {
                    done: true,
                    value: undefined
                };
            }
        };
    };
    /**
     * View this Some a as LinkedList. Useful to help typescript type
     * inference sometimes.
     */
    EmptyLinkedList.prototype.asLinkedList = function () {
        return this;
    };
    /**
     * Get the length of the collection.
     */
    EmptyLinkedList.prototype.length = function () {
        return 0;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    EmptyLinkedList.prototype.single = function () {
        return Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    EmptyLinkedList.prototype.isEmpty = function () {
        return true;
    };
    /**
     * Get the first value of the collection, if any.
     * In this case the list is empty, so returns Option.none
     */
    EmptyLinkedList.prototype.head = function () {
        return Option_1.Option.none();
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    EmptyLinkedList.prototype.tail = function () {
        return Option_1.Option.none();
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    EmptyLinkedList.prototype.last = function () {
        return Option_1.Option.none();
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on LinkedList, which is not a good data structure
     * for random access!
     */
    EmptyLinkedList.prototype.get = function (idx) {
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    EmptyLinkedList.prototype.find = function (predicate) {
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    EmptyLinkedList.prototype.contains = function (v) {
        return false;
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    EmptyLinkedList.prototype.take = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    EmptyLinkedList.prototype.takeWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyLinkedList.prototype.drop = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    EmptyLinkedList.prototype.dropWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyLinkedList.prototype.dropRight = function (n) {
        return this;
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     LinkedList.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    EmptyLinkedList.prototype.fold = function (zero, fn) {
        return zero;
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldLeft("!", (xs,x) => x+xs);
     *     => "cba!"
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    EmptyLinkedList.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldRight("!", (x,xs) => xs+x);
     *     => "!cba"
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    EmptyLinkedList.prototype.foldRight = function (zero, fn) {
        return zero;
    };
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Vector.of(1,2,3).zip(["a","b","c"])
     *     => Vector.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     */
    EmptyLinkedList.prototype.zip = function (other) {
        return emptyLinkedList;
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     LinkedList.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => LinkedList.of("a0", "b1")
     */
    EmptyLinkedList.prototype.zipWithIndex = function () {
        return this;
    };
    /**
     * Reverse the collection. For instance:
     *
     *     LinkedList.of(1,2,3).reverse();
     *     => LinkedList.of(3,2,1)
     */
    EmptyLinkedList.prototype.reverse = function () {
        return this;
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    LinkedList.of(1,2,3,4,5,6).span(x => x <3)
     *    => [LinkedList.of(1,2), LinkedList.of(3,4,5,6)]
     */
    EmptyLinkedList.prototype.span = function (predicate) {
        return [this, this];
    };
    /**
     * Split the collection at a specific index.
     *
     *     LinkedList.of(1,2,3,4,5).splitAt(3)
     *     => [LinkedList.of(1,2,3), LinkedList.of(4,5)]
     */
    EmptyLinkedList.prototype.splitAt = function (index) {
        return [this, this];
    };
    /**
     * Returns a pair of two collections; the first one
     * will only contain the items from this collection for
     * which the predicate you give returns true, the second
     * will only contain the items from this collection where
     * the predicate returns false.
     *
     *     LinkedList.of(1,2,3,4).partition(x => x%2===0)
     *     => [LinkedList.of(2,4),LinkedList.of(1,3)]
     */
    EmptyLinkedList.prototype.partition = function (predicate) {
        return [exports.LinkedList.empty(), exports.LinkedList.empty()];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsLinkedList.arrangeBy]]
     */
    EmptyLinkedList.prototype.groupBy = function (classifier) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsLinkedList.groupBy]]
     */
    EmptyLinkedList.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    EmptyLinkedList.prototype.shuffle = function () {
        return this;
    };
    /**
     * Append an element at the end of this LinkedList.
     * Warning: appending in a loop on a linked list is going
     * to be very slow!
     */
    EmptyLinkedList.prototype.append = function (v) {
        return exports.LinkedList.of(v);
    };
    /*
     * Append multiple elements at the end of this LinkedList.
     */
    EmptyLinkedList.prototype.appendAll = function (elts) {
        return exports.LinkedList.ofIterable(elts);
    };
    /**
     * Removes the first element matching the predicate
     * (use [[Seq.filter]] to remove all elements matching a predicate)
     */
    EmptyLinkedList.prototype.removeFirst = function (predicate) {
        return this;
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    EmptyLinkedList.prototype.prepend = function (elt) {
        return new ConsLinkedList(elt, this);
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    EmptyLinkedList.prototype.prependAll = function (elt) {
        return exports.LinkedList.ofIterable(elt);
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    EmptyLinkedList.prototype.map = function (mapper) {
        return emptyLinkedList;
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     */
    EmptyLinkedList.prototype.mapOption = function (mapper) {
        return emptyLinkedList;
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    EmptyLinkedList.prototype.flatMap = function (mapper) {
        return emptyLinkedList;
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    EmptyLinkedList.prototype.allMatch = function (predicate) {
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    EmptyLinkedList.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyLinkedList.prototype.filter = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     * also see [[ConsLinkedList.sortOn]]
     */
    EmptyLinkedList.prototype.sortBy = function (compare) {
        return this;
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     * also see [[ConsLinkedList.sortBy]]
     */
    EmptyLinkedList.prototype.sortOn = function (getKey) {
        return this;
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     LinkedList.of(1,1,2,3,2,3,1).distinctBy(x => x)
     *     => LinkedList.of(1,2,3)
     */
    EmptyLinkedList.prototype.distinctBy = function (keyExtractor) {
        return this;
    };
    /**
     * Call a function for element in the collection.
     */
    EmptyLinkedList.prototype.forEach = function (fn) {
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    EmptyLinkedList.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.minOn]]
     */
    EmptyLinkedList.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.minBy]]
     */
    EmptyLinkedList.prototype.minOn = function (getNumber) {
        return SeqHelpers.minOn(this, getNumber);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.maxOn]]
     */
    EmptyLinkedList.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.maxBy]]
     */
    EmptyLinkedList.prototype.maxOn = function (getNumber) {
        return SeqHelpers.maxOn(this, getNumber);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     */
    EmptyLinkedList.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     LinkedList.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(LinkedList.of(1,2,3), LinkedList.of(4,5,6), LinkedList.of(7,8))
     */
    EmptyLinkedList.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     LinkedList.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    EmptyLinkedList.prototype.mkString = function (separator) {
        return "";
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    EmptyLinkedList.prototype.toArray = function () {
        return [];
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    EmptyLinkedList.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     */
    EmptyLinkedList.prototype.toMap = function (converter) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     LinkedList.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    EmptyLinkedList.prototype.toSet = function (converter) {
        return HashSet_1.HashSet.empty();
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    EmptyLinkedList.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    EmptyLinkedList.prototype.equals = function (other) {
        if (!other) {
            return false;
        }
        return other.isEmpty();
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    EmptyLinkedList.prototype.hashCode = function () {
        return 1;
    };
    EmptyLinkedList.prototype.inspect = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    EmptyLinkedList.prototype.toString = function () {
        return "LinkedList()";
    };
    return EmptyLinkedList;
}());
exports.EmptyLinkedList = EmptyLinkedList;
/**
 * ConsLinkedList holds a value and a pointer to a next element,
 * which could be [[ConsLinkedList]] or [[EmptyLinkedList]].
 * A ConsLinkedList is basically a non-empty linked list. It will
 * contain at least one element.
 * "static methods" available through [[LinkedListStatic]]
 * @param T the item type
 */
var ConsLinkedList = /** @class */ (function () {
    /**
     * @hidden
     */
    function ConsLinkedList(value, _tail) {
        this.value = value;
        this._tail = _tail;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * @hidden
     */
    ConsLinkedList.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * View this Some a as LinkedList. Useful to help typescript type
     * inference sometimes.
     */
    ConsLinkedList.prototype.asLinkedList = function () {
        return this;
    };
    /**
     * Implementation of the Iterator interface.
     */
    ConsLinkedList.prototype[Symbol.iterator] = function () {
        var item = this;
        return {
            next: function () {
                if (item.isEmpty()) {
                    return { done: true, value: undefined };
                }
                var value = item.head().get();
                item = item.tail().get();
                return { done: false, value: value };
            }
        };
    };
    /**
     * Get the length of the collection.
     */
    ConsLinkedList.prototype.length = function () {
        return this.foldLeft(0, function (n, ignored) { return n + 1; });
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    ConsLinkedList.prototype.single = function () {
        return this._tail.isEmpty() ?
            Option_1.Option.of(this.value) :
            Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    ConsLinkedList.prototype.isEmpty = function () {
        return false;
    };
    /**
     * Get the first value of the collection, if any.
     * In this case the list is not empty, so returns Option.some
     */
    ConsLinkedList.prototype.head = function () {
        return Option_1.Option.some(this.value);
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    ConsLinkedList.prototype.tail = function () {
        return Option_1.Option.some(this._tail);
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    ConsLinkedList.prototype.last = function () {
        var curItem = this;
        while (true) {
            var item = curItem.value;
            curItem = curItem._tail;
            if (curItem.isEmpty()) {
                return Option_1.Option.some(item);
            }
        }
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on LinkedList, which is not a good data structure
     * for random access!
     */
    ConsLinkedList.prototype.get = function (idx) {
        var curItem = this;
        var i = 0;
        while (!curItem.isEmpty()) {
            if (i === idx) {
                var item = curItem.value;
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail;
            ++i;
        }
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    ConsLinkedList.prototype.find = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            var item = curItem.value;
            if (predicate(item)) {
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail;
        }
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    ConsLinkedList.prototype.contains = function (v) {
        return this.find(function (x) { return Comparison_1.areEqual(x, v); }).isSome();
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    ConsLinkedList.prototype.take = function (n) {
        var result = emptyLinkedList;
        var curItem = this;
        var i = 0;
        while (i++ < n && (!curItem.isEmpty())) {
            result = new ConsLinkedList(curItem.value, result);
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    ConsLinkedList.prototype.takeWhile = function (predicate) {
        var result = emptyLinkedList;
        var curItem = this;
        while ((!curItem.isEmpty()) && predicate(curItem.value)) {
            result = new ConsLinkedList(curItem.value, result);
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsLinkedList.prototype.drop = function (n) {
        var i = n;
        var curItem = this;
        while (i-- > 0 && !curItem.isEmpty()) {
            curItem = curItem._tail;
        }
        return curItem;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    ConsLinkedList.prototype.dropWhile = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty() && predicate(curItem.value)) {
            curItem = curItem._tail;
        }
        return curItem;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsLinkedList.prototype.dropRight = function (n) {
        // going twice through the list...
        var length = this.length();
        return this.take(length - n);
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     LinkedList.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    ConsLinkedList.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldLeft("!", (xs,x) => x+xs);
     *     => "cba!"
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    ConsLinkedList.prototype.foldLeft = function (zero, fn) {
        var r = zero;
        var curItem = this;
        while (!curItem.isEmpty()) {
            r = fn(r, curItem.value);
            curItem = curItem._tail;
        }
        return r;
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldRight("!", (x,xs) => xs+x);
     *     => "!cba"
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    ConsLinkedList.prototype.foldRight = function (zero, fn) {
        return this.reverse().foldLeft(zero, function (xs, x) { return fn(x, xs); });
    };
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Vector.of(1,2,3).zip(["a","b","c"])
     *     => Vector.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     */
    ConsLinkedList.prototype.zip = function (other) {
        var otherIterator = other[Symbol.iterator]();
        var otherCurItem = otherIterator.next();
        var curItem = this;
        var result = emptyLinkedList;
        while ((!curItem.isEmpty()) && (!otherCurItem.done)) {
            result = new ConsLinkedList([curItem.value, otherCurItem.value], result);
            curItem = curItem._tail;
            otherCurItem = otherIterator.next();
        }
        return result.reverse();
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     LinkedList.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => LinkedList.of("a0", "b1")
     */
    ConsLinkedList.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Reverse the collection. For instance:
     *
     *     LinkedList.of(1,2,3).reverse();
     *     => LinkedList.of(3,2,1)
     */
    ConsLinkedList.prototype.reverse = function () {
        return this.foldLeft(emptyLinkedList, function (xs, x) { return xs.prepend(x); });
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    LinkedList.of(1,2,3,4,5,6).span(x => x <3)
     *    => [LinkedList.of(1,2), LinkedList.of(3,4,5,6)]
     */
    ConsLinkedList.prototype.span = function (predicate) {
        var first = emptyLinkedList;
        var curItem = this;
        while ((!curItem.isEmpty()) && predicate(curItem.value)) {
            first = new ConsLinkedList(curItem.value, first);
            curItem = curItem._tail;
        }
        return [first.reverse(), curItem];
    };
    /**
     * Split the collection at a specific index.
     *
     *     LinkedList.of(1,2,3,4,5).splitAt(3)
     *     => [LinkedList.of(1,2,3), LinkedList.of(4,5)]
     */
    ConsLinkedList.prototype.splitAt = function (index) {
        var first = emptyLinkedList;
        var curItem = this;
        var i = 0;
        while (i++ < index && (!curItem.isEmpty())) {
            first = new ConsLinkedList(curItem.value, first);
            curItem = curItem._tail;
        }
        return [first.reverse(), curItem];
    };
    /**
     * Returns a pair of two collections; the first one
     * will only contain the items from this collection for
     * which the predicate you give returns true, the second
     * will only contain the items from this collection where
     * the predicate returns false.
     *
     *     LinkedList.of(1,2,3,4).partition(x => x%2===0)
     *     => [LinkedList.of(2,4),LinkedList.of(1,3)]
     */
    ConsLinkedList.prototype.partition = function (predicate) {
        // TODO goes twice over the list, can be optimized...
        return [this.filter(predicate), this.filter(function (x) { return !predicate(x); })];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsLinkedList.arrangeBy]]
     */
    ConsLinkedList.prototype.groupBy = function (classifier) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, v) {
            return acc.putWithMerge(classifier(v), exports.LinkedList.of(v), function (v1, v2) {
                return v1.prepend(v2.single().getOrThrow());
            });
        })
            .mapValues(function (l) { return l.reverse(); });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsLinkedList.groupBy]]
     */
    ConsLinkedList.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    ConsLinkedList.prototype.shuffle = function () {
        return exports.LinkedList.ofIterable(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Append an element at the end of this LinkedList.
     * Warning: appending in a loop on a linked list is going
     * to be very slow!
     */
    ConsLinkedList.prototype.append = function (v) {
        return new ConsLinkedList(this.value, this._tail.append(v));
    };
    /*
     * Append multiple elements at the end of this LinkedList.
     */
    ConsLinkedList.prototype.appendAll = function (elts) {
        return exports.LinkedList.ofIterable(elts).prependAll(this);
    };
    /**
     * Removes the first element matching the predicate
     * (use [[Seq.filter]] to remove all elements matching a predicate)
     */
    ConsLinkedList.prototype.removeFirst = function (predicate) {
        var curItem = this;
        var result = emptyLinkedList;
        var removed = false;
        while (!curItem.isEmpty()) {
            if (predicate(curItem.value) && !removed) {
                removed = true;
            }
            else {
                result = new ConsLinkedList(curItem.value, result);
            }
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    ConsLinkedList.prototype.prepend = function (elt) {
        return new ConsLinkedList(elt, this);
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    ConsLinkedList.prototype.prependAll = function (elts) {
        var leftToAdd = exports.LinkedList.ofIterable(elts).reverse();
        var result = this;
        while (!leftToAdd.isEmpty()) {
            result = new ConsLinkedList(leftToAdd.value, result);
            leftToAdd = leftToAdd._tail;
        }
        return result;
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    ConsLinkedList.prototype.map = function (mapper) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            result = new ConsLinkedList(mapper(curItem.value), result);
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     */
    ConsLinkedList.prototype.mapOption = function (mapper) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            var mapped = mapper(curItem.value);
            if (mapped.isSome()) {
                result = new ConsLinkedList(mapped.get(), result);
            }
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    ConsLinkedList.prototype.flatMap = function (mapper) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            result = result.prependAll(mapper(curItem.value).reverse());
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    ConsLinkedList.prototype.allMatch = function (predicate) {
        return this.find(function (x) { return !predicate(x); }).isNone();
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    ConsLinkedList.prototype.anyMatch = function (predicate) {
        return this.find(predicate).isSome();
    };
    ConsLinkedList.prototype.filter = function (predicate) {
        var curItem = this;
        var result = emptyLinkedList;
        while (!curItem.isEmpty()) {
            if (predicate(curItem.value)) {
                result = new ConsLinkedList(curItem.value, result);
            }
            curItem = curItem._tail;
        }
        return result.reverse();
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     * also see [[ConsLinkedList.sortOn]]
     */
    ConsLinkedList.prototype.sortBy = function (compare) {
        return exports.LinkedList.ofIterable(this.toArray().sort(compare));
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     * also see [[ConsLinkedList.sortBy]]
     */
    ConsLinkedList.prototype.sortOn = function (getKey) {
        return SeqHelpers.sortOn(this, getKey);
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     LinkedList.of(1,1,2,3,2,3,1).distinctBy(x => x)
     *     => LinkedList.of(1,2,3)
     */
    ConsLinkedList.prototype.distinctBy = function (keyExtractor) {
        return SeqHelpers.distinctBy(this, keyExtractor);
    };
    /**
     * Call a function for element in the collection.
     */
    ConsLinkedList.prototype.forEach = function (fn) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            fn(curItem.value);
            curItem = curItem._tail;
        }
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    ConsLinkedList.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.minOn]]
     */
    ConsLinkedList.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.minBy]]
     */
    ConsLinkedList.prototype.minOn = function (getNumber) {
        return SeqHelpers.minOn(this, getNumber);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.maxOn]]
     */
    ConsLinkedList.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsLinkedList.maxBy]]
     */
    ConsLinkedList.prototype.maxOn = function (getNumber) {
        return SeqHelpers.maxOn(this, getNumber);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     */
    ConsLinkedList.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     LinkedList.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(LinkedList.of(1,2,3), LinkedList.of(4,5,6), LinkedList.of(7,8))
     */
    ConsLinkedList.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     LinkedList.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    ConsLinkedList.prototype.mkString = function (separator) {
        var r = "";
        var curItem = this;
        var isNotFirst = false;
        while (!curItem.isEmpty()) {
            if (isNotFirst) {
                r += separator;
            }
            r += SeqHelpers.toStringHelper(curItem.value, { quoteStrings: false });
            curItem = curItem._tail;
            isNotFirst = true;
        }
        return r;
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    ConsLinkedList.prototype.toArray = function () {
        var r = [];
        var curItem = this;
        while (!curItem.isEmpty()) {
            r.push(curItem.value);
            curItem = curItem._tail;
        }
        return r;
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    ConsLinkedList.prototype.toVector = function () {
        return Vector_1.Vector.ofIterable(this.toArray());
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     */
    ConsLinkedList.prototype.toMap = function (converter) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, cur) {
            var converted = converter(cur);
            return acc.put(converted[0], converted[1]);
        });
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     LinkedList.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    ConsLinkedList.prototype.toSet = function (converter) {
        return this.foldLeft(HashSet_1.HashSet.empty(), function (acc, cur) {
            return acc.add(converter(cur));
        });
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    ConsLinkedList.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    ConsLinkedList.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other.tail) {
            return false;
        }
        Contract_1.contractTrueEquality("LinkedList.equals", this, other);
        var myVal = this;
        var hisVal = other;
        while (true) {
            if (myVal.isEmpty() !== hisVal.isEmpty()) {
                return false;
            }
            if (myVal.isEmpty()) {
                // they are both empty, end of the stream
                return true;
            }
            var myHead = myVal.value;
            var hisHead = hisVal.value;
            if ((myHead === undefined) !== (hisHead === undefined)) {
                return false;
            }
            if (myHead === undefined || hisHead === undefined) {
                // they are both undefined, the || is for TS's flow analysis
                // so he realizes none of them is undefined after this.
                continue;
            }
            if (!Comparison_1.areEqual(myHead, hisHead)) {
                return false;
            }
            myVal = myVal._tail;
            hisVal = hisVal._tail;
        }
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    ConsLinkedList.prototype.hashCode = function () {
        var hash = 1;
        var curItem = this;
        while (!curItem.isEmpty()) {
            hash = 31 * hash + Comparison_1.getHashCode(curItem.value);
            curItem = curItem._tail;
        }
        return hash;
    };
    ConsLinkedList.prototype.inspect = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    ConsLinkedList.prototype.toString = function () {
        var curItem = this;
        var result = "LinkedList(";
        while (!curItem.isEmpty()) {
            result += SeqHelpers.toStringHelper(curItem.value);
            var tail = curItem._tail;
            curItem = tail;
            if (!curItem.isEmpty()) {
                result += ", ";
            }
        }
        return result + ")";
    };
    return ConsLinkedList;
}());
exports.ConsLinkedList = ConsLinkedList;
var emptyLinkedList = new EmptyLinkedList();

},{"./Comparison":2,"./Contract":3,"./HashMap":6,"./HashSet":7,"./Option":11,"./SeqHelpers":13,"./Vector":16}],11:[function(require,module,exports){
"use strict";
/**
 * The [[Option]] type expresses that a value may be present or not.
 * The code is organized through the class [[None]] (value not
 * present), the class [[Some]] (value present), and the type alias
 * [[Option]] (Some or None).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[OptionStatic]] and are accessed through the global constant Option.
 *
 * Examples:
 *
 *     Option.of(5);
 *     Option.none<number>();
 *     Option.of(5).map(x => x*2);
 *
 * To get the value out of an option, you can use [[Some.getOrThrow]],
 * or [[Some.get]]. The latter is available if you've checked that you
 * indeed have a some, for example:
 *
 *     const opt = Option.of(5);
 *     if (opt.isSome()) {
 *         opt.get();
 *     }
 *
 * You also have other options like [[Some.getOrElse]], [[Some.getOrUndefined]]
 * and so on. [[Some]] and [[None]] have the same methods, except that
 * Some has the extra [[Some.get]] method that [[None]] doesn't have.
 */
exports.__esModule = true;
var Vector_1 = require("./Vector");
var Either_1 = require("./Either");
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var Contract_1 = require("./Contract");
/**
 * Holds the "static methods" for [[Option]]
 */
var OptionStatic = /** @class */ (function () {
    function OptionStatic() {
    }
    /**
     * Builds an optional value.
     * * T is wrapped in a [[Some]]
     * * undefined becomes a [[None]]
     * * null becomes a [[Some]].
     *
     *     Option.of(5).isSome()
     *     => true
     *
     *     Option.of(undefined).isSome()
     *     => false
     *
     *     Option.of(null).isSome()
     *     => true
     *
     * Also see [[OptionStatic.some]], [[OptionStatic.ofNullable]]
     */
    OptionStatic.prototype.of = function (v) {
        return (v === undefined) ? exports.none : new Some(v);
    };
    /**
     * Build an optional value from a nullable.
     * * T is wrapped in a [[Some]]
     * * undefined becomes a [[None]]
     * * null becomes a [[None]].
     *
     *     Option.ofNullable(5).isSome()
     *     => true
     *
     *     Option.ofNullable(undefined).isSome()
     *     => false
     *
     *     Option.ofNullable(null).isSome()
     *     => false
     *
     * Also see [[OptionStatic.some]], [[OptionStatic.of]]
     */
    OptionStatic.prototype.ofNullable = function (v) {
        return v ? new Some(v) : exports.none;
    };
    /**
     * Build a [[Some]], unlike [[OptionStatic.of]], which may build a [[Some]]
     * or a [[None]].
     * Will throw if given undefined.
     *
     *     Option.some(5).isSome()
     *     => true
     *
     *     Option.some(undefined).isSome()
     *     => throws
     *
     *     Option.some(null).isSome()
     *     => true
     *
     * Also see [[OptionStatic.of]], [[OptionStatic.ofNullable]]
     */
    OptionStatic.prototype.some = function (v) {
        // the reason I decided to add a some in addition to 'of'
        // instead of making 'of' smarter (which is possible in
        // typescript, see https://github.com/bcherny/tsoption)
        // is that sometimes you really want an Option, not a Some.
        // for instance you can't mix an a Some and an Option in a list
        // if you put the Some first, without calling asOption().
        if (typeof v === "undefined") {
            throw "Option.some got undefined!";
        }
        return new Some(v);
    };
    /**
     * The optional value expressing a missing value.
     */
    OptionStatic.prototype.none = function () {
        return exports.none;
    };
    /**
     * Turns a list of options in an option containing a list of items.
     * Useful in many contexts.
     *
     *     Option.sequence(Vector.of(Option.of(1),Option.of(2)))
     *     => Option.of(Vector.of(1,2))
     *
     * But if a single element is None, everything is discarded:
     *
     *     Option.sequence(Vector.of(Option.of(1), Option.none()))
     *     => Option.none()
     */
    OptionStatic.prototype.sequence = function (elts) {
        var r = Vector_1.Vector.empty();
        var iterator = elts[Symbol.iterator]();
        var curItem = iterator.next();
        while (!curItem.done) {
            var v = curItem.value;
            if (v.isNone()) {
                return exports.none;
            }
            r = r.append(v.get());
            curItem = iterator.next();
        }
        return exports.Option.of(r);
    };
    /**
     * Applicative lifting for Option.
     * Takes a function which operates on basic values, and turns it
     * in a function that operates on options of these values ('lifts'
     * the function). The 2 is because it works on functions taking two
     * parameters.
     *
     *     const lifted = Option.liftA2((x:number,y:number) => x+y);
     *     lifted(Option.of(5), Option.of(6));
     *     => Option.of(11)
     *
     *     const lifted2 = Option.liftA2((x:number,y:number) => x+y);
     *     lifted2(Option.of(5), Option.none<number>());
     *     => Option.none()
     *
     * @param T the first option type
     * @param U the second option type
     * @param V the new type as returned by the combining function.
     */
    OptionStatic.prototype.liftA2 = function (fn) {
        return function (p1, p2) { return p1.flatMap(function (a1) { return p2.map(function (a2) { return fn(a1, a2); }); }); };
    };
    /**
     * Applicative lifting for Option. 'p' stands for 'properties'.
     *
     * Takes a function which operates on a simple JS object, and turns it
     * in a function that operates on the same JS object type except which each field
     * wrapped in an Option ('lifts' the function).
     * It's an alternative to [[OptionStatic.liftA2]] when the number of parameters
     * is not two.
     *
     *     const lifted = Option.liftAp((x:{a:number,b:number,c:number}) => x.a+x.b+x.c);
     *     lifted({a:Option.of(5), b:Option.of(6), c:Option.of(3)});
     *     => Option.of(14)
     *
     *     const lifted = Option.liftAp((x:{a:number,b:number}) => x.a+x.b);
     *     lifted({a:Option.of(5), b:Option.none<number>()});
     *     => Option.none()
     *
     * @param A the object property type specifying the parameters for your function
     * @param B the type returned by your function, returned wrapped in an option by liftAp.
     */
    OptionStatic.prototype.liftAp = function (fn) {
        return function (x) {
            var copy = {};
            for (var p in x) {
                if (x[p].isNone()) {
                    return exports.Option.none();
                }
                copy[p] = x[p].getOrThrow();
            }
            return exports.Option.of(fn(copy));
        };
    };
    return OptionStatic;
}());
exports.OptionStatic = OptionStatic;
/**
 * The Option constant allows to call the option "static" methods
 */
exports.Option = new OptionStatic();
function optionHasTrueEquality(opt) {
    return opt.flatMap(function (x) { return (x && x.hasTrueEquality) ?
        exports.Option.of(x.hasTrueEquality()) :
        Comparison_1.hasTrueEquality(x); })
        .getOrElse(true);
}
/**
 * Some represents an [[Option]] with a value.
 * "static methods" available through [[OptionStatic]]
 *
 * [[Some]] and [[None]] have the same methods, except that
 * Some has the extra [[Some.get]] method that [[None]] doesn't have.
 * @param T the item type
 */
var Some = /** @class */ (function () {
    /**
     * @hidden
     */
    function Some(value) {
        this.value = value;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns true since this is a Some (contains a value)
     */
    Some.prototype.isSome = function () {
        return true;
    };
    /**
     * Returns false since this is a Some (contains a value)
     */
    Some.prototype.isNone = function () {
        return false;
    };
    /**
     * View this Some a as Option. Useful to help typescript type
     * inference sometimes.
     */
    Some.prototype.asOption = function () {
        return this;
    };
    /**
     * Get the value contained in this option.
     * NOTE: we know it's there, since this method
     * belongs to Some, not Option.
     */
    Some.prototype.get = function () {
        return this.value;
    };
    /**
     * Combines two options. If this option is a Some, returns it.
     * If it's a None, returns the other one.
     */
    Some.prototype.orElse = function (other) {
        return this;
    };
    /**
     * Get the value from this option if it's a Some, otherwise
     * throw an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    Some.prototype.getOrThrow = function (message) {
        return this.value;
    };
    /**
     * Returns true if the option is a Some and contains the
     * value you give, false otherwise.
     */
    Some.prototype.contains = function (v) {
        return v === this.value;
    };
    /**
     * Get the value contained in the option if it's a Some,
     * return undefined if it's a None.
     */
    Some.prototype.getOrUndefined = function () {
        return this.value;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the default value that you give.
     */
    Some.prototype.getOrElse = function (alt) {
        return this.value;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the value returned by the function that you give.
     *
     *     Option.of(5).getOrCall(() => 6)
     *     => 5
     *
     *     Option.none<number>().getOrCall(() => 6)
     *     => 6
     */
    Some.prototype.getOrCall = function (fn) {
        return this.value;
    };
    /**
     * Return a new option where the element (if present) was transformed
     * by the mapper function you give. If the option was None it'll stay None.
     */
    Some.prototype.map = function (fn) {
        return exports.Option.of(fn(this.value));
    };
    /**
     * If this is a Some, calls the function you give on
     * the item in the option and return its result.
     * If the option is a None, return none.
     * This is the monadic bind.
     */
    Some.prototype.flatMap = function (mapper) {
        return mapper(this.value);
    };
    Some.prototype.filter = function (fn) {
        return fn(this.value) ? this : exports.Option.none();
    };
    /**
     * Execute a side-effecting function if the option
     * is a Some; returns the option.
     */
    Some.prototype.ifSome = function (fn) {
        fn(this.value);
        return this;
    };
    /**
     * Execute a side-effecting function if the option
     * is a None; returns the option.
     */
    Some.prototype.ifNone = function (fn) {
        return this;
    };
    /**
     * Handle both branches of the option and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for option.
     *
     *     Option.of(5).match({
     *         Some: x  => "got " + x,
     *         None: () => "got nothing!"
     *     });
     *     => "got 5"
     */
    Some.prototype.match = function (cases) {
        return cases.Some(this.value);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Some.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Convert to a vector. If it's a None, it's the empty
     * vector, if it's a Some, it's a one-element vector with
     * the contents of the option.
     */
    Some.prototype.toVector = function () {
        return Vector_1.Vector.of(this.value);
    };
    /**
     * Convert to an either. You must provide a left value
     * in case this is a None.
     */
    Some.prototype.toEither = function (left) {
        return Either_1.Either.right(this.value);
    };
    Some.prototype.hasTrueEquality = function () {
        return optionHasTrueEquality(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Some.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        // the .isSome doesn't test if it's a Some, but
        // if the object has a field called isSome.
        if (other === exports.none || !other || !other.isSome) {
            return false;
        }
        var someOther = other;
        Contract_1.contractTrueEquality("Option.equals", this, someOther);
        return Comparison_1.areEqual(this.value, someOther.value);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Some.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this.value);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Some.prototype.toString = function () {
        return "Some(" + SeqHelpers_1.toStringHelper(this.value) + ")";
    };
    /**
     * Used by the node REPL to display values.
     */
    Some.prototype.inspect = function () {
        return this.toString();
    };
    return Some;
}());
exports.Some = Some;
/**
 * None represents an [[Option]] without value.
 * "static methods" available through [[OptionStatic]]
 *
 * [[Some]] and [[None]] have the same methods, except that
 * Some has the extra [[Some.get]] method that [[None]] doesn't have.
 * @param T the item type
 */
var None = /** @class */ (function () {
    function None() {
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Returns false since this is a None (doesn'tcontains a value)
     */
    None.prototype.isSome = function () {
        return false;
    };
    /**
     * Returns true since this is a None (doesn'tcontains a value)
     */
    None.prototype.isNone = function () {
        return true;
    };
    /**
     * View this Some a as Option. Useful to help typescript type
     * inference sometimes.
     */
    None.prototype.asOption = function () {
        return this;
    };
    /**
     * Combines two options. If this option is a Some, returns it.
     * If it's a None, returns the other one.
     */
    None.prototype.orElse = function (other) {
        return other;
    };
    /**
     * Get the value from this option if it's a Some, otherwise
     * throw an exception.
     * You can optionally pass a message that'll be used as the
     * exception message.
     */
    None.prototype.getOrThrow = function (message) {
        throw message || "getOrThrow called on none!";
    };
    /**
     * Returns true if the option is a Some and contains the
     * value you give, false otherwise.
     */
    None.prototype.contains = function (v) {
        return false;
    };
    /**
     * Get the value contained in the option if it's a Some,
     * return undefined if it's a None.
     */
    None.prototype.getOrUndefined = function () {
        return undefined;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the default value that you give.
     */
    None.prototype.getOrElse = function (alt) {
        return alt;
    };
    /**
     * Get the value from this option; if it's a None (no value
     * present), then return the value returned by the function that you give.
     *
     *     Option.of(5).getOrCall(() => 6)
     *     => 5
     *
     *     Option.none<number>().getOrCall(() => 6)
     *     => 6
     */
    None.prototype.getOrCall = function (fn) {
        return fn();
    };
    /**
     * Return a new option where the element (if present) was transformed
     * by the mapper function you give. If the option was None it'll stay None.
     */
    None.prototype.map = function (fn) {
        return exports.none;
    };
    /**
     * If this is a Some, calls the function you give on
     * the item in the option and return its result.
     * If the option is a None, return none.
     * This is the monadic bind.
     */
    None.prototype.flatMap = function (mapper) {
        return exports.none;
    };
    None.prototype.filter = function (fn) {
        return exports.none;
    };
    /**
     * Execute a side-effecting function if the option
     * is a Some; returns the option.
     */
    None.prototype.ifSome = function (fn) {
        return this;
    };
    /**
     * Execute a side-effecting function if the option
     * is a Some; returns the option.
     */
    None.prototype.ifNone = function (fn) {
        fn();
        return this;
    };
    /**
     * Handle both branches of the option and return a value
     * (can also be used for side-effects).
     * This is the catamorphism for option.
     *
     *     Option.of(5).match({
     *         Some: x  => "got " + x,
     *         None: () => "got nothing!"
     *     });
     *     => "got 5"
     */
    None.prototype.match = function (cases) {
        return cases.None();
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    None.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Convert to a vector. If it's a None, it's the empty
     * vector, if it's a Some, it's a one-element vector with
     * the contents of the option.
     */
    None.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert to an either. You must provide a left value
     * in case this is a None.
     */
    None.prototype.toEither = function (left) {
        return Either_1.Either.left(left);
    };
    None.prototype.hasTrueEquality = function () {
        return optionHasTrueEquality(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    None.prototype.equals = function (other) {
        return other === exports.none;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    None.prototype.hashCode = function () {
        return 1;
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    None.prototype.toString = function () {
        return "None()";
    };
    /**
     * Used by the node REPL to display values.
     */
    None.prototype.inspect = function () {
        return this.toString();
    };
    return None;
}());
exports.None = None;
/**
 * @hidden
 */
exports.none = new None();

},{"./Comparison":2,"./Contract":3,"./Either":4,"./SeqHelpers":13,"./Vector":16}],12:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * A predicate is a function taking one parameter and returning a boolean.
 * In other words the predicate checks whether some proposition holds for the parameter.
 *
 * The Predicate interface offers normal function-calling, to make sure that the
 * predicate holds (just call predicate(x)), but also some helper methods to
 * deal with logical operations between propositions.
 *
 * You can build predicates using [[PredicateStatic]] through the
 * 'Predicate' global constant.
 *
 * Examples:
 *
 *     const check = Predicate.of(x => x > 10).and(x => x < 20);
 *     check(12); // => true
 *     check(21);
 *     => false
 *
 *     Vector.of(1,2,3,4,5).filter(
 *         Predicate.isIn([2,3]).negate())
 *     => Vector.of(1, 4, 5)
 */
var Comparison_1 = require("./Comparison");
var Vector_1 = require("./Vector");
/**
 * The Predicates class offers some helper functions to deal
 * with [[Predicate]] including the ability to build [[Predicate]]
 * from functions using [[PredicateStatic.of]], some builtin predicates
 * like [[PredicateStatic.isIn]], and the ability to combine to combine
 * Predicates like with [[PredicateStatic.allOf]].
 */
var PredicateStatic = /** @class */ (function () {
    function PredicateStatic() {
    }
    /**
     * Take a predicate function and of it to become a [[Predicate]]
     * (enabling you to call [[Predicate.and]], and other logic operations on it)
     */
    PredicateStatic.prototype.of = function (fn) {
        var r = fn;
        r.and = function (other) { return exports.Predicate.of(function (x) { return r(x) && other(x); }); };
        r.or = function (other) { return exports.Predicate.of(function (x) { return r(x) || other(x); }); };
        r.negate = function () { return exports.Predicate.of(function (x) { return !fn(x); }); };
        return r;
    };
    /**
     * Return a [[Predicate]] checking whether a value is equal to the
     * value you give as parameter.
     */
    PredicateStatic.prototype.equals = function (other) {
        return exports.Predicate.of(function (x) { return Comparison_1.areEqual(other, x); });
    };
    /**
     * Return a [[Predicate]] checking whether a value is contained in the
     * list of values you give as parameter.
     */
    PredicateStatic.prototype.isIn = function (others) {
        return exports.Predicate.of(function (x) { return Vector_1.Vector.ofIterable(others).contains(x); });
    };
    /**
     * Return a [[Predicate]] checking whether all of the predicate functions given hold
     */
    PredicateStatic.prototype.allOf = function () {
        var predicates = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            predicates[_i] = arguments[_i];
        }
        return exports.Predicate.of(function (x) { return Vector_1.Vector.ofIterable(predicates).allMatch(function (p) { return p(x); }); });
    };
    /**
     * Return a [[Predicate]] checking whether any of the predicate functions given hold
     */
    PredicateStatic.prototype.anyOf = function () {
        var predicates = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            predicates[_i] = arguments[_i];
        }
        return exports.Predicate.of(function (x) { return Vector_1.Vector.ofIterable(predicates).anyMatch(function (p) { return p(x); }); });
    };
    /**
     * Return a [[Predicate]] checking whether none of the predicate functions given hold
     */
    PredicateStatic.prototype.noneOf = function () {
        var predicates = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            predicates[_i] = arguments[_i];
        }
        return exports.Predicate.of(function (x) { return !Vector_1.Vector.ofIterable(predicates).anyMatch(function (p) { return p(x); }); });
    };
    return PredicateStatic;
}());
exports.PredicateStatic = PredicateStatic;
/**
 * The Predicate constant allows to call the [[Predicate]] "static" methods.
 */
exports.Predicate = new PredicateStatic();

},{"./Comparison":2,"./Vector":16}],13:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Option_1 = require("./Option");
var Stream_1 = require("./Stream");
var Lazy_1 = require("./Lazy");
var HashSet_1 = require("./HashSet");
/**
 * @hidden
 */
function shuffle(array) {
    // https://stackoverflow.com/a/2450976/516188
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}
exports.shuffle = shuffle;
/**
 * @hidden
 */
function arrangeBy(collection, getKey) {
    return Option_1.Option.of(collection.groupBy(getKey).mapValues(function (v) { return v.single(); }))
        .filter(function (map) { return !map.anyMatch(function (k, v) { return v.isNone(); }); })
        .map(function (map) { return map.mapValues(function (v) { return v.getOrThrow(); }); });
}
exports.arrangeBy = arrangeBy;
/**
 * @hidden
 */
function seqHasTrueEquality(seq) {
    return seq.find(function (x) { return x != null; }).hasTrueEquality();
}
exports.seqHasTrueEquality = seqHasTrueEquality;
/**
 * @hidden
 */
function zipWithIndex(seq) {
    return seq.zip(Stream_1.Stream.iterate(0, function (i) { return i + 1; }));
}
exports.zipWithIndex = zipWithIndex;
/**
 * @hidden
 */
function sortOn(seq, getKey) {
    return seq.sortBy(function (x, y) {
        var a = getKey(x);
        var b = getKey(y);
        if (a === b) {
            return 0;
        }
        return a > b ? 1 : -1;
    });
}
exports.sortOn = sortOn;
/**
 * @hidden
 */
function distinctBy(seq, keyExtractor) {
    var knownKeys = HashSet_1.HashSet.empty();
    return seq.filter(function (x) {
        var key = keyExtractor(x);
        var r = knownKeys.contains(key);
        if (!r) {
            knownKeys = knownKeys.add(key);
        }
        return !r;
    });
}
exports.distinctBy = distinctBy;
/**
 * Utility function to help converting a value to string
 * util.inspect seems to depend on node.
 * @hidden
 */
function toStringHelper(obj, options) {
    if (options === void 0) { options = { quoteStrings: true }; }
    if (Array.isArray(obj)) {
        return "[" + obj.map(function (o) { return toStringHelper(o, options); }) + "]";
    }
    if (typeof obj === "string") {
        return options.quoteStrings ? "'" + obj + "'" : obj;
    }
    if (obj && (obj.toString !== Object.prototype.toString)) {
        return obj.toString();
    }
    return JSON.stringify(obj);
}
exports.toStringHelper = toStringHelper;
/**
 * @hidden
 */
function minBy(coll, compare) {
    return coll.reduce(function (v1, v2) { return compare(v1, v2) < 0 ? v2 : v1; });
}
exports.minBy = minBy;
/**
 * @hidden
 */
function minOn(coll, getNumber) {
    if (coll.isEmpty()) {
        return Option_1.Option.none();
    }
    var iter = coll[Symbol.iterator]();
    var step = iter.next();
    var val = getNumber(step.value);
    var result = step.value;
    while (!(step = iter.next()).done) {
        var curVal = getNumber(step.value);
        if (curVal < val) {
            val = curVal;
            result = step.value;
        }
    }
    return Option_1.Option.of(result);
}
exports.minOn = minOn;
/**
 * @hidden
 */
function maxBy(coll, compare) {
    return coll.reduce(function (v1, v2) { return compare(v1, v2) > 0 ? v2 : v1; });
}
exports.maxBy = maxBy;
/**
 * @hidden
 */
function maxOn(coll, getNumber) {
    if (coll.isEmpty()) {
        return Option_1.Option.none();
    }
    var iter = coll[Symbol.iterator]();
    var step = iter.next();
    var val = getNumber(step.value);
    var result = step.value;
    while (!(step = iter.next()).done) {
        var curVal = getNumber(step.value);
        if (curVal > val) {
            val = curVal;
            result = step.value;
        }
    }
    return Option_1.Option.of(result);
}
exports.maxOn = maxOn;
/**
 * @hidden
 */
function sumOn(coll, getNumber) {
    return coll.foldLeft(0, function (soFar, cur) { return soFar + getNumber(cur); });
}
exports.sumOn = sumOn;
/**
 * @hidden
 */
function reduce(coll, combine) {
    if (coll.isEmpty()) {
        return Option_1.Option.none();
    }
    var iter = coll[Symbol.iterator]();
    var step = iter.next();
    var result = step.value;
    while (!(step = iter.next()).done) {
        result = combine(result, step.value);
    }
    return Option_1.Option.of(result);
}
exports.reduce = reduce;
/**
 * @hidden
 */
function sliding(seq, count) {
    // in a way should get better performance with Seq.splitAt instead
    // of Seq.take+Seq.drop, but we should be lazy and not hold another
    // version of the sequence in memory (though for linked list it's free,
    // it's not the case for Vector)
    return seq.isEmpty() ?
        Stream_1.Stream.empty() :
        new Stream_1.ConsStream(seq.take(count), Lazy_1.Lazy.of(function () { return sliding(seq.drop(count), count); }));
}
exports.sliding = sliding;

},{"./HashSet":7,"./Lazy":9,"./Option":11,"./Stream":14}],14:[function(require,module,exports){
"use strict";
exports.__esModule = true;
/**
 * A lazy, potentially infinite, sequence of values.
 *
 * The code is organized through the class [[EmptyStream]] (empty list
 * or tail), the class [[ConsStream]] (list value and lazy pointer to next),
 * and the type alias [[Stream]] (empty or cons).
 *
 * Finally, "static" functions on Option are arranged in the class
 * [[StreamStatic]] and are accessed through the global constant Stream.
 *
 * Use take() for instance to reduce an infinite stream to a finite one.
 *
 * Examples:
 *
 *     Stream.iterate(1, x => x*2).take(4);
 *     => Stream.of(1,2,4,8)
 *
 *     Stream.continually(Math.random).take(2);
 *     => Stream.of(0.49884723907769635, 0.3226548779864311)
 */
var Option_1 = require("./Option");
var Vector_1 = require("./Vector");
var Comparison_1 = require("./Comparison");
var Contract_1 = require("./Contract");
var HashMap_1 = require("./HashMap");
var HashSet_1 = require("./HashSet");
var Lazy_1 = require("./Lazy");
var LinkedList_1 = require("./LinkedList");
var SeqHelpers = require("./SeqHelpers");
/**
 * Holds the "static methods" for [[Stream]]
 */
var StreamStatic = /** @class */ (function () {
    function StreamStatic() {
    }
    /**
     * The empty stream
     */
    StreamStatic.prototype.empty = function () {
        return emptyStream;
    };
    /**
     * Create a Stream with the elements you give.
     */
    StreamStatic.prototype.of = function (elt) {
        var elts = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            elts[_i - 1] = arguments[_i];
        }
        return new ConsStream(elt, Lazy_1.Lazy.of(function () { return exports.Stream.ofIterable(elts); }));
    };
    /**
     * Build a stream from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    StreamStatic.prototype.ofIterable = function (elts) {
        // need to eagerly copy the iterable. the reason
        // is, if we would build the stream based on the iterator
        // in the iterable, Stream.tail() would do it.next().
        // but it.next() modifies the iterator (mutability),
        // and you would end up with getting two different tails
        // for the same stream if you call .tail() twice in a row
        if (Array.isArray(elts)) {
            return exports.Stream.ofArray(elts);
        }
        return exports.Stream.ofArray(Array.from(elts));
    };
    /**
     * @hidden
     */
    StreamStatic.prototype.ofArray = function (elts) {
        if (elts.length === 0) {
            return emptyStream;
        }
        var head = elts[0];
        return new ConsStream(head, Lazy_1.Lazy.of(function () { return exports.Stream.ofArray(elts.slice(1)); }));
    };
    /**
     * Build an infinite stream from a seed and a transformation function.
     *
     *     Stream.iterate(1, x => x*2).take(4);
     *     => Stream.of(1,2,4,8)
     */
    StreamStatic.prototype.iterate = function (seed, fn) {
        return new ConsStream(seed, Lazy_1.Lazy.of(function () { return exports.Stream.iterate(fn(seed), fn); }));
    };
    /**
     * Build an infinite stream by calling repeatedly a function.
     *
     *     Stream.continually(() => 1).take(4);
     *     => Stream.of(1,1,1,1)
     *
     *     Stream.continually(Math.random).take(2);
     *     => Stream.of(0.49884723907769635, 0.3226548779864311)
     */
    StreamStatic.prototype.continually = function (fn) {
        return new ConsStream(fn(), Lazy_1.Lazy.of(function () { return exports.Stream.continually(fn); }));
    };
    /**
     * Dual to the foldRight function. Build a collection from a seed.
     * Takes a starting element and a function.
     * It applies the function on the starting element; if the
     * function returns None, it stops building the list, if it
     * returns Some of a pair, it adds the first element to the result
     * and takes the second element as a seed to keep going.
     *
     *     Stream.unfoldRight(
     *          10, x=>Option.of(x)
     *              .filter(x => x!==0)
     *              .map<[number,number]>(x => [x,x-1]));
     *     => Stream.of(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
     */
    StreamStatic.prototype.unfoldRight = function (seed, fn) {
        var nextVal = fn(seed);
        if (nextVal.isNone()) {
            return emptyStream;
        }
        return new ConsStream(nextVal.get()[0], Lazy_1.Lazy.of(function () { return exports.Stream.unfoldRight(nextVal.getOrThrow()[1], fn); }));
    };
    return StreamStatic;
}());
exports.StreamStatic = StreamStatic;
/**
 * The Stream constant allows to call the Stream "static" methods
 */
exports.Stream = new StreamStatic();
/**
 * EmptyStream is the empty stream; every non-empty
 * stream also has a pointer to an empty stream
 * after its last element.
 * "static methods" available through [[StreamStatic]]
 * @param T the item type
 */
var EmptyStream = /** @class */ (function () {
    function EmptyStream() {
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Implementation of the Iterator interface.
     */
    EmptyStream.prototype[Symbol.iterator] = function () {
        return {
            next: function () {
                return {
                    done: true,
                    value: undefined
                };
            }
        };
    };
    /**
     * View this Some a as Stream. Useful to help typescript type
     * inference sometimes.
     */
    EmptyStream.prototype.asStream = function () {
        return this;
    };
    /**
     * @hidden
     */
    EmptyStream.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * Get the length of the collection.
     */
    EmptyStream.prototype.length = function () {
        return 0;
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    EmptyStream.prototype.single = function () {
        return Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    EmptyStream.prototype.isEmpty = function () {
        return true;
    };
    /**
     * Get the first value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    EmptyStream.prototype.head = function () {
        return Option_1.Option.none();
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    EmptyStream.prototype.tail = function () {
        return Option_1.Option.none();
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    EmptyStream.prototype.last = function () {
        return Option_1.Option.none();
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on Stream, which is not a good data structure
     * for random access!
     */
    EmptyStream.prototype.get = function (idx) {
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    EmptyStream.prototype.find = function (predicate) {
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    EmptyStream.prototype.contains = function (v) {
        return false;
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    EmptyStream.prototype.take = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    EmptyStream.prototype.takeWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyStream.prototype.drop = function (n) {
        return this;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    EmptyStream.prototype.dropWhile = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    EmptyStream.prototype.dropRight = function (n) {
        return this;
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     Stream.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    EmptyStream.prototype.fold = function (zero, fn) {
        return zero;
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldLeft("!", (xs,x) => x+xs);
     *     => "cba!"
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    EmptyStream.prototype.foldLeft = function (zero, fn) {
        return zero;
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldRight("!", (x,xs) => xs+x);
     *     => "!cba"
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    EmptyStream.prototype.foldRight = function (zero, fn) {
        return zero;
    };
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Vector.of(1,2,3).zip(["a","b","c"])
     *     => Vector.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     */
    EmptyStream.prototype.zip = function (other) {
        return emptyStream;
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     Stream.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => Stream.of("a0", "b1")
     */
    EmptyStream.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Reverse the collection. For instance:
     *
     *     Stream.of(1,2,3).reverse();
     *     => Stream.of(3,2,1)
     */
    EmptyStream.prototype.reverse = function () {
        return this;
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    Stream.of(1,2,3,4,5,6).span(x => x <3)
     *    => [Stream.of(1,2), Stream.of(3,4,5,6)]
     */
    EmptyStream.prototype.span = function (predicate) {
        return [this, this];
    };
    /**
     * Split the collection at a specific index.
     *
     *     Stream.of(1,2,3,4,5).splitAt(3)
     *     => [Stream.of(1,2,3), Stream.of(4,5)]
     */
    EmptyStream.prototype.splitAt = function (index) {
        return [this, this];
    };
    /**
     * Returns a pair of two collections; the first one
     * will only contain the items from this collection for
     * which the predicate you give returns true, the second
     * will only contain the items from this collection where
     * the predicate returns false.
     *
     *     Stream.of(1,2,3,4).partition(x => x%2===0)
     *     => [Stream.of(2,4),Stream.of(1,3)]
     */
    EmptyStream.prototype.partition = function (predicate) {
        return [exports.Stream.empty(), exports.Stream.empty()];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsStream.arrangeBy]]
     */
    EmptyStream.prototype.groupBy = function (classifier) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsStream.groupBy]]
     */
    EmptyStream.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    EmptyStream.prototype.shuffle = function () {
        return exports.Stream.ofIterable(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Append an element at the end of this Stream.
     */
    EmptyStream.prototype.append = function (v) {
        return exports.Stream.of(v);
    };
    /*
     * Append multiple elements at the end of this Stream.
     */
    EmptyStream.prototype.appendAll = function (elts) {
        return exports.Stream.ofIterable(elts);
    };
    /**
     * Removes the first element matching the predicate
     * (use [[ConsStream.filter]] to remove all elements matching a predicate)
     */
    EmptyStream.prototype.removeFirst = function (predicate) {
        return this;
    };
    /*
     * Append another Stream at the end of this Stream.
     *
     * There is no function taking a javascript iterator,
     * because iterators are stateful and Streams lazy.
     * If we would create two Streams working on the same iterator,
     * the streams would interact with one another.
     * It also breaks the cycle() function.
     */
    EmptyStream.prototype.appendStream = function (elts) {
        return elts;
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    EmptyStream.prototype.prepend = function (elt) {
        return exports.Stream.of(elt);
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    EmptyStream.prototype.prependAll = function (elt) {
        return exports.Stream.ofIterable(elt);
    };
    /**
     * Repeat infinitely this Stream.
     * For instance:
     *
     *     Stream.of(1,2,3).cycle().take(8)
     *     => Stream.of(1,2,3,1,2,3,1,2)
     */
    EmptyStream.prototype.cycle = function () {
        return emptyStream;
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    EmptyStream.prototype.map = function (mapper) {
        return emptyStream;
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     */
    EmptyStream.prototype.mapOption = function (mapper) {
        return emptyStream;
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    EmptyStream.prototype.flatMap = function (mapper) {
        return emptyStream;
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    EmptyStream.prototype.allMatch = function (predicate) {
        return true;
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    EmptyStream.prototype.anyMatch = function (predicate) {
        return false;
    };
    EmptyStream.prototype.filter = function (predicate) {
        return this;
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     * also see [[ConsStream.sortOn]]
     */
    EmptyStream.prototype.sortBy = function (compare) {
        return this;
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     * also see [[ConsStream.sortBy]]
     */
    EmptyStream.prototype.sortOn = function (getKey) {
        return this;
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     Stream.of(1,1,2,3,2,3,1).distinctBy(x => x);
     *     => Stream.of(1,2,3)
     */
    EmptyStream.prototype.distinctBy = function (keyExtractor) {
        return this;
    };
    /**
     * Call a function for element in the collection.
     */
    EmptyStream.prototype.forEach = function (fn) {
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    EmptyStream.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.minOn]]
     */
    EmptyStream.prototype.minBy = function (compare) {
        return Option_1.Option.none();
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.minBy]]
     */
    EmptyStream.prototype.minOn = function (getNumber) {
        return Option_1.Option.none();
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.maxOn]]
     */
    EmptyStream.prototype.maxBy = function (compare) {
        return Option_1.Option.none();
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.maxBy]]
     */
    EmptyStream.prototype.maxOn = function (getNumber) {
        return Option_1.Option.none();
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     */
    EmptyStream.prototype.sumOn = function (getNumber) {
        return 0;
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     Stream.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(Stream.of(1,2,3), Stream.of(4,5,6), Stream.of(7,8))
     */
    EmptyStream.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     Vector.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    EmptyStream.prototype.mkString = function (separator) {
        return "";
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    EmptyStream.prototype.toArray = function () {
        return [];
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    EmptyStream.prototype.toVector = function () {
        return Vector_1.Vector.empty();
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     */
    EmptyStream.prototype.toMap = function (converter) {
        return HashMap_1.HashMap.empty();
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     Stream.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    EmptyStream.prototype.toSet = function (converter) {
        return HashSet_1.HashSet.empty();
    };
    /**
     * Convert this collection to a list.
     */
    EmptyStream.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    EmptyStream.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    EmptyStream.prototype.equals = function (other) {
        if (!other) {
            return false;
        }
        return other.isEmpty();
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    EmptyStream.prototype.hashCode = function () {
        return 1;
    };
    EmptyStream.prototype.inspect = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    EmptyStream.prototype.toString = function () {
        return "[]";
    };
    return EmptyStream;
}());
exports.EmptyStream = EmptyStream;
/**
 * ConsStream holds a value and a lazy pointer to a next element,
 * which could be [[ConsStream]] or [[EmptyStream]].
 * A ConsStream is basically a non-empty stream. It will
 * contain at least one element.
 * "static methods" available through [[StreamStatic]]
 * @param T the item type
 */
var ConsStream = /** @class */ (function () {
    /**
     * @hidden
     */
    function ConsStream(value, _tail) {
        this.value = value;
        this._tail = _tail;
        /**
         * @hidden
         */
        this.className = undefined; // https://stackoverflow.com/a/47841595/516188
    }
    /**
     * Implementation of the Iterator interface.
     */
    ConsStream.prototype[Symbol.iterator] = function () {
        var item = this;
        return {
            next: function () {
                if (item.isEmpty()) {
                    return { done: true, value: undefined };
                }
                var value = item.head().get();
                item = item.tail().get();
                return { done: false, value: value };
            }
        };
    };
    /**
     * View this Some a as Stream. Useful to help typescript type
     * inference sometimes.
     */
    ConsStream.prototype.asStream = function () {
        return this;
    };
    /**
     * @hidden
     */
    ConsStream.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * Get the length of the collection.
     */
    ConsStream.prototype.length = function () {
        return this.foldLeft(0, function (n, ignored) { return n + 1; });
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    ConsStream.prototype.single = function () {
        return this._tail.get().isEmpty() ?
            Option_1.Option.of(this.value) :
            Option_1.Option.none();
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    ConsStream.prototype.isEmpty = function () {
        return false;
    };
    /**
     * Get the first value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    ConsStream.prototype.head = function () {
        return Option_1.Option.some(this.value);
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    ConsStream.prototype.tail = function () {
        return Option_1.Option.some(this._tail.get());
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    ConsStream.prototype.last = function () {
        var curItem = this;
        while (true) {
            var item = curItem.value;
            curItem = curItem._tail.get();
            if (curItem.isEmpty()) {
                return Option_1.Option.some(item);
            }
        }
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     *
     * Careful this is going to have poor performance
     * on Stream, which is not a good data structure
     * for random access!
     */
    ConsStream.prototype.get = function (idx) {
        var curItem = this;
        var i = 0;
        while (!curItem.isEmpty()) {
            if (i === idx) {
                var item = curItem.value;
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail.get();
            ++i;
        }
        return Option_1.Option.none();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    ConsStream.prototype.find = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            var item = curItem.value;
            if (predicate(item)) {
                return Option_1.Option.of(item);
            }
            curItem = curItem._tail.get();
        }
        return Option_1.Option.none();
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    ConsStream.prototype.contains = function (v) {
        return this.find(function (x) { return Comparison_1.areEqual(x, v); }).isSome();
    };
    /**
     * Return a new stream keeping only the first n elements
     * from this stream.
     */
    ConsStream.prototype.take = function (n) {
        var _this = this;
        if (n < 1) {
            return emptyStream;
        }
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return _this._tail.get().take(n - 1); }));
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    ConsStream.prototype.takeWhile = function (predicate) {
        var _this = this;
        if (!predicate(this.value)) {
            return emptyStream;
        }
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return _this._tail.get().takeWhile(predicate); }));
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsStream.prototype.drop = function (n) {
        var i = n;
        var curItem = this;
        while (i-- > 0 && !curItem.isEmpty()) {
            curItem = curItem._tail.get();
        }
        return curItem;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    ConsStream.prototype.dropWhile = function (predicate) {
        var curItem = this;
        while (!curItem.isEmpty() && predicate(curItem.value)) {
            curItem = curItem._tail.get();
        }
        return curItem;
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    ConsStream.prototype.dropRight = function (n) {
        // going twice through the list...
        var length = this.length();
        return this.take(length - n);
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     Stream.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    ConsStream.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldLeft("!", (xs,x) => x+xs);
     *     => "cba!"
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    ConsStream.prototype.foldLeft = function (zero, fn) {
        var r = zero;
        var curItem = this;
        while (!curItem.isEmpty()) {
            r = fn(r, curItem.value);
            curItem = curItem._tail.get();
        }
        return r;
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldRight("!", (x,xs) => xs+x);
     *     => "!cba"
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    ConsStream.prototype.foldRight = function (zero, fn) {
        return this.reverse().foldLeft(zero, function (xs, x) { return fn(x, xs); });
    };
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Vector.of(1,2,3).zip(["a","b","c"])
     *     => Vector.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     */
    ConsStream.prototype.zip = function (other) {
        var _this = this;
        var otherIterator = other[Symbol.iterator]();
        var otherCurItem = otherIterator.next();
        if (this.isEmpty() || otherCurItem.done) {
            return emptyStream;
        }
        return new ConsStream([this.value, otherCurItem.value], Lazy_1.Lazy.of(function () {
            return _this._tail.get().zip((_a = {}, _a[Symbol.iterator] = function () { return otherIterator; }, _a));
            var _a;
        }));
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     Stream.of("a","b").zipWithIndex().map(([v,idx]) => v+idx);
     *     => Stream.of("a0", "b1")
     */
    ConsStream.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Reverse the collection. For instance:
     *
     *     Stream.of(1,2,3).reverse();
     *     => Stream.of(3,2,1)
     */
    ConsStream.prototype.reverse = function () {
        return this.foldLeft(emptyStream, function (xs, x) { return xs.prepend(x); });
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    Stream.of(1,2,3,4,5,6).span(x => x <3)
     *    => [Stream.of(1,2), Stream.of(3,4,5,6)]
     */
    ConsStream.prototype.span = function (predicate) {
        return [this.takeWhile(predicate), this.dropWhile(predicate)];
    };
    /**
     * Split the collection at a specific index.
     *
     *     Stream.of(1,2,3,4,5).splitAt(3)
     *     => [Stream.of(1,2,3), Stream.of(4,5)]
     */
    ConsStream.prototype.splitAt = function (index) {
        return [this.take(index), this.drop(index)];
    };
    /**
     * Returns a pair of two collections; the first one
     * will only contain the items from this collection for
     * which the predicate you give returns true, the second
     * will only contain the items from this collection where
     * the predicate returns false.
     *
     *     Stream.of(1,2,3,4).partition(x => x%2===0)
     *     => [Stream.of(2,4),Stream.of(1,3)]
     */
    ConsStream.prototype.partition = function (predicate) {
        // TODO goes twice over the list, can be optimized...
        return [this.filter(predicate), this.filter(function (x) { return !predicate(x); })];
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[ConsStream.arrangeBy]]
     */
    ConsStream.prototype.groupBy = function (classifier) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, v) {
            return acc.putWithMerge(classifier(v), exports.Stream.of(v), function (v1, v2) { return v1.appendStream(v2); });
        });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[ConsStream.groupBy]]
     */
    ConsStream.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Randomly reorder the elements of the collection.
     */
    ConsStream.prototype.shuffle = function () {
        return exports.Stream.ofIterable(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Append an element at the end of this Stream.
     */
    ConsStream.prototype.append = function (v) {
        var tail = this._tail.get();
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.append(v); }));
    };
    /*
     * Append multiple elements at the end of this Stream.
     */
    ConsStream.prototype.appendAll = function (elts) {
        return this.appendStream(exports.Stream.ofIterable(elts));
    };
    /**
     * Removes the first element matching the predicate
     * (use [[ConsStream.filter]] to remove all elements matching a predicate)
     */
    ConsStream.prototype.removeFirst = function (predicate) {
        var tail = this._tail.get();
        return predicate(this.value) ?
            tail :
            new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.removeFirst(predicate); }));
    };
    /*
     * Append another Stream at the end of this Stream.
     *
     * There is no function taking a javascript iterator,
     * because iterators are stateful and Streams lazy.
     * If we would create two Streams working on the same iterator,
     * the streams would interact with one another.
     * It also breaks the cycle() function.
     */
    ConsStream.prototype.appendStream = function (elts) {
        var tail = this._tail.get();
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.appendStream(elts); }));
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    ConsStream.prototype.prepend = function (elt) {
        var _this = this;
        return new ConsStream(elt, Lazy_1.Lazy.of(function () { return _this; }));
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    ConsStream.prototype.prependAll = function (elts) {
        return exports.Stream.ofIterable(elts).appendAll(this);
    };
    /**
     * Repeat infinitely this Stream.
     * For instance:
     *
     *     Stream.of(1,2,3).cycle().take(8)
     *     => Stream.of(1,2,3,1,2,3,1,2)
     */
    ConsStream.prototype.cycle = function () {
        return this._cycle(this);
    };
    ConsStream.prototype._cycle = function (toRepeat) {
        var tail = this._tail.get();
        return new ConsStream(this.value, Lazy_1.Lazy.of(function () { return tail.isEmpty() ? toRepeat.cycle() : tail._cycle(toRepeat); }));
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    ConsStream.prototype.map = function (mapper) {
        var _this = this;
        return new ConsStream(mapper(this.value), Lazy_1.Lazy.of(function () { return _this._tail.get().map(mapper); }));
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     */
    ConsStream.prototype.mapOption = function (mapper) {
        var _this = this;
        var mapped = mapper(this.value);
        return mapped.isSome() ?
            new ConsStream(mapped.get(), Lazy_1.Lazy.of(function () { return _this._tail.get().mapOption(mapper); })) :
            this._tail.get().mapOption(mapper);
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    ConsStream.prototype.flatMap = function (mapper) {
        return mapper(this.value).appendStream(this._tail.get().flatMap(mapper));
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    ConsStream.prototype.allMatch = function (predicate) {
        return this.find(function (x) { return !predicate(x); }).isNone();
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    ConsStream.prototype.anyMatch = function (predicate) {
        return this.find(predicate).isSome();
    };
    ConsStream.prototype.filter = function (predicate) {
        var _this = this;
        return predicate(this.value) ?
            new ConsStream(this.value, Lazy_1.Lazy.of(function () { return _this._tail.get().filter(predicate); })) :
            this._tail.get().filter(predicate);
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     * also see [[ConsStream.sortOn]]
     */
    ConsStream.prototype.sortBy = function (compare) {
        return exports.Stream.ofIterable(this.toArray().sort(compare));
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     * also see [[ConsStream.sortBy]]
     */
    ConsStream.prototype.sortOn = function (getKey) {
        return SeqHelpers.sortOn(this, getKey);
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     Stream.of(1,1,2,3,2,3,1).distinctBy(x => x);
     *     => Stream.of(1,2,3)
     */
    ConsStream.prototype.distinctBy = function (keyExtractor) {
        return SeqHelpers.distinctBy(this, keyExtractor);
    };
    /**
     * Call a function for element in the collection.
     */
    ConsStream.prototype.forEach = function (fn) {
        var curItem = this;
        while (!curItem.isEmpty()) {
            fn(curItem.value);
            curItem = curItem._tail.get();
        }
        return this;
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    ConsStream.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.minOn]]
     */
    ConsStream.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.minBy]]
     */
    ConsStream.prototype.minOn = function (getNumber) {
        return SeqHelpers.minOn(this, getNumber);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.maxOn]]
     */
    ConsStream.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[ConsStream.maxBy]]
     */
    ConsStream.prototype.maxOn = function (getNumber) {
        return SeqHelpers.maxOn(this, getNumber);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     */
    ConsStream.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     Stream.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(Stream.of(1,2,3), Stream.of(4,5,6), Stream.of(7,8))
     */
    ConsStream.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     Vector.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    ConsStream.prototype.mkString = function (separator) {
        var r = "";
        var curItem = this;
        var isNotFirst = false;
        while (!curItem.isEmpty()) {
            if (isNotFirst) {
                r += separator;
            }
            r += SeqHelpers.toStringHelper(curItem.value, { quoteStrings: false });
            curItem = curItem._tail.get();
            isNotFirst = true;
        }
        return r;
    };
    /**
     * Convert to array.
     * Don't do it on an infinite stream!
     */
    ConsStream.prototype.toArray = function () {
        var r = [];
        var curItem = this;
        while (!curItem.isEmpty()) {
            r.push(curItem.value);
            curItem = curItem._tail.get();
        }
        return r;
    };
    /**
     * Convert to vector.
     * Don't do it on an infinite stream!
     */
    ConsStream.prototype.toVector = function () {
        return Vector_1.Vector.ofIterable(this.toArray());
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     */
    ConsStream.prototype.toMap = function (converter) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, cur) {
            var converted = converter(cur);
            return acc.put(converted[0], converted[1]);
        });
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     Stream.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    ConsStream.prototype.toSet = function (converter) {
        return this.foldLeft(HashSet_1.HashSet.empty(), function (acc, cur) {
            return acc.add(converter(cur));
        });
    };
    /**
     * Convert this collection to a list.
     */
    ConsStream.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.ofIterable(this);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    ConsStream.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    ConsStream.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other.tail) {
            return false;
        }
        Contract_1.contractTrueEquality("Stream.equals", this, other);
        var myVal = this;
        var hisVal = other;
        while (true) {
            if (myVal.isEmpty() !== hisVal.isEmpty()) {
                return false;
            }
            if (myVal.isEmpty()) {
                // they are both empty, end of the stream
                return true;
            }
            var myHead = myVal.value;
            var hisHead = hisVal.value;
            if ((myHead === undefined) !== (hisHead === undefined)) {
                return false;
            }
            if (myHead === undefined || hisHead === undefined) {
                // they are both undefined, the || is for TS's flow analysis
                // so he realizes none of them is undefined after this.
                continue;
            }
            if (!Comparison_1.areEqual(myHead, hisHead)) {
                return false;
            }
            myVal = myVal._tail.get();
            hisVal = hisVal._tail.get();
        }
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    ConsStream.prototype.hashCode = function () {
        var hash = 1;
        var curItem = this;
        while (!curItem.isEmpty()) {
            hash = 31 * hash + Comparison_1.getHashCode(curItem.value);
            curItem = curItem._tail.get();
        }
        return hash;
    };
    ConsStream.prototype.inspect = function () {
        return this.toString();
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    ConsStream.prototype.toString = function () {
        var curItem = this;
        var result = "Stream(";
        while (!curItem.isEmpty()) {
            result += SeqHelpers.toStringHelper(curItem.value);
            var tail = curItem._tail;
            if (!tail.isEvaluated()) {
                result += ", ?";
                break;
            }
            curItem = tail.get();
            if (!curItem.isEmpty()) {
                result += ", ";
            }
        }
        return result + ")";
    };
    return ConsStream;
}());
exports.ConsStream = ConsStream;
var emptyStream = new EmptyStream();

},{"./Comparison":2,"./Contract":3,"./HashMap":6,"./HashSet":7,"./Lazy":9,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Vector":16}],15:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Option_1 = require("./Option");
var Vector_1 = require("./Vector");
var LinkedList_1 = require("./LinkedList");
var Comparison_1 = require("./Comparison");
var SeqHelpers_1 = require("./SeqHelpers");
var Contract_1 = require("./Contract");
/**
 * Contains a pair of two values, which may or may not have the same type.
 * Compared to the builtin typescript [T,U] type, we get equality semantics
 * and helper functions (like mapping and so on).
 * @param T the first item type
 * @param U the second item type
 */
var Tuple2 = /** @class */ (function () {
    function Tuple2(_fst, _snd) {
        this._fst = _fst;
        this._snd = _snd;
    }
    /**
     * Build a pair of value from both values.
     */
    Tuple2.of = function (fst, snd) {
        return new Tuple2(fst, snd);
    };
    /**
     * Build a tuple2 from javascript array. Compared to [[Tuple2.ofPair]],
     * it checks the length of the array and will return [[None]] in case
     * the length isn't two. However the types of the elements aren't checked.
     */
    Tuple2.ofArray = function (pair) {
        if (pair && pair.length === 2) {
            return Option_1.Option.of(new Tuple2(pair[0], pair[1]));
        }
        return Option_1.Option.none();
    };
    /**
     * Build a tuple2 from javascript pair.
     * Also see [[Tuple2.ofArray]]
     */
    Tuple2.ofPair = function (pair) {
        return new Tuple2(pair[0], pair[1]);
    };
    /**
     * @hidden
     */
    Tuple2.prototype.hasTrueEquality = function () {
        return Option_1.Option.of(this.fst()).hasTrueEquality() &&
            Option_1.Option.of(this.snd()).hasTrueEquality();
    };
    /**
     * Extract the first value from the pair
     */
    Tuple2.prototype.fst = function () {
        return this._fst;
    };
    /**
     * Extract the second value from the pair
     */
    Tuple2.prototype.snd = function () {
        return this._snd;
    };
    /**
     * Maps the first component of this tuple to a new value.
     */
    Tuple2.prototype.map1 = function (fn) {
        return new Tuple2(fn(this._fst), this._snd);
    };
    /**
     * Maps the second component of this tuple to a new value.
     */
    Tuple2.prototype.map2 = function (fn) {
        return new Tuple2(this._fst, fn(this._snd));
    };
    /**
     * Make a new tuple by mapping both values inside this one.
     */
    Tuple2.prototype.map = function (fn) {
        return fn(this._fst, this._snd);
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Tuple2.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Tuple2.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || !other._fst) {
            return false;
        }
        Contract_1.contractTrueEquality("Tuple2.equals", this, other);
        return Comparison_1.areEqual(this._fst, other._fst) &&
            Comparison_1.areEqual(this._snd, other._snd);
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Tuple2.prototype.hashCode = function () {
        return Comparison_1.getHashCode(this._fst) * 53 + Comparison_1.getHashCode(this._snd);
    };
    /**
     * Convert the tuple to a javascript pair.
     * Compared to [[Tuple2.toArray]], it behaves the
     * same at runtime, the only difference is the
     * typescript type definition.
     */
    Tuple2.prototype.toPair = function () {
        return [this._fst, this._snd];
    };
    /**
     * Convert the tuple to a javascript array.
     * Compared to [[Tuple2.toPair]], it behaves the
     * same at runtime, the only difference is the
     * typescript type definition.
     */
    Tuple2.prototype.toArray = function () {
        return [this._fst, this._snd];
    };
    /**
     * Convert the tuple to a vector.
     */
    Tuple2.prototype.toVector = function () {
        return Vector_1.Vector.of(this._fst, this._snd);
    };
    /**
     * Convert the tuple to a linked list.
     */
    Tuple2.prototype.toLinkedList = function () {
        return LinkedList_1.LinkedList.of(this._fst, this._snd);
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Tuple2.prototype.toString = function () {
        return "Tuple2(" + SeqHelpers_1.toStringHelper(this._fst) + ", " + SeqHelpers_1.toStringHelper(this._snd) + ")";
    };
    /**
     * Used by the node REPL to display values.
     * Most of the time should be the same as toString()
     */
    Tuple2.prototype.inspect = function () {
        return this.toString();
    };
    return Tuple2;
}());
exports.Tuple2 = Tuple2;

},{"./Comparison":2,"./Contract":3,"./LinkedList":10,"./Option":11,"./SeqHelpers":13,"./Vector":16}],16:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var Option_1 = require("./Option");
var HashMap_1 = require("./HashMap");
var HashSet_1 = require("./HashSet");
var Comparison_1 = require("./Comparison");
var SeqHelpers = require("./SeqHelpers");
var nodeBits = 5;
var nodeSize = (1 << nodeBits); // 32
var nodeBitmask = nodeSize - 1;
/**
 * A general-purpose list class with all-around good performance.
 * quasi-O(1) (actually O(log32(n))) access, append, replace.
 * It's backed by a bit-mapped vector trie.
 * @param T the item type
 */
var Vector = /** @class */ (function () {
    // Based on https://github.com/graue/immutable-vector from Scott Feeney.
    /**
     * @hidden
     */
    // _contents will be undefined only if length===0
    function Vector(_contents, _length, _maxShift) {
        this._contents = _contents;
        this._length = _length;
        this._maxShift = _maxShift;
    }
    /**
     * The empty vector.
     * @param T the item type
     */
    Vector.empty = function () {
        return Vector.ofArray([]);
    };
    /**
     * Build a vector from a series of items (any number, as parameters)
     * @param T the item type
     */
    Vector.of = function () {
        var data = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            data[_i] = arguments[_i];
        }
        return Vector.ofArray(data);
    };
    /**
     * Build a vector from any iterable, which means also
     * an array for instance.
     * @param T the item type
     */
    Vector.ofIterable = function (elts) {
        if (Array.isArray(elts)) {
            return Vector.ofArray(elts);
        }
        // I measure appendAll to be 2x faster than Array.from on my
        // machine (node 6.11.3+8.8.0)
        // return Vector.ofArray(Array.from(elts));
        return Vector.empty().appendAll(elts);
    };
    Vector.ofArray = function (data) {
        var nodes = [];
        var i = 0;
        for (; i < data.length - (data.length % nodeSize); i += nodeSize) {
            var node = data.slice(i, i + nodeSize);
            nodes.push(node);
        }
        // potentially one non-full node to add.
        if (data.length - i > 0) {
            var extraNode = new Array(nodeSize);
            for (var idx = 0; i + idx < data.length; idx++) {
                extraNode[idx] = data[i + idx];
            }
            nodes.push(extraNode);
        }
        return Vector.fromLeafNodes(nodes, data.length);
    };
    /**
     * Build a new vector from the leaf nodes containing data.
     */
    Vector.fromLeafNodes = function (nodes, length) {
        var depth = 1;
        while (nodes.length > 1) {
            var lowerNodes = nodes;
            nodes = [];
            for (var i = 0; i < lowerNodes.length; i += nodeSize) {
                var node = lowerNodes.slice(i, i + nodeSize);
                nodes.push(node);
            }
            depth++;
        }
        var _contents = nodes[0];
        var _maxShift = _contents ? nodeBits * (depth - 1) : 0;
        return new Vector(_contents, length, _maxShift);
    };
    /**
     * Get the length of the collection.
     */
    Vector.prototype.length = function () {
        return this._length;
    };
    /**
     * true if the collection is empty, false otherwise.
     */
    Vector.prototype.isEmpty = function () {
        return this._length === 0;
    };
    /**
     * Get an empty mutable vector. Append is much more efficient, and you can
     * get a normal vector from it.
     */
    Vector.emptyMutable = function () {
        return Vector.appendToMutable(Vector.empty(), undefined);
    };
    /**
     * Get a mutable vector from an immutable one, however you must add a
     * a value to the immutable vector at least once, so that the last
     * node is modified to a temporary vector, because we can't modify
     * the nodes from the original immutable vector.
     * Note that is only safe because the only modifying operation on
     * mutable vector is append at the end (so we know other tiles besides
     * the last one won't be modified).
     */
    Vector.appendToMutable = function (vec, toAppend) {
        // i don't want to offer even a private API to get a mutable vector from
        // an immutable one without adding a value to protect the last node, but
        // I need it for emptyMutable(), so I have this trick with undefined and any.
        if (typeof toAppend !== "undefined") {
            vec = vec.append(toAppend);
        }
        var append = function (val) {
            if (vec._length < (nodeSize << vec._maxShift)) {
                var index = vec._length;
                var node = vec._contents || (vec._contents = new Array(nodeSize));
                var shift = vec._maxShift;
                while (shift > 0) {
                    var childIndex = (index >> shift) & nodeBitmask;
                    if (!node[childIndex]) {
                        // Need to create new node. Can happen when appending element.
                        node[childIndex] = new Array(nodeSize);
                    }
                    node = node[childIndex];
                    shift -= nodeBits;
                }
                node[index & nodeBitmask] = val;
                ++vec._length;
            }
            else {
                // We'll need a new root node.
                vec = Vector.setupNewRootNode(vec, val);
            }
        };
        return {
            append: append,
            appendAll: function (elts) {
                var iterator = elts[Symbol.iterator]();
                var curItem = iterator.next();
                while (!curItem.done) {
                    append(curItem.value);
                    curItem = iterator.next();
                }
            },
            internalGet: function (idx) { return vec.internalGet(idx); },
            getVector: function () { return vec; }
        };
    };
    /**
     * Dual to the foldRight function. Build a collection from a seed.
     * Takes a starting element and a function.
     * It applies the function on the starting element; if the
     * function returns None, it stops building the list, if it
     * returns Some of a pair, it adds the first element to the result
     * and takes the second element as a seed to keep going.
     *
     *     Vector.unfoldRight(
     *          10, x=>Option.of(x)
     *              .filter(x => x!==0)
     *              .map<[number,number]>(x => [x,x-1]))
     *     => Vector.of(10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
     */
    Vector.unfoldRight = function (seed, fn) {
        var nextVal = fn(seed);
        var r = Vector.emptyMutable();
        while (nextVal.isSome()) {
            r.append(nextVal.get()[0]);
            nextVal = fn(nextVal.get()[1]);
        }
        return r.getVector();
    };
    Vector.prototype.cloneVec = function () {
        return new Vector(this._contents, this._length, this._maxShift);
    };
    // WILL blow up if you give out of bounds index!
    // it's the caller's responsability to check bounds.
    Vector.prototype.internalGet = function (index) {
        var shift = this._maxShift;
        var node = this._contents;
        while (shift > 0) {
            node = node[(index >> shift) & nodeBitmask];
            shift -= nodeBits;
        }
        return node[index & nodeBitmask];
    };
    /**
     * Retrieve the element at index idx.
     * Returns an option because the collection may
     * contain less elements than the index.
     */
    Vector.prototype.get = function (index) {
        if (index < 0 || index >= this._length) {
            return Option_1.Option.none();
        }
        return Option_1.Option.of(this.internalGet(index));
    };
    /**
     * If the collection contains a single element,
     * return Some of its value, otherwise return None.
     */
    Vector.prototype.single = function () {
        return this._length === 1 ?
            this.head() :
            Option_1.Option.none();
    };
    // OK to call with index === vec.length (an append) as long as vector
    // length is not a (nonzero) power of the branching factor (32, 1024, ...).
    // Cannot be called on the empty vector!! It would crash
    Vector.prototype.internalSet = function (index, val) {
        var newVec = this.cloneVec();
        // next line will crash on empty vector
        var node = newVec._contents = this._contents.slice();
        var shift = this._maxShift;
        while (shift > 0) {
            var childIndex = (index >> shift) & nodeBitmask;
            if (node[childIndex]) {
                node[childIndex] = node[childIndex].slice();
            }
            else {
                // Need to create new node. Can happen when appending element.
                node[childIndex] = new Array(nodeSize);
            }
            node = node[childIndex];
            shift -= nodeBits;
        }
        node[index & nodeBitmask] = val;
        return newVec;
    };
    /**
     * Replace the value of element at the index you give.
     * Will throw if the index is out of bounds!
     */
    Vector.prototype.replace = function (index, val) {
        if (index >= this._length || index < 0) {
            throw new Error('Vector.replace: index is out of range: ' + index);
        }
        return this.internalSet(index, val);
    };
    /**
     * Append an element at the end of the collection.
     */
    Vector.prototype.append = function (val) {
        if (this._length === 0) {
            return Vector.ofArray([val]);
        }
        else if (this._length < (nodeSize << this._maxShift)) {
            var newVec = this.internalSet(this._length, val);
            newVec._length++;
            return newVec;
        }
        else {
            // We'll need a new root node.
            return Vector.setupNewRootNode(this, val);
        }
    };
    Vector.setupNewRootNode = function (vec, val) {
        var newVec = vec.cloneVec();
        newVec._length++;
        newVec._maxShift += nodeBits;
        var node = [];
        newVec._contents = [vec._contents, node];
        var depth = newVec._maxShift / nodeBits + 1;
        for (var i = 2; i < depth; i++) {
            var newNode = [];
            node.push(newNode);
            node = newNode;
        }
        node[0] = val;
        return newVec;
    };
    /**
     * Append multiple elements at the end of the collection.
     * Note that arrays are also iterables.
     */
    Vector.prototype.appendAll = function (elts) {
        var iterator = elts[Symbol.iterator]();
        var curItem = iterator.next();
        if (curItem.done) {
            return this;
        }
        // first need to create a new Vector through the first append
        // call, and then we can mutate that new Vector, otherwise
        // we'll mutate the receiver which is a big no-no!!
        var mutVec = Vector.appendToMutable(this, curItem.value);
        curItem = iterator.next();
        while (!curItem.done) {
            mutVec.append(curItem.value);
            curItem = iterator.next();
        }
        return mutVec.getVector();
    };
    /**
     * Get the first value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    Vector.prototype.head = function () {
        return this.get(0);
    };
    /**
     * Get the last value of the collection, if any.
     * returns Option.Some if the collection is not empty,
     * Option.None if it's empty.
     */
    Vector.prototype.last = function () {
        if (this._length === 0) {
            return Option_1.Option.none();
        }
        return Option_1.Option.of(this.internalGet(this._length - 1));
    };
    /**
     * Return a new vector containing all the elements in this
     * vector except the last one, or the empty vector if this
     * is the empty vector.
     *
     *     Vector.of(1,2,3).init()
     *     => Vector.of(1,2)
     */
    Vector.prototype.init = function () {
        var popped;
        if (this._length === 0) {
            return this;
        }
        if (this._length === 1) {
            return Vector.empty();
        }
        if ((this._length & nodeBitmask) !== 1) {
            popped = this.internalSet(this._length - 1, null);
        }
        else if (this._length - 1 === nodeSize << (this._maxShift - nodeBits)) {
            popped = this.cloneVec();
            popped._contents = this._contents[0]; // length>0 => _contents!==undefined
            popped._maxShift = this._maxShift - nodeBits;
        }
        else {
            popped = this.cloneVec();
            // we know the vector is not empty, there is a if at the top
            // of the function => ok to cast to any[]
            var node = popped._contents = popped._contents.slice();
            var shift = this._maxShift;
            var removedIndex = this._length - 1;
            while (shift > nodeBits) {
                var localIndex = (removedIndex >> shift) & nodeBitmask;
                node = node[localIndex] = node[localIndex].slice();
                shift -= nodeBits;
            }
            node[(removedIndex >> shift) & nodeBitmask] = null;
        }
        popped._length--;
        return popped;
    };
    /**
     * Returns a new collection, discarding the first elements
     * until one element fails the predicate. All elements
     * after that point are retained.
     */
    Vector.prototype.dropWhile = function (predicate) {
        var r = Vector.emptyMutable();
        var skip = true;
        for (var i = 0; i < this._length; i++) {
            var val = this.internalGet(i);
            if (skip && !predicate(val)) {
                skip = false;
            }
            if (!skip) {
                r.append(val);
            }
        }
        return r.getVector();
    };
    /**
     * Search for an item matching the predicate you pass,
     * return Option.Some of that element if found,
     * Option.None otherwise.
     */
    Vector.prototype.find = function (predicate) {
        for (var i = 0; i < this._length; i++) {
            var item = this.internalGet(i);
            if (predicate(item)) {
                return Option_1.Option.of(item);
            }
        }
        return Option_1.Option.none();
    };
    /**
     * Returns true if the predicate returns true for all the
     * elements in the collection.
     */
    Vector.prototype.allMatch = function (predicate) {
        return this.find(function (x) { return !predicate(x); }).isNone();
    };
    /**
     * Returns true if there the predicate returns true for any
     * element in the collection.
     */
    Vector.prototype.anyMatch = function (predicate) {
        return this.find(predicate).isSome();
    };
    /**
     * Returns a pair of two collections; the first one
     * will only contain the items from this collection for
     * which the predicate you give returns true, the second
     * will only contain the items from this collection where
     * the predicate returns false.
     *
     *     Vector.of(1,2,3,4).partition(x => x%2===0)
     *     => [Vector.of(2,4),Vector.of(1,3)]
     */
    Vector.prototype.partition = function (predicate) {
        // TODO goes twice over the list, can be optimized...
        return [this.filter(predicate), this.filter(function (x) { return !predicate(x); })];
    };
    /**
     * Returns true if the item is in the collection,
     * false otherwise.
     */
    Vector.prototype.contains = function (v) {
        return this.find(function (x) { return Comparison_1.areEqual(x, v); }).isSome();
    };
    /**
     * Group elements in the collection using a classifier function.
     * Elements are then organized in a map. The key is the value of
     * the classifier, and in value we get the list of elements
     * matching that value.
     *
     * also see [[Vector.arrangeBy]]
     */
    Vector.prototype.groupBy = function (classifier) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, v) {
            return acc.putWithMerge(classifier(v), Vector.appendToMutable(Vector.empty(), v), function (v1, v2) {
                v1.append(v2.internalGet(0));
                return v1;
            });
        })
            .mapValues(function (mutVec) { return mutVec.getVector(); });
    };
    /**
     * Matches each element with a unique key that you extract from it.
     * If the same key is present twice, the function will return None.
     *
     * also see [[Vector.groupBy]]
     */
    Vector.prototype.arrangeBy = function (getKey) {
        return SeqHelpers.arrangeBy(this, getKey);
    };
    /**
     * Remove duplicate items; elements are mapped to keys, those
     * get compared.
     *
     *     Vector.of(1,1,2,3,2,3,1).distinctBy(x => x);
     *     => Vector.of(1,2,3)
     */
    Vector.prototype.distinctBy = function (keyExtractor) {
        return SeqHelpers.distinctBy(this, keyExtractor);
    };
    Vector.prototype[Symbol.iterator] = function () {
        var _this = this;
        var _index = -1;
        var _stack = [];
        var _node = this._contents;
        var sz = nodeSize - 1;
        return {
            next: function () {
                // Iterator state:
                //  _node: "Current" leaf node, meaning the one we returned a value from
                //         on the previous call.
                //  _index: Index (within entire vector, not node) of value returned last
                //          time.
                //  _stack: Path we traveled to current node, as [node, local index]
                //          pairs, starting from root node, not including leaf.
                if (_index === _this._length - 1) {
                    return { done: true, value: undefined };
                }
                if (_index > 0 && (_index & nodeBitmask) === sz) {
                    // Using the stack, go back up the tree, stopping when we reach a node
                    // whose children we haven't fully iterated over.
                    var step = void 0;
                    while ((step = _stack.pop())[1] === sz)
                        ;
                    step[1]++;
                    _stack.push(step);
                    _node = step[0][step[1]];
                }
                for (var shift = _stack.length * nodeBits; shift < _this._maxShift; shift += nodeBits) {
                    _stack.push([_node, 0]);
                    _node = _node[0];
                }
                ++_index;
                return { value: _node[_index & nodeBitmask], done: false };
            }
        };
    };
    /**
     * Call a function for element in the collection.
     */
    Vector.prototype.forEach = function (fun) {
        for (var i = 0; i < this._length; i++) {
            fun(this.internalGet(i));
        }
        return this;
    };
    /**
     * Return a new collection where each element was transformed
     * by the mapper function you give.
     */
    Vector.prototype.map = function (fun) {
        var mutVec = Vector.emptyMutable();
        for (var i = 0; i < this._length; i++) {
            mutVec.append(fun(this.internalGet(i)));
        }
        return mutVec.getVector();
    };
    Vector.prototype.filter = function (fun) {
        var mutVec = Vector.emptyMutable();
        for (var i = 0; i < this._length; i++) {
            var value = this.internalGet(i);
            if (fun(value)) {
                mutVec.append(value);
            }
        }
        return mutVec.getVector();
    };
    /**
     * Apply the mapper function on every element of this collection.
     * The mapper function returns an Option; if the Option is a Some,
     * the value it contains is added to the result Collection, if it's
     * a None, the value is discarded.
     */
    Vector.prototype.mapOption = function (mapper) {
        var mutVec = Vector.emptyMutable();
        for (var i = 0; i < this._length; i++) {
            var v = mapper(this.internalGet(i));
            if (v.isSome()) {
                mutVec.append(v.get());
            }
        }
        return mutVec.getVector();
    };
    /**
     * Calls the function you give for each item in the collection,
     * your function returns a collection, all the collections are
     * concatenated.
     * This is the monadic bind.
     */
    Vector.prototype.flatMap = function (mapper) {
        var mutVec = Vector.emptyMutable();
        for (var i = 0; i < this._length; i++) {
            mutVec.appendAll(mapper(this.internalGet(i)));
        }
        return mutVec.getVector();
    };
    /**
     * Reduces the collection to a single value using the
     * associative binary function you give. Since the function
     * is associative, order of application doesn't matter.
     *
     * Example:
     *
     *     Vector.of(1,2,3).fold(0, (a,b) => a + b);
     *     => 6
     */
    Vector.prototype.fold = function (zero, fn) {
        return this.foldLeft(zero, fn);
    };
    /**
     * Reduces the collection to a single value.
     * Left-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldLeft("!", (xs,x) => x+xs);
     *     => "cba!"
     *
     * @param zero The initial value
     * @param fn A function taking the previous value and
     *           the current collection item, and returning
     *           an updated value.
     */
    Vector.prototype.foldLeft = function (zero, fn) {
        var acc = zero;
        for (var i = 0; i < this._length; i++) {
            acc = fn(acc, this.internalGet(i));
        }
        return acc;
    };
    /**
     * Reduces the collection to a single value.
     * Right-associative.
     *
     * Example:
     *
     *     Vector.of("a", "b", "c").foldRight("!", (x,xs) => xs+x);
     *     => "!cba"
     *
     * @param zero The initial value
     * @param fn A function taking the current collection item and
     *           the previous value , and returning
     *           an updated value.
     */
    Vector.prototype.foldRight = function (zero, fn) {
        var r = zero;
        for (var i = this._length - 1; i >= 0; i--) {
            r = fn(this.internalGet(i), r);
        }
        return r;
    };
    // indexOf(element:T, fromIndex:number): number {
    //     if (fromIndex === undefined) {
    //         fromIndex = 0;
    //     } else {
    //         fromIndex >>>= 0;
    //     }
    //     let isImmutableCollection = ImmutableVector.isImmutableVector(element);
    //     for (let index = fromIndex; index < this.length; index++) {
    //         let val = this.get(index);
    //         if (isImmutableCollection) {
    //             if (element.equals(this.get(index))) return index;
    //         } else {
    //             if (element === this.internalGet(index)) return index;
    //         }
    //     }
    //     return -1;
    // }
    /**
     * Randomly reorder the elements of the collection.
     */
    Vector.prototype.shuffle = function () {
        return Vector.ofArray(SeqHelpers.shuffle(this.toArray()));
    };
    /**
     * Transform this value to another value type.
     * Enables fluent-style programming by chaining calls.
     */
    Vector.prototype.transform = function (converter) {
        return converter(this);
    };
    /**
     * Two objects are equal if they represent the same value,
     * regardless of whether they are the same object physically
     * in memory.
     */
    Vector.prototype.equals = function (other) {
        if (other === this) {
            return true;
        }
        if (!other || (other._maxShift === undefined)) {
            return false;
        }
        if (this._length !== other._length)
            return false;
        for (var i = 0; i < this._length; i++) {
            var myVal = this.internalGet(i);
            var hisVal = other.internalGet(i);
            if ((myVal === undefined) !== (hisVal === undefined)) {
                return false;
            }
            if (myVal === undefined || hisVal === undefined) {
                // they are both undefined, the || is for TS's flow analysis
                // so he realizes none of them is undefined after this.
                continue;
            }
            if (!Comparison_1.areEqual(myVal, hisVal)) {
                return false;
            }
        }
        return true;
    };
    /**
     * Get a number for that object. Two different values
     * may get the same number, but one value must always get
     * the same number. The formula can impact performance.
     */
    Vector.prototype.hashCode = function () {
        var hash = 1;
        for (var i = 0; i < this._length; i++) {
            hash = 31 * hash + Comparison_1.getHashCode(this.internalGet(i));
        }
        return hash;
    };
    /**
     * Get a human-friendly string representation of that value.
     */
    Vector.prototype.toString = function () {
        var r = "Vector(";
        for (var i = 0; i < this._length; i++) {
            if (i > 0) {
                r += ", ";
            }
            r += SeqHelpers.toStringHelper(this.internalGet(i));
        }
        return r + ")";
    };
    /**
     * Used by the node REPL to display values.
     * Most of the time should be the same as toString()
     */
    Vector.prototype.inspect = function () {
        return this.toString();
    };
    /**
     * Joins elements of the collection by a separator.
     * Example:
     *
     *     Vector.of(1,2,3).mkString(", ")
     *     => "1, 2, 3"
     */
    Vector.prototype.mkString = function (separator) {
        var r = "";
        for (var i = 0; i < this._length; i++) {
            if (i > 0) {
                r += separator;
            }
            r += SeqHelpers.toStringHelper(this.internalGet(i), { quoteStrings: false });
        }
        return r;
    };
    /**
     * Returns a new collection with elements
     * sorted according to the comparator you give.
     *
     * also see [[Vector.sortOn]]
     */
    Vector.prototype.sortBy = function (compare) {
        return Vector.ofArray(this.toArray().sort(compare));
    };
    /**
     * Give a function associating a number or a string with
     * elements from the collection, and the elements
     * are sorted according to that value.
     *
     * also see [[Vector.sortBy]]
     */
    Vector.prototype.sortOn = function (getKey) {
        return SeqHelpers.sortOn(this, getKey);
    };
    /**
     * Convert this collection to a map. You give a function which
     * for each element in the collection returns a pair. The
     * key of the pair will be used as a key in the map, the value,
     * as a value in the map. If several values get the same key,
     * entries will be lost.
     */
    Vector.prototype.toMap = function (converter) {
        return this.foldLeft(HashMap_1.HashMap.empty(), function (acc, cur) {
            var converted = converter(cur);
            return acc.put(converted[0], converted[1]);
        });
    };
    /**
     * Convert this collection to a set. Since the elements of the
     * Seq may not support equality, you must pass a function returning
     * a value supporting equality.
     *
     *     Vector.of(1,2,3,3,4).toSet(x=>x)
     *     => HashSet.of(1,2,3,4)
     */
    Vector.prototype.toSet = function (converter) {
        return this.foldLeft(HashSet_1.HashSet.empty(), function (acc, cur) {
            return acc.add(converter(cur));
        });
    };
    /**
     * Convert to array.
     */
    Vector.prototype.toArray = function () {
        var out = new Array(this._length);
        for (var i = 0; i < this._length; i++) {
            out[i] = this.internalGet(i);
        }
        return out;
        // alternative implementation, measured slower
        // (concat is creating a new array everytime) =>
        //
        // const nodes = this.getLeafNodes(this._length);
        // return [].concat.apply([], nodes).slice(0,this._length);
    };
    ;
    /**
     * @hidden
     */
    Vector.prototype.hasTrueEquality = function () {
        return SeqHelpers.seqHasTrueEquality(this);
    };
    /**
     * Combine this collection with the collection you give in
     * parameter to produce a new collection which combines both,
     * in pairs. For instance:
     *
     *     Vector.of(1,2,3).zip(["a","b","c"])
     *     => Vector.of([1,"a"], [2,"b"], [3,"c"])
     *
     * The result collection will have the length of the shorter
     * of both collections. Extra elements will be discarded.
     */
    Vector.prototype.zip = function (other) {
        var r = Vector.emptyMutable();
        var thisIterator = this[Symbol.iterator]();
        var otherIterator = other[Symbol.iterator]();
        var thisCurItem = thisIterator.next();
        var otherCurItem = otherIterator.next();
        while (!thisCurItem.done && !otherCurItem.done) {
            r.append([thisCurItem.value, otherCurItem.value]);
            thisCurItem = thisIterator.next();
            otherCurItem = otherIterator.next();
        }
        return r.getVector();
    };
    /**
     * Reverse the collection. For instance:
     *
     *     Vector.of(1,2,3).reverse();
     *     => Vector.of(3,2,1)
     */
    Vector.prototype.reverse = function () {
        var mutVec = Vector.emptyMutable();
        for (var i = this._length - 1; i >= 0; i--) {
            mutVec.append(this.internalGet(i));
        }
        return mutVec.getVector();
    };
    /**
     * Combine this collection with the index of the elements
     * in it. Handy if you need the index when you map on
     * the collection for instance:
     *
     *     Vector.of("a","b").zipWithIndex().map(([v,idx]) => v+idx)
     *     => Vector.of("a0", "b1")
     */
    Vector.prototype.zipWithIndex = function () {
        return SeqHelpers.zipWithIndex(this);
    };
    /**
     * Returns a new collection, discarding the elements
     * after the first element which fails the predicate.
     */
    Vector.prototype.takeWhile = function (predicate) {
        for (var i = 0; i < this._length; i++) {
            if (!predicate(this.internalGet(i))) {
                return this.take(i);
            }
        }
        return this;
    };
    /**
     * Split the collection at a specific index.
     *
     *     Vector.of(1,2,3,4,5).splitAt(3)
     *     => [Vector.of(1,2,3), Vector.of(4,5)]
     */
    Vector.prototype.splitAt = function (index) {
        return [this.take(index), this.drop(index)];
    };
    /**
     * Takes a predicate; returns a pair of collections.
     * The first one is the longest prefix of this collection
     * which satisfies the predicate, and the second collection
     * is the remainder of the collection.
     *
     *    Vector.of(1,2,3,4,5,6).span(x => x <3)
     *    => [Vector.of(1,2), Vector.of(3,4,5,6)]
     */
    Vector.prototype.span = function (predicate) {
        var first = this.takeWhile(predicate);
        return [first, this.drop(first.length())];
    };
    /**
     * Returns a new collection with the first
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    Vector.prototype.drop = function (n) {
        if (n < 0) {
            return this;
        }
        if (n >= this._length) {
            return Vector.empty();
        }
        var mutVec = Vector.emptyMutable();
        for (var i = n; i < this._length; i++) {
            var val = this.internalGet(i);
            mutVec.append(val);
        }
        return mutVec.getVector();
    };
    /**
     * Return a new collection containing the first n
     * elements from this collection
     *
     *     Vector.of(1,2,3,4).take(2)
     *     => Vector.of(1,2)
     */
    Vector.prototype.take = function (n) {
        if (n <= 0 || this._length === 0) {
            return Vector.empty();
        }
        if (n >= this._length) {
            // not only an optimization. we want to wipe from
            // the first item after the current one, but in case
            // the length is a multiple of nodeSize, and we want
            // to take the full array length, that next item is
            // on a node which doesn't exist currently. Trying to
            // go there to wipe that item would fail, so that's also
            // a fix for  that.
            return this;
        }
        // note that index actually points to the
        // first item we want to wipe (item after
        // the last item we want to keep)
        var index = Math.min(n, this._length);
        var newVec = this.cloneVec();
        newVec._length = index;
        // next line will crash on empty vector
        var node = newVec._contents = this._contents.slice();
        var shift = this._maxShift;
        var underRoot = true;
        while (shift > 0) {
            var childIndex = (index >> shift) & nodeBitmask;
            if (underRoot && childIndex === 0) {
                // root killing, skip this node, we don't want
                // root nodes with only 1 child
                newVec._contents = node[childIndex].slice();
                newVec._maxShift -= nodeBits;
                node = newVec._contents;
            }
            else {
                underRoot = false;
                for (var i = childIndex + 1; i < nodeSize; i++) {
                    // remove pointers if present, to enable GC
                    node[i] = undefined;
                }
                node[childIndex] = node[childIndex].slice();
                node = node[childIndex];
            }
            shift -= nodeBits;
        }
        for (var i = (index & nodeBitmask); i < nodeSize; i++) {
            // remove pointers if present, to enable GC
            node[i] = undefined;
        }
        return newVec;
    };
    /**
     * Prepend an element at the beginning of the collection.
     */
    Vector.prototype.prepend = function (elt) {
        // TODO must be optimized!!
        return this.prependAll([elt]);
    };
    /**
     * Prepend multiple elements at the beginning of the collection.
     */
    Vector.prototype.prependAll = function (elts) {
        return Vector.ofIterable(elts).appendAll(this);
    };
    /**
     * Removes the first element matching the predicate
     * (use [[Seq.filter]] to remove all elements matching a predicate)
     */
    Vector.prototype.removeFirst = function (predicate) {
        var v1 = this.takeWhile(function (x) { return !predicate(x); });
        return v1.appendAll(this.drop(v1.length() + 1));
    };
    /**
     * Returns a new collection with the last
     * n elements discarded.
     * If the collection has less than n elements,
     * returns the empty collection.
     */
    Vector.prototype.dropRight = function (n) {
        if (n >= this._length) {
            return Vector.empty();
        }
        return this.take(this._length - n);
    };
    /**
     * Get all the elements in the collection but the first one.
     * If the collection is empty, return None.
     */
    Vector.prototype.tail = function () {
        return this._length > 0 ? Option_1.Option.of(this.drop(1)) : Option_1.Option.none();
    };
    /**
     * Reduces the collection to a single value by repeatedly
     * calling the combine function.
     * No starting value. The order in which the elements are
     * passed to the combining function is undetermined.
     */
    Vector.prototype.reduce = function (combine) {
        return SeqHelpers.reduce(this, combine);
    };
    /**
     * Compare values in the collection and return the smallest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.minOn]]
     */
    Vector.prototype.minBy = function (compare) {
        return SeqHelpers.minBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the smallest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.minBy]]
     */
    Vector.prototype.minOn = function (getNumber) {
        return SeqHelpers.minOn(this, getNumber);
    };
    /**
     * Compare values in the collection and return the largest element.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.maxOn]]
     */
    Vector.prototype.maxBy = function (compare) {
        return SeqHelpers.maxBy(this, compare);
    };
    /**
     * Call the function you give for each value in the collection
     * and return the element for which the result was the largest.
     * Returns Option.none if the collection is empty.
     *
     * also see [[Vector.maxBy]]
     */
    Vector.prototype.maxOn = function (getNumber) {
        return SeqHelpers.maxOn(this, getNumber);
    };
    /**
     * Call the function you give for each element in the collection
     * and sum all the numbers, return that sum.
     * Will return 0 if the collection is empty.
     */
    Vector.prototype.sumOn = function (getNumber) {
        return SeqHelpers.sumOn(this, getNumber);
    };
    /**
     * Slides a window of a specific size over the sequence.
     * Returns a lazy stream so memory use is not prohibitive.
     *
     *     Vector.of(1,2,3,4,5,6,7,8).sliding(3)
     *     => Stream.of(Vector.of(1,2,3), Vector.of(4,5,6), Vector.of(7,8))
     */
    Vector.prototype.sliding = function (count) {
        return SeqHelpers.sliding(this, count);
    };
    return Vector;
}());
exports.Vector = Vector;

},{"./Comparison":2,"./HashMap":6,"./HashSet":7,"./Option":11,"./SeqHelpers":13}],17:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
exports.__esModule = true;
// Not re-exporting the abstract types such as Seq, Collection and so on,
// on purpose. Right now they are more an help to design the library, not meant
// for the user.
// Seq<T>.equals is a lot less type-precise than Vector<T>.equals, so I'd rather
// the users use concrete types.
__export(require("./Option"));
__export(require("./Either"));
__export(require("./Lazy"));
__export(require("./Vector"));
__export(require("./LinkedList"));
__export(require("./HashMap"));
__export(require("./HashSet"));
__export(require("./Tuple2"));
__export(require("./Comparison"));
__export(require("./Stream"));
__export(require("./Contract"));
__export(require("./Predicate"));
__export(require("./Function"));

},{"./Comparison":2,"./Contract":3,"./Either":4,"./Function":5,"./HashMap":6,"./HashSet":7,"./Lazy":9,"./LinkedList":10,"./Option":11,"./Predicate":12,"./Stream":14,"./Tuple2":15,"./Vector":16}],18:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
    @fileOverview Hash Array Mapped Trie.

    Code based on: https://github.com/exclipy/pdata
*/
var hamt = {}; // export

/* Configuration
 ******************************************************************************/
var SIZE = 5;

var BUCKET_SIZE = Math.pow(2, SIZE);

var MASK = BUCKET_SIZE - 1;

var MAX_INDEX_NODE = BUCKET_SIZE / 2;

var MIN_ARRAY_NODE = BUCKET_SIZE / 4;

/*
 ******************************************************************************/
var nothing = {};

var constant = function constant(x) {
    return function () {
        return x;
    };
};

/**
    Get 32 bit hash of string.

    Based on:
    http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
*/
var hash = hamt.hash = function (str) {
    var type = typeof str === 'undefined' ? 'undefined' : _typeof(str);
    if (type === 'number') return str;
    if (type !== 'string') str += '';

    var hash = 0;
    for (var i = 0, len = str.length; i < len; ++i) {
        var c = str.charCodeAt(i);
        hash = (hash << 5) - hash + c | 0;
    }
    return hash;
};

/* Bit Ops
 ******************************************************************************/
/**
    Hamming weight.

    Taken from: http://jsperf.com/hamming-weight
*/
var popcount = function popcount(x) {
    x -= x >> 1 & 0x55555555;
    x = (x & 0x33333333) + (x >> 2 & 0x33333333);
    x = x + (x >> 4) & 0x0f0f0f0f;
    x += x >> 8;
    x += x >> 16;
    return x & 0x7f;
};

var hashFragment = function hashFragment(shift, h) {
    return h >>> shift & MASK;
};

var toBitmap = function toBitmap(x) {
    return 1 << x;
};

var fromBitmap = function fromBitmap(bitmap, bit) {
    return popcount(bitmap & bit - 1);
};

/* Array Ops
 ******************************************************************************/
/**
    Set a value in an array.

    @param mutate Should the input array be mutated?
    @param at Index to change.
    @param v New value
    @param arr Array.
*/
var arrayUpdate = function arrayUpdate(mutate, at, v, arr) {
    var out = arr;
    if (!mutate) {
        var len = arr.length;
        out = new Array(len);
        for (var i = 0; i < len; ++i) {
            out[i] = arr[i];
        }
    }
    out[at] = v;
    return out;
};

/**
    Remove a value from an array.

    @param mutate Should the input array be mutated?
    @param at Index to remove.
    @param arr Array.
*/
var arraySpliceOut = function arraySpliceOut(mutate, at, arr) {
    var newLen = arr.length - 1;
    var i = 0;
    var g = 0;
    var out = arr;
    if (mutate) {
        i = g = at;
    } else {
        out = new Array(newLen);
        while (i < at) {
            out[g++] = arr[i++];
        }
    }
    ++i;
    while (i <= newLen) {
        out[g++] = arr[i++];
    }if (mutate) {
        out.length = newLen;
    }
    return out;
};

/**
    Insert a value into an array.

    @param mutate Should the input array be mutated?
    @param at Index to insert at.
    @param v Value to insert,
    @param arr Array.
*/
var arraySpliceIn = function arraySpliceIn(mutate, at, v, arr) {
    var len = arr.length;
    if (mutate) {
        var _i = len;
        while (_i >= at) {
            arr[_i--] = arr[_i];
        }arr[at] = v;
        return arr;
    }
    var i = 0,
        g = 0;
    var out = new Array(len + 1);
    while (i < at) {
        out[g++] = arr[i++];
    }out[at] = v;
    while (i < len) {
        out[++g] = arr[i++];
    }return out;
};

/* Node Structures
 ******************************************************************************/
var LEAF = 1;
var COLLISION = 2;
var INDEX = 3;
var ARRAY = 4;

/**
    Empty node.
*/
var empty = {
    __hamt_isEmpty: true
};

var isEmptyNode = function isEmptyNode(x) {
    return x === empty || x && x.__hamt_isEmpty;
};

/**
    Leaf holding a value.

    @member edit Edit of the node.
    @member hash Hash of key.
    @member key Key.
    @member value Value stored.
*/
var Leaf = function Leaf(edit, hash, key, value) {
    return {
        type: LEAF,
        edit: edit,
        hash: hash,
        key: key,
        value: value,
        _modify: Leaf__modify
    };
};

/**
    Leaf holding multiple values with the same hash but different keys.

    @member edit Edit of the node.
    @member hash Hash of key.
    @member children Array of collision children node.
*/
var Collision = function Collision(edit, hash, children) {
    return {
        type: COLLISION,
        edit: edit,
        hash: hash,
        children: children,
        _modify: Collision__modify
    };
};

/**
    Internal node with a sparse set of children.

    Uses a bitmap and array to pack children.

  @member edit Edit of the node.
    @member mask Bitmap that encode the positions of children in the array.
    @member children Array of child nodes.
*/
var IndexedNode = function IndexedNode(edit, mask, children) {
    return {
        type: INDEX,
        edit: edit,
        mask: mask,
        children: children,
        _modify: IndexedNode__modify
    };
};

/**
    Internal node with many children.

    @member edit Edit of the node.
    @member size Number of children.
    @member children Array of child nodes.
*/
var ArrayNode = function ArrayNode(edit, size, children) {
    return {
        type: ARRAY,
        edit: edit,
        size: size,
        children: children,
        _modify: ArrayNode__modify
    };
};

/**
    Is `node` a leaf node?
*/
var isLeaf = function isLeaf(node) {
    return node === empty || node.type === LEAF || node.type === COLLISION;
};

/* Internal node operations.
 ******************************************************************************/
/**
    Expand an indexed node into an array node.

  @param edit Current edit.
    @param frag Index of added child.
    @param child Added child.
    @param mask Index node mask before child added.
    @param subNodes Index node children before child added.
*/
var expand = function expand(edit, frag, child, bitmap, subNodes) {
    var arr = [];
    var bit = bitmap;
    var count = 0;
    for (var i = 0; bit; ++i) {
        if (bit & 1) arr[i] = subNodes[count++];
        bit >>>= 1;
    }
    arr[frag] = child;
    return ArrayNode(edit, count + 1, arr);
};

/**
    Collapse an array node into a indexed node.

  @param edit Current edit.
    @param count Number of elements in new array.
    @param removed Index of removed element.
    @param elements Array node children before remove.
*/
var pack = function pack(edit, count, removed, elements) {
    var children = new Array(count - 1);
    var g = 0;
    var bitmap = 0;
    for (var i = 0, len = elements.length; i < len; ++i) {
        if (i !== removed) {
            var elem = elements[i];
            if (elem && !isEmptyNode(elem)) {
                children[g++] = elem;
                bitmap |= 1 << i;
            }
        }
    }
    return IndexedNode(edit, bitmap, children);
};

/**
    Merge two leaf nodes.

    @param shift Current shift.
    @param h1 Node 1 hash.
    @param n1 Node 1.
    @param h2 Node 2 hash.
    @param n2 Node 2.
*/
var mergeLeaves = function mergeLeaves(edit, shift, h1, n1, h2, n2) {
    if (h1 === h2) return Collision(edit, h1, [n2, n1]);

    var subH1 = hashFragment(shift, h1);
    var subH2 = hashFragment(shift, h2);
    return IndexedNode(edit, toBitmap(subH1) | toBitmap(subH2), subH1 === subH2 ? [mergeLeaves(edit, shift + SIZE, h1, n1, h2, n2)] : subH1 < subH2 ? [n1, n2] : [n2, n1]);
};

/**
    Update an entry in a collision list.

    @param mutate Should mutation be used?
    @param edit Current edit.
    @param keyEq Key compare function.
    @param hash Hash of collision.
    @param list Collision list.
    @param f Update function.
    @param k Key to update.
    @param size Size ref.
*/
var updateCollisionList = function updateCollisionList(mutate, edit, keyEq, h, list, f, k, size) {
    var len = list.length;
    for (var i = 0; i < len; ++i) {
        var child = list[i];
        if (keyEq(k, child.key)) {
            var value = child.value;
            var _newValue = f(value);
            if (_newValue === value) return list;

            if (_newValue === nothing) {
                --size.value;
                return arraySpliceOut(mutate, i, list);
            }
            return arrayUpdate(mutate, i, Leaf(edit, h, k, _newValue), list);
        }
    }

    var newValue = f();
    if (newValue === nothing) return list;
    ++size.value;
    return arrayUpdate(mutate, len, Leaf(edit, h, k, newValue), list);
};

var canEditNode = function canEditNode(edit, node) {
    return edit === node.edit;
};

/* Editing
 ******************************************************************************/
var Leaf__modify = function Leaf__modify(edit, keyEq, shift, f, h, k, size) {
    if (keyEq(k, this.key)) {
        var _v = f(this.value);
        if (_v === this.value) return this;else if (_v === nothing) {
            --size.value;
            return empty;
        }
        if (canEditNode(edit, this)) {
            this.value = _v;
            return this;
        }
        return Leaf(edit, h, k, _v);
    }
    var v = f();
    if (v === nothing) return this;
    ++size.value;
    return mergeLeaves(edit, shift, this.hash, this, h, Leaf(edit, h, k, v));
};

var Collision__modify = function Collision__modify(edit, keyEq, shift, f, h, k, size) {
    if (h === this.hash) {
        var canEdit = canEditNode(edit, this);
        var list = updateCollisionList(canEdit, edit, keyEq, this.hash, this.children, f, k, size);
        if (list === this.children) return this;

        return list.length > 1 ? Collision(edit, this.hash, list) : list[0]; // collapse single element collision list
    }
    var v = f();
    if (v === nothing) return this;
    ++size.value;
    return mergeLeaves(edit, shift, this.hash, this, h, Leaf(edit, h, k, v));
};

var IndexedNode__modify = function IndexedNode__modify(edit, keyEq, shift, f, h, k, size) {
    var mask = this.mask;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var bit = toBitmap(frag);
    var indx = fromBitmap(mask, bit);
    var exists = mask & bit;
    var current = exists ? children[indx] : empty;
    var child = current._modify(edit, keyEq, shift + SIZE, f, h, k, size);

    if (current === child) return this;

    var canEdit = canEditNode(edit, this);
    var bitmap = mask;
    var newChildren = void 0;
    if (exists && isEmptyNode(child)) {
        // remove
        bitmap &= ~bit;
        if (!bitmap) return empty;
        if (children.length <= 2 && isLeaf(children[indx ^ 1])) return children[indx ^ 1]; // collapse

        newChildren = arraySpliceOut(canEdit, indx, children);
    } else if (!exists && !isEmptyNode(child)) {
        // add
        if (children.length >= MAX_INDEX_NODE) return expand(edit, frag, child, mask, children);

        bitmap |= bit;
        newChildren = arraySpliceIn(canEdit, indx, child, children);
    } else {
        // modify
        newChildren = arrayUpdate(canEdit, indx, child, children);
    }

    if (canEdit) {
        this.mask = bitmap;
        this.children = newChildren;
        return this;
    }
    return IndexedNode(edit, bitmap, newChildren);
};

var ArrayNode__modify = function ArrayNode__modify(edit, keyEq, shift, f, h, k, size) {
    var count = this.size;
    var children = this.children;
    var frag = hashFragment(shift, h);
    var child = children[frag];
    var newChild = (child || empty)._modify(edit, keyEq, shift + SIZE, f, h, k, size);

    if (child === newChild) return this;

    var canEdit = canEditNode(edit, this);
    var newChildren = void 0;
    if (isEmptyNode(child) && !isEmptyNode(newChild)) {
        // add
        ++count;
        newChildren = arrayUpdate(canEdit, frag, newChild, children);
    } else if (!isEmptyNode(child) && isEmptyNode(newChild)) {
        // remove
        --count;
        if (count <= MIN_ARRAY_NODE) return pack(edit, count, frag, children);
        newChildren = arrayUpdate(canEdit, frag, empty, children);
    } else {
        // modify
        newChildren = arrayUpdate(canEdit, frag, newChild, children);
    }

    if (canEdit) {
        this.size = count;
        this.children = newChildren;
        return this;
    }
    return ArrayNode(edit, count, newChildren);
};

empty._modify = function (edit, keyEq, shift, f, h, k, size) {
    var v = f();
    if (v === nothing) return empty;
    ++size.value;
    return Leaf(edit, h, k, v);
};

/*
 ******************************************************************************/
function Map(editable, edit, config, root, size) {
    this._editable = editable;
    this._edit = edit;
    this._config = config;
    this._root = root;
    this._size = size;
};

Map.prototype.setTree = function (newRoot, newSize) {
    if (this._editable) {
        this._root = newRoot;
        this._size = newSize;
        return this;
    }
    return newRoot === this._root ? this : new Map(this._editable, this._edit, this._config, newRoot, newSize);
};

/* Queries
 ******************************************************************************/
/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `alt` if none.
*/
var tryGetHash = hamt.tryGetHash = function (alt, hash, key, map) {
    var node = map._root;
    var shift = 0;
    var keyEq = map._config.keyEq;
    while (true) {
        switch (node.type) {
            case LEAF:
                {
                    return keyEq(key, node.key) ? node.value : alt;
                }
            case COLLISION:
                {
                    if (hash === node.hash) {
                        var children = node.children;
                        for (var i = 0, len = children.length; i < len; ++i) {
                            var child = children[i];
                            if (keyEq(key, child.key)) return child.value;
                        }
                    }
                    return alt;
                }
            case INDEX:
                {
                    var frag = hashFragment(shift, hash);
                    var bit = toBitmap(frag);
                    if (node.mask & bit) {
                        node = node.children[fromBitmap(node.mask, bit)];
                        shift += SIZE;
                        break;
                    }
                    return alt;
                }
            case ARRAY:
                {
                    node = node.children[hashFragment(shift, hash)];
                    if (node) {
                        shift += SIZE;
                        break;
                    }
                    return alt;
                }
            default:
                return alt;
        }
    }
};

Map.prototype.tryGetHash = function (alt, hash, key) {
    return tryGetHash(alt, hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `tryGetHash`
*/
var tryGet = hamt.tryGet = function (alt, key, map) {
    return tryGetHash(alt, map._config.hash(key), key, map);
};

Map.prototype.tryGet = function (alt, key) {
    return tryGet(alt, key, this);
};

/**
    Lookup the value for `key` in `map` using a custom `hash`.

    Returns the value or `undefined` if none.
*/
var getHash = hamt.getHash = function (hash, key, map) {
    return tryGetHash(undefined, hash, key, map);
};

Map.prototype.getHash = function (hash, key) {
    return getHash(hash, key, this);
};

/**
    Lookup the value for `key` in `map` using internal hash function.

    @see `get`
*/
var get = hamt.get = function (key, map) {
    return tryGetHash(undefined, map._config.hash(key), key, map);
};

Map.prototype.get = function (key, alt) {
    return tryGet(alt, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses custom `hash`.
*/
var hasHash = hamt.has = function (hash, key, map) {
    return tryGetHash(nothing, hash, key, map) !== nothing;
};

Map.prototype.hasHash = function (hash, key) {
    return hasHash(hash, key, this);
};

/**
    Does an entry exist for `key` in `map`? Uses internal hash function.
*/
var has = hamt.has = function (key, map) {
    return hasHash(map._config.hash(key), key, map);
};

Map.prototype.has = function (key) {
    return has(key, this);
};

var defKeyCompare = function defKeyCompare(x, y) {
    return x === y;
};

/**
    Create an empty map.

    @param config Configuration.
*/
hamt.make = function (config) {
    return new Map(0, 0, {
        keyEq: config && config.keyEq || defKeyCompare,
        hash: config && config.hash || hash
    }, empty, 0);
};

/**
    Empty map.
*/
hamt.empty = hamt.make();

/**
    Does `map` contain any elements?
*/
var isEmpty = hamt.isEmpty = function (map) {
    return map && !!isEmptyNode(map._root);
};

Map.prototype.isEmpty = function () {
    return isEmpty(this);
};

/* Updates
 ******************************************************************************/
/**
    Alter the value stored for `key` in `map` using function `f` using
    custom hash.

    `f` is invoked with the current value for `k` if it exists,
    or no arguments if no such value exists. `modify` will always either
    update or insert a value into the map.

    Returns a map with the modified value. Does not alter `map`.
*/
var modifyHash = hamt.modifyHash = function (f, hash, key, map) {
    var size = { value: map._size };
    var newRoot = map._root._modify(map._editable ? map._edit : NaN, map._config.keyEq, 0, f, hash, key, size);
    return map.setTree(newRoot, size.value);
};

Map.prototype.modifyHash = function (hash, key, f) {
    return modifyHash(f, hash, key, this);
};

/**
    Alter the value stored for `key` in `map` using function `f` using
    internal hash function.

    @see `modifyHash`
*/
var modify = hamt.modify = function (f, key, map) {
    return modifyHash(f, map._config.hash(key), key, map);
};

Map.prototype.modify = function (key, f) {
    return modify(f, key, this);
};

/**
    Store `value` for `key` in `map` using custom `hash`.

    Returns a map with the modified value. Does not alter `map`.
*/
var setHash = hamt.setHash = function (hash, key, value, map) {
    return modifyHash(constant(value), hash, key, map);
};

Map.prototype.setHash = function (hash, key, value) {
    return setHash(hash, key, value, this);
};

/**
    Store `value` for `key` in `map` using internal hash function.

    @see `setHash`
*/
var set = hamt.set = function (key, value, map) {
    return setHash(map._config.hash(key), key, value, map);
};

Map.prototype.set = function (key, value) {
    return set(key, value, this);
};

/**
    Remove the entry for `key` in `map`.

    Returns a map with the value removed. Does not alter `map`.
*/
var del = constant(nothing);
var removeHash = hamt.removeHash = function (hash, key, map) {
    return modifyHash(del, hash, key, map);
};

Map.prototype.removeHash = Map.prototype.deleteHash = function (hash, key) {
    return removeHash(hash, key, this);
};

/**
    Remove the entry for `key` in `map` using internal hash function.

    @see `removeHash`
*/
var remove = hamt.remove = function (key, map) {
    return removeHash(map._config.hash(key), key, map);
};

Map.prototype.remove = Map.prototype.delete = function (key) {
    return remove(key, this);
};

/* Mutation
 ******************************************************************************/
/**
    Mark `map` as mutable.
 */
var beginMutation = hamt.beginMutation = function (map) {
    return new Map(map._editable + 1, map._edit + 1, map._config, map._root, map._size);
};

Map.prototype.beginMutation = function () {
    return beginMutation(this);
};

/**
    Mark `map` as immutable.
 */
var endMutation = hamt.endMutation = function (map) {
    map._editable = map._editable && map._editable - 1;
    return map;
};

Map.prototype.endMutation = function () {
    return endMutation(this);
};

/**
    Mutate `map` within the context of `f`.
    @param f
    @param map HAMT
*/
var mutate = hamt.mutate = function (f, map) {
    var transient = beginMutation(map);
    f(transient);
    return endMutation(transient);
};

Map.prototype.mutate = function (f) {
    return mutate(f, this);
};

/* Traversal
 ******************************************************************************/
/**
    Apply a continuation.
*/
var appk = function appk(k) {
    return k && lazyVisitChildren(k[0], k[1], k[2], k[3], k[4]);
};

/**
    Recursively visit all values stored in an array of nodes lazily.
*/
var lazyVisitChildren = function lazyVisitChildren(len, children, i, f, k) {
    while (i < len) {
        var child = children[i++];
        if (child && !isEmptyNode(child)) return lazyVisit(child, f, [len, children, i, f, k]);
    }
    return appk(k);
};

/**
    Recursively visit all values stored in `node` lazily.
*/
var lazyVisit = function lazyVisit(node, f, k) {
    switch (node.type) {
        case LEAF:
            return {
                value: f(node),
                rest: k
            };

        case COLLISION:
        case ARRAY:
        case INDEX:
            var children = node.children;
            return lazyVisitChildren(children.length, children, 0, f, k);

        default:
            return appk(k);
    }
};

var DONE = {
    done: true
};

/**
    Javascript iterator over a map.
*/
function MapIterator(v) {
    this.v = v;
};

MapIterator.prototype.next = function () {
    if (!this.v) return DONE;
    var v0 = this.v;
    this.v = appk(v0.rest);
    return v0;
};

MapIterator.prototype[Symbol.iterator] = function () {
    return this;
};

/**
    Lazily visit each value in map with function `f`.
*/
var visit = function visit(map, f) {
    return new MapIterator(lazyVisit(map._root, f));
};

/**
    Get a Javascsript iterator of `map`.

    Iterates over `[key, value]` arrays.
*/
var buildPairs = function buildPairs(x) {
    return [x.key, x.value];
};
var entries = hamt.entries = function (map) {
    return visit(map, buildPairs);
};

Map.prototype.entries = Map.prototype[Symbol.iterator] = function () {
    return entries(this);
};

/**
    Get array of all keys in `map`.

    Order is not guaranteed.
*/
var buildKeys = function buildKeys(x) {
    return x.key;
};
var keys = hamt.keys = function (map) {
    return visit(map, buildKeys);
};

Map.prototype.keys = function () {
    return keys(this);
};

/**
    Get array of all values in `map`.

    Order is not guaranteed, duplicates are preserved.
*/
var buildValues = function buildValues(x) {
    return x.value;
};
var values = hamt.values = Map.prototype.values = function (map) {
    return visit(map, buildValues);
};

Map.prototype.values = function () {
    return values(this);
};

/* Fold
 ******************************************************************************/
/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function mapping accumulated value, value, and key to new value.
    @param z Starting value.
    @param m HAMT
*/
var fold = hamt.fold = function (f, z, m) {
    var root = m._root;
    if (root.type === LEAF) return f(z, root.value, root.key);

    var toVisit = [root.children];
    var children = void 0;
    while (children = toVisit.pop()) {
        for (var i = 0, len = children.length; i < len;) {
            var child = children[i++];
            if (child && child.type) {
                if (child.type === LEAF) z = f(z, child.value, child.key);else toVisit.push(child.children);
            }
        }
    }
    return z;
};

Map.prototype.fold = function (f, z) {
    return fold(f, z, this);
};

/**
    Visit every entry in the map, aggregating data.

    Order of nodes is not guaranteed.

    @param f Function invoked with value and key
    @param map HAMT
*/
var forEach = hamt.forEach = function (f, map) {
    return fold(function (_, value, key) {
        return f(value, key, map);
    }, null, map);
};

Map.prototype.forEach = function (f) {
    return forEach(f, this);
};

/* Aggregate
 ******************************************************************************/
/**
    Get the number of entries in `map`.
*/
var count = hamt.count = function (map) {
    return map._size;
};

Map.prototype.count = function () {
    return count(this);
};

Object.defineProperty(Map.prototype, 'size', {
    get: Map.prototype.count
});

/* Export
 ******************************************************************************/
if (typeof module !== 'undefined' && module.exports) {
    module.exports = hamt;
} else if (typeof define === 'function' && define.amd) {
    define('hamt', [], function () {
        return hamt;
    });
} else {
    undefined.hamt = hamt;
}


},{}]},{},[1]);
