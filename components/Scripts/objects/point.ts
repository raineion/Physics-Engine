/// <reference path="../../typings/tsd.d.ts"/>

module objects {
    // POINT CLASS ++++++++++++++++++++++++++++++++++++++++++
    export class Point { 
        public x:number;
        public y:number;
        public z:number;
        // CONSTRUCTOR ++++++++++++++++++++++++++++++++++++++++
        constructor(x:number, y:number, z:number) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }
}
