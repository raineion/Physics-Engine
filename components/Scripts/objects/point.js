/// <reference path="../../typings/tsd.d.ts"/>
var objects;
(function (objects) {
    // POINT CLASS ++++++++++++++++++++++++++++++++++++++++++
    var Point = (function () {
        // CONSTRUCTOR ++++++++++++++++++++++++++++++++++++++++
        function Point(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        return Point;
    })();
    objects.Point = Point;
})(objects || (objects = {}));
//# sourceMappingURL=point.js.map